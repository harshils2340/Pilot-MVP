import { NextResponse } from 'next/server';
import connectToDB from '../../../lib/mongodb';
import { Permit } from '../../../lib/permits/schema';
import { PermitManagement } from '../../../lib/permits/managementSchema';

export async function GET(request: Request) {
  try {
    await connectToDB();
    
    // Get clientId from query params
    const url = new URL(request.url);
    const clientId = url.searchParams.get('clientId');
    
    // Build query - if clientId is provided, filter by it
    const query: any = {};
    if (clientId) {
      query.clientId = clientId;
      console.log(`🔍 Fetching permits for clientId: ${clientId}`);
    } else {
      console.log('⚠️ No clientId provided, fetching all permits');
    }
    
    // Try to fetch from PermitManagement collection first
    let permitManagementDocs = await PermitManagement.find(query).sort({ order: 1, createdAt: -1 }).lean();
    console.log(`📋 Found ${permitManagementDocs.length} PermitManagement entries`);
    
    // If clientId is provided but no PermitManagement entries found, return empty array
    // (Don't fallback to all permits when filtering by clientId)
    if (clientId && permitManagementDocs.length === 0) {
      return NextResponse.json([]);
    }
    
    // If PermitManagement collection is empty AND no clientId filter, fetch from Permit collection and transform
    // (This fallback is only for backward compatibility when no clientId is specified)
    if (!clientId && permitManagementDocs.length === 0) {
      const permitDocs = await Permit.find({}).sort({ lastUpdated: -1 }).lean();
      
      // Transform Permit documents to match PermitManagement format
      const formattedPermits = permitDocs.map((permit: any) => {
        // Extract description from activities if available
        const description = permit.activities && permit.activities.length > 0 
          ? (typeof permit.activities[0] === 'string' ? permit.activities[0] : permit.name)
          : permit.name || 'No description available';
        
        // Determine complexity - default to medium, could be enhanced based on level
        let complexity: 'low' | 'medium' | 'high' = 'medium';
        if (permit.level === 'federal') {
          complexity = 'high';
        } else if (permit.level === 'municipal') {
          complexity = 'low';
        }
        
        // Determine category from level
        const category = permit.level === 'federal' ? 'Federal' 
          : permit.level === 'municipal' ? 'Municipal' 
          : 'Provincial';
        
        // Extract estimated time, fees, etc. from contactInfo or default
        const contactInfo = permit.contactInfo || {};
        
        return {
          id: permit._id.toString(),
          name: permit.name || 'Unnamed Permit',
          authority: permit.authority || contactInfo.municipality || 'Unknown Authority',
          complexity,
          estimatedTime: 'N/A', // Not in original schema
          description,
          category,
          requirements: permit.activities || [],
          fees: 'N/A', // Not in original schema
          purpose: permit.prerequisites || description,
          howToApply: permit.applyUrl ? `Apply at: ${permit.applyUrl}` : 'Contact the issuing authority',
          contactInfo: {
            phone: contactInfo.phone,
            email: contactInfo.email,
            website: permit.applyUrl || permit.sourceUrl,
            address: contactInfo.address?.fullAddress || contactInfo.address?.street || '',
            officeHours: '',
          },
          additionalNotes: permit.lastVerified ? `Last verified: ${permit.lastVerified}` : '',
        };
      });
      
      return NextResponse.json(formattedPermits);
    }
    
    // If PermitManagement collection has data, use it
    const formattedPermits = permitManagementDocs.map((permit: any) => ({
      id: permit._id.toString(),
      _id: permit._id.toString(),
      clientId: permit.clientId,
      permitId: permit.permitId,
      name: permit.name,
      authority: permit.authority,
      municipality: permit.municipality,
      complexity: permit.complexity,
      estimatedTime: permit.estimatedTime,
      description: permit.description,
      category: permit.category,
      status: permit.status || 'not-started',
      order: permit.order || 0,
      blockedBy: permit.blockedBy,
      blocks: permit.blocks || [],
      lastActivity: permit.lastActivity,
      lastActivityDate: permit.lastActivityDate,
      requirements: permit.requirements || [],
      fees: permit.fees,
      purpose: permit.purpose,
      howToApply: permit.howToApply,
      contactInfo: permit.contactInfo || {},
      additionalNotes: permit.additionalNotes,
    }));

    return NextResponse.json(formattedPermits);
  } catch (error) {
    console.error('Failed to fetch permits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permits' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDB();
    const body = await request.json();
    
    const permit = await PermitManagement.create(body);
    
    return NextResponse.json({
      id: permit._id.toString(),
      ...permit.toObject(),
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create permit:', error);
    return NextResponse.json(
      { error: 'Failed to create permit' },
      { status: 500 }
    );
  }
}
