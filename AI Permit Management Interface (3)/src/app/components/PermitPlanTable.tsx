import { Lock, Clock, CheckCircle2, AlertCircle, Send, Plus, Search, Building2, Sparkles, X, Loader2, DollarSign } from 'lucide-react';
import { useState } from 'react';

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
  governmentFee: number;
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
    governmentFee: 0,
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
    governmentFee: 1250,
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
    governmentFee: 875,
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
    governmentFee: 450,
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
    blocks: [],
    lastActivity: 'Blocked',
    lastActivityDate: 'Dec 5, 2024',
    daysInState: 18,
    governmentFee: 2200,
    assignee: {
      name: 'Michael Park',
      initials: 'MP',
      color: 'bg-blue-500',
    },
  },
];

interface PermitPlanProps {
  clientId: string | null;
  clientName?: string;
  onSelectPermit: (permitId: string) => void;
}

export function PermitPlanTable({ clientId, clientName, onSelectPermit }: PermitPlanProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPermit, setShowAddPermit] = useState(false);
  const [discoveryInput, setDiscoveryInput] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredPermits, setDiscoveredPermits] = useState<DiscoveredPermit[]>([]);

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
    console.log('Adding permit:', permit);
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
          color: 'text-green-700',
          bg: 'bg-green-50',
          border: 'border-green-200',
        };
      case 'submitted':
        return {
          icon: <Send className="w-3.5 h-3.5" />,
          label: 'Submitted',
          color: 'text-blue-700',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
        };
      case 'action-required':
        return {
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          label: 'Action Required',
          color: 'text-red-700',
          bg: 'bg-red-50',
          border: 'border-red-200',
        };
      default:
        return {
          icon: <Clock className="w-3.5 h-3.5" />,
          label: 'Not Started',
          color: 'text-neutral-500',
          bg: 'bg-neutral-50',
          border: 'border-neutral-200',
        };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredPermits = mockPermits.filter((permit) =>
    permit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    permit.authority.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 bg-neutral-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Permit Plan</h1>
              <p className="text-sm text-neutral-600 mt-1">{filteredPermits.length} permits • {filteredPermits.filter(p => p.status === 'action-required').length} need action</p>
            </div>
            <button 
              onClick={() => setShowAddPermit(!showAddPermit)}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Permit
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search permits..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            />
          </div>
        </div>

        {/* Add Permit Discovery */}
        {showAddPermit && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-5">
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
                    className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent bg-white"
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

        {/* Permit Table */}
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Permit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Last Activity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Blocking</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">Gov Fee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Assigned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredPermits.map((permit) => {
                const statusConfig = getStatusConfig(permit.status);
                const isBlocked = !!permit.blockedBy;
                
                return (
                  <tr
                    key={permit.id}
                    onClick={() => !isBlocked && onSelectPermit(permit.id)}
                    className={`transition-colors ${
                      isBlocked
                        ? 'opacity-60 cursor-not-allowed bg-neutral-50/50'
                        : 'hover:bg-neutral-50 cursor-pointer'
                    } ${permit.priority === 'high' && !isBlocked ? 'border-l-4 border-l-red-500' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <div className={`w-7 h-7 rounded flex items-center justify-center text-xs font-semibold ${
                        isBlocked ? 'bg-neutral-100 text-neutral-400' : 'bg-neutral-900 text-white'
                      }`}>
                        {permit.order}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900 mb-0.5">{permit.name}</p>
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <Building2 className="w-3 h-3" />
                          <span>{permit.authority}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {isBlocked ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs font-medium text-amber-900 inline-flex">
                          <Lock className="w-3 h-3" />
                          Blocked
                        </div>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs text-neutral-600">
                        <p className="font-medium text-neutral-900 mb-0.5">{permit.lastActivity}</p>
                        <p className="text-neutral-500">{permit.lastActivityDate}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {isBlocked ? (
                        <div className="text-xs text-neutral-600">
                          <p className="font-medium text-amber-900">{permit.blockedBy}</p>
                        </div>
                      ) : permit.blocks.length > 0 ? (
                        <div className="text-xs text-neutral-600">
                          <p>{permit.blocks.length} permit{permit.blocks.length > 1 ? 's' : ''}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm font-medium text-neutral-900">
                        {permit.governmentFee > 0 ? formatCurrency(permit.governmentFee) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {permit.assignee && (
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full ${permit.assignee.color} text-white text-xs font-medium flex items-center justify-center`}>
                            {permit.assignee.initials}
                          </div>
                          <span className="text-xs text-neutral-600">{permit.assignee.name}</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
