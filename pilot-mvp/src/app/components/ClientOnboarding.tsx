'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Building2, MapPin, Briefcase, FileText, CheckCircle2, Loader2, Info, Lightbulb, CheckCircle, AlertCircle, Search, ChevronDown } from 'lucide-react';
import { BUSINESS_TYPES } from '@/constants/businessTypes';
import { ACTIVITIES } from '@/constants/activities';

interface ClientOnboardingProps {
  onComplete: (clientData: any) => void;
  onCancel: () => void;
}

interface BusinessFormData {
  businessName: string;
  operatingName?: string;
  location: string; // Where is your business located?
  businessType: string; // What type of business is it?
  permitKeywords: string; // What type of permits and licences are you looking for?
  // Address fields for form filling
  streetNumber?: string;
  streetName?: string;
  suite?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  // Contact fields
  email?: string;
  phone?: string;
  // Owner/representative fields
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerPosition?: string;
  // Business license fields
  businessLicenceNumber?: string;
  licenceExpiry?: string;
}

interface Permit {
  _id?: string;
  name: string;
  level?: string;
  jurisdiction?: {
    province?: string;
    city?: string;
  };
  authority?: string;
  activities?: string[];
  reasons?: string[];
  applyUrl?: string;
  sourceUrl?: string;
  lastUpdated?: string;
  confidence?: 'required' | 'conditional' | 'informational';
  priority?: 'High' | 'Medium' | 'Low';
  category?: string;
}

