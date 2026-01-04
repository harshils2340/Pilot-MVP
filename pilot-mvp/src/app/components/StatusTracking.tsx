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

const mockPermits: Permit[] = [
  {
    id: 'p1',
    name: 'Food Service Establishment Permit',
    authority: 'SF Dept. of Public Health',
    status: 'submitted',
    assignee: 'JD',
    dueDate: 'Dec 28',
    priority: 'high',
  },
  {
    id: 'p2',
    name: 'Health Department Plan Review',
    authority: 'SF Dept. of Public Health',
    status: 'action-required',
    assignee: 'SC',
    dueDate: 'Dec 20',
    priority: 'high',
  },
  {
    id: 'p3',
    name: 'Business Operating Permit',
    authority: 'City of San Francisco',
    status: 'draft',
    assignee: 'JD',
    dueDate: 'Jan 5',
    priority: 'medium',
  },
  {
    id: 'p4',
    name: 'Building Modification Permit',
    authority: 'SF Dept. of Building Inspection',
    status: 'draft',
    assignee: 'JD',
    dueDate: 'Jan 15',
    priority: 'medium',
  },
  {
    id: 'p5',
    name: 'Fire Department Inspection',
    authority: 'San Francisco Fire Department',
    status: 'draft',
    assignee: 'SC',
    dueDate: 'Jan 10',
    priority: 'low',
  },
  {
    id: 'p6',
    name: "Seller's Permit",
    authority: 'California CDTFA',
    status: 'approved',
    assignee: 'JD',
    dueDate: 'Completed',
    priority: 'low',
  },
];

interface StatusTrackingProps {
  clientId: string | null;
  onEditPermit: (permitId: string) => void;
}

export function StatusTracking({ clientId, onEditPermit }: StatusTrackingProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  const columns = [
    { id: 'draft' as const, label: 'Draft', color: 'bg-neutral-100' },
    { id: 'submitted' as const, label: 'Submitted', color: 'bg-blue-100' },
    { id: 'action-required' as const, label: 'Action Required', color: 'bg-amber-100' },
    { id: 'approved' as const, label: 'Approved', color: 'bg-green-100' },
  ];

  const getPermitsByStatus = (status: Permit['status']) => {
    return mockPermits.filter((permit) => permit.status === status);
  };

  const getPriorityColor = (priority: Permit['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-neutral-900 mb-1">Status & Tracking</h1>
            <p className="text-neutral-600">Urban Eats Restaurant Group</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors">
              <Plus className="w-4 h-4" />
              Add Permit
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        {viewMode === 'kanban' ? (
          // Kanban View
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
                        onClick={() => onEditPermit(permit.id)}
                        className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-md hover:border-neutral-300 cursor-pointer transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-neutral-900 text-sm leading-snug">
                            {permit.name}
                          </h4>
                          <button className="p-1 hover:bg-neutral-100 rounded -mt-1 -mr-1">
                            <MoreVertical className="w-4 h-4 text-neutral-400" />
                          </button>
                        </div>

                        <p className="text-xs text-neutral-600 mb-3">{permit.authority}</p>

                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(
                              permit.priority
                            )}`}
                          >
                            {permit.priority}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">{permit.dueDate}</span>
                            <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-medium">
                              {permit.assignee}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-neutral-100">
                          <button className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-700">
                            <GripVertical className="w-3 h-3" />
                            Drag to move
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
          // Table View
          <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-neutral-50 border-b border-neutral-200 text-sm font-medium text-neutral-600">
              <div className="col-span-4">Permit Name</div>
              <div className="col-span-3">Authority</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Priority</div>
              <div className="col-span-1">Assignee</div>
              <div className="col-span-1">Due Date</div>
            </div>

            {/* Table Rows */}
            {mockPermits.map((permit) => (
              <div
                key={permit.id}
                onClick={() => onEditPermit(permit.id)}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors"
              >
                <div className="col-span-4">
                  <p className="font-medium text-neutral-900">{permit.name}</p>
                </div>
                <div className="col-span-3 flex items-center text-neutral-600 text-sm">
                  {permit.authority}
                </div>
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
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(
                      permit.priority
                    )}`}
                  >
                    {permit.priority}
                  </span>
                </div>
                <div className="col-span-1 flex items-center">
                  <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-medium">
                    {permit.assignee}
                  </div>
                </div>
                <div className="col-span-1 flex items-center text-neutral-600 text-sm">
                  {permit.dueDate}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
