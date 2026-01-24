import { Sparkles, Plus, Building2, MapPin, CheckCircle2, Clock, ChevronRight, Loader2, ArrowRight, X, AlertCircle, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DiscoveredPermit {
  id: string;
  name: string;
  authority: string;
  municipality: string;
  estimatedTime: string;
  description: string;
  reason: string;
  dependencies?: string[];
  selected: boolean;
}

interface PermitDiscoveryProps {
  clientId: string;
  clientName: string;
  onAddPermits: (permits: DiscoveredPermit[]) => void;
}

// Jurisdiction-specific discovered permits for different activities
const JURISDICTION_DISCOVERED_PERMITS: Record<string, Record<string, DiscoveredPermit[]>> = {
  'San Francisco': {
    'outdoor': [
      { id: 'sf-out-1', name: 'Sidewalk Cafe Permit', authority: 'SF Public Works Department', municipality: 'San Francisco', estimatedTime: '4-6 weeks', description: 'Required for outdoor seating on public sidewalk', reason: 'Outdoor seating on public property requires Public Works approval', dependencies: [], selected: true },
      { id: 'sf-out-2', name: 'Planning Department Conditional Use', authority: 'SF Planning Department', municipality: 'San Francisco', estimatedTime: '8-12 weeks', description: 'Conditional use authorization for outdoor dining', reason: 'Required for restaurants adding outdoor seating in commercial districts', dependencies: [], selected: true },
      { id: 'sf-out-3', name: 'Health Dept. Outdoor Service Approval', authority: 'SF Dept. of Public Health', municipality: 'San Francisco', estimatedTime: '2-3 weeks', description: 'Health inspection for outdoor food service area', reason: 'Outdoor food service areas require separate health department inspection', dependencies: ['Sidewalk Cafe Permit'], selected: true },
      { id: 'sf-out-4', name: 'Fire Department Outdoor Seating Review', authority: 'SF Fire Department', municipality: 'San Francisco', estimatedTime: '2-3 weeks', description: 'Fire safety review for outdoor seating configuration', reason: 'Fire dept must review egress and emergency access with new outdoor layout', dependencies: [], selected: false },
    ],
    'alcohol': [
      { id: 'sf-alc-1', name: 'Type 47 Liquor License (On-Sale General)', authority: 'California ABC', municipality: 'State of California', estimatedTime: '6-8 weeks', description: 'Full liquor license for restaurant serving all types of alcohol', reason: 'Required for serving distilled spirits, beer, and wine', dependencies: [], selected: true },
      { id: 'sf-alc-2', name: 'Planning Department CU Approval', authority: 'SF Planning Department', municipality: 'San Francisco', estimatedTime: '8-12 weeks', description: 'Conditional use for alcohol sales', reason: 'San Francisco requires CU approval for alcohol service in most zoning districts', dependencies: [], selected: true },
    ],
    'default': [
      { id: 'sf-def-1', name: 'Business Tax Registration Certificate', authority: 'SF Office of the Treasurer', municipality: 'San Francisco', estimatedTime: '1-2 weeks', description: 'Required for all businesses operating in SF', reason: 'All businesses in San Francisco must register for business taxes', dependencies: [], selected: true },
    ],
  },
  'Calgary': {
    'outdoor': [
      { id: 'cal-out-1', name: 'Sidewalk Patio Permit', authority: 'City of Calgary Roads', municipality: 'Calgary', estimatedTime: '4-6 weeks', description: 'Required for outdoor seating on public sidewalk', reason: 'Outdoor patios on city property require Roads department approval', dependencies: [], selected: true },
      { id: 'cal-out-2', name: 'Development Permit Amendment', authority: 'City of Calgary Planning', municipality: 'Calgary', estimatedTime: '6-8 weeks', description: 'Amendment for outdoor dining area', reason: 'Adding patio seating may require zoning amendment', dependencies: [], selected: true },
    ],
    'alcohol': [
      { id: 'cal-alc-1', name: 'Liquor Licence', authority: 'AGLC (Alberta Gaming & Liquor)', municipality: 'Alberta', estimatedTime: '4-6 weeks', description: 'Provincial liquor licence', reason: 'Required for serving alcohol in Alberta', dependencies: [], selected: true },
    ],
    'default': [
      { id: 'cal-def-1', name: 'Business Licence Amendment', authority: 'City of Calgary', municipality: 'Calgary', estimatedTime: '1-2 weeks', description: 'Amendment to existing business licence', reason: 'Business activities may require licence updates', dependencies: [], selected: true },
    ],
  },
  'Toronto': {
    'outdoor': [
      { id: 'tor-out-1', name: 'Cafe TO Permit', authority: 'City of Toronto Transportation', municipality: 'Toronto', estimatedTime: '2-4 weeks', description: 'Permit for curb lane or sidewalk patio', reason: 'Required for outdoor dining on city property', dependencies: [], selected: true },
      { id: 'tor-out-2', name: 'DineSafe Inspection', authority: 'Toronto Public Health', municipality: 'Toronto', estimatedTime: '1-2 weeks', description: 'Health inspection for outdoor service area', reason: 'All food service areas require health inspection', dependencies: [], selected: true },
    ],
    'alcohol': [
      { id: 'tor-alc-1', name: 'Liquor Licence', authority: 'AGCO (Alcohol & Gaming Commission)', municipality: 'Ontario', estimatedTime: '6-8 weeks', description: 'Provincial liquor licence', reason: 'Required for serving alcohol in Ontario', dependencies: [], selected: true },
    ],
    'default': [
      { id: 'tor-def-1', name: 'Business Licence Amendment', authority: 'City of Toronto Municipal Licensing', municipality: 'Toronto', estimatedTime: '1-2 weeks', description: 'Amendment to existing business licence', reason: 'Business activities may require licence updates', dependencies: [], selected: true },
    ],
  },
};

function getDiscoveredPermitsForJurisdiction(jurisdiction: string, activityQuery: string): DiscoveredPermit[] {
  const jurisdictionLower = jurisdiction.toLowerCase();
  const queryLower = activityQuery.toLowerCase();
  
  // Determine which jurisdiction permits to use
  let jurisdictionKey = 'San Francisco'; // default
  if (jurisdictionLower.includes('calgary')) jurisdictionKey = 'Calgary';
  else if (jurisdictionLower.includes('toronto')) jurisdictionKey = 'Toronto';
  else if (jurisdictionLower.includes('san francisco') || jurisdictionLower.includes('sf')) jurisdictionKey = 'San Francisco';
  
  const jurisdictionPermits = JURISDICTION_DISCOVERED_PERMITS[jurisdictionKey] || JURISDICTION_DISCOVERED_PERMITS['San Francisco'];
  
  // Determine activity type from query
  let activityKey = 'default';
  if (queryLower.includes('outdoor') || queryLower.includes('patio') || queryLower.includes('seating')) activityKey = 'outdoor';
  else if (queryLower.includes('alcohol') || queryLower.includes('liquor') || queryLower.includes('bar') || queryLower.includes('beer') || queryLower.includes('wine')) activityKey = 'alcohol';
  
  return jurisdictionPermits[activityKey] || jurisdictionPermits['default'] || [];
}

export function PermitDiscovery({ clientId, clientName, onAddPermits }: PermitDiscoveryProps) {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [discoveredPermits, setDiscoveredPermits] = useState<DiscoveredPermit[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [clientJurisdiction, setClientJurisdiction] = useState('San Francisco');

  // Fetch client jurisdiction on mount
  useEffect(() => {
    const fetchClientInfo = async () => {
      if (!clientId) return;
      try {
        const res = await fetch(`/api/clients/${clientId}`);
        if (res.ok) {
          const data = await res.json();
          const jurisdiction = data.jurisdiction || data.client?.jurisdiction || 'San Francisco';
          setClientJurisdiction(jurisdiction);
          console.log(`📍 PermitDiscovery: Client jurisdiction is ${jurisdiction}`);
        }
      } catch (error) {
        console.error('Error fetching client info:', error);
      }
    };
    fetchClientInfo();
  }, [clientId]);

  // Client context derived from actual client data
  const clientContext = {
    name: clientName,
    businessType: 'Restaurant',
    location: clientJurisdiction,
    existingActivities: ['Indoor dining', 'Food preparation'],
    existingPermits: [],
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setHasAnalyzed(true);
    
    // Get permits based on jurisdiction and query
    setTimeout(() => {
      const permits = getDiscoveredPermitsForJurisdiction(clientJurisdiction, input);
      console.log(`🔍 Discovered ${permits.length} permits for ${clientJurisdiction} based on query: "${input}"`);
      setDiscoveredPermits(permits);
      setIsAnalyzing(false);
    }, 1500);
  };

  const togglePermit = (permitId: string) => {
    setDiscoveredPermits(discoveredPermits.map(p => 
      p.id === permitId ? { ...p, selected: !p.selected } : p
    ));
  };

  const handleAddToPermitPlan = async () => {
    const selectedPermits = discoveredPermits.filter(p => p.selected);
    
    if (!clientId || selectedPermits.length === 0) {
      return;
    }

    setIsAdding(true);
    
    try {
      // Save each permit to the database
      const savePromises = selectedPermits.map(async (permit) => {
        const response = await fetch(`/api/clients/${encodeURIComponent(clientId)}/permits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: permit.name,
            authority: permit.authority,
            municipality: permit.municipality,
            complexity: 'medium', // Default complexity for discovered permits
            estimatedTime: permit.estimatedTime,
            description: permit.description,
            category: permit.municipality.includes('State') ? 'State' : 'Municipal',
            status: 'not-started',
            order: 0,
            lastActivity: 'Added from discovery',
            lastActivityDate: new Date(),
            requirements: permit.dependencies || [],
            fees: 'N/A',
            purpose: permit.reason,
            howToApply: 'Contact the issuing authority',
            contactInfo: {},
            additionalNotes: '',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to add ${permit.name}`);
        }

        return response.json();
      });

      await Promise.all(savePromises);
      
      // Call the callback to notify parent component
      onAddPermits(selectedPermits);
      
      // Reset
      setInput('');
      setDiscoveredPermits([]);
      setHasAnalyzed(false);
    } catch (error: any) {
      console.error('Error adding permits:', error);
      alert(`Failed to add permits: ${error.message || 'Unknown error'}`);
    } finally {
      setIsAdding(false);
    }
  };

  const suggestedPrompts = [
    'Add outdoor seating',
    'Start live music performances',
    'Add a bar area',
    'Expand to delivery kitchen',
    'Install new HVAC system',
  ];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900 mb-1">Permit Discovery</h1>
            <p className="text-sm text-neutral-500">{clientContext.name}</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">AI-Powered Analysis</span>
          </div>
        </div>
      </div>

      {/* Client Context */}
      <div className="border-b border-neutral-200 px-6 py-4 bg-neutral-50">
        <div className="flex items-start gap-6">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-neutral-500" />
            <div>
              <p className="text-xs text-neutral-500">Business Type</p>
              <p className="text-sm font-medium text-neutral-900">{clientContext.businessType}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-neutral-500" />
            <div>
              <p className="text-xs text-neutral-500">Location</p>
              <p className="text-sm font-medium text-neutral-900">{clientContext.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-neutral-500" />
            <div>
              <p className="text-xs text-neutral-500">Active Permits</p>
              <p className="text-sm font-medium text-neutral-900">{clientContext.existingPermits.length} permits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          
          {/* Input Section */}
          {!hasAnalyzed ? (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-neutral-600" />
                </div>
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                  What do you want to do?
                </h2>
                <p className="text-neutral-600 max-w-md mx-auto">
                  Describe what you want to add or change, and we'll discover what permits and approvals you need.
                </p>
              </div>

              {/* Input */}
              <div className="bg-white border-2 border-neutral-200 rounded-xl p-6 shadow-sm">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={4}
                  className="w-full px-0 py-0 border-0 text-lg focus:outline-none focus:ring-0 resize-none placeholder:text-neutral-400"
                  placeholder="e.g., Add outdoor seating on the sidewalk..."
                />
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-200">
                  <p className="text-xs text-neutral-500">
                    We'll analyze your request against {clientContext.location} regulations
                  </p>
                  <button
                    onClick={handleAnalyze}
                    disabled={!input.trim() || isAnalyzing}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Discover Permits
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Suggested Prompts */}
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-3">Common additions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInput(prompt)}
                      className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Example Context */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-1">Context-Aware Discovery</p>
                    <p className="text-sm text-blue-700">
                      We already know you're a {clientContext.businessType.toLowerCase()} in {clientContext.location} with {clientContext.existingPermits.length} active permits. 
                      Our AI will only discover <strong>new permits</strong> you need for this change.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 mb-1">
                    Discovered {discoveredPermits.length} Required Permits
                  </h2>
                  <p className="text-sm text-neutral-600">
                    For: <span className="font-medium">{input}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setHasAnalyzed(false);
                    setDiscoveredPermits([]);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Start Over
                </button>
              </div>

              {/* Analysis Summary */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 mb-2">Analysis Complete</p>
                    <p className="text-sm text-green-700 mb-3">
                      Based on your existing {clientContext.businessType.toLowerCase()} permits in {clientContext.location}, 
                      adding outdoor seating requires {discoveredPermits.filter(p => p.selected).length} new permits and approvals.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-green-700">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Estimated total timeline: 8-12 weeks (longest permit dependency)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Discovered Permits */}
              <div className="space-y-3">
                {discoveredPermits.map((permit, index) => (
                  <div
                    key={permit.id}
                    className={`border-2 rounded-lg p-5 transition-all ${
                      permit.selected
                        ? 'border-neutral-900 bg-neutral-50'
                        : 'border-neutral-200 bg-white opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => togglePermit(permit.id)}
                        className="mt-1 flex-shrink-0"
                      >
                        {permit.selected ? (
                          <div className="w-5 h-5 bg-neutral-900 rounded border-2 border-neutral-900 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 bg-white rounded border-2 border-neutral-300 hover:border-neutral-400 transition-colors" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-neutral-500">#{index + 1}</span>
                              <h3 className="text-base font-semibold text-neutral-900">{permit.name}</h3>
                            </div>
                            <p className="text-sm text-neutral-600">{permit.description}</p>
                          </div>
                        </div>

                        {/* Why this is needed */}
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-xs font-medium text-blue-900 mb-1">Why this is required:</p>
                          <p className="text-xs text-blue-700">{permit.reason}</p>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-neutral-200">
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Issuing Authority</p>
                            <p className="text-sm font-medium text-neutral-900">{permit.authority}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Estimated Timeline</p>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-neutral-500" />
                              <p className="text-sm font-medium text-neutral-900">{permit.estimatedTime}</p>
                            </div>
                          </div>
                        </div>

                        {/* Dependencies */}
                        {permit.dependencies && permit.dependencies.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-neutral-200">
                            <p className="text-xs font-medium text-neutral-700 mb-2">Dependencies:</p>
                            <div className="flex flex-wrap gap-2">
                              {permit.dependencies.map((dep, idx) => (
                                <span key={idx} className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded border border-amber-200">
                                  Requires: {dep}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Bar */}
              <div className="sticky bottom-0 bg-white border-t-2 border-neutral-200 p-4 -mx-6 -mb-6 mt-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {discoveredPermits.filter(p => p.selected).length} of {discoveredPermits.length} permits selected
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      These will be added to the permit plan for {clientContext.name}
                    </p>
                  </div>
                  <button
                    onClick={handleAddToPermitPlan}
                    disabled={discoveredPermits.filter(p => p.selected).length === 0 || isAdding}
                    className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        Add to Permit Plan
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
