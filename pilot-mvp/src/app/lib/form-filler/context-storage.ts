/**
 * Context Storage for form filling - uses localStorage (web) instead of chrome.storage
 * Stores business information for intelligent auto-fill
 */

const STORAGE_KEY = 'pilot_business_context';

export interface BusinessContext {
  businessName?: string;
  legalName?: string;
  businessAddress?: string | { full?: string };
  contactEmail?: string;
  contactPhone?: string;
  ownerName?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerEmail?: string;
  businessNumber?: string;
  gstNumber?: string;
  city?: string;
  province?: string;
  businessType?: string;
  servesAlcohol?: boolean;
  liquorLicenseNumber?: string;
  hasPatio?: boolean;
  patioPermitNumber?: string;
  liveEntertainment?: boolean;
  hasHeating?: boolean;
  hasBarbecue?: boolean;
  notes?: string;
  savedAt?: string;
  permitData?: Record<string, unknown>;
}

export function saveBusinessContext(
  businessInfo: Partial<BusinessContext>,
  permitData: Record<string, unknown> = {}
): BusinessContext {
  const context: BusinessContext = {
    businessName: businessInfo.businessName ?? '',
    businessAddress: businessInfo.businessAddress ?? '',
    contactEmail: businessInfo.contactEmail ?? '',
    contactPhone: businessInfo.contactPhone ?? '',
    businessType: businessInfo.businessType ?? '',
    province: businessInfo.province ?? '',
    notes: businessInfo.notes ?? '',
    savedAt: new Date().toISOString(),
    permitData,
    ...businessInfo,
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
    } catch (e) {
      console.warn('Failed to save business context:', e);
    }
  }
  return context;
}

export function getBusinessContext(): BusinessContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BusinessContext;
  } catch {
    return null;
  }
}
