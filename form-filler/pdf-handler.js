// Simplified PDF Handler - Works with Chrome's PDF viewer
// Alternative approach: Use Chrome's built-in PDF viewer capabilities

class PDFHandler {
  constructor() {
    this.formFields = []
    this.isChromePDFViewer = false
  }

  async detectPDFForm() {
    // Check if we're in Chrome's PDF viewer
    const isChromeViewer = document.querySelector('embed[type="application/pdf"]') !== null ||
                          window.location.href.includes('chrome-extension://') ||
                          document.querySelector('#plugin') !== null
    
    this.isChromePDFViewer = isChromeViewer
    
    if (isChromeViewer) {
      // Chrome's PDF viewer - limited access, but we can try
      return await this.scanChromePDFViewer()
    }
    
    // Try to find embedded PDF
    const pdfEmbed = document.querySelector('embed[type="application/pdf"]')
    const pdfObject = document.querySelector('object[type="application/pdf"]')
    const pdfIframe = document.querySelector('iframe[src*=".pdf"]')
    
    if (pdfEmbed || pdfObject || pdfIframe) {
      return true
    }
    
    return false
  }

  async scanChromePDFViewer() {
    // Chrome's PDF viewer embeds the PDF
    // We can try to access it through the embed element
    try {
      const embed = document.querySelector('embed[type="application/pdf"]')
      if (embed) {
        // Try to access PDF document
        // Note: Chrome's PDF viewer has limited JavaScript access
        // We may need to use a different approach
        return true
      }
    } catch (e) {
      console.error('Pilot: Cannot access Chrome PDF viewer', e)
    }
    
    return false
  }

  // Alternative: Use messaging to communicate with PDF.js if loaded
  async extractFieldsViaPDFJS(url) {
    try {
      // Inject PDF.js if not already loaded
      if (typeof window.pdfjsLib === 'undefined') {
        await this.injectPDFJS()
      }
      
      const pdfDoc = await window.pdfjsLib.getDocument(url).promise
      const fields = []
      
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i)
        const annotations = await page.getAnnotations()
        
        annotations.forEach(ann => {
          if (ann.subtype === 'Widget' && ann.fieldName) {
            fields.push({
              name: ann.fieldName,
              type: this.mapFieldType(ann.fieldType),
              value: ann.fieldValue || '',
              required: ann.required || false,
              page: i
            })
          }
        })
      }
      
      return fields
    } catch (error) {
      console.error('Pilot: Error extracting PDF fields', error)
      return []
    }
  }

  mapFieldType(pdfType) {
    const typeMap = {
      'Tx': 'text',
      'Btn': 'checkbox',
      'Ch': 'select',
      'Sig': 'signature'
    }
    return typeMap[pdfType] || 'text'
  }

  async injectPDFJS() {
    return new Promise((resolve, reject) => {
      if (typeof window.pdfjsLib !== 'undefined') {
        resolve()
        return
      }
      
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        resolve()
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  // Fill fields using PDF.js
  async fillFields(fields, businessContext, confidenceThreshold = 80) {
    const results = {
      filled: 0,
      skipped: 0,
      errors: []
    }
    
    for (const field of fields) {
      const match = this.matchField(field.name, businessContext)
      
      if (match && match.confidence >= confidenceThreshold) {
        try {
          // Access PDF form field and fill it
          // This requires the PDF document to be loaded
          await this.fillPDFField(field, match.value)
          results.filled++
        } catch (error) {
          results.errors.push({ field: field.name, error: error.message })
        }
      } else {
        results.skipped++
      }
    }
    
    return results
  }

  matchField(fieldName, context) {
    // Same matching logic as HTML forms
    const name = fieldName.toLowerCase().replace(/[_-]/g, '')
    
    if (name.includes('businessname') || name.includes('legalname')) {
      return { value: context.businessName, confidence: 95 }
    }
    
    if (name.includes('address')) {
      return { value: context.businessAddress, confidence: 90 }
    }
    
    if (name.includes('email')) {
      return { value: context.contactEmail, confidence: 95 }
    }
    
    if (name.includes('phone')) {
      return { value: context.contactPhone, confidence: 95 }
    }
    
    // Yes/No questions
    if (name.includes('alcohol') || name.includes('liquor')) {
      if (context.servesAlcohol) {
        return { value: true, confidence: 95 }
      }
    }
    
    if (name.includes('patio') || name.includes('outdoor')) {
      if (context.hasPatio) {
        return { value: true, confidence: 95 }
      }
    }
    
    return null
  }

  async fillPDFField(field, value) {
    // Implementation depends on PDF.js access
    // This is a placeholder - actual implementation requires
    // proper PDF document access through PDF.js
    console.log(`Would fill field "${field.name}" with "${value}"`)
  }
}

export default PDFHandler

