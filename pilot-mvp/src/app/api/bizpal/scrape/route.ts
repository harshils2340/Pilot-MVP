// import { NextRequest, NextResponse } from 'next/server';
// import connectToDB from '@/app/lib/mongodb';
// import { Permit } from '@/app/lib/permits/schema';

// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

// export async function POST(req: NextRequest) {
//   const startTime = Date.now();

//   try {
//     const body = await req.json();
//     const { location, businessType, permitKeywords } = body;

//     if (!location || !businessType) {
//       return NextResponse.json({ error: 'Location and businessType are required' }, { status: 400 });
//     }

//     console.log('\n🔍 Starting BizPaL scraping...');
//     const { runBizPalSearch } = await import('@/lib/selenium/bizpal.worker');

//     // ✅ Pass website inputs to Selenium dynamically
//     const permits = await runBizPalSearch({ location, businessType, permitKeywords: permitKeywords || '' });
//     console.log(`\n✅ Scraping complete! Found ${permits.length} permits`);

//     await connectToDB();
//     console.log('✅ Connected to MongoDB');

//     // Save to MongoDB
//     const savedPermits = [];
//     for (const permit of permits) {
//       try {
//         const existing = await Permit.findOne({ name: permit.name });
//         if (!existing) {
//           const newPermit = new Permit({
//             name: permit.name,
//             level: 'unknown',
//             authority: 'BizPaL',
//             jurisdiction: { country: 'Canada' },
//             businessTypes: [businessType],
//             activities: [],
//             applyUrl: 'https://beta.bizpal-perle.ca/en',
//             sourceUrl: 'https://beta.bizpal-perle.ca/en',
//             lastUpdated: new Date(),
//           });
//           await newPermit.save();
//           savedPermits.push(newPermit);
//         }
//       } catch (err) {
//         console.error(`❌ Error saving permit ${permit.name}:`, err);
//       }
//     }

//     const endTime = Date.now();
//     const duration = ((endTime - startTime) / 1000).toFixed(2);

//     return NextResponse.json({ success: true, totalFound: permits.length, totalSaved: savedPermits.length, duration, permits: savedPermits });

//   } catch (err: any) {
//     console.error('❌ BizPaL scraping API error:', err);
//     return NextResponse.json({ success: false, error: err.message }, { status: 500 });
//   }
// }












































import { NextRequest, NextResponse } from 'next/server';
import connectToDB from '@/app/lib/mongodb';
import { Permit } from '@/app/lib/permits/schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // --- Parse input ---
    const body = await req.json();
    const location = String(body.location ?? '').trim();
    const businessType = String(body.businessType ?? '').trim();
    const permitKeywords = String(body.permitKeywords ?? '').trim();

    // --- Validate required inputs ---
    if (!location || !businessType) {
      return NextResponse.json(
        { error: 'location and businessType are required' },
        { status: 400 }
      );
    }

    console.log('\n🔍 BizPaL scrape request received');
    console.log({ location, businessType, permitKeywords });

    // --- Import Selenium worker dynamically ---
    const { runBizPalSearch } = await import('@/lib/selenium/bizpal.worker');

    console.log('🚀 Starting Selenium worker...');
    const permits = await runBizPalSearch({ location, businessType, permitKeywords });
    console.log(`✅ Selenium finished. Found ${permits.length} permits`);

    // --- Connect to MongoDB ---
    await connectToDB();
    console.log('✅ Connected to MongoDB');

    // --- Save permits dynamically ---
    const savedPermits = [];
    for (const permit of permits) {
      try {
        const existing = await Permit.findOne({ name: permit.name });

        if (existing) {
          // Update existing permit
          existing.lastUpdated = new Date();
          existing.businessTypes = Array.from(new Set([...existing.businessTypes, businessType]));
          if (permit.description && !existing.activities.includes(permit.description)) {
            existing.activities.push(permit.description);
          }
          await existing.save();
          savedPermits.push(existing);
        } else {
          // Create new permit
          const newPermit = new Permit({
            name: permit.name,
            level: 'unknown',
            authority: 'BizPaL',
            jurisdiction: { country: 'Canada' },
            businessTypes: [businessType],
            activities: permit.description ? [permit.description] : [],
            applyUrl: 'https://beta.bizpal-perle.ca/en',
            sourceUrl: 'https://beta.bizpal-perle.ca/en',
            lastUpdated: new Date(),
          });
          await newPermit.save();
          savedPermits.push(newPermit);
        }
      } catch (err) {
        console.error(`❌ Error saving permit ${permit.name}:`, err);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    return NextResponse.json({
      success: true,
      totalFound: permits.length,
      totalSaved: savedPermits.length,
      duration,
      permits: savedPermits,
    });

  } catch (err: unknown) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('❌ BizPaL scraping API error:', err);

    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
        duration,
      },
      { status: 500 }
    );
  }
}
