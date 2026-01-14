import { NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { Permit } from '@/app/lib/permits/schema';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDB();
    
    const { id } = await params;
    const permit = await Permit.findById(id).lean();
    
    if (!permit) {
      return NextResponse.json(
        { error: 'Permit not found' },
        { status: 404 }
      );
    }
    
    // Return full permit details with all extracted data
    return NextResponse.json({
      _id: permit._id.toString(),
      name: permit.name,
      description: permit.activities?.[0] || permit.description || '',
      category: permit.level === 'federal' ? 'Federal' : permit.level === 'municipal' ? 'Municipal' : 'Provincial',
      authority: permit.authority || 'BizPaL',
      complexity: 'Medium', // Default since we don't store relevance
      estimatedTime: 'N/A',
      fees: 'N/A',
      prerequisites: permit.prerequisites,
      contactInfo: permit.contactInfo,
      moreInfoUrl: permit.moreInfoUrl,
      applyUrl: permit.applyUrl,
      lastVerified: permit.lastVerified,
      activities: permit.activities,
      businessTypes: permit.businessTypes,
      jurisdiction: permit.jurisdiction,
      // Comprehensive extracted data
      fullText: permit.fullText,
      fullHtml: permit.fullHtml,
      permitTitle: permit.permitTitle,
      expandedDetails: permit.expandedDetails,
    });
  } catch (error: any) {
    console.error('❌ Error fetching permit details:', error);
    
    // If it's a validation error or not found, return 404
    if (error.name === 'CastError' || error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Permit not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch permit details', details: error.message },
      { status: 500 }
    );
  }
}
