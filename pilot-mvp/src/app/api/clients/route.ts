// src/app/api/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/app/lib/mongodb";
import ClientModel from "../../models/client"; // create this model
import { PermitManagement } from "@/app/lib/permits/managementSchema";

// Helper to convert _id to string
const serializeClient = (client: any) => ({
  ...client,
  _id: client._id.toString(),
});

export async function GET() {
  try {
    await connectToDB();
    const clients = await ClientModel.find().lean(); // lean() returns plain JS objects
    const clientsWithStringId = clients.map(serializeClient);
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
