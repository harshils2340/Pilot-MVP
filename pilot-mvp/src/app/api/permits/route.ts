import { NextResponse } from 'next/server';

// Example permits data. Replace with DB fetch in real project.
const permits = [
  { id: '1', clientName: 'Client A', type: 'Construction', status: 'approved' },
  { id: '2', clientName: 'Client B', type: 'Business', status: 'submitted' },
  { id: '3', clientName: 'Client C', type: 'Safety', status: 'action-required' },
];

export async function GET() {
  return NextResponse.json(permits);
}
