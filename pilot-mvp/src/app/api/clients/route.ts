// src/app/api/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectToDB from "@/app/lib/mongodb";
import ClientModel from "../../models/client"; // create this model

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
    return NextResponse.json(
      { error: "Failed to fetch clients", details: err?.message || "Unknown error" },
      { status: 500 }
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
    const newClient = await ClientModel.create({
      ...body,
      activePermits: body.activePermits ?? 0,
      status: body.status ?? "new",
      completionRate: body.completionRate ?? 0,
      lastActivity: new Date(),
    });

    return NextResponse.json(serializeClient(newClient), { status: 201 });
  } catch (err) {
    console.error("POST /clients error:", err);
    return NextResponse.json({ error: "Failed to add client" }, { status: 500 });
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
    const deletedClient = await ClientModel.findByIdAndDelete(_id).lean();

    if (!deletedClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /clients error:", err);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}
