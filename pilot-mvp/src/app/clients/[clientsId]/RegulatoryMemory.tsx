import { FileText, CheckCircle2, XCircle, Edit2, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface TimelineEvent {
  id: string;
  date: string;
  type: 'submission' | 'revision' | 'rejection' | 'approval';
  permitName: string;
  details: string;
  approver?: string;
  changes?: Array<{ field: string; from: string; to: string; reason: string }>;
  documents?: Array<{ name: string; url: string }>;
}

const mockTimeline: TimelineEvent[] = [
  {
    id: 'e1',
    date: '2024-12-18',
    type: 'approval',
    permitName: 'Seller\'s Permit',
    details: 'Application approved by California CDTFA',
    approver: 'State Revenue Officer M. Johnson',
  },
  {
    id: 'e2',
    date: '2024-12-10',
    type: 'submission',
    permitName: 'Food Service Establishment Permit',
    details: 'Initial submission to SF Dept. of Public Health',
    documents: [
      { name: 'Application Form FSE-2024.pdf', url: '#' },
      { name: 'Floor Plan.pdf', url: '#' },
    ],
  },
  {
    id: 'e3',
    date: '2024-12-01',
    type: 'revision',
    permitName: 'Business Operating Permit',
    details: 'Updated business address per lease amendment',
    changes: [
      {
        field: 'Business Physical Address',
        from: '423 Market Street, San Francisco, CA 94105',
        to: '425 Market Street, San Francisco, CA 94105',
        reason: 'Lease amendment - unit number changed',
      },
    ],
  },
  {
    id: 'e4',
    date: '2024-11-22',
    type: 'rejection',
    permitName: 'Health Department Plan Review',
    details: 'Application rejected - insufficient documentation',
    approver: 'Health Inspector R. Martinez',
    changes: [
      {
        field: 'Equipment List',
        from: 'Basic kitchen equipment',
        to: 'Detailed equipment list with NSF certifications',
        reason: 'Required NSF-certified equipment documentation',
      },
      {
        field: 'Ventilation System',
        from: 'Standard hood system',
        to: 'Type I hood with fire suppression specifications',
        reason: 'Must specify fire suppression system details',
      },
    ],
  },
  {
    id: 'e5',
    date: '2024-11-15',
    type: 'approval',
    permitName: 'Business Operating Permit',
    details: 'Application approved by City of San Francisco',
    approver: 'Business Licensing Officer K. Thompson',
  },
  {
    id: 'e6',
    date: '2024-11-01',
    type: 'submission',
    permitName: 'Business Operating Permit',
    details: 'Initial submission to City of San Francisco',
    documents: [
      { name: 'Business Application.pdf', url: '#' },
      { name: 'Articles of Organization.pdf', url: '#' },
    ],
  },
];

interface RegulatoryMemoryProps {
  clientId?: string | null;
  isNewMemory?: boolean;
}

export function RegulatoryMemory({ clientId }: RegulatoryMemoryProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set(['e3', 'e4']));

  const toggleEvent = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'approval':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'rejection':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'revision':
        return <Edit2 className="w-5 h-5 text-blue-600" />;
      case 'submission':
        return <FileText className="w-5 h-5 text-neutral-600" />;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'approval':
        return 'border-green-200';
      case 'rejection':
        return 'border-red-200';
      case 'revision':
        return 'border-blue-200';
      case 'submission':
        return 'border-neutral-200';
    }
  };

  const getEventLabel = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'approval':
        return 'Approved';
      case 'rejection':
        return 'Rejected';
      case 'revision':
        return 'Revised';
      case 'submission':
        return 'Submitted';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-6">
        <div>
          <h1 className="text-neutral-900 mb-1">Regulatory Memory</h1>
          <p className="text-neutral-600">
            Historical audit trail for Urban Eats Restaurant Group
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-neutral-200" />

            {/* Timeline Events */}
            <div className="space-y-6">
              {mockTimeline.map((event) => {
                const isExpanded = expandedEvents.has(event.id);
                const hasDetails = event.changes || event.documents || event.approver;

                return (
                  <div key={event.id} className="relative pl-16">
                    {/* Timeline Dot */}
                    <div className="absolute left-3.5 top-3 w-5 h-5 bg-white border-2 border-neutral-200 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-neutral-900 rounded-full" />
                    </div>

                    {/* Event Card */}
                    <div
                      className={`bg-white rounded-lg border-2 ${getEventColor(
                        event.type
                      )} overflow-hidden`}
                    >
                      <div
                        className={`p-5 ${
                          hasDetails ? 'cursor-pointer hover:bg-neutral-50' : ''
                        }`}
                        onClick={() => hasDetails && toggleEvent(event.id)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getEventIcon(event.type)}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-medium text-neutral-900">
                                  {event.permitName}
                                </h3>
                                <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-700 rounded font-medium">
                                  {getEventLabel(event.type)}
                                </span>
                              </div>
                              <p className="text-sm text-neutral-600">{event.details}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-xs text-neutral-500">
                                <Clock className="w-3 h-3" />
                                {event.date}
                              </div>
                            </div>
                            {hasDetails && (
                              <div>
                                {isExpanded ? (
                                  <ChevronDown className="w-5 h-5 text-neutral-400" />
                                ) : (
                                  <ChevronRight className="w-5 h-5 text-neutral-400" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-neutral-200 bg-neutral-50 p-5 space-y-4">
                          {event.approver && (
                            <div>
                              <p className="text-xs font-medium text-neutral-500 uppercase mb-1">
                                Reviewed By
                              </p>
                              <p className="text-sm text-neutral-900">{event.approver}</p>
                            </div>
                          )}

                          {event.changes && (
                            <div>
                              <p className="text-xs font-medium text-neutral-500 uppercase mb-3">
                                Changes Made
                              </p>
                              <div className="space-y-3">
                                {event.changes.map((change, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-white rounded-lg border border-neutral-200 p-4"
                                  >
                                    <p className="text-sm font-medium text-neutral-900 mb-2">
                                      {change.field}
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                      <div>
                                        <p className="text-xs text-neutral-500 mb-1">From</p>
                                        <p className="text-sm text-neutral-900 line-through decoration-red-500">
                                          {change.from}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-neutral-500 mb-1">To</p>
                                        <p className="text-sm text-neutral-900 font-medium">
                                          {change.to}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="pt-2 border-t border-neutral-100">
                                      <p className="text-xs text-neutral-600">
                                        <span className="font-medium">Reason:</span>{' '}
                                        {change.reason}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {event.documents && (
                            <div>
                              <p className="text-xs font-medium text-neutral-500 uppercase mb-2">
                                Attached Documents
                              </p>
                              <div className="space-y-2">
                                {event.documents.map((doc, idx) => (
                                  <a
                                    key={idx}
                                    href={doc.url}
                                    className="flex items-center gap-2 px-3 py-2 bg-white rounded border border-neutral-200 hover:border-neutral-300 transition-colors"
                                  >
                                    <FileText className="w-4 h-4 text-neutral-400" />
                                    <span className="text-sm text-neutral-900">{doc.name}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
