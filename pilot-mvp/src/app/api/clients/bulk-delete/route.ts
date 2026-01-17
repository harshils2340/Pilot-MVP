import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import ClientModel from '@/app/models/client';
import { PermitManagement } from '@/app/lib/permits/managementSchema';
import { ObjectId } from 'mongodb';

export async function DELETE(request: NextRequest) {
  try {
    await connectToDB();
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No client IDs provided for deletion.' },
        { status: 400 }
      );
    }

    // Validate all IDs are valid ObjectIds
    const validIds = ids.filter(id => ObjectId.isValid(id));
    if (validIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid client IDs provided.' },
        { status: 400 }
      );
    }

    // Delete associated PermitManagement entries first
    try {
      const permitDeleteResult = await PermitManagement.deleteMany({ 
        clientId: { $in: validIds } 
      });
      console.log(`🗑️ Deleted ${permitDeleteResult.deletedCount} permit(s) associated with ${validIds.length} client(s)`);
    } catch (permitErr) {
      console.warn('⚠️ Failed to delete associated permits, continuing with client deletion:', permitErr);
      // Continue with client deletion even if permit deletion fails
    }

    // Delete the clients
    const objectIds = validIds.map(id => new ObjectId(id));
    const result = await ClientModel.deleteMany({ _id: { $in: objectIds } });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'No clients found to delete.' },
        { status: 404 }
      );
    }

    console.log(`✅ Deleted ${result.deletedCount} client(s) successfully`);

    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} client(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error('Error bulk deleting clients:', error);
    return NextResponse.json(
      { error: 'Failed to bulk delete clients', details: error.message },
      { status: 500 }
    );
  }
}
