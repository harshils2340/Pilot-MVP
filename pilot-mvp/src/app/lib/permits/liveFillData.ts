/**
 * Live-fill step definitions for the demo.
 * Each entry maps a PDF field name to a human-readable label + value.
 * Order here controls the animation sequence in the LiveFillModal.
 */

export const SIDEWALK_CAFE_PDF_URL =
  'https://www.toronto.ca/wp-content/uploads/2023/11/898c-sidewalk-cafe-R57-FORM.pdf';

export const SIDEWALK_CAFE_FILL_STEPS = [
  // Business info first — the most visually impressive section
  { fieldName: 'Legal Business Name', label: 'Legal Business Name', value: 'King West Kitchen & Bar Inc.', type: 'text' as const },
  { fieldName: 'Operating Name if applicable', label: 'Operating Name', value: 'King West Kitchen & Bar', type: 'text' as const },
  { fieldName: 'Street Number', label: 'Street Number', value: '450', type: 'text' as const },
  { fieldName: 'Street Name', label: 'Street Name', value: 'King Street West', type: 'text' as const },
  { fieldName: 'SuiteUnit Number', label: 'Suite / Unit', value: 'Unit 2', type: 'text' as const },
  { fieldName: 'CityTown', label: 'City', value: 'Toronto', type: 'text' as const },
  { fieldName: 'Province', label: 'Province', value: 'ON', type: 'dropdown' as const },
  { fieldName: 'Postal Code', label: 'Postal Code', value: 'M5V 1L5', type: 'text' as const },

  // Contact
  { fieldName: 'Business Telephone Number', label: 'Business Telephone', value: '(416) 555-8842', type: 'text' as const },
  { fieldName: 'Business Email', label: 'Business Email', value: 'priya@kingwestkitchen.ca', type: 'text' as const },

  // Licence
  { fieldName: 'Business Licence Number', label: 'Licence Number', value: 'T-2024-09182', type: 'text' as const },
  { fieldName: 'Expiry Date yyyymmdd', label: 'Licence Expiry', value: '2026-03-15', type: 'text' as const },

  // Owner / applicant
  { fieldName: 'First Name', label: 'First Name', value: 'Priya', type: 'text' as const },
  { fieldName: 'Last Name', label: 'Last Name', value: 'Sharma', type: 'text' as const },
  { fieldName: 'Position Held in Corporation', label: 'Position', value: 'President', type: 'dropdown' as const },

  // Café details
  { fieldName: 'Name of the street where proposed café will be located', label: 'Café Street', value: 'King Street West', type: 'text' as const },
  { fieldName: 'Length', label: 'Café Length (m)', value: '6.0', type: 'text' as const },
  { fieldName: 'Width', label: 'Café Width (m)', value: '2.0', type: 'text' as const },
  { fieldName: 'Total SQM', label: 'Total Area (sqm)', value: '12.0', type: 'text' as const },

  // Checkboxes — café type & features
  { fieldName: 'front-frontage', label: 'Café Type: Front Frontage', value: 'yes', type: 'checkbox' as const },
  { fieldName: 'arterial', label: 'Road Class: Arterial', value: 'yes', type: 'checkbox' as const },
  { fieldName: 'using-heater-yes', label: 'Using Heaters: Yes', value: 'yes', type: 'checkbox' as const },
  { fieldName: 'heating-type-propane', label: 'Heater Type: Propane', value: 'yes', type: 'checkbox' as const },
  { fieldName: 'awning-over-yes', label: 'Awning Over Café: Yes', value: 'yes', type: 'checkbox' as const },
  { fieldName: 'awning-yes', label: 'Has Awning: Yes', value: 'yes', type: 'checkbox' as const },
  { fieldName: 'use-bbq-no', label: 'BBQ Usage: No', value: 'no', type: 'checkbox' as const },
];
