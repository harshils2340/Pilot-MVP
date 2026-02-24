import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { resolveClientId } from '@/app/lib/resolveClientId';
import BiSnapshot from '@/app/lib/biSnapshot/schema';
import { Types } from 'mongoose';

/**
 * GET /api/ai-insights/summary?clientId=xxx
 *
 * Returns the BI readiness status and aggregates for a client.
 * Always returns 200 to prevent page crashes (follows existing GET pattern).
 */
export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json({
        status: 'error' as const,
        readinessPercent: 0,
        summary: null,
        location: null,
        error: 'Missing clientId parameter',
      });
    }

    await connectToDB();

    const resolvedId = await resolveClientId(clientId);
    if (!resolvedId) {
      return NextResponse.json({
        status: 'error' as const,
        readinessPercent: 0,
        summary: null,
        location: null,
        error: 'Client not found',
      });
    }

    const snapshot = await BiSnapshot.findOne({
      clientId: new Types.ObjectId(resolvedId),
    })
      .sort({ version: -1 })
      .lean();

    if (!snapshot) {
      return NextResponse.json({
        status: 'not_started' as const,
        readinessPercent: 0,
        summary: null,
        location: null,
      });
    }

    const overall = snapshot.collectionStatus?.overall ?? 'initializing';
    const readiness = snapshot.collectionStatus?.readinessPercent ?? 0;

    return NextResponse.json({
      status: overall,
      readinessPercent: readiness,
      snapshotId: (snapshot._id as Types.ObjectId).toString(),
      location: snapshot.location ?? null,
      summary: snapshot.aggregates
        ? {
            totalCompetitors: snapshot.aggregates.totalCompetitors,
            menusFound: snapshot.aggregates.menusFound,
            reviewsAnalyzed: snapshot.aggregates.reviewsAnalyzed,
            avgCorridorRating: snapshot.aggregates.avgCorridorRating,
            avgCorridorPriceLevel: snapshot.aggregates.avgCorridorPriceLevel,
            menuCoveragePercent: snapshot.aggregates.menuCoveragePercent,
            corridorInsights: snapshot.aggregates.corridorInsights,
            underservedCategories: snapshot.aggregates.underservedCategories,
            topReviewThemes: snapshot.aggregates.topReviewThemes?.slice(0, 6),
            pricingBands: snapshot.aggregates.pricingBands,
            keyOpportunities: snapshot.aggregates.keyOpportunities,
            executiveSummary: snapshot.aggregates.executiveSummary,
          }
        : null,
      competitorNames: (snapshot.competitors ?? []).map(
        (c: { name: string }) => c.name,
      ),
      collectionStatus: snapshot.collectionStatus ?? null,
      lastFullRefresh: snapshot.lastFullRefresh ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('GET /api/ai-insights/summary error:', message);
    return NextResponse.json({
      status: 'error' as const,
      readinessPercent: 0,
      summary: null,
      location: null,
      error: 'Internal server error',
    });
  }
}
