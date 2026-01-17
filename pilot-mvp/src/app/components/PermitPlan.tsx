import { Lock, Clock, CheckCircle2, AlertCircle, Send, ChevronRight, Plus, Search, Building2, User, Sparkles, X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Permit {
  id: string;
  name: string;
  authority: string;
  municipality: string;
  status: 'not-started' | 'submitted' | 'action-required' | 'approved';
  order: number;
  blockedBy?: string;
  blocks: string[];
  lastActivity: string;
  lastActivityDate: string;
  daysInState: number;
  assignee?: {
    name: string;
    initials: string;
    color: string;
  };
  priority?: 'high' | 'medium' | 'low';
}

interface DiscoveredPermit {
  id: string;
  name: string;
  authority: string;
  municipality: string;
  estimatedTime: string;
  description: string;
  reason: string;
}

const mockPermits: Permit[] = [
  {
    id: 'p1',
    name: "Seller's Permit",
    authority: 'California CDTFA',
    municipality: 'State of California',
    status: 'approved',
    order: 1,
    blocks: [],
    lastActivity: 'Approved',
    lastActivityDate: 'Nov 28, 2024',
    daysInState: 45,
    assignee: {
      name: 'Sarah Chen',
      initials: 'SC',
      color: 'bg-green-500',
    },
  },
  {
    id: 'p2',
    name: 'Food Service Establishment Permit',
    authority: 'SF Dept. of Public Health',
    municipality: 'San Francisco',
    status: 'submitted',
    order: 2,
    blocks: [],
    lastActivity: 'Awaiting city review',
    lastActivityDate: 'Dec 15, 2024',
    daysInState: 8,
    assignee: {
      name: 'Sarah Chen',
      initials: 'SC',
      color: 'bg-green-500',
    },
  },
  {
    id: 'p3',
    name: 'Health Department Plan Review',
    authority: 'SF Dept. of Public Health',
    municipality: 'San Francisco',
    status: 'action-required',
    order: 3,
    blocks: ['Business Operating Permit', 'Building Modification Permit'],
    lastActivity: 'City requested revisions',
    lastActivityDate: 'Dec 18, 2024',
    daysInState: 5,
    priority: 'high',
    assignee: {
      name: 'Sarah Chen',
      initials: 'SC',
      color: 'bg-green-500',
    },
  },
  {
    id: 'p4',
    name: 'Business Operating Permit',
    authority: 'City of San Francisco',
    municipality: 'San Francisco',
    status: 'not-started',
    order: 4,
    blockedBy: 'Health Department Plan Review',
    blocks: ['Building Modification Permit'],
    lastActivity: 'Blocked',
    lastActivityDate: 'Dec 5, 2024',
    daysInState: 18,
    assignee: {
      name: 'Michael Park',
      initials: 'MP',
      color: 'bg-blue-500',
    },
  },
  {
    id: 'p5',
    name: 'Building Modification Permit',
    authority: 'SF Dept. of Building Inspection',
    municipality: 'San Francisco',
    status: 'not-started',
    order: 5,
    blockedBy: 'Business Operating Permit',
    blocks: ['Fire Department Inspection'],
    lastActivity: 'Blocked',
    lastActivityDate: 'Dec 5, 2024',
    daysInState: 18,
    assignee: {
      name: 'Michael Park',
      initials: 'MP',
      color: 'bg-blue-500',
    },
  },
  {
    id: 'p6',
    name: 'Fire Department Inspection',
    authority: 'San Francisco Fire Department',
    municipality: 'San Francisco',
    status: 'not-started',
    order: 6,
    blockedBy: 'Building Modification Permit',
    blocks: [],
    lastActivity: 'Blocked',
    lastActivityDate: 'Dec 5, 2024',
    daysInState: 18,
  },
];

interface PermitPlanProps {
  clientId: string | null;
  clientName: string;
  onSelectPermit: (permitId: string) => void;
}

export function PermitPlan({ clientId, clientName, onSelectPermit }: PermitPlanProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPermit, setShowAddPermit] = useState(false);
  const [discoveryInput, setDiscoveryInput] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredPermits, setDiscoveredPermits] = useState<DiscoveredPermit[]>([]);
  const [expandedPermit, setExpandedPermit] = useState<string | null>(null);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch permits for this client
  useEffect(() => {
    const fetchPermits = async () => {
      if (!clientId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(`🔍 PermitPlan: Fetching permits for clientId: ${clientId}`);
        const res = await fetch(`/api/permits/management?clientId=${clientId}`);
        if (res.ok) {
          const data = await res.json();
          console.log(`✅ PermitPlan: Received ${data.length} permits for client ${clientId}`);
          // Transform API response to Permit format
          const transformedPermits: Permit[] = data.map((p: any, index: number) => ({
            id: p.id || p._id?.toString() || `perm-${index}`,
            name: p.name,
            authority: p.authority,
            municipality: p.municipality || p.category || 'Unknown',
            status: p.status || 'not-started',
            order: p.order || index + 1,
            blockedBy: p.blockedBy,
            blocks: p.blocks || [],
            lastActivity: p.lastActivity || 'Not Started',
            lastActivityDate: p.lastActivityDate ? new Date(p.lastActivityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            daysInState: p.lastActivityDate ? Math.floor((Date.now() - new Date(p.lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
            priority: p.complexity === 'high' ? 'high' : p.complexity === 'medium' ? 'medium' : 'low',
          }));
          setPermits(transformedPermits);
        } else {
          console.error('Failed to fetch permits:', res.statusText);
          // Fallback to empty array if fetch fails
          setPermits([]);
        }
      } catch (error) {
        console.error('Error fetching permits:', error);
        setPermits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermits();
  }, [clientId]);

  const handleDiscoverPermits = () => {
    if (!discoveryInput.trim()) return;
    
    setIsDiscovering(true);
    
    // Simulate AI discovery
    setTimeout(() => {
      const permits: DiscoveredPermit[] = [
        {
          id: 'new-1',
          name: 'Sidewalk Cafe Permit',
          authority: 'SF Public Works Department',
          municipality: 'San Francisco',
          estimatedTime: '4-6 weeks',
          description: 'Required for outdoor seating on public sidewalk',
          reason: 'Outdoor seating on public property requires Public Works approval',
        },
        {
          id: 'new-2',
          name: 'Planning Department Conditional Use',
          authority: 'SF Planning Department',
          municipality: 'San Francisco',
          estimatedTime: '8-12 weeks',
          description: 'Conditional use authorization for outdoor dining',
          reason: 'Required for restaurants adding outdoor seating in commercial districts',
        },
      ];
      
      setDiscoveredPermits(permits);
      setIsDiscovering(false);
    }, 1500);
  };

  const handleAddDiscoveredPermit = (permit: DiscoveredPermit) => {
    // Add permit to list
    console.log('Adding permit:', permit);
    // Reset discovery
    setDiscoveredPermits(discoveredPermits.filter(p => p.id !== permit.id));
    if (discoveredPermits.length === 1) {
      setShowAddPermit(false);
      setDiscoveryInput('');
    }
  };

  const getStatusConfig = (status: Permit['status']) => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: 'Approved',
          className: 'text-green-700',
        };
      case 'submitted':
        return {
          icon: <Send className="w-3.5 h-3.5" />,
          label: 'Submitted',
          className: 'text-blue-700',
        };
      case 'action-required':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          label: 'Action Required',
          className: 'text-red-700',
        };
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5" />,
          label: 'Not Started',
          className: 'text-neutral-500',
        };
    }
  };

  const filteredPermits = permits.filter((permit) =>
    permit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    permit.authority.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 px-6 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">Permit Plan</h1>
            <p className="text-xs text-neutral-500">{clientName && clientName !== clientId ? clientName : 'Client'}</p>
          </div>
          <button 
            onClick={() => setShowAddPermit(!showAddPermit)}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Permit
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search permits..."
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent focus:bg-white transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <span>{filteredPermits.length} permits</span>
            <span className="text-neutral-300">•</span>
            <span className="text-red-600 font-medium">{filteredPermits.filter(p => p.status === 'action-required').length} need action</span>
          </div>
        </div>
      </div>

      {/* Add Permit Discovery */}
      {showAddPermit && (
        <div className="border-b border-neutral-200 bg-blue-50 px-6 py-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-2" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-neutral-900 mb-1">Discover New Permits</h3>
              <p className="text-xs text-neutral-600 mb-3">
                Tell us what you want to add or change for {clientName}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discoveryInput}
                  onChange={(e) => setDiscoveryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDiscoverPermits()}
                  placeholder="e.g., Add outdoor seating, Install new HVAC..."
                  className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                />
                <button
                  onClick={handleDiscoverPermits}
                  disabled={!discoveryInput.trim() || isDiscovering}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDiscovering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Finding...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Discover
                    </>
                  )}
                </button>
              </div>

              {/* Discovered Permits */}
              {discoveredPermits.length > 0 && (
                <div className="mt-3 space-y-2">
                  {discoveredPermits.map((permit) => (
                    <div key={permit.id} className="bg-white border border-neutral-200 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-neutral-900 mb-1">{permit.name}</h4>
                          <p className="text-xs text-neutral-600 mb-2">{permit.description}</p>
                          <div className="flex items-center gap-3 text-xs text-neutral-500">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              <span>{permit.authority}</span>
                            </div>
                            <span className="text-neutral-300">•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{permit.estimatedTime}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddDiscoveredPermit(permit)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-md hover:bg-neutral-800 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setShowAddPermit(false);
                setDiscoveryInput('');
                setDiscoveredPermits([]);
              }}
              className="p-1 hover:bg-blue-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-neutral-600" />
            </button>
          </div>
        </div>
      )}

      {/* Permit List */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-1.5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
              <span className="ml-2 text-sm text-neutral-500">Loading permits...</span>
            </div>
          ) : filteredPermits.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <p className="text-sm">No permits found for this client.</p>
              <p className="text-xs mt-1">Use "Discover New Permits" to find and add permits.</p>
            </div>
          ) : (
            filteredPermits.map((permit) => {
            const statusConfig = getStatusConfig(permit.status);
            const isBlocked = !!permit.blockedBy;
            
            return (
              <div
                key={permit.id}
                onClick={() => !isBlocked && onSelectPermit(permit.id)}
                className={`group relative bg-white border rounded-lg transition-all ${
                  isBlocked
                    ? 'border-neutral-200 opacity-60 cursor-not-allowed'
                    : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm cursor-pointer'
                } ${permit.priority === 'high' && !isBlocked ? 'border-l-4 border-l-red-500' : ''}`}
              >
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Order Number */}
                    <div className="flex-shrink-0">
                      <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold ${
                        isBlocked ? 'bg-neutral-100 text-neutral-400' : 'bg-neutral-900 text-white'
                      }`}>
                        {permit.order}
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title Row */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-medium text-sm text-neutral-900 leading-tight">
                          {permit.name}
                        </h3>
                        {!isBlocked && (
                          <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-600 transition-colors flex-shrink-0" />
                        )}
                      </div>

                      {/* Authority */}
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-2">
                        <Building2 className="w-3 h-3" />
                        <span>{permit.authority}</span>
                        <span className="text-neutral-300">•</span>
                        <span>{permit.municipality}</span>
                      </div>

                      {/* Status Row */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`flex items-center gap-1 ${statusConfig.className}`}>
                          {statusConfig.icon}
                          <span className="text-xs font-medium">{statusConfig.label}</span>
                        </div>
                        <span className="text-xs text-neutral-400">•</span>
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                          <Clock className="w-3 h-3" />
                          <span>{permit.lastActivity}</span>
                        </div>
                        <span className="text-xs text-neutral-400">•</span>
                        <span className="text-xs text-neutral-500">{permit.lastActivityDate}</span>
                      </div>

                      {/* Blocker */}
                      {isBlocked && (
                        <div className="flex items-center gap-1.5 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Blocked by <span className="font-medium">{permit.blockedBy}</span></span>
                        </div>
                      )}

                      {/* Blocking */}
                      {permit.blocks.length > 0 && !isBlocked && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <Lock className="w-3 h-3" />
                          <span>Blocking {permit.blocks.length} permit{permit.blocks.length > 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* Assignee */}
                    {permit.assignee && (
                      <div className="flex-shrink-0">
                        <div className={`w-6 h-6 rounded-full ${permit.assignee.color} text-white text-xs font-medium flex items-center justify-center`}>
                          {permit.assignee.initials}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>
    </div>
  );
}