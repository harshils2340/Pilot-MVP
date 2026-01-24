import { NextRequest, NextResponse } from 'next/server';

// POST: Intake emails from Gmail
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // This endpoint is a placeholder for future Gmail intake functionality
    // Email intake is currently handled by the /api/gmail/sync endpoint
    
    return NextResponse.json({
      success: false,
      error: 'This endpoint is not yet implemented. Please use /api/gmail/sync for email intake.',
    }, { status: 501 });
  } catch (error: any) {
    console.error('Error in intake route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process request',
      },
      { status: 500 }
    );
  }
}
