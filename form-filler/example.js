// Example: How to use the Form Filler in your UI

import FormFiller from './form-filler.js';

// Example 1: Fill a PDF form
async function fillPDFForm(pdfUrl, businessData) {
  const filler = new FormFiller({
    confidenceThreshold: 80,
    businessContext: businessData,
    onProgress: (percent, message) => {
      // Update your UI progress bar
      console.log(`Progress: ${percent}% - ${message}`);
    },
    onComplete: (results) => {
      // Handle completion
      console.log(`✅ Filled ${results.filled} fields`);
      console.log(`⏭️ Skipped ${results.skipped} fields`);
      
      // Download the filled PDF
      filler.downloadPDF(results.pdfBytes, 'filled-form.pdf');
    },
    onError: (error) => {
      // Handle errors
      console.error('❌ Error:', error);
    }
  });

  try {
    await filler.fillPDFFromURL(pdfUrl);
  } catch (error) {
    console.error('Failed to fill PDF:', error);
  }
}

// Example 2: Fill an HTML form
async function fillHTMLForm(businessData) {
  const filler = new FormFiller({
    businessContext: businessData
  });

  try {
    const results = await filler.fillHTMLForm();
    console.log(`✅ Filled ${results.filled} HTML fields`);
    return results;
  } catch (error) {
    console.error('Failed to fill HTML form:', error);
  }
}

// Example 3: React component usage
/*
import { useState } from 'react';
import FormFiller from './form-filler';

function PDFFormFiller({ pdfUrl, businessData }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const handleFill = async () => {
    const filler = new FormFiller({
      businessContext: businessData,
      onProgress: (percent, message) => {
        setProgress(percent);
        setStatus(message);
      },
      onComplete: (results) => {
        setStatus(`✅ Filled ${results.filled} fields!`);
        filler.downloadPDF(results.pdfBytes);
      },
      onError: (error) => {
        setStatus(`❌ Error: ${error.message}`);
      }
    });

    await filler.fillPDFFromURL(pdfUrl);
  };

  return (
    <div>
      <button onClick={handleFill}>Fill Form</button>
      {progress > 0 && (
        <div>
          <progress value={progress} max={100} />
          <p>{status}</p>
        </div>
      )}
    </div>
  );
}
*/

// Example business data structure
const exampleBusinessData = {
  businessName: 'Acme Restaurant',
  legalName: 'Acme Restaurant Inc.',
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

export { fillPDFForm, fillHTMLForm, exampleBusinessData };

