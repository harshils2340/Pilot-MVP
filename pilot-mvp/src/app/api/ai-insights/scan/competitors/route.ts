import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDB from '@/app/lib/mongodb';
import { resolveClientId } from '@/app/lib/resolveClientId';
import BiSnapshot from '@/app/lib/biSnapshot/schema';
import { searchNearby } from '@/app/lib/googleMaps/places';
import { Types } from 'mongoose';

const RequestSchema = z.object({
  clientId: z.string().min(1),
  snapshotId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await connectToDB();

    const resolvedId = await resolveClientId(parsed.data.clientId);
    if (!resolvedId) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const snapshot = await BiSnapshot.findById(parsed.data.snapshotId);
    if (!snapshot) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }

    await BiSnapshot.updateOne(
      { _id: snapshot._id },
      { $set: { 'collectionStatus.googleMaps.status': 'in_progress' } },
    );

    const competitors = await searchNearby(
      snapshot.location.lat,
      snapshot.location.lng,
      snapshot.location.radiusMeters,
    );

    if (competitors === null) {
      await BiSnapshot.updateOne(
        { _id: snapshot._id },
        {
          $set: {
            'collectionStatus.googleMaps.status': 'failed',
            'collectionStatus.googleMaps.error': 'Google Maps API call failed',
            'collectionStatus.overall': 'error',
          },
        },
      );
      return NextResponse.json({
        success: false,
        snapshotId: parsed.data.snapshotId,
        progress: 15,
        error: 'Failed to discover competitors. Check Google Maps API key.',
      });
    }

    const now = new Date();
    const competitorDocs = competitors.map(c => ({
      ...c,
      menuItems: [],
      menuCoverage: 'none',
      reviews: [],
      fetchedAt: now,
      lastRefreshedAt: now,
      dataQuality: 'minimal',
    }));

    await BiSnapshot.updateOne(
      { _id: snapshot._id },
      {
        $set: {
          competitors: competitorDocs,
          'collectionStatus.googleMaps.status': 'complete',
          'collectionStatus.googleMaps.lastRun': now,
          'collectionStatus.googleMaps.placesFound': competitorDocs.length,
          'collectionStatus.overall': 'collecting',
          'collectionStatus.readinessPercent': 30,
        },
      },
    );

    return NextResponse.json({
      success: true,
      snapshotId: parsed.data.snapshotId,
      progress: 30,
      competitorsFound: competitorDocs.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('POST /api/ai-insights/scan/competitors error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
