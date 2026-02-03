// Context Storage for RAG-style form filling
// Stores business information and form field mappings for intelligent auto-fill
// Uses localStorage for web, chrome.storage for extensions

class ContextStorage {
  constructor() {
    this.storageKey = 'pilot_business_context'
  }

  _isChromeExtension() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local
  }

  // Save business context from completed permit
  async saveBusinessContext(businessInfo, permitData) {
    const context = {
      businessName: businessInfo.businessName || '',
      businessAddress: businessInfo.businessAddress || '',
      contactEmail: businessInfo.contactEmail || '',
      contactPhone: businessInfo.contactPhone || '',
      businessType: businessInfo.businessType || '',
      province: businessInfo.province || '',
      notes: businessInfo.notes || '',
      savedAt: new Date().toISOString(),
      permitData: permitData || {}
    }

    if (this._isChromeExtension()) {
      await chrome.storage.local.set({ [this.storageKey]: context })
    } else if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(context))
      } catch (e) {
        console.warn('Failed to save business context:', e)
      }
    }
    return context
  }

  // Get stored business context
  async getBusinessContext() {
    if (this._isChromeExtension()) {
      const result = await chrome.storage.local.get([this.storageKey])
      return result[this.storageKey] || null
    }
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(this.storageKey)
        return raw ? JSON.parse(raw) : null
      } catch (e) {
        return null
      }
    }
    return null
  }

  // Common field name mappings
  getFieldMappings() {
    return {
      business_name: 'businessName',
      businessName: 'businessName',
      company_name: 'businessName',
      companyName: 'businessName',
      legal_name: 'businessName',
      legalName: 'businessName',
      organization_name: 'businessName',
      org_name: 'businessName',
      business_address: 'businessAddress',
      businessAddress: 'businessAddress',
      address: 'businessAddress',
      street_address: 'businessAddress',
      streetAddress: 'businessAddress',
      physical_address: 'businessAddress',
      mailing_address: 'businessAddress',
      email: 'contactEmail',
      contact_email: 'contactEmail',
      contactEmail: 'contactEmail',
      business_email: 'contactEmail',
      e_mail: 'contactEmail',
      phone: 'contactPhone',
      contact_phone: 'contactPhone',
      contactPhone: 'contactPhone',
      phone_number: 'contactPhone',
      telephone: 'contactPhone',
      mobile: 'contactPhone',
      business_type: 'businessType',
      industry: 'businessType',
      sector: 'businessType',
    }
  }

  // Smart field matching using stored context
  matchField(fieldName, fieldLabel, fieldType) {
    const context = this.getBusinessContext()
    if (!context) return null

    const mappings = this.getFieldMappings()
    const nameLower = (fieldName || '').toLowerCase().replace(/[_-]/g, '')
    const labelLower = (fieldLabel || '').toLowerCase()

    for (const [key, value] of Object.entries(mappings)) {
      if (nameLower.includes(key.toLowerCase()) || labelLower.includes(key.toLowerCase())) {
        return {
          value: context[value],
          confidence: 0.95,
          source: 'direct_mapping'
        }
      }
    }

    if (nameLower.includes('name') && !nameLower.includes('first') && !nameLower.includes('last')) {
      return {
        value: context.businessName,
        confidence: 0.85,
        source: 'semantic_match'
      }
    }

    if (nameLower.includes('address') || labelLower.includes('address')) {
      return {
        value: context.businessAddress,
        confidence: 0.85,
        source: 'semantic_match'
      }
    }

    if (fieldType === 'email' || nameLower.includes('email') || labelLower.includes('email')) {
      return {
        value: context.contactEmail,
        confidence: 0.90,
        source: 'semantic_match'
      }
    }

    if (fieldType === 'tel' || nameLower.includes('phone') || labelLower.includes('phone')) {
      return {
        value: context.contactPhone,
        confidence: 0.90,
        source: 'semantic_match'
      }
    }

    return null
  }

  matchYesNoQuestion(questionText, permitContext) {
    const q = questionText.toLowerCase()

    if (permitContext) {
      if (q.includes('alcohol') || q.includes('liquor') || q.includes('wine') || q.includes('beer')) {
        const hasLiquorLicense = permitContext.permits?.some(p =>
          p.name?.toLowerCase().includes('liquor') ||
          p.name?.toLowerCase().includes('agco')
        )
        if (hasLiquorLicense !== undefined) {
          return hasLiquorLicense ? 'Yes' : 'No'
        }
      }

      if (q.includes('patio') || q.includes('outdoor') || q.includes('seating')) {
        const hasPatioPermit = permitContext.permits?.some(p =>
          p.name?.toLowerCase().includes('patio') ||
          p.name?.toLowerCase().includes('sidewalk')
        )
        if (hasPatioPermit !== undefined) {
          return hasPatioPermit ? 'Yes' : 'No'
        }
      }
    }

    return null
  }
}

export default ContextStorage
