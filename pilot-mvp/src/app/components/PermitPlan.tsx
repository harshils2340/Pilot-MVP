import { Lock, Clock, CheckCircle2, AlertCircle, Send, ChevronRight, Plus, Search, Building2, User, Sparkles, X, Loader2, Info } from 'lucide-react';
import { useState, useEffect } from 'react';

type PermitStatus = 'not-started' | 'in-progress' | 'submitted' | 'action-required' | 'approved';

interface Permit {
  id: string;
  name: string;
  authority: string;
  municipality: string;
  status: PermitStatus;
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

  // Fetch permits from Mongo for this client
  useEffect(() => {
    const fetchPermits = async () => {
      if (!clientId) {
        setPermits([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(`Fetching permit plan from Mongo for client ${clientId}`);

        const response = await fetch(`/api/permits/management?clientId=${encodeURIComponent(clientId)}`);
        if (!response.ok) {
          throw new Error(`Permit fetch failed with status ${response.status}`);
        }

        const payload: unknown = await response.json();
        const apiPermits = Array.isArray(payload) ? payload : [];

        const normalized: Permit[] = apiPermits
          .map((permit: any, index: number) => {
            const rawStatus = typeof permit.status === 'string' ? permit.status : 'not-started';
            const status: PermitStatus =
              rawStatus === 'not-started' ||
              rawStatus === 'in-progress' ||
              rawStatus === 'submitted' ||
              rawStatus === 'action-required' ||
              rawStatus === 'approved'
                ? rawStatus
                : 'not-started';

            const timestamp =
              typeof permit.lastActivityDate === 'string' || permit.lastActivityDate instanceof Date
                ? new Date(permit.lastActivityDate)
                : null;
            const hasValidTimestamp = Boolean(timestamp && !Number.isNaN(timestamp.getTime()));

            const daysInState = hasValidTimestamp
              ? Math.max(
                  0,
                  Math.floor((Date.now() - (timestamp as Date).getTime()) / (1000 * 60 * 60 * 24))
                )
              : 0;

            const priority: 'high' | 'medium' | 'low' =
              status === 'action-required' ? 'high' : status === 'approved' ? 'low' : 'medium';

            return {
              id:
                typeof permit.id === 'string'
                  ? permit.id
                  : typeof permit._id === 'string'
                    ? permit._id
                    : `permit-${index}`,
              name: typeof permit.name === 'string' ? permit.name : 'Unnamed Permit',
              authority: typeof permit.authority === 'string' ? permit.authority : 'Unknown Authority',
              municipality: typeof permit.municipality === 'string' ? permit.municipality : 'Unknown',
              status,
              order: typeof permit.order === 'number' ? permit.order : index + 1,
              blockedBy: typeof permit.blockedBy === 'string' ? permit.blockedBy : undefined,
              blocks: Array.isArray(permit.blocks)
                ? permit.blocks.filter((block: unknown): block is string => typeof block === 'string')
                : [],
              lastActivity:
                typeof permit.lastActivity === 'string'
                  ? permit.lastActivity
                  : status === 'approved'
                    ? 'Approved'
                    : status === 'action-required'
                      ? 'Action Required'
                      : 'Not Started',
              lastActivityDate: hasValidTimestamp
                ? (timestamp as Date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'N/A',
              daysInState,
              priority,
            };
          })
          .sort((a, b) => a.order - b.order);

        setPermits(normalized);
        console.log(`Loaded ${normalized.length} permit(s) for client ${clientId}`);
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
          className: 'text-foreground',
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
          className: 'text-muted-foreground',
        };
    }
  };

  const filteredPermits = permits.filter((permit) =>
    permit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    permit.authority.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="border-b border-border px-6 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Permit Plan</h1>
            <p className="text-xs text-muted-foreground">{clientName && clientName !== clientId ? clientName : 'Client'}</p>
          </div>
          <button 
            onClick={() => setShowAddPermit(!showAddPermit)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Permit
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search permits..."
              className="w-full pl-9 pr-3 py-1.5 bg-muted/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent focus:bg-background transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{filteredPermits.length} permits</span>
            <span className="text-muted-foreground/60">•</span>
            <span className="text-red-600 font-medium">{filteredPermits.filter(p => p.status === 'action-required').length} need action</span>
          </div>
        </div>
      </div>

      {/* Add Permit Discovery */}
      {showAddPermit && (
        <div className="border-b border-border bg-primary/5 px-6 py-4">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-2" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-foreground mb-1">Discover New Permits</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Tell us what you want to add or change for {clientName}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discoveryInput}
                  onChange={(e) => setDiscoveryInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDiscoverPermits()}
                  placeholder="e.g., Add outdoor seating, Install new HVAC..."
                  className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
                <button
                  onClick={handleDiscoverPermits}
                  disabled={!discoveryInput.trim() || isDiscovering}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div key={permit.id} className="bg-surface border border-border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-foreground mb-1">{permit.name}</h4>
                          <p className="text-xs text-muted-foreground mb-2">{permit.description}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              <span>{permit.authority}</span>
                            </div>
                            <span className="text-muted-foreground/60">•</span>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{permit.estimatedTime}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddDiscoveredPermit(permit)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:opacity-90 transition-colors"
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
              className="p-1 hover:bg-accent rounded transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* Permit List */}
      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-1.5">
          {!loading && filteredPermits.length > 0 && (
            <div className="flex items-start gap-2 px-2 py-2 mb-2 bg-muted/30 border border-border rounded-lg">
              <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">0</span> = any order — these can be done in parallel.
                {' '}<span className="font-semibold text-foreground">1, 2, 3…</span> = sequential — each step requires the previous one to be completed first.
              </p>
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading permits...</span>
            </div>
          ) : filteredPermits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
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
                className={`group relative bg-surface border rounded-lg transition-all ${
                  isBlocked
                    ? 'border-border opacity-60 cursor-not-allowed'
                    : 'border-border hover:border-border hover:shadow-sm cursor-pointer'
                } ${permit.priority === 'high' && !isBlocked ? 'border-l-4 border-l-red-500' : ''}`}
              >
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    {/* Order Number */}
                    <div className="flex-shrink-0" title={permit.order === 0 ? 'Can be done in any order' : `Requires step ${permit.order - 1} to be completed first`}>
                      <div className={`rounded flex items-center justify-center text-xs font-semibold ${
                        permit.order === 0 ? 'min-w-8 px-1.5' : 'min-w-6 px-1'
                      } ${
                        isBlocked ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'
                      } h-6`}>
                        {permit.order === 0 ? 'Any' : permit.order}
                      </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title Row */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-medium text-sm text-foreground leading-tight">
                          {permit.name}
                        </h3>
                        {!isBlocked && (
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                        )}
                      </div>

                      {/* Authority */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                        <Building2 className="w-3 h-3" />
                        <span>{permit.authority}</span>
                        <span className="text-muted-foreground/60">•</span>
                        <span>{permit.municipality}</span>
                      </div>

                      {/* Status Row */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`flex items-center gap-1 ${statusConfig.className}`}>
                          {statusConfig.icon}
                          <span className="text-xs font-medium">{statusConfig.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">•</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{permit.lastActivity}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{permit.lastActivityDate}</span>
                      </div>

                      {/* Blocker */}
                      {isBlocked && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/50 border border-border rounded-md text-xs text-muted-foreground font-medium">
                          <Lock className="w-3 h-3 text-muted-foreground" />
                          <span>Blocked by <span className="font-semibold text-foreground">{permit.blockedBy}</span></span>
                        </div>
                      )}

                      {/* Blocking */}
                      {permit.blocks.length > 0 && !isBlocked && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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

