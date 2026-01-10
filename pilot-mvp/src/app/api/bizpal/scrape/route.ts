import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { Permit } from '@/app/lib/permits/schema';

// Ensure this route is server-only
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Force console logs to flush immediately
if (typeof process !== 'undefined' && process.stdout) {
  const originalLog = console.log;
  console.log = (...args: any[]) => {
    originalLog(...args);
    process.stdout?.write?.('\n');
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { location, businessType, permitKeywords } = body;

    if (!location || !businessType) {
      return NextResponse.json(
        { error: 'Location and businessType are required' },
        { status: 400 }
      );
    }

    // Scrape BizPaL - dynamically import to avoid bundling issues
    console.log('\n🔍 Starting BizPaL scraping...');
    const { scrapeBizpal } = await import('@/lib/selenium/bizpalScraper');
    const permits = await scrapeBizpal({
      location,
      businessType,
      permitKeywords: permitKeywords || '',
    });

    console.log(`\n✅ Scraping complete! Found ${permits.length} permits from BizPaL`);
    console.log('📋 Permits found:');
    permits.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (${p.jurisdiction}, ${p.relevance} priority)`);
    });

    // Connect to database
    console.log('\n💾 Connecting to MongoDB...');
    await connectToDB();
    console.log('✅ Connected to MongoDB');

    // Parse location to extract province/city
    const locationParts = location.split(',').map((p: string) => p.trim());
    const province = locationParts[locationParts.length - 1] || 'Ontario';
    const city = locationParts.length > 1 ? locationParts[0] : undefined;
    console.log(`📍 Parsed location - Province: ${province}, City: ${city || 'N/A'}`);

    // Save permits to MongoDB (check if they exist first to avoid duplicates)
    console.log('\n💾 Saving permits to database...');
    const savedPermits = [];
    const updatedPermits = [];
    const newPermits = [];
    
    for (const bizpalPermit of permits) {
      try {
        // Check if permit already exists (by name and jurisdiction)
        const existingPermit = await Permit.findOne({
          name: bizpalPermit.name,
          'jurisdiction.province': province,
        });

        if (existingPermit) {
          // Update if exists
          console.log(`  🔄 Updating existing permit: ${bizpalPermit.name}`);
          existingPermit.sourceUrl = bizpalPermit.sourceUrl || existingPermit.sourceUrl;
          existingPermit.lastUpdated = new Date();
          // Update extended metadata if available
          if (bizpalPermit.contactInfo) {
            existingPermit.contactInfo = bizpalPermit.contactInfo as any;
            console.log(`    📧 Updated contact info`);
          }
          if (bizpalPermit.lastVerified) {
            existingPermit.lastVerified = bizpalPermit.lastVerified;
            console.log(`    📅 Updated last verified: ${bizpalPermit.lastVerified}`);
          }
          if (bizpalPermit.moreInfoUrl) {
            existingPermit.moreInfoUrl = bizpalPermit.moreInfoUrl;
            console.log(`    🔗 Updated more info URL`);
          }
          await existingPermit.save();
          savedPermits.push(existingPermit);
          updatedPermits.push(existingPermit);
        } else {
          // Create new permit
          console.log(`  ➕ Creating new permit: ${bizpalPermit.name}`);
          const permitLevel = bizpalPermit.jurisdiction.toLowerCase().includes('federal')
            ? 'federal'
            : bizpalPermit.jurisdiction.toLowerCase().includes('municipal')
            ? 'municipal'
            : 'provincial';

          const newPermit = new Permit({
            name: bizpalPermit.name,
            level: permitLevel,
            authority: bizpalPermit.jurisdiction,
            jurisdiction: {
              country: 'Canada',
              province: province,
              city: city || bizpalPermit.contactInfo?.address?.city,
            },
            businessTypes: [businessType],
            activities: bizpalPermit.activities || [bizpalPermit.jurisdiction],
            applyUrl: bizpalPermit.sourceUrl || bizpalPermit.moreInfoUrl || 'https://beta.bizpal-perle.ca/en',
            sourceUrl: bizpalPermit.sourceUrl || 'https://beta.bizpal-perle.ca/en',
            lastUpdated: new Date(),
            confidenceHints: {
              required: bizpalPermit.relevance === 'High',
            },
            // Add extended metadata
            contactInfo: bizpalPermit.contactInfo ? {
              municipality: bizpalPermit.contactInfo.municipality,
              department: bizpalPermit.contactInfo.department,
              email: bizpalPermit.contactInfo.email,
              phone: bizpalPermit.contactInfo.phone,
              address: bizpalPermit.contactInfo.address,
            } : undefined,
            lastVerified: bizpalPermit.lastVerified,
            moreInfoUrl: bizpalPermit.moreInfoUrl,
          });
          
          if (bizpalPermit.contactInfo) {
            console.log(`    📧 Contact info: ${bizpalPermit.contactInfo.municipality || 'N/A'}, ${bizpalPermit.contactInfo.phone || 'N/A'}`);
          }
          if (bizpalPermit.lastVerified) {
            console.log(`    📅 Last verified: ${bizpalPermit.lastVerified}`);
          }

          await newPermit.save();
          savedPermits.push(newPermit);
          newPermits.push(newPermit);
          console.log(`    ✅ Saved with ID: ${newPermit._id}`);
        }
      } catch (error) {
        console.error(`    ❌ Error saving permit ${bizpalPermit.name}:`, error);
        // Continue with other permits even if one fails
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Scraping Summary:');
    console.log(`  - Total permits found: ${permits.length}`);
    console.log(`  - New permits created: ${newPermits.length}`);
    console.log(`  - Existing permits updated: ${updatedPermits.length}`);
    console.log(`  - Total saved to DB: ${savedPermits.length}`);
    console.log(`  - Processing time: ${duration}s`);
    console.log('='.repeat(60) + '\n');

    return NextResponse.json({
      success: true,
      permits: savedPermits.map((p: any) => ({
        _id: p._id,
        name: p.name,
        level: p.level,
        jurisdiction: p.jurisdiction,
        authority: p.authority,
        activities: p.activities,
        sourceUrl: p.sourceUrl,
        // Include extended metadata if available
        contactInfo: p.contactInfo || undefined,
        lastVerified: p.lastVerified || undefined,
        moreInfoUrl: p.moreInfoUrl || undefined,
      })),
      totalFound: permits.length,
      totalSaved: savedPermits.length,
      newPermits: newPermits.length,
      updatedPermits: updatedPermits.length,
      duration: `${duration}s`,
    });
  } catch (error: any) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.error('\n❌ BizPaL scraping API error:', error);
    console.error(`   Error after ${duration}s`);
    console.error('   Stack trace:', error.stack);
    console.log('='.repeat(60) + '\n');
    
    // Always return valid JSON, even on error
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to scrape BizPaL', 
        details: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
