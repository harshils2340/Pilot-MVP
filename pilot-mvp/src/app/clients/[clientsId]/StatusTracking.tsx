'use client';

import { GripVertical, MoreVertical, Plus, Filter, Search } from 'lucide-react';
import { useState } from 'react';

interface Permit {
  id: string;
  name: string;
  authority: string;
  status: 'draft' | 'submitted' | 'approved' | 'action-required';
  assignee: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}

// Sample/mock data
const mockPermits: Permit[] = [
  { id: 'p1', name: 'Food Service Establishment Permit', authority: 'SF Dept. of Public Health', status: 'submitted', assignee: 'JD', dueDate: 'Dec 28', priority: 'high' },
  { id: 'p2', name: 'Health Department Plan Review', authority: 'SF Dept. of Public Health', status: 'action-required', assignee: 'SC', dueDate: 'Dec 20', priority: 'high' },
  { id: 'p3', name: 'Business Operating Permit', authority: 'City of San Francisco', status: 'draft', assignee: 'JD', dueDate: 'Jan 5', priority: 'medium' },
  { id: 'p4', name: 'Building Modification Permit', authority: 'SF Dept. of Building Inspection', status: 'draft', assignee: 'JD', dueDate: 'Jan 15', priority: 'medium' },
  { id: 'p5', name: 'Fire Department Inspection', authority: 'San Francisco Fire Department', status: 'draft', assignee: 'SC', dueDate: 'Jan 10', priority: 'low' },
  { id: 'p6', name: "Seller's Permit", authority: 'California CDTFA', status: 'approved', assignee: 'JD', dueDate: 'Completed', priority: 'low' },
];

interface Client {
  _id: string;
  businessName: string;
  jurisdiction: string;
  activePermits: number;
  status: string;
  lastActivity: string;
  completionRate: number;
}

interface StatusTrackingProps {
  clientId?: string | null;
  client?: Client | null;
  onEditPermit?: (permitId: string) => void; // REQUIRED
}

