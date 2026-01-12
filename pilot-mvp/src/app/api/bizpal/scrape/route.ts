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

    // --- Extract province from location (e.g., "Toronto, ON" → "ON") ---
    const extractProvince = (locationStr: string): string => {
      // Common patterns: "City, ON", "City, Ontario", "ON"
      const provinceMatch = locationStr.match(/,\s*([A-Z]{2})$/i) || 
                           locationStr.match(/\b(ON|QC|BC|AB|MB|SK|NS|NB|NL|PE|YT|NT|NU)\b/i);
      if (provinceMatch) {
        const province = provinceMatch[1].toUpperCase();
        // Map full names to codes if needed
        const provinceMap: { [key: string]: string } = {
          'ONTARIO': 'ON', 'QUEBEC': 'QC', 'BRITISH COLUMBIA': 'BC', 'ALBERTA': 'AB',
          'MANITOBA': 'MB', 'SASKATCHEWAN': 'SK', 'NOVA SCOTIA': 'NS', 'NEW BRUNSWICK': 'NB',
          'NEWFOUNDLAND': 'NL', 'PRINCE EDWARD ISLAND': 'PE', 'YUKON': 'YT',
          'NORTHWEST TERRITORIES': 'NT', 'NUNAVUT': 'NU'
        };
        return provinceMap[province] || province;
      }
      // Default to Ontario if not found (most common for BizPaL)
      return 'ON';
    };

    const province = extractProvince(location);
    console.log(`📍 Extracted province: ${province} from location: "${location}"`);

    // --- Import Selenium worker (CommonJS module) ---
    let runBizPalSearch;
    try {
      // Use dynamic import - Next.js handles CommonJS modules correctly
      const workerModule: any = await import('@/lib/selenium/bizpal.worker');
      
      // CommonJS exports as module.exports, which becomes default in ESM
      // Try different export patterns
      runBizPalSearch = workerModule.runBizPalSearch || 
                        workerModule.default?.runBizPalSearch || 
                        (workerModule.default && typeof workerModule.default === 'function' ? workerModule.default : null);
      
      if (!runBizPalSearch || typeof runBizPalSearch !== 'function') {
        console.error('❌ Worker module structure:');
        console.error('   Keys:', Object.keys(workerModule));
        console.error('   Has runBizPalSearch:', 'runBizPalSearch' in workerModule);
        console.error('   Has default:', 'default' in workerModule);
        console.error('   Default type:', typeof workerModule.default);
        console.error('   runBizPalSearch type:', typeof runBizPalSearch);
        throw new Error('runBizPalSearch function not found or is not a function in worker module');
      }
      console.log('✅ Worker module imported successfully');
    } catch (importError: any) {
      console.error('❌ Failed to import worker module:');
      console.error('   Error type:', typeof importError);
      console.error('   Error:', importError);
      console.error('   Message:', importError?.message);
      console.error('   Stack:', importError?.stack);
      console.error('   Code:', importError?.code);
      throw new Error(`Failed to import Selenium worker: ${importError?.message || String(importError)}. Check if the file exists and is properly exported.`);
    }

    console.log('🚀 Starting Selenium worker...');
    console.log(`📋 Worker inputs - location: "${location}", businessType: "${businessType}", permitKeywords: "${permitKeywords || '(none)'}"`);
    
    let permits;
    try {
      permits = await (runBizPalSearch as any)({ location, businessType, permitKeywords });
      console.log(`✅ Selenium finished. Found ${permits.length} permits`);
      
      // Log sample permit data to verify extraction
      if (permits.length > 0) {
        const samplePermit = permits[0];
        console.log(`📋 Sample permit data:`, {
          name: samplePermit.name,
          hasExpandedDetails: !!samplePermit.expandedDetails,
          hasFullText: !!samplePermit.fullText,
          hasFullHtml: !!samplePermit.fullHtml,
          hasPermitTitle: !!samplePermit.permitTitle,
          buttonLinksCount: samplePermit.expandedDetails?.buttonLinks?.length || 0,
          imagesCount: samplePermit.expandedDetails?.images?.length || 0,
        });
      }
    } catch (workerError: unknown) {
      const errorMessage = workerError instanceof Error ? workerError.message : String(workerError);
      const errorStack = workerError instanceof Error ? workerError.stack : 'No stack trace';
      console.error('❌ Selenium worker failed:');
      console.error('   Message:', errorMessage);
      console.error('   Stack:', errorStack);
      throw new Error(`Selenium automation failed: ${errorMessage}. Check server logs for details.`);
    }

    // --- Connect to MongoDB ---
    await connectToDB();
    console.log('✅ Connected to MongoDB');

    // --- Save permits dynamically with duplicate checking ---
    const savedPermits = [];
    for (const permit of permits) {
      try {
        // Use jurisdiction from permit data if available, otherwise detect from name
        let permitLevel: 'municipal' | 'provincial' | 'federal' = 'provincial';
        if (permit.jurisdiction) {
          // Use the jurisdiction extracted from the permit row
          permitLevel = permit.jurisdiction as 'municipal' | 'provincial' | 'federal';
        } else {
          // Fallback: detect from name/description
          const permitNameLower = permit.name.toLowerCase();
          const permitDescLower = (permit.description || '').toLowerCase();
          
          if (permitNameLower.includes('federal') || permitDescLower.includes('federal')) {
            permitLevel = 'federal';
          } else if (permitNameLower.includes('municipal') || permitNameLower.includes('city') || 
                     permitNameLower.includes('municipality') || permitDescLower.includes('municipal')) {
            permitLevel = 'municipal';
          } else if (permitNameLower.includes('provincial') || permitDescLower.includes('provincial')) {
            permitLevel = 'provincial';
          }
        }

        // Extract city from location if available (e.g., "Toronto, ON" → "Toronto")
        const cityMatch = location.match(/^([^,]+)/);
        const city = cityMatch ? cityMatch[1].trim() : undefined;

        // Check for duplicate: same name AND same level AND same province
        // This prevents storing the same permit multiple times
        const existing = await Permit.findOne({ 
          name: permit.name,
          level: permitLevel,
          'jurisdiction.province': province
        });

        if (existing) {
          // Update existing permit with new information
          console.log(`🔄 Updating existing permit: "${permit.name}"`);
          existing.lastUpdated = new Date();
          existing.businessTypes = Array.from(new Set([...existing.businessTypes, businessType]));
          
          // Merge activities
          if (permit.activities && Array.isArray(permit.activities)) {
            existing.activities = Array.from(new Set([...existing.activities, ...permit.activities]));
          } else if (permit.description && !existing.activities.includes(permit.description)) {
            existing.activities.push(permit.description);
          }
          
          // Update description if new one is longer/more detailed
          if (permit.description && permit.description.length > (existing.activities[0]?.length || 0)) {
            if (!existing.activities.includes(permit.description)) {
              existing.activities.unshift(permit.description);
            }
          }
          
          // Update contact info if available and not already present
          if (permit.contactInfo && Object.keys(permit.contactInfo).length > 0) {
            if (!existing.contactInfo) {
              existing.contactInfo = permit.contactInfo;
            } else {
              // Merge contact info
              existing.contactInfo = {
                ...existing.contactInfo,
                ...permit.contactInfo,
                address: { ...existing.contactInfo.address, ...permit.contactInfo.address }
              };
            }
          }
          
          // Update last verified if newer
          if (permit.lastVerified) {
            existing.lastVerified = permit.lastVerified;
          }
          
          // Update URLs if available
          if (permit.moreInfoUrl) {
            existing.sourceUrl = permit.moreInfoUrl;
            existing.moreInfoUrl = permit.moreInfoUrl;
          }
          
          // Update online application URL if available
          if (permit.onlineApplicationUrl) {
            existing.applyUrl = permit.onlineApplicationUrl;
          }
          
          // Update bylaw URL if available (store in moreInfoUrl or create new field)
          if (permit.bylawUrl) {
            // Store in moreInfoUrl if not already set, or we could add a new field
            if (!existing.moreInfoUrl) {
              existing.moreInfoUrl = permit.bylawUrl;
            }
          }
          
          // Update prerequisites if available and not already present
          if (permit.prerequisites && !existing.prerequisites) {
            existing.prerequisites = permit.prerequisites;
          }
          
          // Update comprehensive data - always update if new data is available (not just if missing)
          if (permit.fullText) {
            existing.fullText = permit.fullText;
            console.log(`   ✅ Updated fullText for "${permit.name}"`);
          }
          if (permit.fullHtml) {
            existing.fullHtml = permit.fullHtml;
            console.log(`   ✅ Updated fullHtml for "${permit.name}"`);
          }
          if (permit.permitTitle) {
            existing.permitTitle = permit.permitTitle;
            console.log(`   ✅ Updated permitTitle for "${permit.name}"`);
          }
          if (permit.expandedDetails) {
            if (!existing.expandedDetails) {
              existing.expandedDetails = permit.expandedDetails;
              console.log(`   ✅ Added expandedDetails for "${permit.name}"`);
            } else {
              // Merge expanded details - avoid duplicates
              if (permit.expandedDetails.buttonLinks && permit.expandedDetails.buttonLinks.length > 0) {
                const existingUrls = new Set((existing.expandedDetails.buttonLinks || []).map((l: any) => l.url));
                const newLinks = permit.expandedDetails.buttonLinks.filter((l: any) => !existingUrls.has(l.url));
                if (newLinks.length > 0) {
                  existing.expandedDetails.buttonLinks = [
                    ...(existing.expandedDetails.buttonLinks || []),
                    ...newLinks
                  ];
                  console.log(`   ✅ Added ${newLinks.length} new button links for "${permit.name}"`);
                }
              }
              if (permit.expandedDetails.images && permit.expandedDetails.images.length > 0) {
                const existingSrcs = new Set((existing.expandedDetails.images || []).map((img: any) => img.src));
                const newImages = permit.expandedDetails.images.filter((img: any) => !existingSrcs.has(img.src));
                if (newImages.length > 0) {
                  existing.expandedDetails.images = [
                    ...(existing.expandedDetails.images || []),
                    ...newImages
                  ];
                  console.log(`   ✅ Added ${newImages.length} new images for "${permit.name}"`);
                }
              }
              // Update fullHtml and fullText in expandedDetails if available
              if (permit.expandedDetails.fullHtml) {
                existing.expandedDetails.fullHtml = permit.expandedDetails.fullHtml;
              }
              if (permit.expandedDetails.fullText) {
                existing.expandedDetails.fullText = permit.expandedDetails.fullText;
              }
            }
          }
          
          await existing.save();
          savedPermits.push(existing);
        } else {
          // Create new permit with all details
          console.log(`✨ Creating new permit: "${permit.name}" (${permitLevel})`);
          const newPermit = new Permit({
            name: permit.name,
            level: permitLevel, // From extracted jurisdiction or detected
            authority: 'BizPaL',
            jurisdiction: { 
              country: 'Canada',
              province: province, // Required field
              ...(city && { city }) // Optional city
            },
            businessTypes: [businessType],
            activities: permit.activities && Array.isArray(permit.activities) 
              ? permit.activities 
              : (permit.description ? [permit.description] : []),
            applyUrl: permit.onlineApplicationUrl || 'https://beta.bizpal-perle.ca/en',
            sourceUrl: permit.moreInfoUrl || permit.onlineApplicationUrl || 'https://beta.bizpal-perle.ca/en',
            lastUpdated: new Date(),
            // Extended metadata
            ...(permit.contactInfo && { contactInfo: permit.contactInfo }),
            ...(permit.lastVerified && { lastVerified: permit.lastVerified }),
            ...(permit.moreInfoUrl && { moreInfoUrl: permit.moreInfoUrl }),
            ...(permit.prerequisites && { prerequisites: permit.prerequisites }),
            // Store button URLs - onlineApplicationUrl goes to applyUrl, bylawUrl can go to moreInfoUrl if not already set
            ...(permit.onlineApplicationUrl && { applyUrl: permit.onlineApplicationUrl }),
            ...(permit.bylawUrl && !permit.moreInfoUrl && { moreInfoUrl: permit.bylawUrl }),
            // Store comprehensive extracted data
            ...(permit.fullText && { fullText: permit.fullText }),
            ...(permit.fullHtml && { fullHtml: permit.fullHtml }),
            ...(permit.permitTitle && { permitTitle: permit.permitTitle }),
            ...(permit.expandedDetails && { expandedDetails: permit.expandedDetails }),
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
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : 'No stack trace available';
    
    console.error('❌ BizPaL scraping API error:');
    console.error('   Message:', errorMessage);
    console.error('   Stack:', errorStack);
    console.error('   Duration:', duration, 'seconds');

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        duration,
      },
      { status: 500 }
    );
  }
}