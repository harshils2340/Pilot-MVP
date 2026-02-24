'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Building2, MapPin, Briefcase, FileText, CheckCircle2, Loader2, Info, Lightbulb, CheckCircle, AlertCircle, Search, Sparkles } from 'lucide-react';

interface ClientOnboardingProps {
  onComplete: (clientData: any) => void;
  onCancel: () => void;
}

interface BusinessFormData {
  businessName: string;
  location: string; // Where is your business located?
  businessType: string; // What type of business is it?
  permitKeywords: string; // What type of permits and licences are you looking for?
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
    location: '',
    businessType: '',
    permitKeywords: '',
  });

  // Refs to track ongoing operations for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
  const dbFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const requestIdRef = useRef<string | null>(null);

  const handleInputChange = (field: keyof BusinessFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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
  const parseLocation = (locationStr: string): { country: string; province: string; city: string } => {
    const parts = locationStr.split(',').map(p => p.trim());
    let city = parts[0] || '';
    let province = parts[1] || '';
    let country = 'CA'; // Default to Canada
    
    // Handle US states
    const usStates: { [key: string]: string } = {
      'california': 'CA', 'ca': 'CA', 'calif': 'CA',
      'new york': 'NY', 'ny': 'NY',
      'texas': 'TX', 'tx': 'TX',
      'florida': 'FL', 'fl': 'FL',
    };
    
    const provinceLower = province.toLowerCase();
    if (usStates[provinceLower]) {
      country = 'US';
      province = usStates[provinceLower];
    } else if (province.length === 2) {
      // Assume 2-letter codes are US states
      country = 'US';
    } else {
      // Canadian provinces
      const canadianProvinces: { [key: string]: string } = {
        'ontario': 'ON', 'on': 'ON',
        'quebec': 'QC', 'qc': 'QC',
        'british columbia': 'BC', 'bc': 'BC',
        'alberta': 'AB', 'ab': 'AB',
        'manitoba': 'MB', 'mb': 'MB',
        'saskatchewan': 'SK', 'sk': 'SK',
        'nova scotia': 'NS', 'ns': 'NS',
        'new brunswick': 'NB', 'nb': 'NB',
        'newfoundland': 'NL', 'nl': 'NL',
        'prince edward island': 'PE', 'pe': 'PE',
        'northwest territories': 'NT', 'nt': 'NT',
        'yukon': 'YT', 'yt': 'YT',
        'nunavut': 'NU', 'nu': 'NU',
      };
      
      const provinceKey = provinceLower;
      if (canadianProvinces[provinceKey]) {
        province = canadianProvinces[provinceKey];
      } else if (province.length === 2) {
        // Assume it's already a 2-letter code
        province = province.toUpperCase();
      }
    }
    
    return { country, province: province.toUpperCase(), city };
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
      // Parse location
      const parsedLocation = parseLocation(trimmedData.location);
      
      // Convert permitKeywords to activities array
      const activities = trimmedData.permitKeywords
        ? trimmedData.permitKeywords.split(',').map(a => a.trim()).filter(a => a.length > 0)
        : [trimmedData.businessType]; // Fallback to business type
      
      // If no activities, use business type as activity
      if (activities.length === 0) {
        activities.push(trimmedData.businessType);
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
      const clientData = {
        businessName: formData.businessName,
        businessType: formData.businessType,
        jurisdiction: formData.location,
        activePermits: permits.length,
        status: 'draft' as const,
        lastActivity: 'Just now',
        completionRate: 0,
        location: formData.location,
        permitKeywords: formData.permitKeywords,
        permits: permits,
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
      <div className="h-full flex flex-col bg-surface">
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
          <div className="max-w-4xl mx-auto">
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
    <div className="h-full flex flex-col bg-surface">
      {/* Compact Header */}
      <div className="border-b border-border px-8 py-6 bg-surface">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <FileText className="w-4 h-4" />
          <span>New Permit Setup</span>
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Start New Permit</h1>
        <p className="text-sm text-muted-foreground mt-1">Tell us about the business to discover required permits and licenses</p>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto px-8 py-8 bg-surface">
        <div className="w-full max-w-7xl mx-auto">
          <div className="bg-surface border border-border rounded-lg p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Building2 className="w-4 h-4 inline mr-2" />
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Business Location <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isStep1Valid && !loading) {
                      e.preventDefault();
                      handleFindPermits();
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground transition-colors"
                  placeholder="Ex: Ottawa, Ontario"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1.5">City and province/state</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Business Type <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isStep1Valid && !loading) {
                      e.preventDefault();
                      handleFindPermits();
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-sm text-foreground bg-surface placeholder:text-muted-foreground transition-colors"
                  placeholder="Ex: restaurant business"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1.5">Describe the type of business</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  Permit Keywords <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </label>
                <textarea
                  value={formData.permitKeywords}
                  onChange={(e) => handleInputChange('permitKeywords', e.target.value)}
                  rows={2}
                  maxLength={200}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none text-sm text-foreground bg-surface placeholder:text-muted-foreground transition-colors"
                  placeholder="Ex: zoning, food service, building permits"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-muted-foreground">Specific permits or licenses you're looking for</p>
                  <p className="text-xs text-muted-foreground">{formData.permitKeywords.length}/200</p>
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
      <div className="border-t border-border px-8 py-5 bg-surface">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
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
