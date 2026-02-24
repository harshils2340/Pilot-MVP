import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDB from '@/app/lib/mongodb';
import { resolveClientId } from '@/app/lib/resolveClientId';
import BiSnapshot from '@/app/lib/biSnapshot/schema';
import {
  isSerpApiAvailable,
  enrichReviewsBatch,
  type ReviewEnrichment,
} from '@/app/lib/serpApi/search';

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
    if (!snapshot || !snapshot.competitors?.length) {
      return NextResponse.json({
        success: false,
        snapshotId: parsed.data.snapshotId,
        progress: 55,
        error: 'No competitors found. Run details scan first.',
      });
    }

    if (!isSerpApiAvailable()) {
      return NextResponse.json({
        success: true,
        snapshotId: parsed.data.snapshotId,
        progress: 55,
        enrichedCount: 0,
        skipped: true,
        message: 'SerpAPI key not configured — skipping deep review enrichment.',
      });
    }

    // Collect placeIds for competitors that could use more reviews
    const placeIds = snapshot.competitors
      .map((c: { placeId: string; reviews?: unknown[] }) => c.placeId)
      .filter(Boolean) as string[];

    if (placeIds.length === 0) {
      return NextResponse.json({
        success: true,
        snapshotId: parsed.data.snapshotId,
        progress: 55,
        enrichedCount: 0,
        message: 'No place IDs available for review enrichment.',
      });
    }

    // Limit to first 10 competitors to stay within Vercel timeout
    const targetIds = placeIds.slice(0, 10);
    const enrichments = await enrichReviewsBatch(targetIds, 3);

    const updates: Record<string, unknown> = {
      'collectionStatus.readinessPercent': 55,
    };
    let enrichedCount = 0;
    let totalNewReviews = 0;

    for (let i = 0; i < snapshot.competitors.length; i++) {
      const comp = snapshot.competitors[i];
      const enrichment: ReviewEnrichment | undefined = enrichments.get(comp.placeId);
      if (!enrichment || enrichment.reviews.length === 0) continue;

      enrichedCount++;
      const prefix = `competitors.${i}`;

      // Merge SerpAPI reviews with existing ones, avoiding duplicates
      const existingTexts = new Set(
        (comp.reviews ?? []).map((r: { text: string }) => r.text.slice(0, 50).toLowerCase()),
      );

      const newReviews = enrichment.reviews.filter(
        r => !existingTexts.has(r.text.slice(0, 50).toLowerCase()),
      );

      if (newReviews.length > 0) {
        const merged = [...(comp.reviews ?? []), ...newReviews];
        updates[`${prefix}.reviews`] = merged;
        totalNewReviews += newReviews.length;
      }

      // Store topic data for theme analysis
      if (enrichment.topics.length > 0) {
        updates[`${prefix}.serpApiTopics`] = enrichment.topics.map(t => ({
          keyword: t.keyword,
          mentions: t.mentions,
        }));
      }

      if (enrichment.totalReviewCount > (comp.userRatingCount ?? 0)) {
        updates[`${prefix}.userRatingCount`] = enrichment.totalReviewCount;
      }

      updates[`${prefix}.dataQuality`] = 'full';
    }

    await BiSnapshot.updateOne(
      { _id: snapshot._id },
      { $set: updates },
    );

    return NextResponse.json({
      success: true,
      snapshotId: parsed.data.snapshotId,
      progress: 55,
      enrichedCount,
      totalNewReviews,
      totalCompetitors: snapshot.competitors.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('POST /api/ai-insights/scan/reviews error:', message);
    return NextResponse.json({
      success: true,
      progress: 55,
      enrichedCount: 0,
      error: message,
      message: 'Review enrichment failed gracefully — scan continues.',
    });
  }
}
