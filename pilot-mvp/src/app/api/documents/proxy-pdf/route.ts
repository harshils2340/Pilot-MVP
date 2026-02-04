/**
 * Proxy endpoint to fetch external PDFs server-side (bypasses CORS)
 * Usage: /api/documents/proxy-pdf?url=https://example.com/form.pdf
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pdfUrl = searchParams.get('url');

  if (!pdfUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // Validate URL
    const url = new URL(pdfUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
    }

    // Fetch the PDF from the external URL
    const response = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Pilot-MVP/1.0)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'application/pdf';
    if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
      console.warn(`Unexpected content-type for PDF: ${contentType}`);
    }

    const pdfBytes = await response.arrayBuffer();

    // Return the PDF with appropriate headers
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="form.pdf"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error proxying PDF:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch PDF' },
      { status: 500 }
    );
  }
}

