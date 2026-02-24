/**
 * Debug endpoint to list PDF form fields
 * GET /api/fill-pdf/debug?pdfUrl=[url]
 */

import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function GET(request: NextRequest) {
  const pdfUrl = request.nextUrl.searchParams.get('pdfUrl');

  if (!pdfUrl) {
    return NextResponse.json(
      { error: 'pdfUrl parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Fetch PDF
    const pdfResponse = await fetch(pdfUrl, { next: { revalidate: 86400 } });
    if (!pdfResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${pdfResponse.status}` },
        { status: 500 }
      );
    }
    const pdfBytes = await pdfResponse.arrayBuffer();

    // Parse form fields
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    const fieldInfo = fields.map(field => {
      const name = field.getName();
      let type = 'unknown';
      let value: any = null;
      let options: string[] = [];

      try {
        if (field.constructor.name === 'PDFTextField') {
          type = 'text';
          value = (field as any).getText();
        } else if (field.constructor.name === 'PDFCheckBox') {
          type = 'checkbox';
          value = (field as any).isChecked();
        } else if (field.constructor.name === 'PDFDropdown') {
          type = 'dropdown';
          const dropdown = field as any;
          options = dropdown.getOptions();
          value = dropdown.getSelected();
        }
      } catch (err) {
        // Ignore errors
      }

      return {
        name,
        type,
        value,
        options: options.length > 0 ? options : undefined,
      };
    });

    return NextResponse.json({
      pdfUrl,
      totalFields: fieldInfo.length,
      fields: fieldInfo,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
