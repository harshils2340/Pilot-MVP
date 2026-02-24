// src/app/api/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/app/lib/mongodb";
import ClientModel from "../../models/client";
import DocumentModel from "@/app/lib/documents/schema";
import { PermitManagement } from "@/app/lib/permits/managementSchema";
import DiscoveredPermit from "@/app/lib/permits/discoveredSchema";

// Helper to convert _id to string
const serializeClient = (client: any) => ({
  ...client,
  _id: client._id.toString(),
});

export async function GET(request: Request) {
  try {
    await connectToDB();
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const includeDocCounts = url.searchParams.get('includeDocCounts') === '1';

    let queryBuilder = ClientModel.find();
    if (limit && limit > 0) {
      queryBuilder = queryBuilder.limit(limit);
    }

    const clients = await queryBuilder.lean();
    let clientsWithStringId = clients.map(serializeClient);

    if (includeDocCounts && clientsWithStringId.length > 0) {
      const clientIds = clientsWithStringId.map((c) => c._id);
      const docCounts = await DocumentModel.aggregate([
        { $match: { clientId: { $in: clientIds } } },
        {
          $group: {
            _id: '$clientId',
            totalDocs: { $sum: 1 },
            pendingDocs: {
              $sum: { $cond: [{ $in: ['$status', ['draft', 'pending-review']] }, 1, 0] },
            },
          },
        },
      ]);
      const docCountsMap = Object.fromEntries(
        docCounts.map((d) => [d._id, { totalDocs: d.totalDocs, pendingDocs: d.pendingDocs }])
      );

      // Permit-derived stats (status, activePermits, completionRate, lastActivity, pendingReview)
      const permitStats = await PermitManagement.aggregate([
        { $match: { clientId: { $in: clientIds } } },
        {
          $group: {
            _id: '$clientId',
            total: { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            actionRequired: { $sum: { $cond: [{ $eq: ['$status', 'action-required'] }, 1, 0] } },
            submitted: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
            notStarted: { $sum: { $cond: [{ $eq: ['$status', 'not-started'] }, 1, 0] } },
            lastActivity: { $max: '$lastActivityDate' },
          },
        },
      ]);
      const permitStatsMap = Object.fromEntries(permitStats.map((p) => [p._id, p]));

      clientsWithStringId = clientsWithStringId.map((c) => {
        const docCount = docCountsMap[c._id];
        const permit = permitStatsMap[c._id];
        let status = c.status || 'draft';
        let activePermits = c.activePermits ?? 0;
        let completionRate = c.completionRate ?? 0;
        let lastActivity = c.lastActivity;
        let pendingReview = 0;

        if (permit) {
          const { total, approved, actionRequired, submitted, inProgress } = permit;
          activePermits = (inProgress || 0) + (submitted || 0) + (actionRequired || 0);
          completionRate = total > 0 ? Math.round(((approved || 0) / total) * 100) : 0;
          pendingReview = submitted || 0;
          if (permit.lastActivity) {
            const d = permit.lastActivity;
            lastActivity =
              typeof d === 'string'
                ? d
                : d instanceof Date
                  ? d.toISOString?.() ?? String(d)
                  : d ? String(d) : undefined;
          }
          if (actionRequired > 0) status = 'action-required';
          else if (submitted > 0) status = 'submitted';
          else if (approved === total && total > 0) status = 'approved';
          else if (inProgress > 0) status = 'in-progress';
          else status = 'draft';
        } else {
          status = (c.status === 'new' || !c.status) ? 'draft' : (c.status as string);
        }

        return {
          ...c,
          status,
          activePermits,
          completionRate,
          lastActivity: lastActivity ?? c.lastActivity,
          pendingDocs: docCount?.pendingDocs ?? 0,
          totalDocs: docCount?.totalDocs ?? 0,
          pendingReview,
        };
      });
    }

    return NextResponse.json(clientsWithStringId, { status: 200 });
  } catch (err: any) {
    console.error("GET /clients error:", err);
    console.error("Error stack:", err?.stack);
    // Return empty array instead of error to prevent page crash
    return NextResponse.json(
      { error: "Failed to fetch clients", details: err?.message || "Unknown error", clients: [] },
      { status: 200 } // Return 200 with error message so page still loads
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.businessName || !body.jurisdiction) {
      return NextResponse.json(
        { error: "businessName and jurisdiction are required" },
        { status: 400 }
      );
    }

    await connectToDB();

    // Check for duplicate client (same business name and jurisdiction created in last 5 seconds)
    // This prevents rapid duplicate submissions
    const recentDuplicate = await ClientModel.findOne({
      businessName: body.businessName.trim(),
      jurisdiction: body.jurisdiction.trim(),
      lastActivity: { $gte: new Date(Date.now() - 5000) } // Within last 5 seconds
    }).lean();

    if (recentDuplicate) {
      console.log("⚠️ Duplicate client creation prevented:", {
        businessName: body.businessName,
        jurisdiction: body.jurisdiction,
        existingId: recentDuplicate._id
      });
      return NextResponse.json(
        serializeClient(recentDuplicate),
        { status: 200 } // Return existing client instead of creating duplicate
      );
    }

    const newClient = await ClientModel.create({
      ...body,
      businessName: body.businessName.trim(),
      jurisdiction: body.jurisdiction.trim(),
      activePermits: body.activePermits ?? 0,
      status: body.status ?? "new",
      completionRate: body.completionRate ?? 0,
      lastActivity: new Date(),
    });

    console.log("✅ New client created:", {
      _id: newClient._id,
      businessName: newClient.businessName,
      jurisdiction: newClient.jurisdiction
    });

    return NextResponse.json(serializeClient(newClient), { status: 201 });
  } catch (err: any) {
    console.error("POST /clients error:", err);
    
    // Handle duplicate key error (if unique index exists)
    if (err.code === 11000 || err.message?.includes('duplicate')) {
      return NextResponse.json(
        { error: "A client with this name and location already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to add client", details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body._id) {
      return NextResponse.json({ error: "_id is required" }, { status: 400 });
    }

    await connectToDB();
    const updatedClient = await ClientModel.findByIdAndUpdate(
      body._id,
      { ...body, lastActivity: new Date() },
      { new: true }
    ).lean();

    if (!updatedClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json(serializeClient(updatedClient), { status: 200 });
  } catch (err) {
    console.error("PUT /clients error:", err);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { _id } = await req.json();
    if (!_id) {
      return NextResponse.json({ error: "_id is required" }, { status: 400 });
    }

    await connectToDB();
    
    // Delete associated PermitManagement entries first
    try {
      const deleteResult = await PermitManagement.deleteMany({ clientId: _id });
      console.log(`🗑️ Deleted ${deleteResult.deletedCount} permit(s) associated with client ${_id}`);
    } catch (permitErr) {
      console.warn('⚠️ Failed to delete associated permits, continuing with client deletion:', permitErr);
      // Continue with client deletion even if permit deletion fails
    }
    
    // Delete discovered permit snapshots for this client
    try {
      const discoveredDeleteResult = await DiscoveredPermit.deleteMany({ clientId: _id });
      console.log(`Deleted ${discoveredDeleteResult.deletedCount} discovered permit(s) for client ${_id}`);
    } catch (discoveredErr) {
      console.warn(
        "Failed to delete discovered permits, continuing with client deletion:",
        discoveredErr
      );
      // Continue with client deletion even if discovered permit deletion fails
    }

    // Delete the client
    const deletedClient = await ClientModel.findByIdAndDelete(_id).lean();

    if (!deletedClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    console.log(`✅ Client ${_id} deleted successfully`);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /clients error:", err);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
