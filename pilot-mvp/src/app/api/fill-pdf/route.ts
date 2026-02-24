/**
 * GET /api/fill-pdf?clientId=[clientId]&permitId=[permitId]&formId=[formId]
 *
 * Fetches a real government PDF, fills it with the client's business data
 * using pdf-lib, and streams the filled PDF back.
 *
 * The result is a fully populated PDF that Chrome renders immediately.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

/**
 * Build business context from client data
 * Makes assumptions for missing address fields
 */
function buildBusinessContextFromClient(client: any): {
  legalName: string;
  operatingName: string;
  streetNumber: string;
  streetName: string;
  suite: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  businessLicenceNumber: string;
  licenceExpiry: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerPosition: string;
  cafeStreet: string;
  cafeLength: string;
  cafeWidth: string;
  cafeSqm: string;
} {
  // Parse jurisdiction to extract city/province
  const jurisdiction = client.jurisdiction || '';
  const jurisdictionParts = jurisdiction.split(',').map((s: string) => s.trim());
  const city = jurisdictionParts[0] || client.address?.city || '';
  const province = jurisdictionParts[1] || client.address?.province || '';
  
  // Extract address components - try multiple sources
  let streetNumber = '';
  let streetName = '';
  let suite = '';
  
  // Try fullAddress first
  if (client.address?.fullAddress) {
    const addressParts = client.address.fullAddress.split(',').map((s: string) => s.trim());
    const streetAddress = addressParts[0] || '';
    const streetMatch = streetAddress.match(/^(\d+)\s+(.+)$/);
    if (streetMatch) {
      streetNumber = streetMatch[1];
      streetName = streetMatch[2];
    }
  }
  
  // Fallback to individual address fields
  if (!streetNumber && client.address?.streetNumber) {
    streetNumber = client.address.streetNumber;
  }
  if (!streetName && client.address?.streetName) {
    streetName = client.address.streetName;
  }
  if (client.address?.suite) {
    suite = client.address.suite;
  } else if (client.address?.unit) {
    suite = client.address.unit;
  }
  
  // Parse owner name from contactInfo
  const ownerName = client.contactInfo?.name || client.ownerName || '';
  const nameParts = ownerName.split(' ').filter(Boolean);
  const ownerFirstName = nameParts[0] || client.ownerFirstName || '';
  const ownerLastName = nameParts.slice(1).join(' ') || client.ownerLastName || '';
  
  return {
    legalName: client.businessName || client.name || '',
    operatingName: client.businessName || client.name || client.operatingName || '',
    streetNumber: streetNumber || '',
    streetName: streetName || '',
    suite: suite || '',
    city: city || '',
    province: province || '',
    postalCode: client.address?.postalCode || client.address?.zipCode || client.postalCode || '',
    phone: client.contactInfo?.phone || client.contactPhone || client.phone || '',
    email: client.contactInfo?.email || client.contactEmail || client.email || '',
    businessLicenceNumber: client.businessLicenceNumber || client.licenseNumber || '',
    licenceExpiry: client.licenceExpiry || client.licenseExpiry || '',
    ownerFirstName: ownerFirstName,
    ownerLastName: ownerLastName,
    ownerPosition: client.ownerPosition || client.contactInfo?.position || 'Owner',
    cafeStreet: streetName || '',
    cafeLength: client.cafeLength || '6.0',
    cafeWidth: client.cafeWidth || '2.0',
    cafeSqm: client.cafeSqm || '12.0',
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const clientId = request.nextUrl.searchParams.get('clientId');
  const permitId = request.nextUrl.searchParams.get('permitId');
  const formId = request.nextUrl.searchParams.get('formId') || 'sidewalk-cafe'; // Default form

  if (!clientId || !permitId) {
    return NextResponse.json(
      { error: 'clientId and permitId are required' },
      { status: 400 }
    );
  }

  try {
    // Fetch client data
    const baseUrl = request.nextUrl.origin;
    const clientRes = await fetch(`${baseUrl}/api/clients/${encodeURIComponent(clientId)}`);
    
    if (!clientRes.ok) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    const client = await clientRes.json();
    
    // Fetch permit data to get form URL
    // First try permit management (client-specific permit plan)
    let permit: any = null;
    let permitRes = await fetch(`${baseUrl}/api/permits/management/${encodeURIComponent(permitId)}`);
    
    if (permitRes.ok) {
      const permitPlanData = await permitRes.json();
      if (permitPlanData && !permitPlanData.error) {
        permit = permitPlanData;
        // If permitPlan has permitId, fetch catalog data for form URL
        if (permitPlanData.permitId) {
          const catalogRes = await fetch(`${baseUrl}/api/permits/${encodeURIComponent(permitPlanData.permitId)}`);
          if (catalogRes.ok) {
            const catalogData = await catalogRes.json();
            if (catalogData && !catalogData.error) {
              permit = { ...permitPlanData, ...catalogData };
            }
          }
        }
      }
    }
    
    // If not found in permit management, try catalog directly
    if (!permit) {
      permitRes = await fetch(`${baseUrl}/api/permits/${encodeURIComponent(permitId)}`);
      if (permitRes.ok) {
        permit = await permitRes.json();
      }
    }
    
    // Build business context from client
    const businessContext = buildBusinessContextFromClient(client);
    
    // Get form URL from permit or use default
    const formUrl = permit?.applyUrl || permit?.sourceUrl || 
      'https://www.toronto.ca/wp-content/uploads/2023/11/898c-sidewalk-cafe-R57-FORM.pdf';
    
    // 1. Fetch the original government PDF
    const pdfResponse = await fetch(formUrl, { next: { revalidate: 86400 } });
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
    }
    const pdfBytes = await pdfResponse.arrayBuffer();

    // 2. Load PDF and parse form fields
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    // Log all field names for debugging
    const fieldNames = fields.map(f => f.getName());
    console.log('[fill-pdf] PDF form fields found:', fieldNames);

    // 3. Intelligent field matching - match business context to actual PDF field names
    // Helper to find field by partial name match
    const findFieldByName = (searchTerms: string[], fieldType: 'text' | 'checkbox' | 'dropdown' = 'text') => {
      for (const term of searchTerms) {
        const lowerTerm = term.toLowerCase();
        for (const fieldName of fieldNames) {
          const lowerField = fieldName.toLowerCase();
          // Try exact match first, then partial
          if (lowerField === lowerTerm || lowerField.includes(lowerTerm) || lowerTerm.includes(lowerField)) {
            // Verify field type matches
            try {
              if (fieldType === 'text') {
                form.getTextField(fieldName);
                return fieldName;
              } else if (fieldType === 'checkbox') {
                form.getCheckBox(fieldName);
                return fieldName;
              } else if (fieldType === 'dropdown') {
                form.getDropdown(fieldName);
                return fieldName;
              }
            } catch {
              continue;
            }
          }
        }
      }
      return null;
    };

    // Map business context to PDF fields (try common field name patterns)
    const businessNameField = findFieldByName(['Legal Business Name', 'business name', 'legal name', 'company name'], 'text') || 
                              findFieldByName(['name'], 'text');
    const operatingNameField = findFieldByName(['Operating Name', 'operating name', 'trade name', 'dba'], 'text');
    const streetNumberField = findFieldByName(['Street Number', 'street number', 'address number'], 'text');
    const streetNameField = findFieldByName(['Street Name', 'street name', 'street address'], 'text');
    const suiteField = findFieldByName(['SuiteUnit Number', 'Suite', 'Unit', 'suite', 'unit'], 'text');
    const cityField = findFieldByName(['CityTown', 'City', 'Town', 'city', 'town'], 'text');
    const provinceField = findFieldByName(['Province', 'province', 'state', 'State'], 'dropdown') || 
                          findFieldByName(['Province', 'province', 'state', 'State'], 'text');
    const postalCodeField = findFieldByName(['Postal Code', 'postal code', 'zip code', 'postal'], 'text');
    const phoneField = findFieldByName(['Business Telephone Number', 'phone', 'telephone', 'tel'], 'text');
    const emailField = findFieldByName(['Business Email', 'email', 'e-mail', 'mail'], 'text');
    const licenceNumberField = findFieldByName(['Business Licence Number', 'licence number', 'license number'], 'text');
    const expiryField = findFieldByName(['Expiry Date', 'expiry', 'expire', 'expiration'], 'text');
    const firstNameField = findFieldByName(['First Name', 'first name', 'given name'], 'text');
    const lastNameField = findFieldByName(['Last Name', 'last name', 'surname', 'family name'], 'text');
    const positionField = findFieldByName(['Position Held', 'position', 'title', 'role'], 'dropdown') ||
                          findFieldByName(['Position Held', 'position', 'title', 'role'], 'text');

    // 4. Fill text fields with matched names
    const fillTextField = (fieldName: string | null, value: string) => {
      if (!fieldName || !value) return;
      try {
        const field = form.getTextField(fieldName);
        field.setText(value);
        console.log(`[fill-pdf] Filled ${fieldName} = ${value}`);
      } catch (err) {
        console.warn(`[fill-pdf] Could not fill ${fieldName}:`, err);
      }
    };

    // Fill all matched fields
    if (businessNameField) fillTextField(businessNameField, businessContext.legalName);
    if (operatingNameField) fillTextField(operatingNameField, businessContext.operatingName);
    if (streetNumberField) fillTextField(streetNumberField, businessContext.streetNumber);
    if (streetNameField) fillTextField(streetNameField, businessContext.streetName);
    if (suiteField) fillTextField(suiteField, businessContext.suite);
    if (cityField) fillTextField(cityField, businessContext.city);
    if (provinceField) {
      try {
        const field = form.getDropdown(provinceField);
        const options = field.getOptions();
        const match = options.find(o => 
          o.toLowerCase() === businessContext.province.toLowerCase() ||
          o.toLowerCase().includes(businessContext.province.toLowerCase())
        );
        if (match) {
          field.select(match);
          console.log(`[fill-pdf] Selected ${provinceField} = ${match}`);
        } else {
          // Try as text field
          fillTextField(provinceField, businessContext.province);
        }
      } catch {
        fillTextField(provinceField, businessContext.province);
      }
    }
    if (postalCodeField) fillTextField(postalCodeField, businessContext.postalCode);
    if (phoneField) fillTextField(phoneField, businessContext.phone);
    if (emailField) fillTextField(emailField, businessContext.email);
    if (licenceNumberField) fillTextField(licenceNumberField, businessContext.businessLicenceNumber);
    if (expiryField) fillTextField(expiryField, businessContext.licenceExpiry);
    if (firstNameField) fillTextField(firstNameField, businessContext.ownerFirstName);
    if (lastNameField) fillTextField(lastNameField, businessContext.ownerLastName);
    if (positionField) {
      try {
        const field = form.getDropdown(positionField);
        const options = field.getOptions();
        const match = options.find(o => 
          o.toLowerCase().includes(businessContext.ownerPosition.toLowerCase())
        );
        if (match) {
          field.select(match);
          console.log(`[fill-pdf] Selected ${positionField} = ${match}`);
        } else {
          fillTextField(positionField, businessContext.ownerPosition);
        }
      } catch {
        fillTextField(positionField, businessContext.ownerPosition);
      }
    }

    // 5. Fill checkboxes (try common checkbox patterns)
    for (const fieldName of fieldNames) {
      try {
        const field = form.getCheckBox(fieldName);
        const lowerName = fieldName.toLowerCase();
        // Auto-check common affirmative checkboxes
        if (lowerName.includes('agree') || lowerName.includes('accept') || 
            lowerName.includes('certify') || lowerName.includes('confirm')) {
          field.check();
          console.log(`[fill-pdf] Checked ${fieldName}`);
        }
      } catch {
        // Not a checkbox, skip
      }
    }

    // 6. Save and return the filled PDF
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
