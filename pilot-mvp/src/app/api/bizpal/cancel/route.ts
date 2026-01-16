import { NextRequest, NextResponse } from 'next/server';
import { setCancelled, isCancelled as checkCancelled, clearCancellation } from '@/app/lib/cancellation';

// POST: Cancel a scraping operation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: 'requestId is required' },
        { status: 400 }
      );
    }

    // Mark this request as cancelled
    setCancelled(requestId);
    console.log(`🛑 Cancellation requested for request: ${requestId}`);

    return NextResponse.json({
      success: true,
      message: 'Cancellation signal sent',
      requestId
    });
  } catch (error: any) {
    console.error('Error processing cancellation:', error);
    return NextResponse.json(
      { error: 'Failed to process cancellation', details: error.message },
      { status: 500 }
    );
  }
}

// GET: Check if a request is cancelled
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json(
        { error: 'requestId is required' },
        { status: 400 }
      );
    }

    const cancelled = checkCancelled(requestId);

    return NextResponse.json({
      requestId,
      cancelled
    });
  } catch (error: any) {
    console.error('Error checking cancellation:', error);
    return NextResponse.json(
      { error: 'Failed to check cancellation', details: error.message },
      { status: 500 }
    );
  }
}
