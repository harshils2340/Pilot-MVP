/**
 * GET /api/fill-pdf?form=sidewalk-cafe
 *
 * Fetches a real City of Toronto government PDF, fills it with the client's
 * business data using pdf-lib, and streams the filled PDF back.
 *
 * The result is a fully populated PDF that Chrome renders immediately —
 * it looks like the system already knew every answer.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

// ---------------------------------------------------------------------------
// Client business context — "King West Kitchen & Bar" (Toronto demo client)
// In production this would come from the DB keyed by clientId.
// ---------------------------------------------------------------------------

const KING_WEST_CONTEXT = {
  legalName: 'King West Kitchen & Bar Inc.',
  operatingName: 'King West Kitchen & Bar',
  streetNumber: '450',
  streetName: 'King Street West',
  suite: 'Unit 2',
  city: 'Toronto',
  province: 'ON',
  postalCode: 'M5V 1L5',
  phone: '(416) 555-8842',
  email: 'priya@kingwestkitchen.ca',
  businessLicenceNumber: 'T-2024-09182',
  licenceExpiry: '2026-03-15',
  ownerFirstName: 'Priya',
  ownerLastName: 'Sharma',
  ownerPosition: 'Owner',
  cafeStreet: 'King Street West',
  // Cafe dimensions (metres)
  cafeLength: '6.0',
  cafeWidth: '2.0',
  cafeSqm: '12.0',
};

// ---------------------------------------------------------------------------
// Form definitions — maps a form slug to its source PDF + field mapping
// ---------------------------------------------------------------------------

interface FormDef {
  pdfUrl: string;
  textFields: Record<string, string>;
  checkBoxes: string[];           // field names to CHECK
  dropdowns: Record<string, string>; // field name → value to select
}

const FORMS: Record<string, FormDef> = {
  'sidewalk-cafe': {
    pdfUrl:
      'https://www.toronto.ca/wp-content/uploads/2023/11/898c-sidewalk-cafe-R57-FORM.pdf',
    textFields: {
      'Legal Business Name': KING_WEST_CONTEXT.legalName,
      'Operating Name if applicable': KING_WEST_CONTEXT.operatingName,
      'Street Number': KING_WEST_CONTEXT.streetNumber,
      'Street Name': KING_WEST_CONTEXT.streetName,
      'SuiteUnit Number': KING_WEST_CONTEXT.suite,
      'CityTown': KING_WEST_CONTEXT.city,
      'Postal Code': KING_WEST_CONTEXT.postalCode,
      'Business Telephone Number': KING_WEST_CONTEXT.phone,
      'Business Email': KING_WEST_CONTEXT.email,
      'Business Licence Number': KING_WEST_CONTEXT.businessLicenceNumber,
      'Expiry Date yyyymmdd': KING_WEST_CONTEXT.licenceExpiry,
      'First Name': KING_WEST_CONTEXT.ownerFirstName,
      'Last Name': KING_WEST_CONTEXT.ownerLastName,
      'Name of the street where proposed café will be located':
        KING_WEST_CONTEXT.cafeStreet,
      'Length': KING_WEST_CONTEXT.cafeLength,
      'Width': KING_WEST_CONTEXT.cafeWidth,
      'Total SQM': KING_WEST_CONTEXT.cafeSqm,
    },
    checkBoxes: [
      'front-frontage',     // frontage café on the front
      'arterial',           // road classification
      'using-heater-yes',   // has patio heaters
      'heating-type-propane', // propane heaters
      'awning-over-yes',    // awning over café
      'awning-yes',         // has awning
      'use-bbq-no',         // no BBQ
    ],
    dropdowns: {
      'Province': 'ON',
      'Position Held in Corporation': 'President',
    },
  },
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const formSlug = request.nextUrl.searchParams.get('form');

  if (!formSlug || !FORMS[formSlug]) {
    return NextResponse.json(
      { error: `Unknown form: ${formSlug}. Available: ${Object.keys(FORMS).join(', ')}` },
      { status: 400 }
    );
  }

  const formDef = FORMS[formSlug];

  try {
    // 1. Fetch the original government PDF
    const pdfResponse = await fetch(formDef.pdfUrl, { next: { revalidate: 86400 } });
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
    }
    const pdfBytes = await pdfResponse.arrayBuffer();

    // 2. Load and fill with pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();

    // Text fields
    for (const [fieldName, value] of Object.entries(formDef.textFields)) {
      try {
        const field = form.getTextField(fieldName);
        field.setText(value);
      } catch {
        // Field not found — skip silently
      }
    }

    // Checkboxes
    for (const fieldName of formDef.checkBoxes) {
      try {
        const field = form.getCheckBox(fieldName);
        field.check();
      } catch {
        // Field not found — skip silently
      }
    }

    // Dropdowns
    for (const [fieldName, value] of Object.entries(formDef.dropdowns)) {
      try {
        const field = form.getDropdown(fieldName);
        const options = field.getOptions();
        // Try exact match first, then case-insensitive partial
        const exact = options.find((o) => o === value);
        const match =
          exact ??
          options.find(
            (o) =>
              o.toLowerCase() === value.toLowerCase() ||
              o.toLowerCase().includes(value.toLowerCase())
          );
        if (match) {
          field.select(match);
        }
      } catch {
        // Field not found — skip silently
      }
    }

    // 3. Save and return the filled PDF
    const filledBytes = await pdfDoc.save();
    const responseBytes = new Uint8Array(filledBytes);
    return new NextResponse(responseBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="sidewalk-cafe-permit-filled.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[fill-pdf] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
