import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { PipelineStage, initializeDefaultStages } from '@/app/lib/crm/pipelineSchema';

// Helper to serialize stage
const serializeStage = (stage: any) => ({
  ...stage,
  _id: stage._id.toString(),
});

// GET: Fetch all pipeline stages
export async function GET(request: NextRequest) {
  try {
    await connectToDB();
    
    const stages = await PipelineStage.find()
      .sort({ sequence: 1 })
      .lean();
    
    // If no stages exist, initialize defaults
    if (stages.length === 0) {
      await initializeDefaultStages();
      const defaultStages = await PipelineStage.find()
        .sort({ sequence: 1 })
        .lean();
      return NextResponse.json({ stages: defaultStages.map(serializeStage) }, { status: 200 });
    }
    
    return NextResponse.json({ stages: stages.map(serializeStage) }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching pipeline stages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline stages', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Create a new pipeline stage
export async function POST(request: NextRequest) {
  try {
    await connectToDB();
    const body = await request.json();
    
    if (!body.name || body.sequence === undefined) {
      return NextResponse.json(
        { error: 'name and sequence are required' },
        { status: 400 }
      );
    }
    
    const newStage = new PipelineStage({
      name: body.name.trim(),
      sequence: body.sequence,
      probability: body.probability || 0,
      isWon: body.isWon || false,
      isLost: body.isLost || false,
      teamId: body.teamId,
      requirements: body.requirements,
      fold: body.fold || false,
    });
    
    await newStage.save();
    
    return NextResponse.json(
      { success: true, stage: serializeStage(newStage.toObject()) },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating pipeline stage:', error);
    return NextResponse.json(
      { error: 'Failed to create pipeline stage', details: error.message },
      { status: 500 }
    );
  }
}