export function ClientOnboarding({ onComplete, onCancel }: ClientOnboardingProps) {
  const [step, setStep] = useState(1);
  const [showPermits, setShowPermits] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [formData, setFormData] = useState<BusinessFormData>({
    businessName: '',
    operatingName: '',
    location: '',
    businessType: '',
    permitKeywords: '',
    streetNumber: '',
    streetName: '',
    suite: '',
    city: '',
    province: '',
    postalCode: '',
    email: '',
    phone: '',
    ownerFirstName: '',
    ownerLastName: '',
    ownerPosition: '',
    businessLicenceNumber: '',
    licenceExpiry: '',
  });

  // Refs to track ongoing operations for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const dbFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const requestIdRef = useRef<string | null>(null);

  // Structured location when selected from dropdown (has 2-char provinceCode)
  const selectedLocationRef = useRef<{ display: string; city: string; province: string; country: string } | null>(null);

  // Dropdown refs for click-outside
  const businessTypeRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const permitKeywordsRef = useRef<HTMLDivElement>(null);
  const [businessTypeOpen, setBusinessTypeOpen] = useState(false);
  const [businessTypeHighlightedIndex, setBusinessTypeHighlightedIndex] = useState(-1);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationHighlightedIndex, setLocationHighlightedIndex] = useState(-1);
  const [permitKeywordsOpen, setPermitKeywordsOpen] = useState(false);
  const [permitKeywordsHighlightedIndex, setPermitKeywordsHighlightedIndex] = useState(-1);

  const handleInputChange = (field: keyof BusinessFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        !businessTypeRef.current?.contains(e.target as Node) &&
        !locationRef.current?.contains(e.target as Node) &&
        !permitKeywordsRef.current?.contains(e.target as Node)
      ) {
        setBusinessTypeOpen(false);
        setLocationOpen(false);
        setPermitKeywordsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredBusinessTypes = BUSINESS_TYPES.filter(
    (b) => !formData.businessType || b.label.toLowerCase().includes(formData.businessType.toLowerCase())
  );
  const filteredPermitKeywords = ACTIVITIES.filter(
    (a) => !formData.permitKeywords || a.label.toLowerCase().includes(formData.permitKeywords.toLowerCase())
  );

  // Reset highlighted index when dropdown opens/closes or options change
  useEffect(() => {
    if (businessTypeOpen && filteredBusinessTypes.length > 0) {
      setBusinessTypeHighlightedIndex((prev) =>
        prev < 0 ? 0 : prev >= filteredBusinessTypes.length ? filteredBusinessTypes.length - 1 : prev
      );
    } else {
      setBusinessTypeHighlightedIndex(-1);
    }
  }, [businessTypeOpen, filteredBusinessTypes.length]);

  useEffect(() => {
    if (permitKeywordsOpen && filteredPermitKeywords.length > 0) {
      setPermitKeywordsHighlightedIndex((prev) =>
        prev < 0 ? 0 : prev >= filteredPermitKeywords.length ? filteredPermitKeywords.length - 1 : prev
      );
    } else {
      setPermitKeywordsHighlightedIndex(-1);
    }
  }, [permitKeywordsOpen, filteredPermitKeywords.length]);

  // Location suggestions from API (thousands of cities via country-state-city)
  type LocationSuggestion = { display: string; city: string; state: string; provinceCode: string; country: string };
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const locationDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const q = formData.location.trim();
    if (!q) {
      setLocationSuggestions([]);
      return;
    }
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    locationDebounceRef.current = setTimeout(async () => {
      setLocationLoading(true);
      try {
        const res = await fetch(`/api/locations/search?q=${encodeURIComponent(q)}&limit=15`);
        const data = await res.json();
        setLocationSuggestions((Array.isArray(data) ? data : []) as LocationSuggestion[]);
      } catch {
        setLocationSuggestions([]);
      } finally {
        setLocationLoading(false);
      }
    }, 150);
    return () => {
      if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);
    };
  }, [formData.location]);

  useEffect(() => {
    if (locationOpen && locationSuggestions.length > 0 && !locationLoading) {
      setLocationHighlightedIndex((prev) =>
        prev < 0 ? 0 : prev >= locationSuggestions.length ? locationSuggestions.length - 1 : prev
      );
    } else {
      setLocationHighlightedIndex(-1);
    }
  }, [locationOpen, locationSuggestions.length, locationLoading]);

  // Cleanup function to stop all ongoing operations
  const cleanupOperations = async () => {
    console.log('🧹 Cleaning up ongoing operations...');
    
    // Mark as cancelled
    isCancelledRef.current = true;
    
    // Cancel Selenium process on backend if requestId exists
    if (requestIdRef.current) {
      try {
        console.log(`🛑 Sending cancellation signal to backend for request: ${requestIdRef.current}`);
        const cancelResponse = await fetch('/api/bizpal/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId: requestIdRef.current }),
        });
        
        if (cancelResponse.ok) {
          const cancelData = await cancelResponse.json();
          console.log('✅ Cancellation signal sent:', cancelData);
        } else {
          console.warn('⚠️ Failed to send cancellation signal, but continuing cleanup');
        }
      } catch (cancelError) {
        console.error('❌ Error sending cancellation signal:', cancelError);
        // Continue with other cleanup even if cancel request fails
      }
    }
    
    // Abort fetch request if it exists
    if (abortControllerRef.current) {
      console.log('🛑 Aborting fetch request...');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Clear timeout if it exists
    if (timeoutIdRef.current) {
      console.log('⏱️ Clearing timeout...');
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    // Clear database fetch timeout if it exists
    if (dbFetchTimeoutRef.current) {
      console.log('⏱️ Clearing database fetch timeout...');
      clearTimeout(dbFetchTimeoutRef.current);
      dbFetchTimeoutRef.current = null;
    }

    // Reset loading state
    setLoading(false);
    
    // Clear request ID
    requestIdRef.current = null;
    
    console.log('✅ Cleanup completed');
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupOperations();
    };
  }, []);
  // Helper to parse location string (e.g., "Ottawa, Ontario" or "San Francisco, CA")
  // Always returns 2-char province code - required by permit search API
  const parseLocation = (locationStr: string): { country: string; province: string; city: string } => {
    const parts = locationStr.split(',').map(p => p.trim());
    let city = parts[0] || '';
    let province = (parts[1] || '').trim();
    let country = 'CA';

    const provinceLower = province.toLowerCase();

    // US states - full name to code
    const usStates: Record<string, string> = {
      alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR', california: 'CA', colorado: 'CO',
      connecticut: 'CT', delaware: 'DE', florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID',
      illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS', kentucky: 'KY', louisiana: 'LA',
      maine: 'ME', maryland: 'MD', massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS',
      missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
      'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', ohio: 'OH',
      oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
      'south dakota': 'SD', tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT', virginia: 'VA',
      washington: 'WA', 'west virginia': 'WV', wisconsin: 'WI', wyoming: 'WY', 'district of columbia': 'DC',
    };

    // Canadian provinces
    const canadianProvinces: Record<string, string> = {
      ontario: 'ON', quebec: 'QC', 'british columbia': 'BC', alberta: 'AB', manitoba: 'MB',
      saskatchewan: 'SK', 'nova scotia': 'NS', 'new brunswick': 'NB',
      'newfoundland and labrador': 'NL', newfoundland: 'NL', labrador: 'NL',
      'prince edward island': 'PE', 'northwest territories': 'NT', yukon: 'YT', nunavut: 'NU',
    };

    if (provinceLower in usStates) {
      country = 'US';
      province = usStates[provinceLower];
    } else if (provinceLower in canadianProvinces) {
      province = canadianProvinces[provinceLower];
    } else if (province.length === 2) {
      province = province.toUpperCase();
    }

    if (province.length > 2 || !province) {
      province = country === 'US' ? 'CA' : 'ON';
    }

    return { country, province: province.slice(0, 2).toUpperCase(), city };
  };

  const getPermitApplyUrl = (permit: Permit): string | null => {
    const rawUrl = permit.applyUrl;
    if (!rawUrl) return null;

    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.toString();
      }
      return null;
    } catch {
      return null;
    }
  };

  const getPermitSourceUrl = (permit: Permit): string | null => {
    const rawUrl = permit.sourceUrl;
    if (!rawUrl) return null;

    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.toString();
      }
      return null;
    } catch {
      return null;
    }
  };

  const getPermitConfidence = (
    permit: Permit
  ): 'required' | 'conditional' | 'informational' => {
    if (permit.confidence) return permit.confidence;
    if (permit.priority === 'High') return 'required';
    if (permit.priority === 'Low') return 'informational';
    return 'conditional';
  };

  const handlePermitOpen = (permit: Permit) => {
    const targetUrl = getPermitApplyUrl(permit);
    if (!targetUrl) return;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleFindPermits = async () => {
    // Validate form fields before proceeding
    const trimmedData = {
      businessName: formData.businessName.trim(),
      location: formData.location.trim(),
      businessType: formData.businessType.trim(),
      permitKeywords: formData.permitKeywords.trim(),
    };

    if (!trimmedData.businessName || !trimmedData.location || !trimmedData.businessType) {
      alert('Please fill in all required fields: Business Name, Location, and Business Type');
      return;
    }

    setLoading(true);
    isCancelledRef.current = false;
    
    console.log('🔍 Starting permit discovery...');
    console.log('📋 Form data:', trimmedData);
    
    try {
      // Parse location - prefer structured selection from dropdown (guaranteed 2-char province)
      const sel = selectedLocationRef.current;
      const parsedLocation =
        sel && sel.display === trimmedData.location
          ? { country: sel.country, province: sel.province, city: sel.city }
          : parseLocation(trimmedData.location);
      
      // Convert permitKeywords to activities - default to "all" when empty
      const activities = trimmedData.permitKeywords
        ? trimmedData.permitKeywords.split(',').map((a) => a.trim()).filter((a) => a.length > 0)
        : ['all'];
      
      if (activities.length === 0) {
        activities.push('all');
      }
      
      const payload = {
        businessName: trimmedData.businessName,
        permitKeywords: trimmedData.permitKeywords,
        location: parsedLocation,
        businessType: trimmedData.businessType,
        activities: activities,
      };
      
      console.log('🚀 Calling permit search API with payload:', payload);
      
      const res = await fetch('/api/clients/permits/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (isCancelledRef.current) {
        console.log('🚫 Operation was cancelled');
        setLoading(false);
        return;
      }
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Permit search failed:', errorData);
        const errorMessage = typeof errorData?.error === 'string'
          ? errorData.error
          : typeof errorData?.message === 'string'
            ? errorData.message
            : errorData?.error
              ? JSON.stringify(errorData.error)
              : 'Unknown error';
        alert(`Failed to search for permits: ${errorMessage}`);
        setLoading(false);
        return;
      }
      
      const data = await res.json();
      const apiPermits = data.permits || [];
      
      console.log(`✅ Found ${apiPermits.length} permits from API`);
      
      // Transform API permits to our Permit format and keep only permits with valid apply/source URLs.
      const discoveredPermits: Permit[] = apiPermits
        .map((p: any, index: number) => ({
          _id: `permit-${index}-${Date.now()}`,
          name: p.name,
          level: p.level || 'municipal',
          jurisdiction: {
            city: parsedLocation.city,
            province: parsedLocation.province,
          },
          authority: p.authority || 'Unknown',
          activities: Array.isArray(p.reasons) ? p.reasons : [],
          reasons: Array.isArray(p.reasons) ? p.reasons : [],
          confidence:
            p.confidence === 'required' || p.confidence === 'conditional' || p.confidence === 'informational'
              ? p.confidence
              : 'conditional',
          lastUpdated: typeof p.lastUpdated === 'string' ? p.lastUpdated : new Date().toISOString(),
          priority: p.confidence === 'required' ? 'High' : p.confidence === 'conditional' ? 'Medium' : 'Low',
          category: p.level === 'federal' ? 'Federal' : p.level === 'provincial' ? 'Provincial' : 'Municipal',
          applyUrl: p.applyUrl,
          sourceUrl: p.sourceUrl,
        }))
        .filter((permit: Permit) => Boolean(getPermitApplyUrl(permit) && getPermitSourceUrl(permit)));

      if (discoveredPermits.length < apiPermits.length) {
        console.warn(
          `Filtered out ${apiPermits.length - discoveredPermits.length} permit(s) due to invalid or missing links`
        );
      }
      
      if (Array.isArray(data.warnings) && data.warnings.length > 0) {
        console.warn('Permit discovery warnings:', data.warnings);
      }

      if (discoveredPermits.length === 0) {
        console.log('No permits found from API.');
        if (Array.isArray(data.warnings) && data.warnings.length > 0) {
          alert(`No permits found yet. ${data.warnings[0]}`);
        }
        setPermits([]);
      } else {
        setPermits(discoveredPermits);
      }
      
      setShowPermits(true);
      setLoading(false);
      console.log('🏁 Permit discovery process completed');
    } catch (err) {
      console.error('❌ Error during permit discovery:', err);
      setPermits([]);
      setShowPermits(true);
      setLoading(false);
    }
  };

  // Handle cancel with cleanup
  const handleCancel = async () => {
    console.log('🚫 Cancel button clicked, cleaning up...');
    await cleanupOperations();
    onCancel();
  };

  const handleComplete = async () => {
    // Prevent duplicate submissions
    if (submitting) {
      console.log('⚠️ Client creation already in progress, ignoring duplicate call');
      return;
    }

    // Create client in MongoDB
    setSubmitting(true);
    try {
      // Parse location to extract city/province for address
      const locationParts = formData.location.split(',').map(s => s.trim());
      // Use form data if provided, otherwise parse from location string
      const city = formData.city || locationParts[0] || '';
      const province = formData.province || locationParts[1] || '';
      
      // Auto-populate city/province from location if not manually entered
      if (!formData.city && locationParts[0]) {
        formData.city = locationParts[0];
      }
      if (!formData.province && locationParts[1]) {
        formData.province = locationParts[1];
      }
      
      // Build full address if we have components
      let fullAddress = '';
      if (formData.streetNumber && formData.streetName) {
        const addressParts = [
          `${formData.streetNumber} ${formData.streetName}`,
          formData.suite,
          city,
          province,
          formData.postalCode
        ].filter(Boolean);
        fullAddress = addressParts.join(', ');
      }
      
      const clientData = {
        businessName: formData.businessName,
        operatingName: formData.operatingName || formData.businessName,
        businessType: formData.businessType,
        jurisdiction: formData.location,
        activePermits: permits.length,
        status: 'draft' as const,
        lastActivity: 'Just now',
        completionRate: 0,
        location: formData.location,
        permitKeywords: formData.permitKeywords,
        permits: permits,
        // Address fields for form filling
        address: {
          streetNumber: formData.streetNumber || '',
          streetName: formData.streetName || '',
          suite: formData.suite || '',
          city: city,
          province: province,
          postalCode: formData.postalCode || '',
          fullAddress: fullAddress,
        },
        // Contact info
        contactInfo: {
          email: formData.email || '',
          phone: formData.phone || '',
          name: formData.ownerFirstName && formData.ownerLastName 
            ? `${formData.ownerFirstName} ${formData.ownerLastName}`
            : formData.ownerFirstName || formData.ownerLastName || '',
        },
        // Owner info
        ownerInfo: {
          firstName: formData.ownerFirstName || '',
          lastName: formData.ownerLastName || '',
          fullName: formData.ownerFirstName && formData.ownerLastName
            ? `${formData.ownerFirstName} ${formData.ownerLastName}`
            : formData.ownerFirstName || formData.ownerLastName || '',
          position: formData.ownerPosition || '',
          email: formData.email || '',
          phone: formData.phone || '',
        },
        // Business license fields
        businessLicenceNumber: formData.businessLicenceNumber || '',
        licenceExpiry: formData.licenceExpiry || '',
      };

      console.log('📝 Creating client:', clientData.businessName);

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });

      if (res.ok) {
        const newClient = await res.json();
        console.log('✅ Client created successfully:', newClient._id);
        
        // Link discovered permits to this client by creating PermitManagement entries
        if (permits.length > 0 && newClient._id) {
          try {
            console.log(`📋 Linking ${permits.length} permits to client ${newClient._id}...`);
            
            // Transform permits to PermitManagement format
            const permitManagementEntries = permits.map((permit, index) => {
              const description = permit.activities && permit.activities.length > 0 
                ? (typeof permit.activities[0] === 'string' ? permit.activities[0] : permit.name)
                : permit.name || 'No description available';
              
              let complexity: 'low' | 'medium' | 'high' = 'medium';
              if (permit.level === 'federal') {
                complexity = 'high';
              } else if (permit.level === 'municipal') {
                complexity = 'low';
              }
              
              const category = permit.level === 'federal' ? 'Federal' 
                : permit.level === 'municipal' ? 'Municipal' 
                : 'Provincial';
              
              return {
                clientId: newClient._id,
                permitId: permit._id ? (typeof permit._id === 'string' ? permit._id : String(permit._id)) : undefined,
                name: permit.name,
                authority: permit.authority || 'Unknown',
                municipality: permit.jurisdiction?.city || permit.jurisdiction?.province || undefined,
                complexity,
                estimatedTime: 'N/A',
                description,
                category,
                status: 'not-started' as const,
                order: index + 1,
                lastActivity: 'Not Started',
                lastActivityDate: new Date(),
                requirements: permit.reasons || permit.activities || [],
                howToApply: getPermitApplyUrl(permit)
                  ? `Apply at: ${getPermitApplyUrl(permit)}`
                  : 'Contact the issuing authority',
              };
            });
            
            // Create PermitManagement entries in bulk
            const permitRes = await fetch('/api/permits/management/bulk-create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ permits: permitManagementEntries }),
            });
            
            if (permitRes.ok) {
              const result = await permitRes.json();
              console.log(`✅ Linked ${result.created} permits to client ${newClient._id}`);
            } else {
              console.warn('⚠️ Failed to link permits to client, but client was created');
            }
          } catch (permitErr) {
            console.error('❌ Error linking permits to client:', permitErr);
            // Don't fail the whole operation if permit linking fails
          }
        }

        if (permits.length > 0 && newClient._id) {
          try {
            const discoveredPermitsForDb = permits
              .map((permit) => {
                const applyUrl = getPermitApplyUrl(permit);
                const sourceUrl = getPermitSourceUrl(permit);
                if (!applyUrl || !sourceUrl) return null;

                return {
                  name: permit.name,
                  level: permit.level || 'municipal',
                  authority: permit.authority || 'Unknown',
                  applyUrl,
                  sourceUrl,
                  lastUpdated: permit.lastUpdated || new Date().toISOString(),
                  reasons: permit.reasons || permit.activities || [],
                  confidence: getPermitConfidence(permit),
                };
              })
              .filter(
                (
                  permit
                ): permit is {
                  name: string;
                  level: string;
                  authority: string;
                  applyUrl: string;
                  sourceUrl: string;
                  lastUpdated: string;
                  reasons: string[];
                  confidence: 'required' | 'conditional' | 'informational';
                } => permit !== null
              );

            if (discoveredPermitsForDb.length > 0) {
              const discoveredRes = await fetch('/api/permits/discovered/bulk-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clientId: newClient._id,
                  permits: discoveredPermitsForDb,
                }),
              });

              if (discoveredRes.ok) {
                const discoveredResult = await discoveredRes.json();
                console.log(
                  `Saved ${discoveredResult.created} discovered permit record(s) for client ${newClient._id}`
                );
              } else {
                const discoveredError = await discoveredRes.json().catch(() => ({}));
                console.warn(
                  'Failed to save discovered permits, but client was created:',
                  discoveredError
                );
              }
            } else {
              console.warn('No valid discovered permits to save after URL validation');
            }
          } catch (discoveredErr) {
            console.error('Error saving discovered permits:', discoveredErr);
            // Don't fail the whole operation if discovered permit save fails
          }
        }

        onComplete(newClient);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ Failed to create client:', errorData);
        alert(`Failed to create client: ${errorData.error || 'Unknown error'}`);
        setSubmitting(false);
      }
    } catch (err) {
      console.error('❌ Error creating client:', err);
      alert('Error creating client. Please try again.');
      setSubmitting(false);
    }
  };

  // Validate form with trimmed values to handle whitespace
  const isStep1Valid = 
    formData.businessName.trim() !== '' && 
    formData.location.trim() !== '' && 
    formData.businessType.trim() !== '';

  if (showPermits) {
    return (
      <div className="h-full w-full min-w-0 flex flex-col bg-surface">
        {/* Header */}
        <div className="border-b border-border px-8 py-6 bg-surface">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Building2 className="w-4 h-4" />
            <span>New Client Setup</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Required Permits</h1>
          <p className="text-sm text-muted-foreground">Review and confirm the permits needed for {formData.businessName}</p>
        </div>

        {/* Permits List */}
        <div className="flex-1 overflow-auto p-8 bg-surface">
          <div className="w-full max-w-7xl mx-auto">
            <div className="bg-muted/50 border border-border rounded-lg p-5 mb-6">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground mb-1">
                    {permits.length} permits identified
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Based on AI-assisted research across official government sources, we've identified the following permits and licenses required for your client.
                  </p>
                </div>
              </div>
            </div>

            {permits.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No permits found. Please try modifying your search criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {permits.map((permit, index) => (
                  <div
                    key={permit._id || index}
                    className={`bg-surface border border-border rounded-lg p-5 hover:border-border hover:shadow-md transition-all ${
                      getPermitApplyUrl(permit) ? 'cursor-pointer' : ''
                    }`}
                    onClick={getPermitApplyUrl(permit) ? () => handlePermitOpen(permit) : undefined}
                    onKeyDown={getPermitApplyUrl(permit)
                      ? (event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handlePermitOpen(permit);
                          }
                        }
                      : undefined
                    }
                    role={getPermitApplyUrl(permit) ? 'button' : undefined}
                    tabIndex={getPermitApplyUrl(permit) ? 0 : undefined}
                  >
                    <div className="flex items-start gap-4">
                      {/* Number Badge */}
                      <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
                        {index + 1}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        {/* Title Row */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-foreground text-base">{permit.name}</h3>
                          <span
                            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border ${
                              permit.priority === 'High'
                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                : permit.priority === 'Medium'
                                ? 'bg-muted text-muted-foreground border-border'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            {permit.priority}
                          </span>
                        </div>
                        
                        {/* Authority */}
                        <p className="text-sm text-muted-foreground mb-3">
                          {permit.authority || permit.jurisdiction?.province || 'Unknown'}
                        </p>
                        
                        {/* Tags Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted text-foreground rounded-md text-xs font-medium border border-border">
                            <FileText className="w-3 h-3" />
                            {permit.category || permit.level || 'General'}
                          </span>
                          {permit.jurisdiction?.city && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted text-muted-foreground rounded-md text-xs border border-border">
                              <MapPin className="w-3 h-3" />
                              {permit.jurisdiction.city}
                            </span>
                          )}
                          {permit.activities && permit.activities.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {permit.activities.slice(0, 2).join(' • ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <button
                onClick={() => setShowPermits(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors border border-border"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Details
              </button>
              <button
                onClick={handleComplete}
                disabled={permits.length === 0 || submitting}
                className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all shadow-sm disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:shadow-none font-medium"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Adding Client...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Add Client to Dashboard
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col bg-muted/30">
      {/* Header - centered */}
      <div className="border-b border-border bg-surface px-6 py-8">
        <div className="mx-auto max-w-xl text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
            <FileText className="w-4 h-4" />
            <span>New Permit Setup</span>
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Start New Permit</h1>
          <p className="text-sm text-muted-foreground mt-1">Tell us about the business to discover required permits and licenses</p>
        </div>
      </div>

      {/* Form Content - centered card */}
      <div className="flex-1 overflow-auto flex items-start justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-xl mx-auto">
          <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-sm">
            <div className="space-y-6">
            {/* Form fields - single column for clean layout */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Business Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isStep1Valid && !loading) {
                      e.preventDefault();
                      handleFindPermits();
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground transition-colors"
                  placeholder="e.g., Riverside Coffee Co."
                  required
                />
              </div>

              <div ref={locationRef} className="relative">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Business Location <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => {
                      handleInputChange('location', e.target.value);
                      selectedLocationRef.current = null;
                      setLocationOpen(true);
                    }}
                    onFocus={() => setLocationOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' && !locationOpen) {
                        setLocationOpen(true);
                        setLocationHighlightedIndex(0);
                        e.preventDefault();
                        return;
                      }
                      if (locationOpen && locationSuggestions.length > 0 && !locationLoading) {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setLocationHighlightedIndex((i) =>
                            i < locationSuggestions.length - 1 ? i + 1 : i < 0 ? 0 : i
                          );
                          return;
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setLocationHighlightedIndex((i) => (i > 0 ? i - 1 : 0));
                          return;
                        }
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const idx = locationHighlightedIndex >= 0 ? locationHighlightedIndex : 0;
                          const selected = locationSuggestions[idx];
                          if (selected) {
                            handleInputChange('location', selected.display);
                            selectedLocationRef.current = {
                              display: selected.display,
                              city: selected.city,
                              province: selected.provinceCode,
                              country: selected.country,
                            };
                            setLocationOpen(false);
                          }
                          return;
                        }
                      }
                      if (e.key === 'Enter' && isStep1Valid && !loading) {
                        e.preventDefault();
                        handleFindPermits();
                      }
                    }}
                    className="w-full px-4 py-2.5 pr-9 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground transition-colors"
                    placeholder="Ex: Ottawa, Ontario"
                    required
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                {locationOpen && (
                  <ul className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-auto py-1">
                    {locationLoading ? (
                      <li className="px-4 py-2 text-muted-foreground text-sm">Searching...</li>
                    ) : locationSuggestions.length > 0 ? (
                      locationSuggestions.map((loc, i) => (
                        <li
                          key={`${loc.display}-${i}`}
                          onClick={() => {
                            handleInputChange('location', loc.display);
                            selectedLocationRef.current = {
                              display: loc.display,
                              city: loc.city,
                              province: loc.provinceCode,
                              country: loc.country,
                            };
                            setLocationOpen(false);
                          }}
                          className={`px-4 py-2 cursor-pointer hover:bg-accent text-sm ${
                            i === locationHighlightedIndex ? 'bg-accent' : ''
                          }`}
                        >
                          {loc.display}
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-2 text-muted-foreground text-sm">Type to search cities (US & Canada)</li>
                    )}
                  </ul>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">City and province/state</p>
              </div>

            </div>

            <div className="space-y-5">
              <div ref={businessTypeRef} className="relative">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Business Type <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.businessType}
                    onChange={(e) => {
                      handleInputChange('businessType', e.target.value);
                      setBusinessTypeOpen(true);
                    }}
                    onFocus={() => setBusinessTypeOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' && !businessTypeOpen) {
                        setBusinessTypeOpen(true);
                        setBusinessTypeHighlightedIndex(0);
                        e.preventDefault();
                        return;
                      }
                      if (businessTypeOpen && filteredBusinessTypes.length > 0) {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setBusinessTypeHighlightedIndex((i) =>
                            i < filteredBusinessTypes.length - 1 ? i + 1 : i < 0 ? 0 : i
                          );
                          return;
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setBusinessTypeHighlightedIndex((i) => (i > 0 ? i - 1 : 0));
                          return;
                        }
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const idx = businessTypeHighlightedIndex >= 0 ? businessTypeHighlightedIndex : 0;
                          const selected = filteredBusinessTypes[idx];
                          if (selected) {
                            handleInputChange('businessType', selected.label);
                            setBusinessTypeOpen(false);
                          }
                          return;
                        }
                      }
                      if (e.key === 'Enter' && isStep1Valid && !loading) {
                        e.preventDefault();
                        handleFindPermits();
                      }
                    }}
                    className="w-full px-4 py-2.5 pr-9 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground transition-colors"
                    placeholder="Ex: restaurant business"
                    required
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                {businessTypeOpen && (
                  <ul className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-auto py-1">
                    {filteredBusinessTypes.length > 0 ? (
                      filteredBusinessTypes.map((b, idx) => (
                        <li
                          key={b.slug}
                          onClick={() => {
                            handleInputChange('businessType', b.label);
                            setBusinessTypeOpen(false);
                          }}
                          className={`px-4 py-2 cursor-pointer hover:bg-accent text-sm ${
                            idx === businessTypeHighlightedIndex ? 'bg-accent' : ''
                          }`}
                        >
                          {b.label}
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-2 text-muted-foreground text-sm">Type to add custom</li>
                    )}
                  </ul>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">Describe the type of business</p>
              </div>

              <div ref={permitKeywordsRef} className="relative">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Permit Keywords <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.permitKeywords}
                    onChange={(e) => {
                      handleInputChange('permitKeywords', e.target.value.slice(0, 200));
                      setPermitKeywordsOpen(true);
                    }}
                    onFocus={() => setPermitKeywordsOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown' && !permitKeywordsOpen) {
                        setPermitKeywordsOpen(true);
                        setPermitKeywordsHighlightedIndex(0);
                        e.preventDefault();
                        return;
                      }
                      if (permitKeywordsOpen && filteredPermitKeywords.length > 0) {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setPermitKeywordsHighlightedIndex((i) =>
                            i < filteredPermitKeywords.length - 1 ? i + 1 : i < 0 ? 0 : i
                          );
                          return;
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setPermitKeywordsHighlightedIndex((i) => (i > 0 ? i - 1 : 0));
                          return;
                        }
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const idx = permitKeywordsHighlightedIndex >= 0 ? permitKeywordsHighlightedIndex : 0;
                          const selected = filteredPermitKeywords[idx];
                          if (selected) {
                            handleInputChange('permitKeywords', selected.label.slice(0, 200));
                            setPermitKeywordsOpen(false);
                          }
                          return;
                        }
                      }
                      if (e.key === 'Enter' && isStep1Valid && !loading) {
                        e.preventDefault();
                        handleFindPermits();
                      }
                    }}
                    className="w-full px-4 py-2.5 pr-9 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground transition-colors"
                    placeholder="Ex: zoning, food service, building permits"
                    maxLength={200}
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                {permitKeywordsOpen && (
                  <ul className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-auto py-1">
                    {filteredPermitKeywords.length > 0 ? (
                      filteredPermitKeywords.map((a, idx) => (
                        <li
                          key={a.slug}
                          onClick={() => {
                            handleInputChange('permitKeywords', a.label.slice(0, 200));
                            setPermitKeywordsOpen(false);
                          }}
                          className={`px-4 py-2 cursor-pointer hover:bg-accent text-sm ${
                            idx === permitKeywordsHighlightedIndex ? 'bg-accent' : ''
                          }`}
                        >
                          {a.label}
                        </li>
                      ))
                    ) : (
                      <li className="px-4 py-2 text-muted-foreground text-sm">Type to add custom</li>
                    )}
                  </ul>
                )}
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-muted-foreground">Specific permits or licenses you're looking for</p>
                  <p className="text-xs text-muted-foreground">{formData.permitKeywords.length}/200</p>
                </div>
              </div>

              {/* Additional Fields for Form Filling */}
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-4">Additional Business Information</h3>
                <p className="text-xs text-muted-foreground mb-4">These details will be used to auto-fill permit forms</p>
                
                <div className="space-y-4">
                  {/* Operating Name */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Operating Name (DBA)
                    </label>
                    <input
                      type="text"
                      value={formData.operatingName}
                      onChange={(e) => handleInputChange('operatingName', e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground"
                      placeholder="Leave blank if same as business name"
                    />
                  </div>

                  {/* Address Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Street Number
                      </label>
                      <input
                        type="text"
                        value={formData.streetNumber}
                        onChange={(e) => handleInputChange('streetNumber', e.target.value)}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground"
                        placeholder="123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Street Name
                      </label>
                      <input
                        type="text"
                        value={formData.streetName}
                        onChange={(e) => handleInputChange('streetName', e.target.value)}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground"
                        placeholder="Main Street"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Suite/Unit
                      </label>
                      <input
                        type="text"
                        value={formData.suite}
                        onChange={(e) => handleInputChange('suite', e.target.value)}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground"
                        placeholder="Suite 200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground"
                        placeholder="Auto-filled from location"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Province/State
                      </label>
                      <input
                        type="text"
                        value={formData.province}
                        onChange={(e) => handleInputChange('province', e.target.value)}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground"
                        placeholder="Auto-filled from location"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Postal/ZIP Code
                    </label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground"
                      placeholder="M5V 1L5"
                    />
                  </div>

                  {/* Contact Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground"
                        placeholder="contact@business.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground"
                        placeholder="(416) 555-1234"
                      />
                    </div>
                  </div>

                  {/* Owner Fields */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Owner First Name
                      </label>
                      <input
                        type="text"
                        value={formData.ownerFirstName}
                        onChange={(e) => handleInputChange('ownerFirstName', e.target.value)}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Owner Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.ownerLastName}
                        onChange={(e) => handleInputChange('ownerLastName', e.target.value)}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground"
                        placeholder="Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Position
                      </label>
                      <input
                        type="text"
                        value={formData.ownerPosition}
                        onChange={(e) => handleInputChange('ownerPosition', e.target.value)}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground"
                        placeholder="Owner"
                      />
                    </div>
                  </div>

                  {/* Business License Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Business License Number
                      </label>
                      <input
                        type="text"
                        value={formData.businessLicenceNumber}
                        onChange={(e) => handleInputChange('businessLicenceNumber', e.target.value)}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground"
                        placeholder="T-2024-00000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        License Expiry Date
                      </label>
                      <input
                        type="date"
                        value={formData.licenceExpiry}
                        onChange={(e) => handleInputChange('licenceExpiry', e.target.value)}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="mt-8 bg-muted/50 border border-border rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-border border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Search className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-foreground mb-1">Discovering Permits...</p>
                    <p className="text-sm text-muted-foreground">
                      Analyzing business requirements for {formData.location || 'your location'}
                    </p>
                    <div className="mt-3 w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border px-4 py-5 sm:px-6 bg-surface">
        <div className="w-full max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors text-sm font-medium border border-border"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              console.log('🔘 Find My Permits button clicked!');
              console.log('📋 Current form data:', {
                businessName: formData.businessName,
                location: formData.location,
                businessType: formData.businessType,
                permitKeywords: formData.permitKeywords
              });
              console.log('✅ Validation check:', {
                businessNameValid: formData.businessName.trim() !== '',
                locationValid: formData.location.trim() !== '',
                businessTypeValid: formData.businessType.trim() !== '',
                isStep1Valid: isStep1Valid
              });
              
              if (!isStep1Valid) {
                const missing = [];
                if (!formData.businessName.trim()) missing.push('Business Name');
                if (!formData.location.trim()) missing.push('Location');
                if (!formData.businessType.trim()) missing.push('Business Type');
                alert(`Please fill in the following required fields:\n\n${missing.join('\n')}\n\nAll fields marked with * are required.`);
                return;
              }
              
              if (loading) {
                console.log('⏳ Already loading, ignoring click');
                return;
              }
              
              console.log('🚀 Calling handleFindPermits...');
              handleFindPermits();
            }}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all text-sm font-medium ${
              isStep1Valid && !loading
                ? 'bg-primary text-primary-foreground hover:opacity-90 cursor-pointer shadow-sm'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
            title={
              loading 
                ? 'Searching for permits...' 
                : !isStep1Valid 
                  ? 'Please fill in Business Name, Location, and Business Type' 
                  : 'Click to find permits'
            }
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Finding Permits...
              </>
            ) : (
              <>
                Find My Permits
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
