import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDB from '@/app/lib/mongodb';
import { resolveClientId } from '@/app/lib/resolveClientId';
import BiSnapshot from '@/app/lib/biSnapshot/schema';
import { getPlaceDetailsBatch } from '@/app/lib/googleMaps/places';

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
        progress: 35,
        error: 'No competitors to enrich. Run competitor discovery first.',
      });
    }

    const placeIds = snapshot.competitors.map((c: { placeId: string }) => c.placeId);
    const detailsMap = await getPlaceDetailsBatch(placeIds, 5);

    // Build targeted updates per competitor index instead of rewriting the whole array
    let enrichedCount = 0;
    const updates: Record<string, unknown> = {
      'collectionStatus.readinessPercent': 50,
    };

    for (let i = 0; i < snapshot.competitors.length; i++) {
      const comp = snapshot.competitors[i];
      const details = detailsMap.get(comp.placeId);
      if (!details) continue;

      enrichedCount++;
      const prefix = `competitors.${i}`;
      updates[`${prefix}.reviews`] = details.reviews;
      if (Object.keys(details.hours).length > 0) updates[`${prefix}.hours`] = details.hours;
      if (details.formattedAddress) updates[`${prefix}.address`] = details.formattedAddress;
      if (details.websiteUrl) updates[`${prefix}.websiteUrl`] = details.websiteUrl;
      if (details.phone) updates[`${prefix}.phone`] = details.phone;
      if (details.googleMapsUrl) updates[`${prefix}.googleMapsUrl`] = details.googleMapsUrl;
      if (details.rating != null) updates[`${prefix}.rating`] = details.rating;
      if (details.userRatingCount != null) updates[`${prefix}.userRatingCount`] = details.userRatingCount;
      if (details.priceLevel != null) updates[`${prefix}.priceLevel`] = details.priceLevel;
      updates[`${prefix}.dataQuality`] = details.reviews.length > 0 ? 'partial' : 'minimal';
      updates[`${prefix}.lastRefreshedAt`] = new Date();
    }

    await BiSnapshot.updateOne(
      { _id: snapshot._id },
      { $set: updates },
    );

    return NextResponse.json({
      success: true,
      snapshotId: parsed.data.snapshotId,
      progress: 50,
      enrichedCount,
      totalCompetitors: snapshot.competitors.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('POST /api/ai-insights/scan/details error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
