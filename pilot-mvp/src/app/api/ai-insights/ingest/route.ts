import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import BiSnapshot, { pushVersionUpdate } from '@/app/lib/biSnapshot/schema';
import type { IMenuItem } from '@/app/lib/biSnapshot/schema';
import { processMenuUpload } from '@/app/lib/ingest/menuNormalizer';
import { ObjectId } from 'mongodb';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? '';

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Expected multipart/form-data with a file upload' },
        { status: 400 },
      );
    }

    const formData = await req.formData();
    const clientId = formData.get('clientId');
    const competitorName = formData.get('competitorName');
    const file = formData.get('file');

    if (!clientId || typeof clientId !== 'string') {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'A file upload is required' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10 MB.' },
        { status: 400 },
      );
    }

    const ext = file.name.toLowerCase().split('.').pop() ?? '';
    if (!['csv', 'json', 'pdf'].includes(ext)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a CSV, JSON, or PDF file.' },
        { status: 400 },
      );
    }

    await connectToDB();

    if (!ObjectId.isValid(clientId)) {
      return NextResponse.json({ error: 'Invalid clientId format' }, { status: 400 });
    }

    const snapshot = await BiSnapshot.findOne({ clientId: new ObjectId(clientId) });

    if (!snapshot) {
      return NextResponse.json(
        { error: 'No BI snapshot found for this client. Run an AI Insights scan first.' },
        { status: 404 },
      );
    }

    // Determine which competitor to attach menu items to
    let competitorIndex = -1;
    let isNewCompetitor = false;
    if (competitorName && typeof competitorName === 'string') {
      const searchName = competitorName.toLowerCase().trim();
      competitorIndex = snapshot.competitors.findIndex(
        (c: { name: string }) => c.name.toLowerCase().includes(searchName)
          || searchName.includes(c.name.toLowerCase()),
      );
      if (competitorIndex === -1) {
        // Create a new competitor entry for custom names
        snapshot.competitors.push({
          name: competitorName.trim(),
          placeId: `manual-${Date.now()}`,
          address: '',
          types: [],
          menuItems: [],
          menuCoverage: 'none',
          reviews: [],
          dataQuality: 'minimal',
        });
        competitorIndex = snapshot.competitors.length - 1;
        isNewCompetitor = true;
      }
    } else if (snapshot.competitors.length > 0) {
      return NextResponse.json(
        { error: 'Please enter or select which competitor this menu belongs to.' },
        { status: 400 },
      );
    }

    const existingItems: IMenuItem[] = competitorIndex >= 0
      ? snapshot.competitors[competitorIndex].menuItems ?? []
      : [];

    const buffer = await file.arrayBuffer();
    const result = await processMenuUpload(buffer, file.name, existingItems);

    if (result.items.length === 0 && result.duplicatesSkipped > 0) {
      return NextResponse.json({
        success: true,
        itemsAdded: 0,
        duplicatesSkipped: result.duplicatesSkipped,
        invalidSkipped: result.invalidSkipped,
        format: result.format,
        warnings: [`All ${result.duplicatesSkipped} items already exist — no new items to add.`],
        competitorMatched: competitorIndex >= 0
          ? snapshot.competitors[competitorIndex].name
          : null,
      });
    }

    if (result.items.length === 0) {
      return NextResponse.json({
        success: true,
        itemsAdded: 0,
        duplicatesSkipped: result.duplicatesSkipped,
        invalidSkipped: result.invalidSkipped,
        format: result.format,
        warnings: result.warnings.length > 0
          ? result.warnings
          : ['No menu items could be extracted from this file.'],
        competitorMatched: competitorIndex >= 0
          ? snapshot.competitors[competitorIndex].name
          : null,
      });
    }

    // Store the new items on the target competitor
    if (competitorIndex >= 0) {
      const comp = snapshot.competitors[competitorIndex];
      comp.menuItems.push(...result.items);
      comp.menuCoverage = comp.menuItems.length >= 10 ? 'full' : 'partial';
      comp.menuLastUpdated = new Date();
    }

    // Update aggregates
    if (snapshot.aggregates) {
      const totalMenus = snapshot.competitors.filter(
        (c: { menuCoverage: string }) => c.menuCoverage !== 'none',
      ).length;
      snapshot.aggregates.menusFound = totalMenus;
      snapshot.aggregates.menuCoveragePercent = snapshot.competitors.length > 0
        ? Math.round((totalMenus / snapshot.competitors.length) * 100)
        : 0;
    }

    // Update collection status
    if (snapshot.collectionStatus?.manualIngest) {
      snapshot.collectionStatus.manualIngest.lastUpload = new Date();
      snapshot.collectionStatus.manualIngest.filesProcessed += 1;
      snapshot.collectionStatus.manualIngest.itemsAdded += result.items.length;
    }

    await snapshot.save();

    // Push version history entry
    await BiSnapshot.updateOne(
      { _id: snapshot._id },
      pushVersionUpdate({
        version: snapshot.version + 1,
        createdBy: 'consultant',
        trigger: 'data_ingest',
        summary: `Uploaded ${result.items.length} menu items from ${result.format.toUpperCase()} file "${file.name}"`,
        changes: {
          competitorsAdded: isNewCompetitor ? 1 : 0,
          competitorsRemoved: 0,
          menusUpdated: 1,
          reviewsAdded: 0,
          trafficRefreshed: false,
          revenueRecalculated: false,
        },
      }),
    );

    return NextResponse.json({
      success: true,
      itemsAdded: result.items.length,
      duplicatesSkipped: result.duplicatesSkipped,
      invalidSkipped: result.invalidSkipped,
      format: result.format,
      warnings: result.warnings,
      competitorMatched: competitorIndex >= 0
        ? snapshot.competitors[competitorIndex].name
        : null,
      items: result.items.slice(0, 10).map(i => ({ name: i.name, price: i.price, category: i.category })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('POST /api/ai-insights/ingest error:', message);
    return NextResponse.json(
      { error: 'Failed to process upload', details: message },
      { status: 500 },
    );
  }
}
