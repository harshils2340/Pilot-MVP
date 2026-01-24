import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch all invoices
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ invoices: [] });
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({ message: 'Invoice created', invoice: body });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice', details: error.message },
      { status: 500 }
    );
  }
}
