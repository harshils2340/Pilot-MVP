import { NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { Permit } from '@/app/lib/permits/schema';

export async function GET() {
  try {
    await connectToDB();
    
    // Fetch all permits from the database
    const permits = await Permit.find({}).sort({ lastUpdated: -1 }).lean();
    
    // Remove duplicates based on _id (in case there are any)
    const uniquePermits = permits.filter((permit, index, self) => 
      index === self.findIndex((p) => p._id.toString() === permit._id.toString())
    );
    
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
