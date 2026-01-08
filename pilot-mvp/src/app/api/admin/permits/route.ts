import { NextResponse } from "next/server";
import { Permit } from "@/app/lib/permits/schema";
import { adminPermitSchema } from "@/validators/adminPermitSchema";

// POST: Create new permit
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = adminPermitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const newPermit = new Permit(parsed.data);
    await newPermit.save();

    return NextResponse.json({ message: "Permit created", permit: newPermit });
  } catch (error) {
    console.error("Permit creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET: List all permits
export async function GET() {
  try {
    const permits = await Permit.find().sort({ lastUpdated: -1 });
    return NextResponse.json({ permits });
  } catch (error) {
    console.error("Permit fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update permit
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: "Permit ID is required" }, { status: 400 });

    const parsed = adminPermitSchema.safeParse(data);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

    const updatedPermit = await Permit.findByIdAndUpdate(id, parsed.data, { new: true });
    if (!updatedPermit) return NextResponse.json({ error: "Permit not found" }, { status: 404 });

    return NextResponse.json({ message: "Permit updated", permit: updatedPermit });
  } catch (error) {
    console.error("Permit update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete permit
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) return NextResponse.json({ error: "Permit ID is required" }, { status: 400 });

    const deletedPermit = await Permit.findByIdAndDelete(id);
    if (!deletedPermit) return NextResponse.json({ error: "Permit not found" }, { status: 404 });

    return NextResponse.json({ message: "Permit deleted" });
  } catch (error) {
    console.error("Permit deletion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
