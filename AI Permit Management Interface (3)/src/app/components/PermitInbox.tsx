import { AlertCircle, Clock, ChevronRight, Search, Filter } from 'lucide-react';
import { useState } from 'react';

interface PermitInboxItem {
  id: string;
  permitName: string;
  clientName: string;
  authority: string;
  municipality: string;
  feedbackDate: string;
  daysWaiting: number;
  priority: 'high' | 'medium' | 'low';
  summary: string;
}

const mockInboxItems: PermitInboxItem[] = [
  {
    id: '1',
    permitName: 'Health Department Plan Review',
    clientName: 'Urban Eats Restaurant Group',
    authority: 'SF Dept. of Public Health',
    municipality: 'San Francisco',
    feedbackDate: 'Dec 18, 2024',
    daysWaiting: 5,
    priority: 'high',
    summary: 'Floor plan revisions required - sink dimensions missing',
  },
  {
    id: '2',
    permitName: 'Conditional Use Permit',
    clientName: 'GreenSpace Co-Working',
    authority: 'SF Planning Department',
    municipality: 'San Francisco',
    feedbackDate: 'Dec 12, 2024',
    daysWaiting: 11,
    priority: 'high',
    summary: 'Neighborhood notification incomplete - need proof of mailing',
  },
  {
    id: '3',
    permitName: 'Sign Permit',
    clientName: 'Bloom Coffee',
    authority: 'City of Oakland',
    municipality: 'Oakland',
    feedbackDate: 'Dec 16, 2024',
    daysWaiting: 7,
    priority: 'medium',
    summary: 'Sign dimensions exceed zoning allowance - need variance or redesign',
  },
  {
    id: '4',
    permitName: 'Building Permit',
    clientName: 'TechHub Office Space',
    authority: 'SF Dept. of Building Inspection',
    municipality: 'San Francisco',
    feedbackDate: 'Dec 10, 2024',
    daysWaiting: 13,
    priority: 'high',
    summary: 'Structural engineer stamp missing on plans',
  },
];

interface PermitInboxProps {
  onSelectPermit: (permitId: string, clientName: string) => void;
}

export function PermitInbox({ onSelectPermit }: PermitInboxProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const getPriorityColor = (priority: PermitInboxItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-neutral-50 text-neutral-600 border-neutral-200';
    }
  };

  const filteredItems = mockInboxItems.filter((item) => {
    const matchesSearch =
      item.permitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
    
    return matchesSearch && matchesPriority;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    // Sort by priority first (high > medium > low), then by days waiting
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.daysWaiting - a.daysWaiting;
  });

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-6">
        <div className="mb-4">
          <h1 className="text-neutral-900 mb-1">Permit Inbox</h1>
          <p className="text-neutral-600">All permits requiring action across clients</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search permits, clients, or feedback..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterPriority('all')}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                filterPriority === 'all'
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterPriority('high')}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                filterPriority === 'high'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              High
            </button>
            <button
              onClick={() => setFilterPriority('medium')}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                filterPriority === 'medium'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              Medium
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-neutral-200 px-8 py-4">
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-neutral-500 mb-1">Total Action Required</p>
            <p className="text-2xl font-semibold text-neutral-900">{mockInboxItems.length}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">High Priority</p>
            <p className="text-2xl font-semibold text-red-600">
              {mockInboxItems.filter(i => i.priority === 'high').length}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Average Wait Time</p>
            <p className="text-2xl font-semibold text-neutral-900">
              {Math.round(mockInboxItems.reduce((sum, item) => sum + item.daysWaiting, 0) / mockInboxItems.length)} days
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Clients Affected</p>
            <p className="text-2xl font-semibold text-neutral-900">
              {new Set(mockInboxItems.map(i => i.clientName)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Inbox Items */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          {sortedItems.length === 0 ? (
            <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
              <AlertCircle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="font-medium text-neutral-900 mb-2">No permits requiring action</h3>
              <p className="text-neutral-600">All permits are either approved or awaiting city response.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectPermit(item.id, item.clientName)}
                  className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-neutral-300 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <AlertCircle className="w-8 h-8 text-amber-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-neutral-900 text-lg">
                              {item.permitName}
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                            <span className="font-medium">{item.clientName}</span>
                            <span className="text-neutral-400">•</span>
                            <span>{item.authority}</span>
                            <span className="text-neutral-400">•</span>
                            <span>{item.municipality}</span>
                          </div>
                          <p className="text-sm text-neutral-700">{item.summary}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-neutral-400 ml-4 flex-shrink-0" />
                      </div>

                      <div className="flex items-center gap-4 pt-3 border-t border-neutral-100 text-sm text-neutral-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>Feedback received {item.feedbackDate}</span>
                        </div>
                        <span className="text-neutral-400">•</span>
                        <span className={item.daysWaiting > 10 ? 'text-red-600 font-medium' : ''}>
                          Waiting {item.daysWaiting} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
