import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitEmail } from '@/app/lib/emails/schema';

// GET: Get a specific email by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await params;

    const email = await PermitEmail.findById(id).lean();

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ email });
  } catch (error: any) {
    console.error('Error fetching email:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update email (e.g., mark as read, archive, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    const { id } = await params;
    const body = await request.json();

    const email = await PermitEmail.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    ).lean();

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ email });
  } catch (error: any) {
    console.error('Error updating email:', error);
    return NextResponse.json(
      { error: 'Failed to update email', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete an email
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check if email functionality is enabled (test mode)
    const EMAIL_TEST_MODE = process.env.EMAIL_TEST_MODE === 'true' || false;
    if (!EMAIL_TEST_MODE) {
      return NextResponse.json(
        { error: 'Email deletion is only available in test mode.' },
        { status: 403 }
      );
    }

    await connectToDB();
    const { id } = await params;

    const email = await PermitEmail.findByIdAndDelete(id).lean();

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email deleted successfully',
      emailId: id
    });
  } catch (error: any) {
    console.error('Error deleting email:', error);
    return NextResponse.json(
      { error: 'Failed to delete email', details: error.message },
      { status: 500 }
    );
  }
}
