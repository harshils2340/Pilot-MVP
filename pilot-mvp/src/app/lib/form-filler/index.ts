/**
 * Form Filler - integrates form-filler logic with pdf-lib for PDF form filling
 * Parses form fields, matches to business context, and fills PDFs
 */

import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown } from 'pdf-lib';
import type { BusinessContext } from './context-storage';
import { matchFieldToContext, matchFieldsToContext } from './field-matcher';
import { saveBusinessContext, getBusinessContext } from './context-storage';

export interface ParsedFormField {
  fieldName: string;
  fieldType: 'text' | 'checkbox' | 'dropdown' | 'unknown';
  defaultValue?: string;
}

export interface FormFillerOptions {
  confidenceThreshold?: number;
  businessContext?: BusinessContext;
  onProgress?: (percent: number, message: string) => void;
  onComplete?: (results: FormFillResult) => void;
  onError?: (error: Error) => void;
}

export interface FormFillResult {
  filled: number;
  skipped: number;
  total: number;
  pdfBytes: Uint8Array;
}

/**
 * Parse form fields from a PDF using pdf-lib
 */
export async function parsePDFFormFields(
  pdfBytes: ArrayBuffer | Uint8Array
): Promise<ParsedFormField[]> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  const result: ParsedFormField[] = [];

  for (const field of fields) {
    const name = field.getName();
    let fieldType: ParsedFormField['fieldType'] = 'unknown';
    let defaultValue: string | undefined;

    if (field.constructor.name === 'PDFTextField') {
      fieldType = 'text';
      defaultValue = (field as PDFTextField).getText();
    } else if (field.constructor.name === 'PDFCheckBox') {
      fieldType = 'checkbox';
    } else if (field.constructor.name === 'PDFDropdown') {
      fieldType = 'dropdown';
      const opts = (field as PDFDropdown).getOptions();
      if (opts.length > 0) defaultValue = opts[0];
    }

    result.push({ fieldName: name, fieldType, defaultValue });
  }

  return result;
}

/**
 * Fill a PDF form with matched values from business context
 */
