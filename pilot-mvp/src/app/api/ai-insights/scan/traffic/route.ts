import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDB from '@/app/lib/mongodb';
import { resolveClientId } from '@/app/lib/resolveClientId';
import BiSnapshot from '@/app/lib/biSnapshot/schema';
import { getForecastBatch } from '@/app/lib/bestTime/forecast';

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
        error: 'No competitors found. Run competitor discovery first.',
      });
    }

    if (!process.env.BESTTIME_API_KEY_PRIVATE) {
      await BiSnapshot.updateOne(
        { _id: snapshot._id },
        {
          $set: {
            'collectionStatus.bestTime.status': 'failed',
            'collectionStatus.bestTime.error': 'BESTTIME_API_KEY_PRIVATE not configured',
            'collectionStatus.readinessPercent': 65,
          },
        },
      );
      return NextResponse.json({
        success: true,
        snapshotId: parsed.data.snapshotId,
        progress: 65,
        venuesProcessed: 0,
        warning: 'BestTime API key not configured — using industry defaults for foot traffic.',
      });
    }

    await BiSnapshot.updateOne(
      { _id: snapshot._id },
      { $set: { 'collectionStatus.bestTime.status': 'in_progress' } },
    );

    const venues = snapshot.competitors.map((c: { name: string; address: string; placeId: string }) => ({
      name: c.name,
      address: c.address,
      placeId: c.placeId,
    }));

    const trafficMap = await getForecastBatch(venues);

    // Targeted updates per competitor instead of rewriting the whole array
    let processedCount = 0;
    const updates: Record<string, unknown> = {
      'collectionStatus.bestTime.status': 'failed',
      'collectionStatus.bestTime.lastRun': new Date(),
      'collectionStatus.bestTime.venuesTotal': venues.length,
      'collectionStatus.readinessPercent': 70,
    };

    for (let i = 0; i < snapshot.competitors.length; i++) {
      const comp = snapshot.competitors[i];
      const traffic = trafficMap.get(comp.placeId);
      if (traffic) {
        updates[`competitors.${i}.footTraffic`] = traffic;
        updates[`competitors.${i}.dataQuality`] = 'complete';
        processedCount++;
      }
    }

    updates['collectionStatus.bestTime.status'] = processedCount > 0 ? 'complete' : 'failed';
    updates['collectionStatus.bestTime.venuesProcessed'] = processedCount;

    await BiSnapshot.updateOne(
      { _id: snapshot._id },
      { $set: updates },
    );

    return NextResponse.json({
      success: true,
      snapshotId: parsed.data.snapshotId,
      progress: 70,
      venuesProcessed: processedCount,
      venuesTotal: venues.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('POST /api/ai-insights/scan/traffic error:', message);

    // Don't crash the pipeline — mark traffic as failed and continue
    try {
      const body = await req.clone().json().catch(() => null);
      if (body?.snapshotId) {
        await connectToDB();
        await BiSnapshot.updateOne(
          { _id: body.snapshotId },
          {
            $set: {
              'collectionStatus.bestTime.status': 'failed',
              'collectionStatus.bestTime.error': message,
              'collectionStatus.readinessPercent': 65,
            },
          },
        );
      }
    } catch { /* best-effort */ }

    return NextResponse.json({
      success: true,
      snapshotId: '',
      progress: 65,
      venuesProcessed: 0,
      warning: `Traffic scan encountered an error: ${message}. Continuing with available data.`,
    });
  }
}
