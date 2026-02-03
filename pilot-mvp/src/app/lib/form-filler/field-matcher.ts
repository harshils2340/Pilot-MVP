/**
 * Field matching logic from form-filler - maps PDF form field names to business context
 */

import type { BusinessContext } from './context-storage';

export interface FieldMatch {
  value: string | boolean;
  confidence: number;
  source: string;
  reasoning?: string;
}

export interface ParsedField {
  fieldName: string;
  fieldType?: string;
  inputType?: string;
}

export function matchFieldToContext(
  field: ParsedField,
  context: BusinessContext
): FieldMatch | null {
  const fieldName = (field.fieldName || '').toLowerCase().replace(/[_-]/g, '');
  const inputType = field.inputType || field.fieldType || 'text';

  // Direct name matching
  if (
    fieldName.includes('businessname') ||
    fieldName.includes('companyname') ||
    fieldName.includes('legalname')
  ) {
    const value = context.legalName || context.businessName;
    if (value) {
      return { value: String(value), confidence: 95, source: 'direct_match' };
    }
  }

  if (fieldName.includes('operatingname') || fieldName.includes('tradingname') || fieldName.includes('dba')) {
    const value = context.businessName;
    if (value) {
      return { value: String(value), confidence: 90, source: 'direct_match' };
    }
  }

  // Address fields
  if (fieldName.includes('address') || fieldName.includes('street')) {
    if (fieldName.includes('city')) {
      const value = context.city;
      if (value) return { value: String(value), confidence: 90, source: 'direct_match' };
    }
    if (fieldName.includes('province')) {
      const value = context.province;
      if (value) return { value: String(value), confidence: 90, source: 'direct_match' };
    }
    if (fieldName.includes('postal') || fieldName.includes('zip')) {
      const addr = typeof context.businessAddress === 'string' ? context.businessAddress : '';
      const postal = addr.match(/[A-Z0-9]{3}\s*[A-Z0-9]{3}/i)?.[0] || '';
      if (postal) return { value: postal, confidence: 85, source: 'address_parsing' };
    }
    const value =
      typeof context.businessAddress === 'string'
        ? context.businessAddress
        : (context.businessAddress as { full?: string })?.full || '';
    if (value) {
      return { value: String(value), confidence: 90, source: 'direct_match' };
    }
  }

  if (fieldName.includes('mailingaddress')) {
    const value =
      typeof context.businessAddress === 'string'
        ? context.businessAddress
        : (context.businessAddress as { full?: string })?.full || '';
    if (value) {
      return { value: String(value), confidence: 90, source: 'direct_match' };
    }
  }

  // Email
  if (fieldName.includes('email')) {
    const value = context.contactEmail || context.ownerEmail;
    if (value) {
      return { value: String(value), confidence: 95, source: 'direct_match' };
    }
  }

  // Phone
  if (fieldName.includes('phone') || fieldName.includes('telephone')) {
    const value = context.contactPhone;
    if (value) {
      return { value: String(value), confidence: 95, source: 'direct_match' };
    }
  }

  // Owner/Contact
  if (fieldName.includes('firstname') || (fieldName.includes('first') && fieldName.includes('name'))) {
    const value = context.ownerFirstName || context.ownerName?.split(' ')[0];
    if (value) return { value: String(value), confidence: 90, source: 'direct_match' };
  }
  if (fieldName.includes('lastname') || (fieldName.includes('last') && fieldName.includes('name'))) {
    const value = context.ownerLastName || context.ownerName?.split(' ').slice(1).join(' ');
    if (value) return { value: String(value), confidence: 90, source: 'direct_match' };
  }
  if (
    fieldName.includes('ownername') ||
    fieldName.includes('contactperson') ||
    fieldName.includes('applicantname') ||
    fieldName.includes('owner_name')
  ) {
    const value = context.ownerName;
    if (value) return { value: String(value), confidence: 90, source: 'direct_match' };
  }

  if (fieldName.includes('title') && !fieldName.includes('sub')) {
    // Owner title - use a sensible default if we have owner
    if (context.ownerName) {
      return { value: 'Owner', confidence: 80, source: 'default' };
    }
  }

  // Registration numbers
  if (fieldName.includes('businessnumber') || fieldName.includes('registrationnumber') || fieldName.includes('ein')) {
    const value = context.businessNumber;
    if (value) return { value: String(value), confidence: 95, source: 'rag_context' };
  }
  if (fieldName.includes('gstnumber') || fieldName.includes('hstnumber')) {
    const value = context.gstNumber;
    if (value) return { value: String(value), confidence: 95, source: 'rag_context' };
  }
  if (fieldName.includes('licensenumber') || fieldName.includes('licencenumber')) {
    const value = context.liquorLicenseNumber;
    if (value) return { value: String(value), confidence: 90, source: 'rag_context' };
  }

  // Yes/No questions (checkboxes)
  if (inputType === 'checkbox' || inputType === 'radio') {
    if (
      fieldName.includes('alcohol') ||
      fieldName.includes('liquor') ||
      fieldName.includes('wine') ||
      fieldName.includes('beer')
    ) {
      if (context.servesAlcohol || context.liquorLicenseNumber) {
        return {
          value: true,
          confidence: 95,
          source: 'rag_context',
          reasoning: 'Has approved Liquor License',
        };
      }
    }
    if (
      fieldName.includes('patio') ||
      fieldName.includes('outdoor') ||
      fieldName.includes('sidewalk') ||
      fieldName.includes('seating')
    ) {
      if (context.hasPatio || context.patioPermitNumber) {
        return {
          value: true,
          confidence: 95,
          source: 'rag_context',
          reasoning: 'Has approved Patio Permit',
        };
      }
    }
    if (fieldName.includes('entertainment') || fieldName.includes('music')) {
      if (context.liveEntertainment) {
        return { value: true, confidence: 85, source: 'rag_context' };
      }
    }
    if (fieldName.includes('heater') || fieldName.includes('heating')) {
      if (context.hasHeating !== undefined) {
        return { value: context.hasHeating, confidence: 80, source: 'rag_context' };
      }
    }
    if (fieldName.includes('barbeque') || fieldName.includes('barbecue')) {
      if (context.hasBarbecue !== undefined) {
        return { value: context.hasBarbecue, confidence: 80, source: 'rag_context' };
      }
    }
  }

  // Semantic matching
  if (
    fieldName.includes('name') &&
    !fieldName.includes('first') &&
    !fieldName.includes('last') &&
    !fieldName.includes('owner')
  ) {
    const value = context.businessName;
    if (value) return { value: String(value), confidence: 85, source: 'semantic_match' };
  }

  return null;
}

export function matchFieldsToContext(
  fields: ParsedField[],
  context: BusinessContext,
  confidenceThreshold = 80
): Array<ParsedField & { match: FieldMatch; shouldFill: boolean }> {
  return fields.map((field) => {
    const match = matchFieldToContext(field, context);
    return {
      ...field,
      match: match!,
      shouldFill: !!(match && match.confidence >= confidenceThreshold),
    };
  });
}
