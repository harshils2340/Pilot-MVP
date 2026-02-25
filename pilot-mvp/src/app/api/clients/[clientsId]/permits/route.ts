import { NextResponse } from 'next/server';
import connectToDB from '../../../../lib/mongodb';
import { PermitManagement } from '../../../../lib/permits/managementSchema';
import { calculateDependencyOrder } from '../../../../lib/permits/dependencyCalculator';
import { Permit } from '../../../../lib/permits/schema';
import { estimatePermitTimeline } from '../../../../lib/timeline/estimation';
import ClientModel from '../../../../models/client';

const TIMELINE_ESTIMATE_VERSION = 2;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientsId: string }> }
) {
  try {
    await connectToDB();
    const { clientsId } = await params;
    const clientId = decodeURIComponent(clientsId);

    // Fetch permit plan for this client
    const permits = await PermitManagement.find({ clientId })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const formattedPermits = permits.map((permit: any) => ({
      id: permit._id.toString(),
      _id: permit._id.toString(),
      clientId: permit.clientId,
      permitId: permit.permitId,
      name: permit.name,
      authority: permit.authority,
      municipality: permit.municipality,
      complexity: permit.complexity,
      estimatedTime: permit.estimatedTime,
      description: permit.description,
      category: permit.category,
      status: permit.status || 'not-started',
      order: permit.order || 0,
      blockedBy: permit.blockedBy,
      blocks: permit.blocks || [],
      lastActivity: permit.lastActivity,
      lastActivityDate: permit.lastActivityDate,
      requirements: permit.requirements || [],
      fees: permit.fees,
      purpose: permit.purpose,
      howToApply: permit.howToApply,
      contactInfo: permit.contactInfo || {},
      additionalNotes: permit.additionalNotes,
      timeline: permit.timeline,
    }));

    return NextResponse.json(formattedPermits);
  } catch (error: any) {
    console.error('Failed to fetch client permits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client permits', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientsId: string }> }
) {
  try {
    await connectToDB();
    const { clientsId } = await params;
    const clientId = decodeURIComponent(clientsId);
    const body = await request.json();

    // Fetch existing permits for this client to calculate dependency order
    const existingPermits = await PermitManagement.find({ clientId }).lean();

    // Fetch permit catalog item if permitId is provided (to get prerequisites)
    let prerequisites: string | undefined;
    if (body.permitId) {
      try {
        const catalogPermit = await Permit.findById(body.permitId).lean();
        if (catalogPermit) {
          prerequisites = catalogPermit.prerequisites;
        }
      } catch (err) {
        console.warn('Could not fetch permit catalog item:', err);
      }
    }

    // Calculate dependency order
    const dependencyInfo = calculateDependencyOrder(
      existingPermits as any[],
      {
        name: body.name,
        prerequisites: prerequisites || body.prerequisites,
        permitId: body.permitId,
      }
    );

    // Create permit plan entry
    const permitData = {
      clientId,
      permitId: body.permitId,
      name: body.name,
      authority: body.authority,
      municipality: body.municipality,
      complexity: body.complexity || 'medium',
      estimatedTime: body.estimatedTime,
      description: body.description,
      category: body.category,
      status: body.status || 'not-started',
      order: dependencyInfo.order,
      blockedBy: dependencyInfo.blockedBy,
      blocks: dependencyInfo.blocks,
      lastActivity: body.lastActivity || 'Added to permit plan',
      lastActivityDate: body.lastActivityDate || new Date(),
      requirements: body.requirements || [],
      fees: body.fees,
      purpose: body.purpose,
      howToApply: body.howToApply,
      contactInfo: body.contactInfo || {},
      additionalNotes: body.additionalNotes,
    };

    const permit = await PermitManagement.create(permitData);

    // Automatically estimate timeline for ALL new permits (including not-started)
    // This gives clients visibility into expected timelines upfront
    try {
      let clientInfo: { businessName?: string; jurisdiction?: string } | null = null;
      try {
        const client = await ClientModel.findById(clientId).lean();
        if (client) {
          clientInfo = {
            businessName: client.businessName,
            jurisdiction: client.jurisdiction,
          };
        }
      } catch (err) {
        console.warn('Could not fetch client info for timeline estimation:', err);
      }

      let catalogPermit = null;
      if (permit.permitId) {
        try {
          catalogPermit = await Permit.findById(permit.permitId).lean();
        } catch (err) {
          console.warn('Could not fetch catalog permit for timeline estimation:', err);
        }
      }

      const estimate = await estimatePermitTimeline(permit, catalogPermit, clientInfo);
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

      await permit.save();
    } catch (err) {
      console.error('Failed to estimate timeline for new permit:', err);
      // Continue without timeline estimate
    }

    return NextResponse.json({
      id: permit._id.toString(),
      _id: permit._id.toString(),
      clientId: permit.clientId,
      permitId: permit.permitId,
      name: permit.name,
      authority: permit.authority,
      municipality: permit.municipality,
      complexity: permit.complexity,
      estimatedTime: permit.estimatedTime,
      description: permit.description,
      category: permit.category,
      status: permit.status,
      order: permit.order,
      blockedBy: permit.blockedBy,
      blocks: permit.blocks,
      lastActivity: permit.lastActivity,
      lastActivityDate: permit.lastActivityDate,
      requirements: permit.requirements,
      fees: permit.fees,
      purpose: permit.purpose,
      howToApply: permit.howToApply,
      contactInfo: permit.contactInfo,
      additionalNotes: permit.additionalNotes,
      timeline: permit.timeline,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create client permit:', error);
    return NextResponse.json(
      { error: 'Failed to create client permit', details: error.message },
      { status: 500 }
    );
  }
}
