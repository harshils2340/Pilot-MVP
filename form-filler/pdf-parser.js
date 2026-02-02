// PDF Form Field Parser
// Extracts field names from fillable PDFs and matches them to business context

class PDFFormParser {
  constructor() {
    this.pdfDoc = null
    this.formFields = []
    this.pdfjsLib = null
  }

  async init() {
    // Load PDF.js library dynamically
    if (!this.pdfjsLib) {
      await this.loadPDFJS()
    }
  }

  async loadPDFJS() {
    return new Promise((resolve, reject) => {
      // Use CDN version of PDF.js
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = () => {
        // Set worker
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        this.pdfjsLib = window.pdfjsLib
        resolve()
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  async parsePDFFromURL(url) {
    try {
      await this.init()
      
      const loadingTask = this.pdfjsLib.getDocument(url)
      this.pdfDoc = await loadingTask.promise
      
      const formFields = []
      
      // Parse each page for form fields
      for (let pageNum = 1; pageNum <= this.pdfDoc.numPages; pageNum++) {
        const page = await this.pdfDoc.getPage(pageNum)
        const annotations = await page.getAnnotations()
        
        annotations.forEach(annotation => {
          if (annotation.subtype === 'Widget') {
            // Extract field information
            const fieldInfo = {
              fieldName: annotation.fieldName || '',
              fieldType: annotation.fieldType || '',
              fieldValue: annotation.fieldValue || '',
              readOnly: annotation.readOnly || false,
              required: annotation.required || false,
              options: annotation.options || [],
              rect: annotation.rect || [],
              page: pageNum
            }
            
            // Map PDF.js field types to standard types
            if (annotation.fieldType === 'Tx') {
              fieldInfo.inputType = 'text'
            } else if (annotation.fieldType === 'Btn') {
              fieldInfo.inputType = annotation.checkBox ? 'checkbox' : 'radio'
            } else if (annotation.fieldType === 'Ch') {
              fieldInfo.inputType = 'select'
            } else if (annotation.fieldType === 'Sig') {
              fieldInfo.inputType = 'signature'
            }
            
            formFields.push(fieldInfo)
          }
        })
      }
      
      this.formFields = formFields
      return formFields
    } catch (error) {
      console.error('Pilot: Error parsing PDF', error)
      return []
    }
  }

  async parsePDFFromEmbedded() {
    // Try to access PDF if embedded in page
    try {
      const embed = document.querySelector('embed[type="application/pdf"]')
      const object = document.querySelector('object[type="application/pdf"]')
      const iframe = document.querySelector('iframe[src*=".pdf"]')
      
      let pdfUrl = null
      if (embed) pdfUrl = embed.src
      else if (object) pdfUrl = object.data
      else if (iframe) pdfUrl = iframe.src
      else pdfUrl = window.location.href
      
      return await this.parsePDFFromURL(pdfUrl)
    } catch (error) {
      console.error('Pilot: Error accessing embedded PDF', error)
      return []
    }
  }

  // Match PDF fields to business context with confidence scoring
  matchPDFFieldsToContext(formFields, businessContext) {
    if (!businessContext || !formFields) return []
    
    const matchedFields = formFields.map(field => {
      const match = this.matchFieldToContext(field, businessContext)
      return {
        ...field,
        match: match,
        shouldFill: match && match.confidence >= 80
      }
    })
    
    return matchedFields
  }

  matchFieldToContext(field, context) {
    const fieldName = (field.fieldName || '').toLowerCase().replace(/[_-]/g, '')
    
    // Direct name matching
    if (fieldName.includes('businessname') || fieldName.includes('companyname') || fieldName.includes('legalname')) {
      return {
        value: context.businessName || context.legalName,
        confidence: 95,
        source: 'direct_match'
      }
    }
    
    if (fieldName.includes('address') || fieldName.includes('street')) {
      return {
        value: context.businessAddress || context.businessAddress?.full,
        confidence: 90,
        source: 'direct_match'
      }
    }
    
    if (fieldName.includes('email')) {
      return {
        value: context.contactEmail || context.ownerEmail,
        confidence: 95,
        source: 'direct_match'
      }
    }
    
    if (fieldName.includes('phone') || fieldName.includes('telephone')) {
      return {
        value: context.contactPhone || context.ownerPhone,
        confidence: 95,
        source: 'direct_match'
      }
    }
    
    // Yes/No questions (checkboxes/radios)
    if (field.inputType === 'checkbox' || field.inputType === 'radio') {
      const questionText = fieldName
      
      if (questionText.includes('alcohol') || questionText.includes('liquor')) {
        if (context.servesAlcohol || context.liquorLicenseNumber) {
          return {
            value: true,
            confidence: 95,
            source: 'rag_context',
            reasoning: 'Has approved Liquor License'
          }
        }
      }
      
      if (questionText.includes('patio') || questionText.includes('outdoor')) {
        if (context.hasPatio || context.patioPermitNumber) {
          return {
            value: true,
            confidence: 95,
            source: 'rag_context',
            reasoning: 'Has approved Patio Permit'
          }
        }
      }
    }
    
    // Registration numbers
    if (fieldName.includes('businessnumber') || fieldName.includes('registrationnumber')) {
      if (context.businessNumber) {
        return {
          value: context.businessNumber,
          confidence: 95,
          source: 'rag_context'
        }
      }
    }
    
    if (fieldName.includes('gstnumber') || fieldName.includes('hstnumber')) {
      if (context.gstNumber) {
        return {
          value: context.gstNumber,
          confidence: 95,
          source: 'rag_context'
        }
      }
    }
    
    return null
  }

  // Fill PDF form fields (requires PDF.js and form filling capabilities)
  async fillPDFFields(formFields, businessContext) {
    try {
      await this.init()
      
      const matchedFields = this.matchPDFFieldsToContext(formFields, businessContext)
      let filledCount = 0
      let skippedCount = 0
      
      // Fill fields with high confidence
      for (const field of matchedFields) {
        if (field.shouldFill && field.match) {
          try {
            // Access PDF form fields through PDF.js
            const form = await this.pdfDoc.getField(field.fieldName)
            
            if (form) {
              if (field.inputType === 'checkbox' || field.inputType === 'radio') {
                if (field.match.value === true) {
                  form.check()
                  filledCount++
                  console.log(`✅ Filled PDF checkbox "${field.fieldName}" (${field.match.confidence}% confidence)`)
                }
              } else {
                form.setValue(field.match.value)
                filledCount++
                console.log(`✅ Filled PDF field "${field.fieldName}" (${field.match.confidence}% confidence)`)
              }
            }
          } catch (err) {
            console.warn(`Pilot: Could not fill field "${field.fieldName}"`, err)
            skippedCount++
          }
        } else if (field.match && field.match.confidence < 80) {
          skippedCount++
          console.log(`⏭️  Skipped PDF field "${field.fieldName}" - confidence ${field.match.confidence}% < 80%`)
        }
      }
      
      return { filledCount, skippedCount, totalFields: formFields.length }
    } catch (error) {
      console.error('Pilot: Error filling PDF fields', error)
      return { filledCount: 0, skippedCount: 0, error: error.message }
    }
  }
}

export default PDFFormParser

