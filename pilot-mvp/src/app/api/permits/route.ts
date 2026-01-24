import { NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { Permit } from '@/app/lib/permits/schema'; // This model queries the "permits" collection, NOT "permitmanagements"

export async function GET() {
  try {
    await connectToDB();
    
    // IMPORTANT: This endpoint fetches ALL permits from the "permits" collection
    // - NO clientId filtering (this is a global permit library, not client-specific)
    // - NOT from "permitmanagements" collection (that's for client-specific permit tracking)
    // - This is the master list of all available permits in the system
    // The Permit model explicitly queries the "permits" collection in MongoDB
    
    // Verify the collection name BEFORE querying
    const collectionName = Permit.collection.collectionName;
    console.log(`🔍 API /api/permits: Using Permit model which queries collection: "${collectionName}"`);
    console.log(`📋 API /api/permits: Expected collection: "permits" | Actual collection: "${collectionName}"`);
    
    if (collectionName !== 'permits') {
      console.error(`❌ ERROR: Permit model is querying the wrong collection! Expected "permits", but got "${collectionName}"`);
      throw new Error(`Permit model is querying wrong collection: ${collectionName}. Expected "permits".`);
    }
    
    console.log(`📋 API /api/permits: Fetching ALL permits (NO client filtering - this is a global permit library)`);
    
    // Fetch ALL permits - no filtering, no limit - fetch everything from the permits collection
    // Using lean() for better performance with large datasets
    const permits = await Permit.find({}).sort({ lastUpdated: -1 }).lean();
    
    console.log(`📋 API /api/permits: Fetched ${permits.length} permits from collection "${collectionName}"`);
    
    // Log a sample permit to verify it's from the correct collection
    if (permits.length > 0) {
      const samplePermit = permits[0];
      console.log(`📄 Sample permit from collection "${collectionName}":`, {
        _id: samplePermit._id,
        name: samplePermit.name,
        level: samplePermit.level,
        hasActivities: !!samplePermit.activities,
      });
    }
    
    // Remove duplicates based on _id (in case there are any)
    const uniquePermits = permits.filter((permit, index, self) => 
      index === self.findIndex((p) => p._id.toString() === permit._id.toString())
    );
    
    console.log(`✅ API: Returning ${uniquePermits.length} unique permits`);
    
    // Transform permits to match the frontend interface
    const transformedPermits = uniquePermits.map((permit: any) => {
      // Get description from activities array (first item) or use empty string
      // The description is stored in the activities array when permits are saved
      const description = permit.activities && permit.activities.length > 0 
        ? (typeof permit.activities[0] === 'string' ? permit.activities[0] : '')
        : '';
      
      // Determine complexity from activities or default to Medium
      let complexity: 'High' | 'Medium' | 'Low' = 'Medium';
      // We don't store relevance in the schema, so we'll default to Medium
      // You could add a relevance field to the schema if needed
      
      return {
        _id: permit._id.toString(),
        name: permit.name || 'Unnamed Permit',
        description: description || 'No description available',
        category: permit.level === 'federal' ? 'Federal' : permit.level === 'municipal' ? 'Municipal' : 'Provincial',
        authority: permit.authority || 'BizPaL',
        complexity: complexity,
        estimatedTime: 'N/A', // Not stored in current schema
        fees: 'N/A', // Not stored in current schema
        // Include all extracted data
        prerequisites: permit.prerequisites,
        contactInfo: permit.contactInfo,
        lastVerified: permit.lastVerified,
        moreInfoUrl: permit.moreInfoUrl,
        applyUrl: permit.applyUrl,
        fullText: permit.fullText,
        fullHtml: permit.fullHtml,
        permitTitle: permit.permitTitle,
        expandedDetails: permit.expandedDetails,
      };
    });
    
    return NextResponse.json(transformedPermits);
  } catch (error) {
    console.error('❌ Error fetching permits:', error);
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
    
    console.log('📝 Creating new permit:', body.name);
    
    // Validate required fields
    if (!body.name || !body.level || !body.authority || !body.jurisdiction?.province) {
      return NextResponse.json(
        { error: 'Missing required fields: name, level, authority, and jurisdiction.province are required' },
        { status: 400 }
      );
    }

    // Create permit with required fields
    const permitData = {
      name: body.name,
      level: body.level,
      authority: body.authority,
      jurisdiction: {
        country: body.jurisdiction?.country || 'Canada',
        province: body.jurisdiction.province,
        ...(body.jurisdiction?.city && { city: body.jurisdiction.city }),
      },
      businessTypes: Array.isArray(body.businessTypes) ? body.businessTypes : [],
      activities: Array.isArray(body.activities) ? body.activities : [],
      applyUrl: body.applyUrl || 'https://beta.bizpal-perle.ca/en',
      sourceUrl: body.sourceUrl || 'https://beta.bizpal-perle.ca/en',
      lastUpdated: new Date(),
      // Optional fields
      ...(body.prerequisites && { prerequisites: body.prerequisites }),
      ...(body.contactInfo && { contactInfo: body.contactInfo }),
      ...(body.lastVerified && { lastVerified: body.lastVerified }),
      ...(body.moreInfoUrl && { moreInfoUrl: body.moreInfoUrl }),
      ...(body.fullText && { fullText: body.fullText }),
      ...(body.fullHtml && { fullHtml: body.fullHtml }),
      ...(body.permitTitle && { permitTitle: body.permitTitle }),
      ...(body.expandedDetails && { expandedDetails: body.expandedDetails }),
    };

    const newPermit = new Permit(permitData);
    await newPermit.save();
    
    console.log('✅ Permit created successfully:', newPermit._id);
    
    const permitObj = newPermit.toObject();
    return NextResponse.json({
      success: true,
      permit: {
        ...permitObj,
        _id: permitObj._id.toString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Error creating permit:', error);
    return NextResponse.json(
      { error: 'Failed to create permit', details: error.message },
      { status: 500 }
    );
  }
}
