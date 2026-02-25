import { NextResponse } from 'next/server';
import connectToDB from '../../../../lib/mongodb';
import { PermitManagement } from '../../../../lib/permits/managementSchema';
import { estimatePermitTimeline } from '../../../../lib/timeline/estimation';
import { Permit } from '../../../../lib/permits/schema';
import ClientModel from '../../../../models/client';

const TIMELINE_ESTIMATE_VERSION = 2;

// Helper to estimate timeline for a permit
async function estimatePermitTimelineHelper(permit: any, clientId: string) {
  try {
    console.log(`[EstimateHelper] Starting estimation for permit: ${permit.name}, ID: ${permit._id}`);
    
    // Fetch client info for context
    let clientInfo = null;
    try {
      const client = await ClientModel.findById(clientId).lean();
      if (client) {
        clientInfo = {
          businessName: client.businessName,
          jurisdiction: client.jurisdiction,
        };
        console.log(`[EstimateHelper] Found client: ${client.businessName} in ${client.jurisdiction}`);
      }
    } catch (err) {
      console.log(`[EstimateHelper] Could not fetch client info:`, err);
    }
    
    let catalogPermit = null;
    if (permit.permitId) {
      try {
        catalogPermit = await Permit.findById(permit.permitId).lean();
        console.log(`[EstimateHelper] Found catalog permit: ${catalogPermit?.name || 'N/A'}`);
      } catch (err) {
        console.log(`[EstimateHelper] No catalog permit found, using permit data only`);
      }
    }

    const estimate = await estimatePermitTimeline(permit, catalogPermit, clientInfo);
    console.log(`[EstimateHelper] Got estimate: ${estimate.estimatedDays} days, completion: ${estimate.estimatedCompletionDate}`);
    
    const now = new Date();
    const estimatedStartDate = now;

    permit.timeline = {
      initialEstimatedDays: estimate.estimatedDays,
      currentEstimatedDays: estimate.estimatedDays,
      estimatedStartDate,
      initialEstimatedCompletionDate: estimate.estimatedCompletionDate,
      currentEstimatedCompletionDate: estimate.estimatedCompletionDate,
      lastUpdated: now,
      estimateVersion: TIMELINE_ESTIMATE_VERSION,
    };

    console.log(`[EstimateHelper] Saving timeline data for permit ${permit._id}...`);
    const saved = await permit.save();
    console.log(`[EstimateHelper] ✅ Saved timeline: ${saved.timeline?.initialEstimatedDays} days`);
    
    // Verify it was saved
    const verify = await PermitManagement.findById(permit._id).lean();
    if (verify?.timeline?.initialEstimatedDays) {
      console.log(`[EstimateHelper] ✅ Verified timeline saved: ${verify.timeline.initialEstimatedDays} days`);
      return true;
    } else {
      console.error(`[EstimateHelper] ❌ Timeline NOT saved! verify.timeline:`, verify?.timeline);
      return false;
    }
  } catch (err: any) {
    console.error(`[EstimateHelper] ❌ Failed to estimate timeline for permit ${permit._id}:`, err);
    console.error(`[EstimateHelper] Error details:`, err.message, err.stack);
    return false;
  }
}

