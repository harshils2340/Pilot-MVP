# Form Filler Integration

This module integrates the form-filler logic from the `form-filler` directory into the Pilot web app. It provides:

- **Field matching**: Maps PDF form field names to business context (business name, address, contact, etc.)
- **Context storage**: Uses localStorage for web (replaces Chrome extension's chrome.storage)
- **PDF filling**: Uses pdf-lib to parse, fill, and save PDF forms

## Usage

### FillablePDFModal

The `FillablePDFModal` component uses this library when the user clicks "Fill with AI":

```tsx
<FillablePDFModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  permitName="Health Permit"
  clientName="Urban Eats"
  formTitle="Health Permit Application (Form EH-01)"
  pdfUrl="/api/documents/sample-form"  // Optional: load from URL
/>
```

- Without `pdfUrl`: Creates a sample fillable PDF client-side
- With `pdfUrl`: Loads an existing fillable PDF and auto-detects fields

### Programmatic Usage

```ts
import {
  parsePDFFormFields,
  fillPDFForm,
  fillPDFFromURL,
  getSuggestedFieldValues,
  buildBusinessContextFromPermit,
} from '@/app/lib/form-filler';

// Parse fields from a PDF
const fields = await parsePDFFormFields(pdfBytes);

// Get suggested values from business context
const context = buildBusinessContextFromPermit('Health Permit', 'Acme Corp');
const values = getSuggestedFieldValues(['business_name', 'address'], context);

// Fill PDF from URL
const result = await fillPDFFromURL('/api/documents/sample-form', context, {
  onProgress: (p, m) => console.log(p, m),
  onComplete: (r) => console.log('Filled', r.filled, 'fields'),
});
```

## Relationship to form-filler Directory

The root `form-filler/` directory contains the original module (ES modules, Chrome extension oriented). This lib adapts it for:

- Next.js / React
- Web (localStorage instead of chrome.storage)
- pdf-lib from npm (no CDN)
- TypeScript
