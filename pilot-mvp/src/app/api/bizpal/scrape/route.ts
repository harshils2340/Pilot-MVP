import { NextResponse } from 'next/server';
import { scrapeBizpal } from '@/lib/selenium/bizpalScraper';

// Example POST request handler
export async function POST() {
  const result = await scrapeBizpal({
    businessType: 'Restaurant',
    location: 'Toronto, ON',
    permitKeywords: 'zoning, plumbing', // <-- added this to satisfy BizpalInput type
  });

  return NextResponse.json(result);
}
