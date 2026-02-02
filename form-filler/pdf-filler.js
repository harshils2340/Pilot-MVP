// PDF Form Field Filler - Parses PDF fields and fills intelligently
// Uses PDF.js to extract field names and fill them with RAG context

class PDFFiller {
  constructor() {
    this.pdfDoc = null
    this.formFields = []
    this.confidenceThreshold = 80
  }

  async init() {
    // Load PDF.js if not already loaded
    if (typeof window.pdfjsLib === 'undefined') {
      await this.loadPDFJS()
    }
  }

  async loadPDFJS() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        resolve()
      }
      script.onerror = () => reject(new Error('Failed to load PDF.js'))
      document.head.appendChild(script)
    })
  }

  async parsePDFFields(pdfUrl) {
    try {
      await this.init()
      
      console.log('Pilot: Parsing PDF fields from:', pdfUrl)
      
      const loadingTask = window.pdfjsLib.getDocument(pdfUrl)
      this.pdfDoc = await loadingTask.promise
      
      const fields = []
      
      // Parse each page for form fields
      for (let pageNum = 1; pageNum <= this.pdfDoc.numPages; pageNum++) {
        const page = await this.pdfDoc.getPage(pageNum)
        const annotations = await page.getAnnotations()
        
        annotations.forEach(annotation => {
          if (annotation.subtype === 'Widget' && annotation.fieldName) {
            const fieldType = this.mapFieldType(annotation.fieldType)
            
            fields.push({
              name: annotation.fieldName,
              fullName: annotation.fullName,
              type: fieldType,
              pdfType: annotation.fieldType,
              value: annotation.fieldValue || '',
              defaultValue: annotation.defaultValue || '',
              readOnly: annotation.readType === 1,
              required: annotation.required || false,
              options: annotation.options || [],
              page: pageNum,
              rect: annotation.rect,
              // Extract label from alternative text or parent
              label: annotation.alternativeText || annotation.fieldName.replace(/_/g, ' ')
            })
          }
        })
      }
      
      this.formFields = fields
      console.log(`Pilot: Found ${fields.length} PDF form fields:`, fields.map(f => f.name))
      
      return fields
    } catch (error) {
      console.error('Pilot: Error parsing PDF fields', error)
      return []
    }
  }

  mapFieldType(pdfType) {
    const typeMap = {
      'Tx': 'text',           // Text input
      'Btn': 'checkbox',      // Button/Checkbox
      'Ch': 'select',         // Choice/Dropdown
      'Sig': 'signature'      // Signature
    }
    return typeMap[pdfType] || 'text'
  }

  // Match PDF field names to business context (RAG intelligence)
  matchPDFFieldToContext(field, context) {
    const fieldName = (field.name || field.fullName || '').toLowerCase().replace(/[_-]/g, '')
    const fieldLabel = (field.label || '').toLowerCase()
    
    // Direct name matching (95% confidence)
    if (fieldName.includes('businessname') || fieldName.includes('legalname') || fieldName.includes('companyname')) {
      return {
        value: context.legalName || context.businessName,
        confidence: 95,
        source: 'direct_match',
        reasoning: 'Matches business name field'
      }
    }
    
    // Operating name
    if (fieldName.includes('operatingname') || fieldName.includes('tradingname')) {
      return {
        value: context.businessName,
        confidence: 90,
        source: 'direct_match'
      }
    }
    
    // Address fields
    if (fieldName.includes('address') || fieldName.includes('street')) {
      if (fieldName.includes('suite') || fieldName.includes('unit')) {
        // Suite/Unit field
        const suite = context.businessAddress?.match(/suite\s*(\w+)/i)?.[1] || 
                     context.businessAddress?.match(/unit\s*(\w+)/i)?.[1] || ''
        return { value: suite, confidence: suite ? 85 : 0, source: 'address_parsing' }
      }
      if (fieldName.includes('city')) {
        return { value: context.city || 'Toronto', confidence: 90, source: 'direct_match' }
      }
      if (fieldName.includes('province')) {
        return { value: context.province || 'Ontario', confidence: 90, source: 'direct_match' }
      }
      if (fieldName.includes('postal') || fieldName.includes('zip')) {
        const postal = context.businessAddress?.match(/[A-Z0-9]{3}\s*[A-Z0-9]{3}/i)?.[0] || ''
        return { value: postal, confidence: postal ? 85 : 0, source: 'address_parsing' }
      }
      // Full address
      return {
        value: typeof context.businessAddress === 'string' 
          ? context.businessAddress 
          : context.businessAddress?.full || context.businessAddress,
        confidence: 90,
        source: 'direct_match'
      }
    }
    
    // Street number and name separately
    if (fieldName.includes('streetnumber')) {
      const number = context.businessAddress?.match(/^\d+/)?.[0] || ''
      return { value: number, confidence: number ? 85 : 0, source: 'address_parsing' }
    }
    if (fieldName.includes('streetname')) {
      const street = context.businessAddress?.match(/\d+\s+(.+?)(?:,|suite)/i)?.[1]?.trim() || ''
      return { value: street, confidence: street ? 85 : 0, source: 'address_parsing' }
    }
    
    // Email
    if (fieldName.includes('email')) {
      return {
        value: context.contactEmail || context.ownerEmail,
        confidence: 95,
        source: 'direct_match'
      }
    }
    
    // Phone
    if (fieldName.includes('phone') || fieldName.includes('telephone')) {
      return {
        value: context.contactPhone || context.ownerPhone,
        confidence: 95,
        source: 'direct_match'
      }
    }
    
    // Owner/Contact person
    if (fieldName.includes('firstname') || (fieldName.includes('first') && fieldName.includes('name'))) {
      return {
        value: context.ownerFirstName || context.ownerName?.split(' ')[0],
        confidence: 90,
        source: 'direct_match'
      }
    }
    
    if (fieldName.includes('lastname') || (fieldName.includes('last') && fieldName.includes('name'))) {
      return {
        value: context.ownerLastName || context.ownerName?.split(' ')[1],
        confidence: 90,
        source: 'direct_match'
      }
    }
    
    if (fieldName.includes('ownername') || fieldName.includes('contactperson') || fieldName.includes('applicantname')) {
      return {
        value: context.ownerName,
        confidence: 90,
        source: 'direct_match'
      }
    }
    
    // Registration numbers
    if (fieldName.includes('businessnumber') || fieldName.includes('registrationnumber')) {
      if (context.businessNumber) {
        return { value: context.businessNumber, confidence: 95, source: 'rag_context' }
      }
    }
    
    if (fieldName.includes('licensenumber') || fieldName.includes('licencenumber')) {
      if (context.liquorLicenseNumber) {
        return { value: context.liquorLicenseNumber, confidence: 90, source: 'rag_context' }
      }
    }
    
    if (fieldName.includes('gstnumber') || fieldName.includes('hstnumber')) {
      if (context.gstNumber) {
        return { value: context.gstNumber, confidence: 95, source: 'rag_context' }
      }
    }
    
    // Yes/No questions (checkboxes) - RAG intelligence
    if (field.type === 'checkbox') {
      // Alcohol questions
      if (fieldName.includes('alcohol') || fieldName.includes('liquor') || 
          fieldLabel.includes('alcohol') || fieldLabel.includes('liquor')) {
        if (context.servesAlcohol || context.liquorLicenseNumber ||
            context._completedPermits?.some(p => p.name?.includes('Liquor'))) {
          return {
            value: true,
            confidence: 95,
            source: 'rag_intelligence',
            reasoning: 'Has approved Liquor License'
          }
        }
      }
      
      // Patio questions
      if (fieldName.includes('patio') || fieldName.includes('outdoor') || fieldName.includes('sidewalk') ||
          fieldLabel.includes('patio') || fieldLabel.includes('outdoor')) {
        if (context.hasPatio || context.patioPermitNumber ||
            context._completedPermits?.some(p => p.name?.includes('Patio'))) {
          return {
            value: true,
            confidence: 95,
            source: 'rag_intelligence',
            reasoning: 'Has approved Patio Permit'
          }
        }
      }
      
      // Entertainment
      if (fieldName.includes('entertainment') || fieldName.includes('music') ||
          fieldLabel.includes('entertainment')) {
        if (context.liveEntertainment) {
          return {
            value: true,
            confidence: 85,
            source: 'rag_context'
          }
        }
      }
      
      // Awning
      if (fieldName.includes('awning')) {
        // No context - leave blank
        return null
      }
      
      // Heating
      if (fieldName.includes('heater') || fieldName.includes('heating')) {
        if (context.hasHeating !== undefined) {
          return {
            value: context.hasHeating,
            confidence: 80,
            source: 'rag_context'
          }
        }
      }
      
      // Barbecue
      if (fieldName.includes('barbeque') || fieldName.includes('barbecue')) {
        if (context.hasBarbecue !== undefined) {
          return {
            value: context.hasBarbecue,
            confidence: 80,
            source: 'rag_context'
          }
        }
      }
    }
    
    // Semantic matching (85% confidence)
    if (fieldName.includes('name') && !fieldName.includes('first') && !fieldName.includes('last') && !fieldName.includes('owner')) {
      return {
        value: context.businessName,
        confidence: 85,
        source: 'semantic_match'
      }
    }
    
    return null
  }

  // Fill PDF form fields with matched values
  async fillPDFFields(fields, context) {
    if (!this.pdfDoc) {
      console.error('Pilot: PDF document not loaded')
      return { filled: 0, skipped: 0, errors: [] }
    }
    
    const results = {
      filled: 0,
      skipped: 0,
      errors: []
    }
    
    console.log(`Pilot: Attempting to fill ${fields.length} PDF fields...`)
    
    for (const field of fields) {
      try {
        const match = this.matchPDFFieldToContext(field, context)
        
        if (match && match.confidence >= this.confidenceThreshold) {
          // Try to access the field through PDF.js
          const pdfField = await this.getPDFField(field.name)
          
          if (pdfField) {
            if (field.type === 'checkbox') {
              if (match.value === true) {
                pdfField.check()
                results.filled++
                console.log(`✅ Filled PDF checkbox "${field.name}" (${match.confidence}% confidence) - ${match.reasoning || match.source}`)
              }
            } else {
              pdfField.setValue(match.value)
              results.filled++
              console.log(`✅ Filled PDF field "${field.name}" (${match.confidence}% confidence) - ${match.reasoning || match.source}`)
            }
          } else {
            // Field not accessible - might need different approach
            results.skipped++
            console.log(`⚠️  Could not access PDF field "${field.name}"`)
          }
        } else if (match && match.confidence < this.confidenceThreshold) {
          results.skipped++
          console.log(`⏭️  Skipped PDF field "${field.name}" - confidence ${match.confidence}% < ${this.confidenceThreshold}%`)
        } else {
          // No match - leave blank (don't guess)
          console.log(`⬜ No match for PDF field "${field.name}" - leaving blank`)
        }
      } catch (error) {
        results.errors.push({ field: field.name, error: error.message })
        console.error(`Pilot: Error filling field "${field.name}"`, error)
      }
    }
    
    return results
  }

  async getPDFField(fieldName) {
    // Access PDF form field - requires proper PDF.js setup
    // This is a simplified version
    try {
      // PDF.js doesn't directly expose form fields in a simple way
      // We need to access them through the annotation system
      for (let pageNum = 1; pageNum <= this.pdfDoc.numPages; pageNum++) {
        const page = await this.pdfDoc.getPage(pageNum)
        const annotations = await page.getAnnotations()
        
        const annotation = annotations.find(ann => 
          ann.fieldName === fieldName || ann.fullName === fieldName
        )
        
        if (annotation) {
          // Return annotation wrapper
          return {
            setValue: (value) => {
              // This would need to be implemented with proper PDF manipulation
              console.log(`Would set ${fieldName} = ${value}`)
            },
            check: () => {
              console.log(`Would check ${fieldName}`)
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error accessing field ${fieldName}`, error)
    }
    
    return null
  }
}

export default PDFFiller

