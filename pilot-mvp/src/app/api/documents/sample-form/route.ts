/**
 * API route that returns a sample fillable PDF form for testing the form-filler
 */

import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function GET() {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]);
    const form = pdfDoc.getForm();
    const pageHeight = page.getHeight();

    const fields = [
      { name: 'business_name', y: 700 },
      { name: 'dba', y: 660 },
      { name: 'ein', y: 620 },
      { name: 'business_address', y: 580 },
      { name: 'mailing_address', y: 540 },
      { name: 'phone', y: 500 },
      { name: 'owner_name', y: 460 },
      { name: 'owner_title', y: 420 },
      { name: 'owner_email', y: 380 },
      { name: 'facility_type', y: 340 },
      { name: 'permit_type', y: 300 },
      { name: 'number_of_employees', y: 260 },
      { name: 'square_footage', y: 220 },
      { name: 'date', y: 180 },
    ];

    for (const f of fields) {
      const textField = form.createTextField(f.name);
      textField.addToPage(page, {
        x: 72,
        y: pageHeight - f.y - 22,
        width: 300,
        height: 20,
      });
    }

    const bytes = await pdfDoc.save();

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="sample-permit-form.pdf"',
      },
    });
  } catch (err) {
    console.error('Failed to generate sample form:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
