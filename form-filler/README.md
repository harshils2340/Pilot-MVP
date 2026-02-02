# Form Filler Module

Complete form filling solution extracted from the Pilot extension. This module can fill both PDF forms and HTML forms using business context data.

## Files

- `form-filler.js` - Main form filler class (combines all functionality)
- `pdf-filler.js` - PDF form field filler using PDF.js
- `pdf-handler.js` - PDF handling utilities
- `pdf-parser.js` - PDF form field parser
- `context-storage.js` - Business context storage and field matching
- `libs/` - PDF libraries (pdf-lib, pdf.js)

## Usage

### Basic Usage

```javascript
import FormFiller from './form-filler.js';

const filler = new FormFiller({
  confidenceThreshold: 80,
  businessContext: {
    businessName: 'My Business',
    businessAddress: '123 Main St, Toronto, ON',
    contactEmail: 'contact@business.com',
    contactPhone: '416-555-1234',
    // ... more business data
  },
  onProgress: (percent, message) => {
    console.log(`${percent}%: ${message}`);
  },
  onComplete: (results) => {
    console.log(`Filled ${results.filled} fields`);
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});

// Fill PDF form
await filler.fillPDFFromURL('https://example.com/form.pdf');

// Fill HTML form
await filler.fillHTMLForm();
```

### With Business Context

```javascript
const businessContext = {
  businessName: 'Acme Corp',
  legalName: 'Acme Corporation Inc.',
  businessAddress: '123 Main Street, Suite 100, Toronto, ON M5H 2N2',
  contactEmail: 'info@acme.com',
  contactPhone: '416-555-1234',
  ownerName: 'John Doe',
  ownerFirstName: 'John',
  ownerLastName: 'Doe',
  businessNumber: '123456789',
  gstNumber: '123456789RT0001',
  city: 'Toronto',
  province: 'Ontario',
  servesAlcohol: true,
  liquorLicenseNumber: 'LIC-12345',
  hasPatio: true,
  patioPermitNumber: 'PATIO-67890'
};

filler.setBusinessContext(businessContext);
```

### Download Filled PDF

```javascript
const results = await filler.fillPDFFromURL('https://example.com/form.pdf');
filler.downloadPDF(results.pdfBytes, 'my-filled-form.pdf');
```

## Features

- ✅ PDF form filling using pdf-lib
- ✅ HTML form filling
- ✅ Intelligent field matching with confidence scoring
- ✅ Yes/No question intelligence based on business context
- ✅ Support for text fields, checkboxes, dropdowns
- ✅ Progress callbacks
- ✅ Error handling

## Dependencies

- pdf-lib (loaded via CDN)
- PDF.js (loaded via CDN)

## Field Matching

The form filler uses intelligent matching to map form fields to business data:

- **Direct matches** (95% confidence): Exact field name matches
- **Semantic matches** (85% confidence): Similar field names
- **RAG intelligence** (95% confidence): Context-aware answers for Yes/No questions

Only fields with confidence >= threshold (default 80%) are filled.

