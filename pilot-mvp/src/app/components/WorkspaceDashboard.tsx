import { Plus, Search, Filter, MoreVertical, CheckCircle2, Clock, AlertCircle, FileText, Trash2, Square, CheckSquare, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { InviteClientModal } from './InviteClientModal';

interface Client {
  _id: string;
  businessName: string;
  jurisdiction: string;
  activePermits: number;
  status: 'draft' | 'submitted' | 'approved' | 'action-required';
  lastActivity: string;
  completionRate: number;
}

interface WorkspaceDashboardProps {
  onSelectClient?: (clientId: string) => void;
  onStartPermit: () => void;
  onOpenInbox?: () => void;
}

export function WorkspaceDashboard({ onSelectClient, onStartPermit, onOpenInbox }: WorkspaceDashboardProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [inviteClient, setInviteClient] = useState<Client | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/clients');
        if (res.ok) {
          const data = await res.json();
          setClients(data);
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleClientClick = (client: Client) => {
    if (onSelectClient) {
      onSelectClient(client._id);
    } else {
      // Navigate to client page using proper routing
      router.push(`/clients/${client._id}`);
    }
  };
  const getStatusIcon = (status: Client['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'submitted':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'action-required':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'draft':
        return <FileText className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getStatusLabel = (status: Client['status']) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'submitted':
        return 'Submitted';
      case 'action-required':
        return 'Action Required';
      case 'draft':
        return 'Draft';
    }
  };

  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'action-required':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'draft':
        return 'bg-neutral-50 text-neutral-600 border-neutral-200';
    }
  };

  const formatLastActivity = (dateString: string) => {
    // Handle already formatted strings like "2 days ago"
    if (!dateString || !dateString.includes('T')) {
      return dateString;
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Extract unique values for filters
  const statuses = ['draft', 'submitted', 'approved', 'action-required'] as const;
  const jurisdictions = Array.from(new Set(clients.map((c) => c.jurisdiction)));

  // Filter clients based on search and filters
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      searchQuery === '' ||
      client.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.jurisdiction.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.status.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(client.status);

    const matchesJurisdiction =
      selectedJurisdictions.length === 0 || selectedJurisdictions.includes(client.jurisdiction);

    return matchesSearch && matchesStatus && matchesJurisdiction;
  });

  const toggleFilter = (filterArray: string[], setFilter: (arr: string[]) => void, value: string) => {
    if (filterArray.includes(value)) {
      setFilter(filterArray.filter((item) => item !== value));
    } else {
      setFilter([...filterArray, value]);
    }
  };

  const clearAllFilters = () => {
    setSelectedStatuses([]);
    setSelectedJurisdictions([]);
    setSearchQuery('');
  };

  const activeFilterCount = selectedStatuses.length + selectedJurisdictions.length;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        const menuElement = menuRefs.current[openMenuId];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${clientName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch('/api/clients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: clientId }),
      });

      if (res.ok) {
        // Remove client from state
        setClients(clients.filter(client => client._id !== clientId));
        setOpenMenuId(null);
        // Remove from selected if it was selected
        setSelectedClients(prev => {
          const next = new Set(prev);
          next.delete(clientId);
          return next;
        });
        console.log(`✅ Client "${clientName}" deleted successfully`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to delete client: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Error deleting client. Please try again.');
    }
  };

  const handleToggleSelectClient = (clientId: string) => {
    setSelectedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!multiSelectMode) {
      // Enable multi-select mode and immediately select all
      setMultiSelectMode(true);
      setSelectedClients(new Set(filteredClients.map(client => client._id)));
    } else {
      if (selectedClients.size === filteredClients.length) {
        // Deselect all (but stay in multi-select mode)
        setSelectedClients(new Set());
      } else {
        // Select all filtered clients
        setSelectedClients(new Set(filteredClients.map(client => client._id)));
      }
    }
  };

  const toggleMultiSelectMode = () => {
    setMultiSelectMode(prev => {
      const newMode = !prev;
      if (!newMode) {
        // Clear selection when exiting multi-select mode
        setSelectedClients(new Set());
      }
      return newMode;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedClients.size === 0) return;

    const count = selectedClients.size;
    const clientNames = clients
      .filter(client => selectedClients.has(client._id))
      .map(client => client.businessName)
      .join(', ');

    if (!confirm(`Are you sure you want to delete ${count} client(s)?\n\n${clientNames}\n\nThis action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch('/api/clients/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedClients) }),
      });

      if (res.ok) {
        const result = await res.json();
        // Remove deleted clients from state
        setClients(clients.filter(client => !selectedClients.has(client._id)));
        setSelectedClients(new Set());
        console.log(`✅ ${result.deletedCount || count} client(s) deleted successfully`);
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(`Failed to delete clients: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error bulk deleting clients:', error);
      alert('Error deleting clients. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMenuClick = (e: React.MouseEvent, clientId: string) => {
    e.stopPropagation(); // Prevent row click
    setOpenMenuId(openMenuId === clientId ? null : clientId);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-neutral-900 mb-1">Workspace</h1>
            <p className="text-neutral-600">Manage clients and their regulatory compliance</p>
          </div>
          <div className="flex items-center gap-2">
            {!multiSelectMode && filteredClients.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <span>Select All</span>
              </button>
            )}
            {multiSelectMode && selectedClients.size > 0 && (
              <>
                <button
                  onClick={() => {
                    setSelectedClients(new Set());
                    setMultiSelectMode(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <CheckSquare className="w-4 h-4" />
                  Deselect All
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({selectedClients.size})
                </button>
              </>
            )}
            <button
              onClick={onStartPermit}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Client
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients, jurisdictions, or permit types..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="bg-white text-neutral-900 text-xs px-1.5 py-0.5 rounded-full font-medium">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="grid grid-cols-2 gap-6">
              {/* Status Filter */}
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">Status</p>
                <div className="space-y-2">
                  {statuses.map((status) => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(status)}
                        onChange={() => toggleFilter(selectedStatuses, setSelectedStatuses, status)}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                      <span className="text-sm text-neutral-700 capitalize">
                        {status === 'action-required' ? 'Action Required' : status}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Jurisdiction Filter */}
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">Jurisdiction</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {jurisdictions.map((jurisdiction) => (
                    <label key={jurisdiction} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedJurisdictions.includes(jurisdiction)}
                        onChange={() => toggleFilter(selectedJurisdictions, setSelectedJurisdictions, jurisdiction)}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                      <span className="text-sm text-neutral-700">{jurisdiction}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        {filteredClients.length !== clients.length && (
          <p className="text-sm text-neutral-500 mt-3">
            Showing {filteredClients.length} of {clients.length} clients
          </p>
        )}
      </div>

      {/* Client List */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-neutral-50 border-b border-neutral-200 text-sm font-medium text-neutral-600">
            {multiSelectMode && (
              <div className="col-span-1">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center justify-center p-1 hover:bg-neutral-200 rounded transition-colors"
                  title={selectedClients.size === filteredClients.length ? 'Deselect All' : 'Select All'}
                >
                  {selectedClients.size === filteredClients.length && filteredClients.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-neutral-900" />
                  ) : (
                    <Square className="w-4 h-4 text-neutral-400" />
                  )}
                </button>
              </div>
            )}
            <div className={multiSelectMode ? "col-span-3" : "col-span-4"}>Client</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Permits</div>
            <div className="col-span-2">Pending Items</div>
            <div className={multiSelectMode ? "col-span-1" : "col-span-1"}>Updated</div>
            <div className="col-span-1"></div>
          </div>

          {/* Table Rows */}
          {loading ? (
            <div className="p-8 text-center text-neutral-600">Loading clients...</div>
          ) : filteredClients.length === 0 ? (
            <div className="p-8 text-center text-neutral-600">
              {clients.length === 0 ? 'No clients found' : 'No clients match your search or filters'}
            </div>
          ) : (
            filteredClients.map((client) => {
              // Mock pending items - in real app, this would come from API
              const pendingDocs = client.status === 'action-required' ? 2 : client.status === 'draft' ? 3 : 0;
              const pendingReview = client.status === 'submitted' ? 1 : 0;
              const hasPending = pendingDocs > 0 || pendingReview > 0;
              
              return (
              <div
                key={client._id}
                className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                  multiSelectMode && selectedClients.has(client._id) ? 'bg-blue-50 border-blue-200' : ''
                } ${!multiSelectMode ? 'cursor-pointer' : ''}`}
              >
              {multiSelectMode && (
                <div className="col-span-1 flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelectClient(client._id);
                    }}
                    className="p-1 hover:bg-neutral-200 rounded transition-colors"
                  >
                    {selectedClients.has(client._id) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-400" />
                    )}
                  </button>
                </div>
              )}
              <div 
                className={multiSelectMode ? "col-span-3" : "col-span-4"}
                onClick={() => {
                  if (!multiSelectMode) {
                    handleClientClick(client);
                  }
                }}
              >
                <p className="font-medium text-neutral-900">{client.businessName}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{client.jurisdiction}</p>
              </div>
              <div 
                className="col-span-2 flex items-center"
                onClick={() => {
                  if (!multiSelectMode) {
                    handleClientClick(client);
                  }
                }}
              >
                <span
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    client.status
                  )}`}
                >
                  {getStatusIcon(client.status)}
                  {getStatusLabel(client.status)}
                </span>
              </div>
              <div 
                className="col-span-2 flex items-center"
                onClick={() => {
                  if (!multiSelectMode) {
                    handleClientClick(client);
                  }
                }}
              >
                <span className="text-sm text-neutral-700">
                  {client.activePermits} active
                </span>
              </div>
              <div 
                className="col-span-2 flex items-center"
                onClick={() => {
                  if (!multiSelectMode) {
                    handleClientClick(client);
                  }
                }}
              >
                {hasPending ? (
                  <div className="flex items-center gap-2">
                    {pendingDocs > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium">
                        <FileText className="w-3 h-3" />
                        {pendingDocs} docs
                      </span>
                    )}
                    {pendingReview > 0 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        <Clock className="w-3 h-3" />
                        review
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-neutral-400">—</span>
                )}
              </div>
              <div 
                className="col-span-1 flex items-center text-neutral-500 text-xs"
                onClick={() => {
                  if (!multiSelectMode) {
                    handleClientClick(client);
                  }
                }}
              >
                {formatLastActivity(client.lastActivity)}
              </div>
              <div className="col-span-1 flex items-center justify-end relative">
                <button
                  onClick={(e) => handleMenuClick(e, client._id)}
                  className="p-1 hover:bg-neutral-100 rounded transition-colors"
                >
                  <MoreVertical className="w-4 h-4 text-neutral-400" />
                </button>
                
                {/* Dropdown Menu */}
                {openMenuId === client._id && (
                  <div
                    ref={(el) => { menuRefs.current[client._id] = el; }}
                    className="absolute right-0 top-8 z-50 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 min-w-[150px]"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInviteClient(client);
                        setOpenMenuId(null);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite Client
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClient(client._id, client.businessName);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Client
                    </button>
                  </div>
                )}
              </div>
            </div>
              );
            })
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <p className="text-neutral-600 text-sm mb-1">Total Clients</p>
            <p className="text-neutral-900 font-semibold">{filteredClients.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <p className="text-neutral-600 text-sm mb-1">Active Permits</p>
            <p className="text-neutral-900 font-semibold">34</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <p className="text-neutral-600 text-sm mb-1">Pending Review</p>
            <p className="text-neutral-900 font-semibold">12</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <p className="text-neutral-600 text-sm mb-1">Action Required</p>
            <p className="text-amber-600 font-semibold">4</p>
          </div>
        </div>
      </div>

      {/* Invite Client Modal */}
      {inviteClient && (
        <InviteClientModal
          clientId={inviteClient._id}
          clientName={inviteClient.businessName}
          onClose={() => setInviteClient(null)}
        />
      )}
    </div>
  );
}
