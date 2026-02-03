// Complete Form Filler Module
// Combines PDF parsing, field matching, and filling logic

import PDFFiller from './pdf-filler.js';
import PDFHandler from './pdf-handler.js';
import PDFFormParser from './pdf-parser.js';
import ContextStorage from './context-storage.js';

class FormFiller {
  constructor(options = {}) {
    this.pdfFiller = new PDFFiller();
    this.pdfHandler = new PDFHandler();
    this.pdfParser = new PDFFormParser();
    this.contextStorage = new ContextStorage();
    this.confidenceThreshold = options.confidenceThreshold || 80;
    this.businessContext = options.businessContext || null;
    this.onProgress = options.onProgress || (() => {});
    this.onComplete = options.onComplete || (() => {});
    this.onError = options.onError || ((error) => console.error(error));
  }

  setBusinessContext(context) {
    this.businessContext = context;
    if (this.contextStorage) {
      this.contextStorage.saveBusinessContext(context, {});
    }
  }

  async fillPDFFromURL(pdfUrl, businessContext = null) {
    try {
      if (businessContext) {
        this.setBusinessContext(businessContext);
      }

      this.onProgress(10, 'Parsing PDF fields...');

      const fields = await this.pdfParser.parsePDFFromURL(pdfUrl);

      if (!fields || fields.length === 0) {
        throw new Error('No fillable fields found in PDF');
      }

      this.onProgress(30, `Found ${fields.length} fields, matching...`);

      const context = this.businessContext || await this.contextStorage.getBusinessContext();
      if (!context) {
        throw new Error('No business context available');
      }

      const matchedFields = this.pdfParser.matchPDFFieldsToContext(fields, context);

      this.onProgress(50, 'Filling form fields...');

      const results = await this.fillPDFWithPDFLib(pdfUrl, matchedFields, context);

      this.onProgress(100, 'Complete!');
      this.onComplete(results);

      return results;
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }

  async fillPDFWithPDFLib(pdfUrl, matchedFields, context) {
    if (typeof window.PDFLib === 'undefined') {
      await this.loadPDFLib();
    }

    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF: ${response.status}`);
    }
    const pdfBytes = await response.arrayBuffer();

    const pdfDoc = await window.PDFLib.PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();
    const fields = form.getFields();

    let filledCount = 0;
    let skippedCount = 0;

    for (const matchedField of matchedFields) {
      if (!matchedField.shouldFill || !matchedField.match) {
        skippedCount++;
        continue;
      }

      try {
        const fieldName = matchedField.fieldName || matchedField.field.fieldName;
        const match = matchedField.match;
        const fieldObj = fields.find(f => f.getName() === fieldName);

        if (!fieldObj) {
          skippedCount++;
          continue;
        }

        if (fieldObj.constructor.name === 'PDFTextField') {
          fieldObj.setText(String(match.value));
          filledCount++;
        } else if (fieldObj.constructor.name === 'PDFCheckBox') {
          if (match.value === true) {
            fieldObj.check();
            filledCount++;
          }
        } else if (fieldObj.constructor.name === 'PDFDropdown') {
          const options = fieldObj.getOptions();
          const matchedOption = options.find(opt =>
            opt.toLowerCase().includes(String(match.value).toLowerCase()) ||
            String(match.value).toLowerCase().includes(opt.toLowerCase())
          );
          if (matchedOption) {
            fieldObj.select(matchedOption);
            filledCount++;
          } else {
            skippedCount++;
          }
        }
      } catch (error) {
        console.warn(`Error filling field ${matchedField.fieldName}:`, error);
        skippedCount++;
      }
    }

    const filledPdfBytes = await pdfDoc.save();

    return {
      filled: filledCount,
      skipped: skippedCount,
      total: matchedFields.length,
      pdfBytes: filledPdfBytes
    };
  }

  async loadPDFLib() {
    return new Promise((resolve, reject) => {
      if (typeof window.PDFLib !== 'undefined') {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load pdf-lib'));
      document.head.appendChild(script);
    });
  }

  async fillHTMLForm(businessContext = null) {
    try {
      if (businessContext) {
        this.setBusinessContext(businessContext);
      }

      const context = this.businessContext || await this.contextStorage.getBusinessContext();
      if (!context) {
        throw new Error('No business context available');
      }

      const fields = this.findFormFields();
      let filledCount = 0;
      let skippedCount = 0;

      for (const field of fields) {
        const match = this.matchHTMLField(field, context);

        if (match && match.confidence >= this.confidenceThreshold) {
          if (field.type === 'checkbox' || field.type === 'radio') {
            if (match.value === true || match.value === 'yes' || match.value === 'Yes') {
              field.checked = true;
              field.dispatchEvent(new Event('change', { bubbles: true }));
              filledCount++;
            }
          } else {
            if (!field.value || field.value.trim() === '') {
              field.value = match.value;
              field.dispatchEvent(new Event('input', { bubbles: true }));
              field.dispatchEvent(new Event('change', { bubbles: true }));
              filledCount++;
            }
          }
        } else {
          skippedCount++;
        }
      }

      return {
        filled: filledCount,
        skipped: skippedCount,
        total: fields.length
      };
    } catch (error) {
      this.onError(error);
      throw error;
    }
  }

  findFormFields() {
    const selectors = [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="tel"]',
      'input[name*="name" i]',
      'input[name*="business" i]',
      'input[name*="address" i]',
      'input[name*="email" i]',
      'input[name*="phone" i]',
      'textarea',
      'select'
    ];

    const fields = [];
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(field => {
        if (!fields.includes(field)) {
          fields.push(field);
        }
      });
    });

    return fields;
  }

  matchHTMLField(field, context) {
    const fieldName = (field.name || field.id || '').toLowerCase().replace(/[_-]/g, '');
    const fieldLabel = this.getFieldLabel(field).toLowerCase();
    const fieldType = field.type || 'text';

    if (fieldName.includes('businessname') || fieldName.includes('legalname') || fieldName.includes('companyname')) {
      return { value: context.businessName || context.legalName, confidence: 95, source: 'direct_match' };
    }
    if (fieldName.includes('address') || fieldLabel.includes('address')) {
      return { value: context.businessAddress || context.businessAddress?.full, confidence: 90, source: 'direct_match' };
    }
    if (fieldType === 'email' || fieldName.includes('email') || fieldLabel.includes('email')) {
      return { value: context.contactEmail || context.ownerEmail, confidence: 95, source: 'direct_match' };
    }
    if (fieldType === 'tel' || fieldName.includes('phone') || fieldLabel.includes('phone')) {
      return { value: context.contactPhone || context.ownerPhone, confidence: 95, source: 'direct_match' };
    }
    if (fieldType === 'checkbox' || fieldType === 'radio') {
      return this.getIntelligentYesNoAnswer(fieldLabel || fieldName, context);
    }
    return null;
  }

  getIntelligentYesNoAnswer(questionText, context) {
    const q = questionText.toLowerCase();
    if (q.includes('alcohol') || q.includes('liquor') || q.includes('wine') || q.includes('beer')) {
      if (context.servesAlcohol || context.liquorLicenseNumber) {
        return { value: true, confidence: 95, source: 'rag_context', reasoning: 'Has approved Liquor License' };
      }
    }
    if (q.includes('patio') || q.includes('outdoor') || q.includes('seating')) {
      if (context.hasPatio || context.patioPermitNumber) {
        return { value: true, confidence: 95, source: 'rag_context', reasoning: 'Has approved Patio Permit' };
      }
    }
    return null;
  }

  getFieldLabel(field) {
    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label) return label.textContent;
    }
    const parentLabel = field.closest('label');
    if (parentLabel) return parentLabel.textContent;
    if (field.placeholder) return field.placeholder;
    return field.name || field.id || '';
  }

  downloadPDF(pdfBytes, filename = 'filled-form.pdf') {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}

export default FormFiller;
