/**
 * API route that returns a sample fillable PDF form for testing the form-filler
 */

import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET() {
  try {
    const pdfDoc = await PDFDocument.create();
    const page1 = pdfDoc.addPage([612, 792]);
    const page2 = pdfDoc.addPage([612, 792]);
    const form = pdfDoc.getForm();
    const pageHeight = page1.getHeight();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Header + light styling so it feels like a real form
    page1.drawText('San Francisco Department of Public Health', {
      x: 72,
      y: pageHeight - 60,
      size: 16,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    page1.drawText('Food Service Establishment Permit Application (Sample)', {
      x: 72,
      y: pageHeight - 82,
      size: 11,
      font,
      color: rgb(0.25, 0.25, 0.25),
    });
    page1.drawLine({
      start: { x: 72, y: pageHeight - 95 },
      end: { x: 540, y: pageHeight - 95 },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    });

    const label = (text: string, x: number, y: number) => {
      page1.drawText(text, { x, y, size: 9, font, color: rgb(0.2, 0.2, 0.2) });
    };

    const fields = [
      { name: 'business_name', y: 660, label: 'Legal Business Name' },
      { name: 'dba', y: 620, label: 'Doing Business As (DBA)' },
      { name: 'ein', y: 580, label: 'Employer Identification Number (EIN)' },
      { name: 'business_address', y: 540, label: 'Business Physical Address' },
      { name: 'mailing_address', y: 500, label: 'Mailing Address' },
      { name: 'phone', y: 460, label: 'Business Phone Number' },
      { name: 'owner_name', y: 420, label: 'Owner/Authorized Representative Name' },
      { name: 'owner_title', y: 380, label: 'Title' },
      { name: 'owner_email', y: 340, label: 'Email' },
      { name: 'number_of_employees', y: 300, label: 'Number of Employees' },
      { name: 'square_footage', y: 260, label: 'Total Square Footage' },
      { name: 'date', y: 220, label: 'Date' },
    ];

    for (const f of fields) {
      label(f.label, 72, pageHeight - f.y);
      const textField = form.createTextField(f.name);
      textField.addToPage(page1, {
        x: 72,
        y: pageHeight - f.y - 22,
        width: 420,
        height: 20,
      });
    }

    // Dropdown + checkboxes to better mimic real forms
    page1.drawText('Facility Type', {
      x: 72,
      y: pageHeight - 160,
      size: 9,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    const facilityType = form.createDropdown('facility_type');
    facilityType.addOptions(['Restaurant', 'Cafe', 'Bar', 'Catering', 'Food Truck']);
    facilityType.addToPage(page1, {
      x: 72,
      y: pageHeight - 185,
      width: 220,
      height: 20,
    });

    page1.drawText('Permit Type', {
      x: 310,
      y: pageHeight - 160,
      size: 9,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    const permitType = form.createDropdown('permit_type');
    permitType.addOptions(['New', 'Renewal', 'Change of Ownership', 'Change of Use']);
    permitType.addToPage(page1, {
      x: 310,
      y: pageHeight - 185,
      width: 182,
      height: 20,
    });

    page1.drawText('Operational Details (check all that apply)', {
      x: 72,
      y: pageHeight - 210,
      size: 9,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });

    const checkboxY = pageHeight - 240;
    const cb1 = form.createCheckBox('serves_alcohol');
    cb1.addToPage(page1, { x: 72, y: checkboxY, width: 14, height: 14 });
    page1.drawText('Serves Alcohol', { x: 92, y: checkboxY + 3, size: 9, font });

    const cb2 = form.createCheckBox('has_patio');
    cb2.addToPage(page1, { x: 210, y: checkboxY, width: 14, height: 14 });
    page1.drawText('Has Outdoor Patio', { x: 230, y: checkboxY + 3, size: 9, font });

    const cb3 = form.createCheckBox('live_entertainment');
    cb3.addToPage(page1, { x: 360, y: checkboxY, width: 14, height: 14 });
    page1.drawText('Live Entertainment', { x: 380, y: checkboxY + 3, size: 9, font });

    // Page 2: signatures + additional details
    const page2Height = page2.getHeight();
    page2.drawText('Certification & Signature (Sample)', {
      x: 72,
      y: page2Height - 60,
      size: 14,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    page2.drawLine({
      start: { x: 72, y: page2Height - 72 },
      end: { x: 540, y: page2Height - 72 },
      thickness: 1,
      color: rgb(0.85, 0.85, 0.85),
    });
    page2.drawText(
      'I certify that the information provided is true and correct to the best of my knowledge.',
      { x: 72, y: page2Height - 98, size: 9, font, color: rgb(0.25, 0.25, 0.25) }
    );

    page2.drawText('Printed Name', { x: 72, y: page2Height - 140, size: 9, font });
    const printedName = form.createTextField('cert_printed_name');
    printedName.addToPage(page2, { x: 72, y: page2Height - 165, width: 260, height: 20 });

    page2.drawText('Signature', { x: 350, y: page2Height - 140, size: 9, font });
    const signature = form.createTextField('cert_signature');
    signature.addToPage(page2, { x: 350, y: page2Height - 165, width: 190, height: 20 });

    page2.drawText('Date', { x: 72, y: page2Height - 200, size: 9, font });
    const certDate = form.createTextField('cert_date');
    certDate.addToPage(page2, { x: 72, y: page2Height - 225, width: 140, height: 20 });

    const bytes = await pdfDoc.save();

    return new NextResponse(bytes.buffer, {
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