/**
 * GET /api/clients/[clientsId]/timeline
 * Get aggregated timeline for all permits belonging to a client
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientsId: string }> }
) {
  try {
    await connectToDB();
    const { clientsId } = await params;
    const clientId = decodeURIComponent(clientsId);

    // Fetch all permits for this client (as documents so we can update them)
    const permitDocs = await PermitManagement.find({ clientId })
      .sort({ order: 1, createdAt: -1 });

    // Auto-estimate timelines for permits that don't have them
    console.log(`[Timeline] Found ${permitDocs.length} permits, checking for missing timelines...`);
    
    const permitsNeedingEstimation = permitDocs.filter((permitDoc) => {
      const hasTimeline = permitDoc.timeline?.initialEstimatedDays || permitDoc.timeline?.currentEstimatedDays;
      const isStaleEstimate = (permitDoc.timeline?.estimateVersion || 0) < TIMELINE_ESTIMATE_VERSION;
      return !hasTimeline || isStaleEstimate;
    });

    console.log(`[Timeline] ${permitsNeedingEstimation.length} permits need timeline estimation`);

    // Estimate timelines synchronously - estimate ALL permits without timelines
    if (permitsNeedingEstimation.length > 0) {
      for (const permitDoc of permitsNeedingEstimation) {
        try {
          console.log(`[Timeline] Estimating timeline for: ${permitDoc.name} (status: ${permitDoc.status})`);
          const success = await estimatePermitTimelineHelper(permitDoc, clientId);
          if (success) {
            console.log(`[Timeline] ✅ Successfully estimated timeline for: ${permitDoc.name}`);
          } else {
            console.log(`[Timeline] ⚠️ Failed to estimate timeline for: ${permitDoc.name}`);
          }
        } catch (err) {
          console.error(`[Timeline] ❌ Error estimating for ${permitDoc.name}:`, err);
        }
      }
    }

    // Re-fetch permits to get updated timeline data
    const updatedPermits = await PermitManagement.find({ clientId })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // De-duplicate permits (same permitId or same name+authority can appear after re-adding plans).
    // Keep the newest entry.
    const dedupedPermitsMap = new Map<string, any>();
    for (const permit of updatedPermits) {
      const dedupeKey = permit.permitId
        ? `permitId:${permit.permitId}`
        : `name:${(permit.name || '').toLowerCase()}|auth:${(permit.authority || '').toLowerCase()}`;

      const existing = dedupedPermitsMap.get(dedupeKey);
      if (!existing) {
        dedupedPermitsMap.set(dedupeKey, permit);
        continue;
      }

      const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
      const currentTime = new Date((permit as any).updatedAt || (permit as any).createdAt || 0).getTime();
      if (currentTime >= existingTime) {
        dedupedPermitsMap.set(dedupeKey, permit);
      }
    }
    const effectivePermits = Array.from(dedupedPermitsMap.values())
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    
    console.log(`[Timeline] Returning ${effectivePermits.length} permits with timeline data`);

    // Build base permit timelines
    const basePermitTimelines = effectivePermits.map((permit: any) => {
      const timeline = permit.timeline || {};
      return {
        permitId: permit._id.toString(),
        permitName: permit.name,
        authority: permit.authority || '',
        status: permit.status,
        complexity: permit.complexity,
        order: permit.order || 0,
        blockedBy: permit.blockedBy,
        blocks: permit.blocks || [],
        lastActivity: permit.lastActivity,
        timeline: {
          initialEstimatedDays: timeline.initialEstimatedDays,
          currentEstimatedDays: timeline.currentEstimatedDays,
          estimatedStartDate: timeline.estimatedStartDate,
          initialEstimatedCompletionDate: timeline.initialEstimatedCompletionDate,
          currentEstimatedCompletionDate: timeline.currentEstimatedCompletionDate,
          actualStartDate: timeline.actualStartDate,
          actualCompletionDate: timeline.actualCompletionDate,
          processingDelays: timeline.processingDelays || 0,
        },
      };
    });

    // Apply dependency-aware scheduling:
    // if permit B is blocked by permit A, B starts only after A's completion.
    const completionByName = new Map<string, Date>();
    const permitTimelines = [...basePermitTimelines]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((permit) => {
        const timeline = { ...permit.timeline };
        const estimatedDays = timeline.currentEstimatedDays || timeline.initialEstimatedDays;
        const now = new Date();

        let startDate = timeline.actualStartDate
          ? new Date(timeline.actualStartDate)
          : timeline.estimatedStartDate
            ? new Date(timeline.estimatedStartDate)
            : now;

        let dependencyDelayDays = 0;
        if (permit.blockedBy) {
          const blockers = permit.blockedBy
            .split(',')
            .map((n: string) => n.trim().toLowerCase())
            .filter(Boolean);

          const blockerCompletionDates = blockers
            .map((name: string) => completionByName.get(name))
            .filter((d: Date | undefined): d is Date => Boolean(d));

          if (blockerCompletionDates.length > 0) {
            const latestBlockerCompletion = new Date(
              Math.max(...blockerCompletionDates.map((d: Date) => d.getTime()))
            );
            const requiredStart = new Date(latestBlockerCompletion);
            requiredStart.setDate(requiredStart.getDate() + 1);

            if (requiredStart.getTime() > startDate.getTime()) {
              dependencyDelayDays = Math.ceil(
                (requiredStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              startDate = requiredStart;
            }
          }
        }

        let completionDate: Date | null = null;
        if (timeline.actualCompletionDate) {
          completionDate = new Date(timeline.actualCompletionDate);
        } else if (estimatedDays) {
          completionDate = new Date(startDate);
          completionDate.setDate(completionDate.getDate() + estimatedDays);
        }

        if (completionDate) {
          completionByName.set(permit.permitName.toLowerCase(), completionDate);
        }

        return {
          ...permit,
          dependencyDelayDays,
          timeline: {
            ...timeline,
            estimatedStartDate: startDate,
            currentEstimatedCompletionDate: completionDate,
            processingDelays: (timeline.processingDelays || 0) + dependencyDelayDays,
          },
        };
      });

    // Calculate overall timeline metrics
    const completedPermits = permitTimelines.filter((p) => p.status === 'approved');
    const inProgressPermits = permitTimelines.filter(
      (p) => p.status === 'in-progress' || p.status === 'submitted'
    );
    const notStartedPermits = permitTimelines.filter((p) => p.status === 'not-started');

    // Find earliest start date and latest completion date
    const datesWithTimelines = permitTimelines
      .filter((p) => p.timeline.currentEstimatedCompletionDate)
      .map((p) => ({
        start: p.timeline.estimatedStartDate || p.timeline.actualStartDate,
        end: p.timeline.currentEstimatedCompletionDate || p.timeline.actualCompletionDate,
      }))
      .filter((d) => d.start && d.end);

    const earliestStart = datesWithTimelines.length > 0
      ? new Date(Math.min(...datesWithTimelines.map((d) => new Date(d.start!).getTime())))
      : null;

    const latestCompletion = datesWithTimelines.length > 0
      ? new Date(Math.max(...datesWithTimelines.map((d) => new Date(d.end!).getTime())))
      : null;

    // Calculate total estimated days (considering dependencies and parallel processing)
    const totalEstimatedDays = latestCompletion && earliestStart
      ? Math.ceil((latestCompletion.getTime() - earliestStart.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Calculate total processing delays
    const totalDelays = permitTimelines.reduce(
      (sum, p) => sum + (p.timeline.processingDelays || 0),
      0
    );

    // Calculate average processing time
    const completedWithDates = permitTimelines.filter(
      (p) => p.timeline.actualStartDate && p.timeline.actualCompletionDate
    );
    const averageProcessingDays =
      completedWithDates.length > 0
        ? completedWithDates.reduce((sum, p) => {
            const start = new Date(p.timeline.actualStartDate!);
            const end = new Date(p.timeline.actualCompletionDate!);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / completedWithDates.length
        : null;

    return NextResponse.json({
      clientId,
      summary: {
        totalPermits: permitTimelines.length,
        completed: completedPermits.length,
        inProgress: inProgressPermits.length,
        notStarted: notStartedPermits.length,
        totalEstimatedDays,
        totalProcessingDelays: totalDelays,
        averageProcessingDays,
        earliestStartDate: earliestStart,
        latestCompletionDate: latestCompletion,
      },
      permits: permitTimelines,
    });
  } catch (error: any) {
    console.error('Failed to fetch client timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client timeline', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/clients/[clientsId]/timeline
 * Estimate timelines for all permits (or specific permits) for a client
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientsId: string }> }
) {
  try {
    await connectToDB();
    const { clientsId } = await params;
    const clientId = decodeURIComponent(clientsId);
    const body = await request.json();

    // Fetch all permits for this client
    const permits = await PermitManagement.find({ clientId });

    // If specific permit IDs provided, filter to those
    const permitIds = body.permitIds;
    const permitsToEstimate = permitIds
      ? permits.filter((p) => permitIds.includes(p._id.toString()))
      : permits;

    const results = [];

    for (const permit of permitsToEstimate) {
      try {
        // Only skip if timeline exists AND we're not forcing re-estimation
        const hasTimeline = permit.timeline?.initialEstimatedDays || permit.timeline?.currentEstimatedDays;
        if (hasTimeline && !body.forceEstimate) {
          results.push({
            permitId: permit._id.toString(),
            permitName: permit.name,
            success: true,
            skipped: true,
            message: 'Timeline already exists',
          });
          continue;
        }

        // Fetch catalog permit if available
        let catalogPermit = null;
        if (permit.permitId) {
          try {
            catalogPermit = await Permit.findById(permit.permitId).lean();
          } catch (err) {
            console.warn(`Could not fetch catalog permit for ${permit._id}:`, err);
          }
        }

        // Fetch client info for context
        let clientInfo = null;
        try {
          const client = await ClientModel.findById(clientId).lean();
          if (client) {
            clientInfo = {
              businessName: client.businessName,
              jurisdiction: client.jurisdiction,
            };
          }
        } catch (err) {
          // Ignore client fetch errors
        }

        const estimate = await estimatePermitTimeline(permit, catalogPermit, clientInfo);

        // Update timeline
        const now = new Date();
        const estimatedStartDate =
          permit.timeline?.actualStartDate ||
          permit.timeline?.estimatedStartDate ||
          now;

    // Set timeline object (don't spread undefined)
    permit.timeline = {
      initialEstimatedDays: estimate.estimatedDays,
      currentEstimatedDays: estimate.estimatedDays,
      estimatedStartDate,
      initialEstimatedCompletionDate: estimate.estimatedCompletionDate,
      currentEstimatedCompletionDate: estimate.estimatedCompletionDate,
      lastUpdated: now,
      processingDelays: 0,
      estimateVersion: TIMELINE_ESTIMATE_VERSION,
      ...(permit.timeline?.statusHistory && { statusHistory: permit.timeline.statusHistory }),
    };

        await permit.save();

        results.push({
          permitId: permit._id.toString(),
          permitName: permit.name,
          success: true,
          estimate,
        });
      } catch (error: any) {
        console.error(`Failed to estimate timeline for permit ${permit._id}:`, error);
        results.push({
          permitId: permit._id.toString(),
          permitName: permit.name,
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      estimated: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error: any) {
    console.error('Failed to estimate client timelines:', error);
    return NextResponse.json(
      { error: 'Failed to estimate client timelines', details: error.message },
      { status: 500 }
    );
  }
}