export async function fillPDFForm(
  pdfBytes: ArrayBuffer | Uint8Array,
  fieldValues: Record<string, string | boolean>,
  options?: { onProgress?: (p: number, m: string) => void }
): Promise<FormFillResult> {
  const onProgress = options?.onProgress ?? (() => {});
  onProgress(10, 'Loading PDF...');

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  let filled = 0;
  let skipped = 0;

  onProgress(30, 'Filling form fields...');

  for (const field of fields) {
    const name = field.getName();
    const value = fieldValues[name];

    if (value === undefined || value === null) {
      skipped++;
      continue;
    }

    try {
      if (field.constructor.name === 'PDFTextField') {
        (field as PDFTextField).setText(String(value));
        filled++;
      } else if (field.constructor.name === 'PDFCheckBox') {
        if (value === true || value === 'true' || value === 'yes') {
          (field as PDFCheckBox).check();
          filled++;
        }
      } else if (field.constructor.name === 'PDFDropdown') {
        const dropdown = field as PDFDropdown;
        const options = dropdown.getOptions();
        const strVal = String(value);
        const matched = options.find(
          (opt) =>
            opt.toLowerCase().includes(strVal.toLowerCase()) ||
            strVal.toLowerCase().includes(opt.toLowerCase())
        );
        if (matched) {
          dropdown.select(matched);
          filled++;
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
    } catch {
      skipped++;
    }
  }

  onProgress(80, 'Saving PDF...');
  const filledBytes = await pdfDoc.save();
  onProgress(100, 'Complete!');

  return {
    filled,
    skipped,
    total: fields.length,
    pdfBytes: filledBytes,
  };
}

/**
 * Fill PDF from URL using business context - matches fields and fills
 */
export async function fillPDFFromURL(
  pdfUrl: string,
  businessContext: BusinessContext,
  options?: FormFillerOptions
): Promise<FormFillResult> {
  const confidenceThreshold = options?.confidenceThreshold ?? 80;
  const onProgress = options?.onProgress ?? (() => {});
  const onError = options?.onError ?? (() => {});

  try {
    onProgress(10, 'Fetching PDF...');
    const response = await fetch(pdfUrl);
    if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`);
    const pdfBytes = await response.arrayBuffer();

    onProgress(20, 'Parsing form fields...');
    const parsedFields = await parsePDFFormFields(pdfBytes);

    if (parsedFields.length === 0) {
      throw new Error('No fillable fields found in PDF');
    }

    onProgress(40, `Found ${parsedFields.length} fields, matching...`);
    const matched = matchFieldsToContext(
      parsedFields.map((f) => ({
        fieldName: f.fieldName,
        inputType: f.fieldType,
      })),
      businessContext,
      confidenceThreshold
    );

    const fieldValues: Record<string, string | boolean> = {};
    for (const m of matched) {
      if (m.shouldFill && m.match) {
        fieldValues[m.fieldName] = m.match.value;
      }
    }

    onProgress(50, 'Filling form...');
    const result = await fillPDFForm(pdfBytes, fieldValues, { onProgress });

    options?.onComplete?.(result);
    return result;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    onError(error);
    throw error;
  }
}

/**
 * Get suggested field values from business context for display in UI
 */
export function getSuggestedFieldValues(
  fieldNames: string[],
  context: BusinessContext,
  permitName?: string,
  clientName?: string
): Record<string, string> {
  const enriched: BusinessContext = {
    ...context,
    businessName: context.businessName || clientName,
    legalName: context.legalName || clientName,
  };

  const result: Record<string, string> = {};

  // Apply common permit-form defaults (keyed by normalized field name)
  const defaults: Record<string, string> = {
    business_name: clientName || context.businessName || 'Urban Eats Restaurant Group LLC',
    dba: clientName ? `${clientName} Downtown` : 'Urban Eats Downtown',
    ein: context.businessNumber || '12-3456789',
    business_address:
      (typeof context.businessAddress === 'string' ? context.businessAddress : null) ||
      '425 Market Street, San Francisco, CA 94105',
    mailing_address:
      (typeof context.businessAddress === 'string' ? context.businessAddress : null) ||
      '425 Market Street, San Francisco, CA 94105',
    phone: context.contactPhone || '(415) 555-0123',
    owner_name: context.ownerName || 'Sarah Chen',
    owner_title: 'Managing Partner',
    owner_email: context.contactEmail || 'sarah.chen@urbaneats.com',
    facility_type: 'Food Service Establishment',
    permit_type: permitName || 'Health Permit',
    number_of_employees: '15',
    square_footage: '2400',
    date: new Date().toLocaleDateString('en-US'),
  };

  const norm = (s: string) => s.toLowerCase().replace(/[_-]/g, '');

  for (const name of fieldNames) {
    const match = matchFieldToContext(
      { fieldName: name, inputType: 'text' },
      enriched
    );
    if (match && typeof match.value === 'string') {
      result[name] = match.value;
    } else {
      const defaultKey = Object.keys(defaults).find((k) => norm(k) === norm(name));
      if (defaultKey) result[name] = defaults[defaultKey];
    }
  }

  return result;
}

/**
 * Build business context from permit and client info for form filling
 */
export function buildBusinessContextFromPermit(
  permitName?: string,
  clientName?: string,
  overrides?: Partial<BusinessContext>
): BusinessContext {
  const base: BusinessContext = {
    businessName: clientName || 'Urban Eats Restaurant Group LLC',
    legalName: clientName || 'Urban Eats Restaurant Group LLC',
    businessAddress: '425 Market Street, San Francisco, CA 94105',
    contactEmail: 'sarah.chen@urbaneats.com',
    contactPhone: '(415) 555-0123',
    ownerName: 'Sarah Chen',
    ownerFirstName: 'Sarah',
    ownerLastName: 'Chen',
    businessNumber: '12-3456789',
    city: 'San Francisco',
    province: 'California',
    ...overrides,
  };

  const stored = getBusinessContext();
  if (stored) {
    return { ...base, ...stored, ...overrides };
  }
  return base;
}

export { saveBusinessContext, getBusinessContext };
export type { BusinessContext } from './context-storage';
