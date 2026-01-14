'use client';

import { useState } from 'react';
import { ArrowRight, ArrowLeft, Building2, MapPin, Briefcase, FileText, CheckCircle2, Loader2 } from 'lucide-react';

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
  const [permits, setPermits] = useState<Permit[]>([]);
  const [formData, setFormData] = useState<BusinessFormData>({
    businessName: '',
    location: '',
    businessType: '',
    permitKeywords: '',
  });

  const handleInputChange = (field: keyof BusinessFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFindPermits = async () => {
    setLoading(true);
    console.log('🔍 Starting permit discovery...');
    console.log('📋 Form data:', formData);
    
    let scrapingStarted = false;
    let permitsFromResponse: Permit[] = [];
    
    try {
      // Call BizPaL scraping API with a longer timeout
      console.log('📡 Calling BizPaL scraping API...');
      console.log('⏳ This may take several minutes. Please wait...');
      
      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000); // 30 minute timeout
      
      try {
        const response = await fetch('/api/bizpal/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: formData.location,
            businessType: formData.businessType,
            permitKeywords: formData.permitKeywords,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            const text = await response.text();
            console.error('❌ API Error - Response text:', text);
            throw new Error(`Server error (${response.status}): ${text || 'Unknown error'}`);
          }
          console.error('❌ API Error:', errorData);
          throw new Error(errorData.error || errorData.details || 'Failed to fetch permits');
        }

        let data;
        try {
          data = await response.json();
        } catch (e) {
          const text = await response.text();
          console.error('❌ Failed to parse JSON response:', text);
          throw new Error('Invalid response from server');
        }
        
        scrapingStarted = true;
        console.log('✅ API Response received:', data);
        console.log(`📊 Found ${data.totalFound} permits, saved ${data.totalSaved} to database`);
        
        // Transform permits to match our display format
        permitsFromResponse = data.permits.map((p: any, index: number) => ({
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
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // If it's an abort (timeout) or network error, try fetching from database
        if (fetchError.name === 'AbortError' || fetchError.message.includes('fetch')) {
          console.log('⏱️ Request timed out or failed. Fetching permits from database...');
          scrapingStarted = true; // Assume scraping may have completed
          
          // Wait a bit for scraping to potentially complete, then fetch from database
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Try to fetch permits from database
          try {
            const dbResponse = await fetch('/api/permits');
            if (dbResponse.ok) {
              const dbPermits = await dbResponse.json();
              console.log(`📊 Fetched ${dbPermits.length} permits from database`);
              
              // Filter permits that match the business type or location
              const relevantPermits = dbPermits
                .filter((p: any) => {
                  const nameMatch = p.name?.toLowerCase().includes(formData.businessType.toLowerCase()) ||
                                   p.name?.toLowerCase().includes(formData.location.toLowerCase());
                  const activityMatch = p.activities?.some((a: string) => 
                    a.toLowerCase().includes(formData.businessType.toLowerCase())
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
                // If no relevant permits found, show all recent permits
                permitsFromResponse = dbPermits.slice(0, 20).map((p: any, index: number) => ({
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
      console.error('❌ Error fetching permits:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      
      // If scraping started but no permits found, suggest checking database
      if (scrapingStarted) {
        alert(`Scraping completed but no permits were returned. The permits may have been saved to the database. Please check the permit management page or try again. Error: ${errorMessage}`);
      } else {
        alert(`Failed to start permit discovery: ${errorMessage}. Check the browser console and server logs for details.`);
      }
    } finally {
      setLoading(false);
      console.log('🏁 Permit discovery process completed');
    }
  };

  const handleComplete = async () => {
    // Create client in MongoDB
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

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });

      if (res.ok) {
        const newClient = await res.json();
        onComplete(newClient);
      } else {
        console.error('Failed to create client');
        onComplete({ ...formData, permits });
      }
    } catch (err) {
      console.error('Error creating client:', err);
      onComplete({ ...formData, permits });
    }
  };

  const isStep1Valid = formData.businessName && formData.location && formData.businessType;

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
                disabled={permits.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
              >
                Add Client to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
          <Building2 className="w-4 h-4" />
          <span>New Client Setup</span>
        </div>
        <h1 className="text-neutral-900 mb-1">Add New Client</h1>
        <p className="text-neutral-600">Tell us about the business to discover required permits</p>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Business Name *
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="e.g., Riverside Coffee Co."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Where is your business located? *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="Ex: Ottawa, Ontario"
            />
            <p className="text-xs text-neutral-500 mt-1.5">Enter city and province/state</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              What type of business is it? *
            </label>
            <input
              type="text"
              value={formData.businessType}
              onChange={(e) => handleInputChange('businessType', e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="Ex: restaurant business"
            />
            <p className="text-xs text-neutral-500 mt-1.5">Describe the type of business</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              What type of permits and licences are you looking for? (Optional)
            </label>
            <textarea
              value={formData.permitKeywords}
              onChange={(e) => handleInputChange('permitKeywords', e.target.value)}
              rows={3}
              maxLength={200}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
              placeholder="Ex: zoning and land use, food service permits"
            />
            <p className="text-xs text-neutral-500 mt-1.5">
              {formData.permitKeywords.length}/200 characters
            </p>
          </div>

          <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
            <p className="text-sm text-neutral-600">
              <span className="font-medium text-neutral-900">Ready to find permits?</span> We'll analyze your business details using BizPaL and identify all required permits and licenses for your jurisdiction.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t border-neutral-200 px-8 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </button>

          <button
            onClick={handleFindPermits}
            disabled={!isStep1Valid || loading}
            className="flex items-center gap-2 px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
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
