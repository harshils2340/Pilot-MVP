import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { CityFeedback } from '@/app/lib/cityFeedback/schema';

// Helper to convert _id to string
const serializeFeedback = (feedback: any) => ({
  ...feedback,
  _id: feedback._id.toString(),
  id: feedback._id.toString(), // Also include as 'id' for frontend compatibility
});

// GET: Fetch city feedback items
export async function GET(request: NextRequest) {
  try {
    await connectToDB();

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId');
    const permitId = searchParams.get('permitId');
    const status = searchParams.get('status'); // 'not_started', 'in_progress', 'addressed', or 'all'

    // Build query
    const query: any = {};
    if (clientId) query.clientId = clientId;
    if (permitId) query.permitId = permitId;
    if (status && status !== 'all') query.status = status;

    // Fetch feedback items, sorted by most recent first
    const feedbackItems = await CityFeedback.find(query)
      .sort({ date: -1 })
      .lean();

    const serializedItems = feedbackItems.map(serializeFeedback);

    return NextResponse.json({
      feedback: serializedItems,
      total: serializedItems.length
    });
  } catch (error: any) {
    console.error('Error fetching city feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch city feedback', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new city feedback item
export async function POST(request: NextRequest) {
  try {
    await connectToDB();

    const body = await request.json();
    const {
      clientId,
      permitId,
      emailId,
      type,
      author,
      department,
      subject,
      comment,
      attachments,
      status,
      requiredDocuments,
      consultantResponse
    } = body;

    // Validate required fields
    if (!clientId || !author || !subject || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, author, subject, and comment are required' },
        { status: 400 }
      );
    }

    // Format date and time
    const now = new Date();
    const date = body.date ? new Date(body.date) : now;
    const time = body.time || now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });

    // Create feedback item
    const feedbackItem = new CityFeedback({
      clientId,
      permitId: permitId || undefined,
      emailId: emailId || undefined,
      type: type || 'client_message',
      author,
      department: department || undefined,
      subject,
      comment,
      attachments: attachments || [],
      status: status || 'not_started',
      requiredDocuments: requiredDocuments || [],
      consultantResponse: consultantResponse || undefined,
      date,
      time
    });

    await feedbackItem.save();

    console.log('✅ City feedback item created:', {
      _id: feedbackItem._id,
      clientId: feedbackItem.clientId,
      subject: feedbackItem.subject
    });

    return NextResponse.json(serializeFeedback(feedbackItem), { status: 201 });
  } catch (error: any) {
    console.error('Error creating city feedback:', error);
    return NextResponse.json(
      { error: 'Failed to create city feedback', details: error.message },
      { status: 500 }
    );
  }
}

// PUT: Update a city feedback item
export async function PUT(request: NextRequest) {
  try {
    await connectToDB();

    const body = await request.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json(
        { error: '_id is required' },
        { status: 400 }
      );
    }

    const updatedFeedback = await CityFeedback.findByIdAndUpdate(
      _id,
      updateData,
      { new: true }
    ).lean();

    if (!updatedFeedback) {
      return NextResponse.json(
        { error: 'City feedback item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(serializeFeedback(updatedFeedback), { status: 200 });
  } catch (error: any) {
    console.error('Error updating city feedback:', error);
    return NextResponse.json(
      { error: 'Failed to update city feedback', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a city feedback item
export async function DELETE(request: NextRequest) {
  try {
    await connectToDB();

    const { _id } = await request.json();

    if (!_id) {
      return NextResponse.json(
        { error: '_id is required' },
        { status: 400 }
      );
    }

    const deletedFeedback = await CityFeedback.findByIdAndDelete(_id).lean();

    if (!deletedFeedback) {
      return NextResponse.json(
        { error: 'City feedback item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting city feedback:', error);
    return NextResponse.json(
      { error: 'Failed to delete city feedback', details: error.message },
      { status: 500 }
    );
  }
}
