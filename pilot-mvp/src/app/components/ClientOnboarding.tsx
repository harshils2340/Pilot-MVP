'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Building2, MapPin, Briefcase, FileText, CheckCircle2, Loader2, Info, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';

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
  sourceUrl?: string;
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
    isCancelledRef.current = false; // Reset cancellation flag
    
    // Generate unique request ID for cancellation tracking
    const requestId = `scrape-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    requestIdRef.current = requestId;
    console.log(`🆔 Generated request ID: ${requestId}`);
    
    console.log('🔍 Starting permit discovery...');
    console.log('📋 Form data:', trimmedData);
    
    let scrapingStarted = false;
    let permitsFromResponse: Permit[] = [];
    
    try {
      // Call BizPaL scraping API with a longer timeout
      console.log('📡 Calling BizPaL scraping API...');
      console.log('⏳ This may take several minutes. Please wait...');
      
      // Create an AbortController for timeout handling and store in ref
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => {
        console.log('⏱️ Request timeout reached, aborting...');
        controller.abort();
      }, 30 * 60 * 1000); // 30 minute timeout
      timeoutIdRef.current = timeoutId;
      
      try {
        const response = await fetch('/api/bizpal/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: trimmedData.location,
            businessType: trimmedData.businessType,
            permitKeywords: trimmedData.permitKeywords,
            requestId: requestId, // Send request ID so backend can track it
          }),
          signal: controller.signal,
        });

        // Clear timeout on successful response
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        // Read response body once
        let responseText: string;
        try {
          responseText = await response.text();
        } catch (e) {
          console.error('❌ Failed to read response:', e);
          throw new Error('Failed to read response from server');
        }

        if (!response.ok) {
          // Try to parse as JSON for error details
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            // Not JSON, use text as error message
            console.error('❌ API Error - Response text:', responseText);
            throw new Error(`Server error (${response.status}): ${responseText || 'Unknown error'}`);
          }
          console.error('❌ API Error:', errorData);
          throw new Error(errorData.error || errorData.details || 'Failed to fetch permits');
        }

        // Parse successful response as JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('❌ Failed to parse JSON response:', responseText);
          throw new Error('Invalid response from server');
        }
        
        scrapingStarted = true;
        console.log('✅ API Response received:', data);
        
        // Store request ID for cancellation (if provided)
        if (data.requestId) {
          requestIdRef.current = data.requestId;
          console.log(`🆔 Request ID stored: ${data.requestId}`);
        }
        
        console.log(`📊 Found ${data.totalFound} permits, saved ${data.totalSaved} to database`);
        
        // Transform permits to match our display format
        permitsFromResponse = data.permits.map((p: any, index: number) => ({
          _id: p._id ? (typeof p._id === 'string' ? p._id : p._id.toString()) : undefined,
          name: p.name,
          level: p.level,
          jurisdiction: p.jurisdiction,
          authority: p.authority || p.jurisdiction?.province || 'Unknown',
          activities: p.activities || [],
          sourceUrl: p.sourceUrl,
          priority: index < 3 ? 'High' : index < 10 ? 'Medium' : 'Low',
          category: p.level === 'federal' ? 'Federal' : p.level === 'municipal' ? 'Municipal' : 'Provincial',
        }));
      } catch (fetchError: any) {
        // Clear timeout on error
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        // If user cancelled, don't continue
        if (fetchError.name === 'AbortError' && !abortControllerRef.current) {
          console.log('🚫 User cancelled the operation');
          return;
        }
        
        // If it's an abort (timeout) or network error, try fetching from database
        if (fetchError.name === 'AbortError' || fetchError.message.includes('fetch')) {
          // Check if operation was cancelled by user
          if (isCancelledRef.current) {
            console.log('🚫 Operation was cancelled by user, not fetching from database');
            return;
          }

          console.log('⏱️ Request timed out or failed. Fetching permits from database...');
          scrapingStarted = true; // Assume scraping may have completed
          
          // Wait a bit for scraping to potentially complete, then fetch from database
          // Store timeout in ref so we can cancel it
          const dbTimeout = new Promise<void>((resolve) => {
            const timeout = setTimeout(() => resolve(), 5000);
            dbFetchTimeoutRef.current = timeout;
          });
          await dbTimeout;
          
          // Check again if cancelled during wait
          if (isCancelledRef.current) {
            console.log('🚫 Operation was cancelled during database fetch wait');
            if (dbFetchTimeoutRef.current) {
              clearTimeout(dbFetchTimeoutRef.current);
              dbFetchTimeoutRef.current = null;
            }
            return;
          }
          
          if (dbFetchTimeoutRef.current) {
            clearTimeout(dbFetchTimeoutRef.current);
            dbFetchTimeoutRef.current = null;
          }
          
          // Try to fetch permits from database
          try {
            const dbResponse = await fetch('/api/permits');
            if (dbResponse.ok) {
              const dbPermits = await dbResponse.json();
              console.log(`📊 Fetched ${dbPermits.length} permits from database`);
              
              // Filter permits that match the business type or location
              const relevantPermits = dbPermits
                .filter((p: any) => {
                  const nameMatch = p.name?.toLowerCase().includes(trimmedData.businessType.toLowerCase()) ||
                                   p.name?.toLowerCase().includes(trimmedData.location.toLowerCase());
                  const activityMatch = p.activities?.some((a: string) => 
                    a.toLowerCase().includes(trimmedData.businessType.toLowerCase())
                  );
                  return nameMatch || activityMatch;
                })
                .slice(0, 50) // Limit to 50 most recent
                .map((p: any, index: number) => ({
                  _id: p._id,
                  name: p.name,
                  level: p.level,
                  jurisdiction: p.jurisdiction,
                  authority: p.authority || p.jurisdiction?.province || 'Unknown',
                  activities: p.activities || [],
                  sourceUrl: p.sourceUrl,
                  priority: index < 3 ? 'High' : index < 10 ? 'Medium' : 'Low',
                  category: p.level === 'federal' ? 'Federal' : p.level === 'municipal' ? 'Municipal' : 'Provincial',
                }));
              
              if (relevantPermits.length > 0) {
                permitsFromResponse = relevantPermits;
                console.log(`✅ Found ${relevantPermits.length} relevant permits from database`);
              } else {
                // If no relevant permits found, show all recent permits (no limit)
                permitsFromResponse = dbPermits.map((p: any, index: number) => ({
                  _id: p._id,
                  name: p.name,
                  level: p.level,
                  jurisdiction: p.jurisdiction,
                  authority: p.authority || p.jurisdiction?.province || 'Unknown',
                  activities: p.activities || [],
                  sourceUrl: p.sourceUrl,
                  priority: index < 3 ? 'High' : index < 10 ? 'Medium' : 'Low',
                  category: p.level === 'federal' ? 'Federal' : p.level === 'municipal' ? 'Municipal' : 'Provincial',
                }));
                console.log(`✅ Showing ${permitsFromResponse.length} most recent permits from database`);
              }
            }
          } catch (dbError) {
            console.error('❌ Failed to fetch from database:', dbError);
            throw fetchError; // Re-throw original error
          }
        } else {
          throw fetchError;
        }
      }
      
      // Display permits (either from API response or database)
      if (permitsFromResponse.length > 0) {
        setPermits(permitsFromResponse);
        setShowPermits(true);
        console.log(`✅ Displaying ${permitsFromResponse.length} permits to user`);
      } else {
        throw new Error('No permits found. The scraping may still be in progress. Please try again in a few minutes or check the permit management page.');
      }
    } catch (error: any) {
      // If operation was cancelled by user, don't show error
      if (isCancelledRef.current) {
        console.log('🚫 Operation cancelled by user, not showing error');
        return;
      }

      console.error('❌ Error fetching permits:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      
      // Provide more helpful error messages
      let userMessage = '';
      if (error.name === 'AbortError') {
        userMessage = 'The request took too long. The scraping may still be in progress. Please check the permit management page in a few minutes.';
      } else if (error.message?.includes('fetch')) {
        userMessage = 'Network error: Could not connect to the server. Please check your internet connection and try again.';
      } else if (error.message?.includes('Failed to import')) {
        userMessage = 'Server configuration error. Please contact support or try again later.';
      } else if (scrapingStarted) {
        userMessage = `Scraping completed but no permits were returned. The permits may have been saved to the database. Please check the permit management page or try again.`;
      } else {
        userMessage = `Failed to start permit discovery: ${errorMessage}. Please check the browser console (F12) for more details.`;
      }
      
      alert(userMessage);
    } finally {
      // Clean up refs (but keep isCancelledRef to track cancellation state)
      abortControllerRef.current = null;
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      if (dbFetchTimeoutRef.current) {
        clearTimeout(dbFetchTimeoutRef.current);
        dbFetchTimeoutRef.current = null;
      }
      // Only reset loading if not cancelled (to prevent state updates after unmount)
      if (!isCancelledRef.current) {
        setLoading(false);
      }
      console.log('🏁 Permit discovery process completed');
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
                requirements: permit.activities || [],
                howToApply: permit.sourceUrl ? `Apply at: ${permit.sourceUrl}` : 'Contact the issuing authority',
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
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="border-b border-neutral-200 px-8 py-6">
          <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
            <Building2 className="w-4 h-4" />
            <span>New Client Setup</span>
          </div>
          <h1 className="text-neutral-900 mb-1">Required Permits</h1>
          <p className="text-neutral-600">Review and confirm the permits needed for {formData.businessName}</p>
        </div>

        {/* Permits List */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">
                    {permits.length} permits identified
                  </p>
                  <p className="text-sm text-blue-700">
                    Based on the business information provided and BizPaL data, we've identified the following permits and licenses required for your client.
                  </p>
                </div>
              </div>
            </div>

            {permits.length === 0 ? (
              <div className="text-center py-12 text-neutral-600">
                No permits found. Please try modifying your search criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {permits.map((permit, index) => (
                  <div
                    key={permit._id || index}
                    className="bg-white border border-neutral-200 rounded-lg p-5 hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-medium">
                            {index + 1}
                          </span>
                          <h3 className="font-medium text-neutral-900">{permit.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              permit.priority === 'High'
                                ? 'bg-red-50 text-red-700'
                                : permit.priority === 'Medium'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {permit.priority} Priority
                          </span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-neutral-600">
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-4 h-4" />
                            {permit.category || permit.level || 'General'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {permit.authority || permit.jurisdiction?.province || 'Unknown'}
                          </span>
                          {permit.activities && permit.activities.length > 0 && (
                            <span className="flex items-center gap-1.5">
                              <Briefcase className="w-4 h-4" />
                              {permit.activities.slice(0, 2).join(', ')}
                              {permit.activities.length > 2 && '...'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-200">
              <button
                onClick={() => setShowPermits(false)}
                className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Details
              </button>
              <button
                onClick={handleComplete}
                disabled={permits.length === 0 || submitting}
                className="flex items-center gap-2 px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding Client...
                  </>
                ) : (
                  <>
                    Add Client to Dashboard
                    <ArrowRight className="w-4 h-4" />
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
    <div className="h-full flex flex-col bg-white">
      {/* Compact Header */}
      <div className="border-b border-neutral-200 px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-1">
          <Building2 className="w-4 h-4" />
          <span>New Client Setup</span>
        </div>
        <h1 className="text-xl font-semibold text-neutral-900">Add New Client</h1>
        <p className="text-xs text-neutral-500 mt-0.5">Tell us about the business to discover required permits</p>
      </div>

      {/* Form Content - Enhanced Layout with Sidebar */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Form Fields (2 columns) */}
            <div className="lg:col-span-2 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-1.5">
                      Business Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent text-sm text-neutral-900 placeholder:text-neutral-400"
                      placeholder="e.g., Riverside Coffee Co."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-1.5">
                      Business Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent text-sm text-neutral-900 placeholder:text-neutral-400"
                      placeholder="Ex: Ottawa, Ontario"
                      required
                    />
                    <p className="text-xs text-neutral-500 mt-1">City and province/state</p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-1.5">
                      Business Type <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.businessType}
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent text-sm text-neutral-900 placeholder:text-neutral-400"
                      placeholder="Ex: restaurant business"
                      required
                    />
                    <p className="text-xs text-neutral-500 mt-1">Describe the type of business</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-900 mb-1.5">
                      Permit Keywords <span className="text-xs font-normal text-neutral-500">(Optional)</span>
                    </label>
                    <textarea
                      value={formData.permitKeywords}
                      onChange={(e) => handleInputChange('permitKeywords', e.target.value)}
                      rows={2}
                      maxLength={200}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none text-sm text-neutral-900 placeholder:text-neutral-400"
                      placeholder="Ex: zoning, food service, building permits"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-neutral-500">Specific permits or licenses you're looking for</p>
                      <p className="text-xs text-neutral-400">{formData.permitKeywords.length}/200</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box and Additional Content */}
              <div className="mt-6 space-y-4">
                {/* Info Box */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">Ready to find permits?</p>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        We'll analyze your business details using BizPaL and identify all required permits and licenses for your jurisdiction.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Process Steps Card */}
                <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-neutral-600" />
                    How It Works
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-medium flex items-center justify-center">
                        1
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-900 mb-0.5">Fill Details</p>
                        <p className="text-xs text-neutral-600">Enter your business information</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-medium flex items-center justify-center">
                        2
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-900 mb-0.5">Search Permits</p>
                        <p className="text-xs text-neutral-600">We'll search BizPaL database</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-medium flex items-center justify-center">
                        3
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-900 mb-0.5">Review Results</p>
                        <p className="text-xs text-neutral-600">Review and add to dashboard</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Helpful Note */}
                {loading && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Loader2 className="w-5 h-5 text-amber-600 animate-spin flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 mb-1">Searching for permits...</p>
                        <p className="text-xs text-amber-800">
                          This process may take a few minutes. Please don't close this page. You can cancel the search at any time.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Helpful Information */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 space-y-4">
                {/* Form Summary Card */}
                <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <h3 className="text-sm font-semibold text-neutral-900">Form Summary</h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      {formData.businessName.trim() ? (
                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                      )}
                      <span className={formData.businessName.trim() ? 'text-neutral-700' : 'text-neutral-400'}>
                        Business Name
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.location.trim() ? (
                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                      )}
                      <span className={formData.location.trim() ? 'text-neutral-700' : 'text-neutral-400'}>
                        Location
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.businessType.trim() ? (
                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-neutral-400 flex-shrink-0" />
                      )}
                      <span className={formData.businessType.trim() ? 'text-neutral-700' : 'text-neutral-400'}>
                        Business Type
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.permitKeywords.trim() ? (
                        <CheckCircle className="w-3 h-3 text-blue-600 flex-shrink-0" />
                      ) : (
                        <div className="w-3 h-3 flex-shrink-0" />
                      )}
                      <span className={formData.permitKeywords.trim() ? 'text-neutral-700' : 'text-neutral-400'}>
                        Permit Keywords (Optional)
                      </span>
                    </div>
                  </div>
                  {isStep1Valid && (
                    <div className="mt-3 pt-3 border-t border-neutral-200">
                      <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded px-2 py-1.5">
                        <CheckCircle className="w-3 h-3" />
                        <span className="font-medium">Ready to search</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tips Card */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-semibold text-amber-900">Quick Tips</h3>
                  </div>
                  <ul className="space-y-2 text-xs text-amber-800">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>Be specific with your business type for better results</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>Include both city and province/state for location</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>Permit keywords help narrow down the search</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span>The search may take a few minutes to complete</span>
                    </li>
                  </ul>
                </div>

                {/* Examples Card */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-neutral-600" />
                    <h3 className="text-sm font-semibold text-neutral-900">Examples</h3>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="font-medium text-neutral-700 mb-1">Business Type:</p>
                      <p className="text-neutral-600">"Restaurant & Food Service"</p>
                      <p className="text-neutral-600">"Retail Store"</p>
                      <p className="text-neutral-600">"Construction Company"</p>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-700 mb-1">Location:</p>
                      <p className="text-neutral-600">"Toronto, Ontario"</p>
                      <p className="text-neutral-600">"Vancouver, BC"</p>
                      <p className="text-neutral-600">"Calgary, Alberta"</p>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-700 mb-1">Permit Keywords:</p>
                      <p className="text-neutral-600">"zoning, building, food service"</p>
                      <p className="text-neutral-600">"business license, health permit"</p>
                    </div>
                  </div>
                </div>

                {/* What Happens Next Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ArrowRight className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-semibold text-blue-900">What Happens Next?</h3>
                  </div>
                  <ol className="space-y-2 text-xs text-blue-800 list-decimal list-inside">
                    <li>We'll search BizPaL for relevant permits</li>
                    <li>Review the identified permits and licenses</li>
                    <li>Add the client to your dashboard</li>
                    <li>Start tracking permit applications</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation - Compact */}
      <div className="border-t border-neutral-200 px-8 py-4 bg-neutral-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:bg-white rounded-lg transition-colors text-sm font-medium border border-neutral-300"
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
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors text-sm font-medium ${
              isStep1Valid && !loading
                ? 'bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer shadow-sm'
                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
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