export function StatusTracking({ clientId, client, onEditPermit }: StatusTrackingProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  const columns = [
    { id: 'draft' as const, label: 'Draft', color: 'bg-neutral-100' },
    { id: 'submitted' as const, label: 'Submitted', color: 'bg-blue-100' },
    { id: 'action-required' as const, label: 'Action Required', color: 'bg-amber-100' },
    { id: 'approved' as const, label: 'Approved', color: 'bg-green-100' },
  ];

  // Extract unique values for filters
  const statuses = ['draft', 'submitted', 'approved', 'action-required'] as const;
  const priorities = ['low', 'medium', 'high'] as const;
  const assignees = Array.from(new Set(mockPermits.map((p) => p.assignee)));

  // Filter permits based on search and filters
  const filteredPermits = mockPermits.filter((permit) => {
    const matchesSearch =
      searchQuery === '' ||
      permit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.authority.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.assignee.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(permit.status);

    const matchesPriority =
      selectedPriorities.length === 0 || selectedPriorities.includes(permit.priority);

    const matchesAssignee =
      selectedAssignees.length === 0 || selectedAssignees.includes(permit.assignee);

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const getPermitsByStatus = (status: Permit['status']) =>
    filteredPermits.filter((permit) => permit.status === status);

  const toggleFilter = (filterArray: string[], setFilter: (arr: string[]) => void, value: string) => {
    if (filterArray.includes(value)) {
      setFilter(filterArray.filter((item) => item !== value));
    } else {
      setFilter([...filterArray, value]);
    }
  };

  const clearAllFilters = () => {
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setSelectedAssignees([]);
    setSearchQuery('');
  };

  const activeFilterCount = selectedStatuses.length + selectedPriorities.length + selectedAssignees.length;

  const getPriorityColor = (priority: Permit['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-neutral-900 mb-1">Status & Tracking</h1>
            <p className="text-neutral-600">{client?.businessName || clientId || 'Unknown Client'}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              <Filter className="w-4 h-4" /> Filter
              {activeFilterCount > 0 && (
                <span className="bg-white text-neutral-900 text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors px-3 py-2"
              >
                Clear all
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors">
              <Plus className="w-4 h-4" /> Add Permit
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search permits..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            />
          </div>
          <div className="flex border border-neutral-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              Table
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="grid grid-cols-3 gap-6">
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

              {/* Priority Filter */}
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">Priority</p>
                <div className="space-y-2">
                  {priorities.map((priority) => (
                    <label key={priority} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPriorities.includes(priority)}
                        onChange={() => toggleFilter(selectedPriorities, setSelectedPriorities, priority)}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                      <span className="text-sm text-neutral-700 capitalize">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Assignee Filter */}
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-2">Assignee</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {assignees.map((assignee) => (
                    <label key={assignee} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAssignees.includes(assignee)}
                        onChange={() => toggleFilter(selectedAssignees, setSelectedAssignees, assignee)}
                        className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                      <span className="text-sm text-neutral-700">{assignee}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        {filteredPermits.length !== mockPermits.length && (
          <p className="text-sm text-neutral-500 mt-3">
            Showing {filteredPermits.length} of {mockPermits.length} permits
          </p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-4 gap-6 h-full">
            {columns.map((column) => {
              const permits = getPermitsByStatus(column.id);
              return (
                <div key={column.id} className="flex flex-col">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-neutral-900">{column.label}</h3>
                      <span className="px-2 py-1 bg-neutral-100 text-neutral-600 rounded text-sm font-medium">
                        {permits.length}
                      </span>
                    </div>
                    <div className={`h-1 ${column.color} rounded-full`} />
                  </div>

                  <div className="flex-1 space-y-3 min-h-0">
                    {permits.map((permit) => (
                      <div
                        key={permit.id}
                        onClick={() => onEditPermit?.(permit.id)}
                        className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-md hover:border-neutral-300 cursor-pointer transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-neutral-900 text-sm leading-snug">{permit.name}</h4>
                          <button className="p-1 hover:bg-neutral-100 rounded -mt-1 -mr-1">
                            <MoreVertical className="w-4 h-4 text-neutral-400" />
                          </button>
                        </div>

                        <p className="text-xs text-neutral-600 mb-3">{permit.authority}</p>

                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(permit.priority)}`}>
                            {permit.priority}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">{permit.dueDate}</span>
                            <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-medium">{permit.assignee}</div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-neutral-100">
                          <button className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700">
                            <GripVertical className="w-3 h-3" /> Drag to move
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-neutral-50 border-b border-neutral-200 text-sm font-medium text-neutral-600">
              <div className="col-span-4">Permit Name</div>
              <div className="col-span-3">Authority</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Priority</div>
              <div className="col-span-1">Assignee</div>
              <div className="col-span-1">Due Date</div>
            </div>

            {mockPermits.map((permit) => (
              <div
                key={permit.id}
                onClick={() => onEditPermit?.(permit.id)}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors"
              >
                <div className="col-span-4">
                  <p className="font-medium text-neutral-900">{permit.name}</p>
                </div>
                <div className="col-span-3 flex items-center text-neutral-600 text-sm">{permit.authority}</div>
                <div className="col-span-2 flex items-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      permit.status === 'approved'
                        ? 'bg-green-50 text-green-700'
                        : permit.status === 'submitted'
                        ? 'bg-blue-50 text-blue-700'
                        : permit.status === 'action-required'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-neutral-50 text-neutral-600'
                    }`}
                  >
                    {permit.status === 'action-required'
                      ? 'Action Required'
                      : permit.status.charAt(0).toUpperCase() + permit.status.slice(1)}
                  </span>
                </div>
                <div className="col-span-1 flex items-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(permit.priority)}`}>
                    {permit.priority}
                  </span>
                </div>
                <div className="col-span-1 flex items-center">
                  <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-medium">{permit.assignee}</div>
                </div>
                <div className="col-span-1 flex items-center text-neutral-600 text-sm">{permit.dueDate}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
