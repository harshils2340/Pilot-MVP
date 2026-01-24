import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PipelineStage, initializeDefaultStages } from '@/app/lib/crm/pipelineSchema';

const serializeStage = (s: any) => ({ ...s, _id: s._id.toString() });

export async function GET(_request: NextRequest) {
  try {
    await connectToDB();
    await initializeDefaultStages();
    const stages = await PipelineStage.find().sort({ sequence: 1 }).lean();
    return NextResponse.json({ stages: stages.map(serializeStage) }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching pipeline stages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline stages', details: error.message },
      { status: 500 }
    );
  }
}
