import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PermitEmail } from '@/app/lib/emails/schema';

// DELETE: Bulk delete emails
export async function DELETE(request: NextRequest) {
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

    const body = await request.json();
    const { emailIds } = body;

    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of email IDs to delete' },
        { status: 400 }
      );
    }

    // Delete emails
    const result = await PermitEmail.deleteMany({
      _id: { $in: emailIds }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} email(s)`,
      deletedCount: result.deletedCount
    });
  } catch (error: any) {
    console.error('Error bulk deleting emails:', error);
    return NextResponse.json(
      { error: 'Failed to delete emails', details: error.message },
      { status: 500 }
    );
  }
}
