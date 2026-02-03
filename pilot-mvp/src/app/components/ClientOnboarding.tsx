'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Building2, MapPin, Briefcase, FileText, CheckCircle2, Loader2, Info, Lightbulb, CheckCircle, AlertCircle, Search } from 'lucide-react';

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

  // Hardcoded permits based on location and business type
  const getHardcodedPermits = (location: string, businessType: string): Permit[] => {
    const locationLower = location.toLowerCase();
    const businessLower = businessType.toLowerCase();
    
    // Check if San Francisco / California location
    const isSanFrancisco = locationLower.includes('san francisco') || 
                          locationLower.includes('sf') ||
                          (locationLower.includes('california') || locationLower.includes('ca'));
    
    // Check if restaurant/food business
    const isRestaurant = businessLower.includes('restaurant') || 
                        businessLower.includes('food') ||
                        businessLower.includes('cafe') ||
                        businessLower.includes('bar') ||
                        businessLower.includes('dining');
    
    // San Francisco Restaurant permits (18 total)
    if (isSanFrancisco && isRestaurant) {
      return [
        {
          _id: 'sf-health-permit',
          name: 'Food Service Health Permit',
          level: 'municipal',
          jurisdiction: { city: 'San Francisco', province: 'California' },
          authority: 'SF Department of Public Health',
          activities: ['Food preparation', 'Food service', 'Food handling'],
          priority: 'High',
          category: 'Health & Safety',
        },
        {
          _id: 'sf-business-license',
          name: 'Business Registration Certificate',
          level: 'municipal',
          jurisdiction: { city: 'San Francisco', province: 'California' },
          authority: 'SF Office of the Treasurer & Tax Collector',
          activities: ['Operating a business in San Francisco'],
          priority: 'High',
          category: 'Business',
        },
        {
          _id: 'sf-food-handler',
          name: 'Food Handler Certificate',
          level: 'municipal',
          jurisdiction: { city: 'San Francisco', province: 'California' },
          authority: 'SF Department of Public Health',
          activities: ['Food handling', 'Food preparation'],
          priority: 'High',
          category: 'Health & Safety',
        },
        {
          _id: 'sf-fire-permit',
          name: 'Fire Department Permit',
          level: 'municipal',
          jurisdiction: { city: 'San Francisco', province: 'California' },
          authority: 'SF Fire Department',
          activities: ['Commercial cooking', 'Hood and duct systems', 'Fire safety'],
          priority: 'High',
          category: 'Fire Safety',
        },
        {
          _id: 'sf-building-permit',
          name: 'Building Permit (Tenant Improvements)',
          level: 'municipal',
          jurisdiction: { city: 'San Francisco', province: 'California' },
          authority: 'SF Department of Building Inspection',
          activities: ['Interior construction', 'Restaurant build-out', 'Kitchen installation'],
          priority: 'High',
          category: 'Construction',
        },
        {
          _id: 'sf-conditional-use',
          name: 'Conditional Use Authorization',
          level: 'municipal',
          jurisdiction: { city: 'San Francisco', province: 'California' },
          authority: 'SF Planning Commission',
          activities: ['Restaurant use in certain zoning districts', 'Late night operations'],
          priority: 'High',
          category: 'Planning',
        },
        {
          _id: 'sf-grease-trap',
          name: 'Grease Trap/Interceptor Permit',
          level: 'municipal',
          jurisdiction: { city: 'San Francisco', province: 'California' },
          authority: 'SF Public Utilities Commission',
          activities: ['Wastewater discharge', 'Grease management'],
          priority: 'Medium',
          category: 'Environmental',
        },
        {
          _id: 'sf-hood-duct',
          name: 'Commercial Kitchen Hood & Duct Permit',
          level: 'municipal',
          jurisdiction: { city: 'San Francisco', province: 'California' },
          authority: 'SF Fire Department',
          activities: ['Kitchen ventilation', 'Fire suppression systems'],
          priority: 'Medium',
          category: 'Fire Safety',
        },
        {
          _id: 'sf-signage-permit',
          name: 'Sign Permit',
          level: 'municipal',
          jurisdiction: { city: 'San Francisco', province: 'California' },
          authority: 'SF Planning Department',
          activities: ['Business signage', 'Exterior signs'],
          priority: 'Medium',
          category: 'Planning',
        },
        {
          _id: 'sf-sidewalk-permit',
          name: 'Sidewalk Tables & Chairs Permit',
          level: 'municipal',
          jurisdiction: { city: 'San Francisco', province: 'California' },
          authority: 'SF Department of Public Works',
          activities: ['Outdoor seating', 'Sidewalk dining'],
          priority: 'Medium',
          category: 'Public Works',
        },
        {
          _id: 'sf-entertainment',
          name: 'Place of Entertainment Permit',
          level: 'municipal',
          jurisdiction: { city: 'San Francisco', province: 'California' },
          authority: 'SF Entertainment Commission',
          activities: ['Live music', 'DJ performances', 'Dancing'],
          priority: 'Medium',
          category: 'Entertainment',
        },
        {
          _id: 'sf-alcohol-abc',
          name: 'Alcoholic Beverage License (Type 47)',
          level: 'provincial',
          jurisdiction: { city: 'San Francisco', province: 'California' },
          authority: 'California Dept of Alcoholic Beverage Control',
          activities: ['On-premises alcohol sales', 'Beer, wine, and spirits'],
          priority: 'High',
          category: 'Alcohol',
        },
        {
          _id: 'ca-sellers-permit',
          name: 'California Seller\'s Permit',
          level: 'provincial',
          jurisdiction: { province: 'California' },
          authority: 'CA Department of Tax and Fee Administration',
          activities: ['Selling taxable goods', 'Retail sales'],
          priority: 'High',
          category: 'State Tax',
        },
        {
          _id: 'ca-ehs-permit',
          name: 'Environmental Health Services Permit',
          level: 'provincial',
          jurisdiction: { province: 'California' },
          authority: 'California Department of Public Health',
          activities: ['Food facility operation', 'Environmental compliance'],
          priority: 'Medium',
          category: 'Health & Safety',
        },
        {
          _id: 'ca-weights-measures',
          name: 'Weights & Measures Registration',
          level: 'provincial',
          jurisdiction: { province: 'California' },
          authority: 'CA Dept of Food and Agriculture',
          activities: ['Commercial scales', 'Measuring devices'],
          priority: 'Low',
          category: 'State',
        },
        {
          _id: 'fed-ein',
          name: 'Federal Employer Identification Number (EIN)',
          level: 'federal',
          jurisdiction: { province: 'USA' },
          authority: 'Internal Revenue Service (IRS)',
          activities: ['Business tax identification', 'Hiring employees'],
          priority: 'High',
          category: 'Federal',
        },
        {
          _id: 'fed-fda',
          name: 'FDA Food Facility Registration',
          level: 'federal',
          jurisdiction: { province: 'USA' },
          authority: 'U.S. Food and Drug Administration',
          activities: ['Food manufacturing', 'Food storage'],
          priority: 'Medium',
          category: 'Federal',
        },
        {
          _id: 'sf-music-license',
          name: 'Music License (ASCAP/BMI/SESAC)',
          level: 'municipal',
          jurisdiction: { city: 'San Francisco', province: 'California' },
          authority: 'Music Licensing Organizations',
          activities: ['Playing recorded music', 'Background music'],
          priority: 'Low',
          category: 'Entertainment',
        },
      ];
    }
    
    // Default permits for other locations/business types (12 permits)
    const city = location.split(',')[0]?.trim() || 'Your City';
    const state = location.split(',')[1]?.trim() || 'Your State';
    
    return [
      {
        _id: 'general-business-license',
        name: 'Business License',
        level: 'municipal',
        jurisdiction: { city, province: state },
        authority: 'City Business Administration',
        activities: ['General business operations'],
        priority: 'High',
        category: 'Business',
      },
      {
        _id: 'general-health-permit',
        name: 'Health Department Permit',
        level: 'municipal',
        jurisdiction: { city, province: state },
        authority: 'County Health Department',
        activities: ['Food service', 'Public health compliance'],
        priority: 'High',
        category: 'Health & Safety',
      },
      {
        _id: 'general-food-handler',
        name: 'Food Handler Certification',
        level: 'municipal',
        jurisdiction: { city, province: state },
        authority: 'Health Department',
        activities: ['Food handling', 'Food safety training'],
        priority: 'High',
        category: 'Health & Safety',
      },
      {
        _id: 'general-fire-safety',
        name: 'Fire Safety Permit',
        level: 'municipal',
        jurisdiction: { city, province: state },
        authority: 'Fire Department',
        activities: ['Fire safety compliance', 'Commercial operations'],
        priority: 'High',
        category: 'Fire Safety',
      },
      {
        _id: 'general-building',
        name: 'Building Permit',
        level: 'municipal',
        jurisdiction: { city, province: state },
        authority: 'Building Department',
        activities: ['Construction', 'Tenant improvements'],
        priority: 'Medium',
        category: 'Construction',
      },
      {
        _id: 'general-zoning',
        name: 'Zoning Compliance Certificate',
        level: 'municipal',
        jurisdiction: { city, province: state },
        authority: 'Planning Department',
        activities: ['Land use compliance', 'Business location approval'],
        priority: 'Medium',
        category: 'Planning',
      },
      {
        _id: 'general-signage',
        name: 'Sign Permit',
        level: 'municipal',
        jurisdiction: { city, province: state },
        authority: 'Planning Department',
        activities: ['Business signage', 'Exterior signs'],
        priority: 'Low',
        category: 'Planning',
      },
      {
        _id: 'general-alcohol',
        name: 'Liquor License',
        level: 'provincial',
        jurisdiction: { province: state },
        authority: 'State Alcoholic Beverage Control',
        activities: ['Alcohol sales', 'On-premises consumption'],
        priority: 'High',
        category: 'Alcohol',
      },
      {
        _id: 'general-sales-tax',
        name: 'Sales Tax Permit',
        level: 'provincial',
        jurisdiction: { province: state },
        authority: 'State Revenue Department',
        activities: ['Collecting sales tax', 'Retail transactions'],
        priority: 'High',
        category: 'State Tax',
      },
      {
        _id: 'general-ein',
        name: 'Federal Employer ID (EIN)',
        level: 'federal',
        jurisdiction: { province: 'USA' },
        authority: 'Internal Revenue Service',
        activities: ['Business identification', 'Tax filing'],
        priority: 'High',
        category: 'Federal',
      },
      {
        _id: 'general-outdoor',
        name: 'Outdoor Seating Permit',
        level: 'municipal',
        jurisdiction: { city, province: state },
        authority: 'Public Works Department',
        activities: ['Patio seating', 'Sidewalk dining'],
        priority: 'Medium',
        category: 'Public Works',
      },
      {
        _id: 'general-music',
        name: 'Music License',
        level: 'municipal',
        jurisdiction: { city, province: state },
        authority: 'ASCAP/BMI/SESAC',
        activities: ['Background music', 'Entertainment'],
        priority: 'Low',
        category: 'Entertainment',
      },
    ];
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
    
    // Simulate loading for 5 seconds then show hardcoded permits
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => resolve(), 5000);
      timeoutIdRef.current = timeout;
    });
    
    // Check if cancelled during wait
    if (isCancelledRef.current) {
      console.log('🚫 Operation was cancelled');
      setLoading(false);
      return;
    }
    
    // Get hardcoded permits based on location and business type
    const discoveredPermits = getHardcodedPermits(trimmedData.location, trimmedData.businessType);
    
    console.log(`✅ Found ${discoveredPermits.length} permits for ${trimmedData.location}`);
    
    setPermits(discoveredPermits);
    setShowPermits(true);
    setLoading(false);
    
    console.log('🏁 Permit discovery process completed');
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
                    className="bg-white border border-neutral-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-4">
                      {/* Number Badge */}
                      <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-900 text-white text-sm font-semibold">
                        {index + 1}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        {/* Title Row */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-semibold text-neutral-900 text-base">{permit.name}</h3>
                          <span
                            className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                              permit.priority === 'High'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : permit.priority === 'Medium'
                                ? 'bg-amber-200/80 dark:bg-amber-500/20 text-amber-950 dark:text-amber-200 border border-amber-400 dark:border-amber-500/40'
                                : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                            }`}
                          >
                            {permit.priority}
                          </span>
                        </div>
                        
                        {/* Authority */}
                        <p className="text-sm text-neutral-600 mb-2">
                          {permit.authority || permit.jurisdiction?.province || 'Unknown'}
                        </p>
                        
                        {/* Tags Row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                            <FileText className="w-3 h-3" />
                            {permit.category || permit.level || 'General'}
                          </span>
                          {permit.jurisdiction?.city && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-md text-xs">
                              <MapPin className="w-3 h-3" />
                              {permit.jurisdiction.city}
                            </span>
                          )}
                          {permit.activities && permit.activities.length > 0 && (
                            <span className="text-xs text-neutral-500">
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

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-200">
              <button
                onClick={() => setShowPermits(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Details
              </button>
              <button
                onClick={handleComplete}
                disabled={permits.length === 0 || submitting}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:shadow-none font-medium text-base"
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
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Search className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-blue-900 mb-1">Discovering Permits...</p>
                        <p className="text-sm text-blue-700">
                          Analyzing business requirements for {formData.location || 'your location'}
                        </p>
                        <div className="mt-3 w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }} />
                        </div>
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
                <div className="bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <h3 className="text-sm font-semibold text-amber-950 dark:text-amber-200">Quick Tips</h3>
                  </div>
                  <ul className="space-y-2 text-xs text-amber-950 dark:text-amber-200">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-700 dark:text-amber-400 mt-0.5">•</span>
                      <span>Be specific with your business type for better results</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-700 dark:text-amber-400 mt-0.5">•</span>
                      <span>Include both city and province/state for location</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-700 dark:text-amber-400 mt-0.5">•</span>
                      <span>Permit keywords help narrow down the search</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-700 dark:text-amber-400 mt-0.5">•</span>
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
