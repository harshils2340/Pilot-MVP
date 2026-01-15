import { Sparkles, Plus, Building2, MapPin, CheckCircle2, Clock, ChevronRight, Loader2, ArrowRight, X, AlertCircle, FileText } from 'lucide-react';
import { useState } from 'react';

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

export function PermitDiscovery({ clientId, clientName, onAddPermits }: PermitDiscoveryProps) {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [discoveredPermits, setDiscoveredPermits] = useState<DiscoveredPermit[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Mock client context - would come from database
  const clientContext = {
    name: 'Urban Eats Restaurant Group',
    businessType: 'Restaurant',
    location: 'San Francisco, CA',
    existingActivities: ['Indoor dining', 'Food preparation', 'Alcohol service'],
    existingPermits: ['Business Operating Permit', 'Food Service Establishment Permit', 'Liquor License'],
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setHasAnalyzed(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      // Mock discovered permits based on "outdoor seating" example
      const permits: DiscoveredPermit[] = [
        {
          id: 'new-1',
          name: 'Sidewalk Cafe Permit',
          authority: 'SF Public Works Department',
          municipality: 'San Francisco',
          estimatedTime: '4-6 weeks',
          description: 'Required for outdoor seating on public sidewalk',
          reason: 'Outdoor seating on public property requires Public Works approval for sidewalk usage',
          dependencies: [],
          selected: true,
        },
        {
          id: 'new-2',
          name: 'Planning Department Conditional Use',
          authority: 'SF Planning Department',
          municipality: 'San Francisco',
          estimatedTime: '8-12 weeks',
          description: 'Conditional use authorization for outdoor dining',
          reason: 'Required for restaurants adding outdoor seating in commercial districts',
          dependencies: [],
          selected: true,
        },
        {
          id: 'new-3',
          name: 'Health Dept. Outdoor Service Approval',
          authority: 'SF Dept. of Public Health',
          municipality: 'San Francisco',
          estimatedTime: '2-3 weeks',
          description: 'Health inspection for outdoor food service area',
          reason: 'Outdoor food service areas require separate health department inspection and approval',
          dependencies: ['Sidewalk Cafe Permit'],
          selected: true,
        },
        {
          id: 'new-4',
          name: 'Alcohol Beverage Control - Outdoor Service',
          authority: 'California ABC',
          municipality: 'State of California',
          estimatedTime: '6-8 weeks',
          description: 'Amendment to existing liquor license for outdoor service',
          reason: 'Your existing liquor license needs to be amended to cover the outdoor seating area',
          dependencies: ['Sidewalk Cafe Permit', 'Planning Department Conditional Use'],
          selected: true,
        },
        {
          id: 'new-5',
          name: 'Fire Department Outdoor Seating Review',
          authority: 'SF Fire Department',
          municipality: 'San Francisco',
          estimatedTime: '2-3 weeks',
          description: 'Fire safety review for outdoor seating configuration',
          reason: 'Fire dept must review egress and emergency access with new outdoor layout',
          dependencies: [],
          selected: false,
        },
      ];
      
      setDiscoveredPermits(permits);
      setIsAnalyzing(false);
    }, 2000);
  };

  const togglePermit = (permitId: string) => {
    setDiscoveredPermits(discoveredPermits.map(p => 
      p.id === permitId ? { ...p, selected: !p.selected } : p
    ));
  };

  const handleAddToPermitPlan = () => {
    const selectedPermits = discoveredPermits.filter(p => p.selected);
    onAddPermits(selectedPermits);
    // Reset
    setInput('');
    setDiscoveredPermits([]);
    setHasAnalyzed(false);
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
                    disabled={discoveredPermits.filter(p => p.selected).length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    Add to Permit Plan
                    <ArrowRight className="w-4 h-4" />
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
