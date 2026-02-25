'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';

interface TimelineData {
  permitId: string;
  permitName: string;
  status: string;
  blockedBy?: string;
  dependencyDelayDays?: number;
  timeline: {
    initialEstimatedDays?: number;
    currentEstimatedDays?: number;
    estimatedStartDate?: string;
    initialEstimatedCompletionDate?: string;
    currentEstimatedCompletionDate?: string;
    actualStartDate?: string;
    actualCompletionDate?: string;
    processingDelays?: number;
    lastUpdated?: string;
    statusHistory?: Array<{
      status: string;
      date: string;
      notes?: string;
    }>;
  };
}

function toDate(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

interface TimelineViewProps {
  clientId: string;
  permitId?: string; // If provided, show single permit timeline; otherwise show aggregated
}

export function TimelineView({ clientId, permitId }: TimelineViewProps) {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [aggregatedData, setAggregatedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchTimeline = async () => {
      try {
        setLoading(true);
        setError(null);

        if (permitId) {
          // Fetch single permit timeline
          const response = await fetch(`/api/clients/${clientId}/permits/${permitId}/timeline`, {
            cache: 'no-store',
          });
          if (!response.ok) throw new Error('Failed to fetch permit timeline');
          const data = await response.json();
          if (!cancelled) {
            setTimelineData(data);
          }
        } else {
          // Fetch aggregated client timeline (GET endpoint auto-estimates missing timelines)
          const response = await fetch(`/api/clients/${clientId}/timeline`, {
            cache: 'no-store',
          });
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[TimelineView] API error:', response.status, errorText);
            throw new Error(`Failed to fetch client timeline: ${response.status}`);
          }
          const data = await response.json();
          if (!cancelled) {
            setAggregatedData(data);
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Failed to load timeline');
          console.error('Timeline fetch error:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (clientId) {
      fetchTimeline();
    }

    return () => {
      cancelled = true;
    };
  }, [clientId, permitId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading timeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Error loading timeline</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  // Render aggregated client timeline
  if (aggregatedData) {
    const { summary, permits } = aggregatedData;
    const datedPermits = permits
      .map((p: TimelineData) => ({
        ...p,
        start: toDate(p.timeline.estimatedStartDate || p.timeline.actualStartDate),
        end: toDate(p.timeline.currentEstimatedCompletionDate || p.timeline.initialEstimatedCompletionDate || p.timeline.actualCompletionDate),
      }))
      .filter((p: any) => p.start && p.end);

    const minStart = datedPermits.length > 0
      ? new Date(Math.min(...datedPermits.map((p: any) => p.start.getTime())))
      : null;
    const maxEnd = datedPermits.length > 0
      ? new Date(Math.max(...datedPermits.map((p: any) => p.end.getTime())))
      : null;
    const totalSpanDays = minStart && maxEnd
      ? Math.max(1, differenceInDays(maxEnd, minStart))
      : 1;
    
    return (
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">Client Timeline Overview</h1>
          <p className="text-sm text-muted-foreground">Track permit processing timelines and estimated completion dates</p>
        </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border bg-surface p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Total Permits</p>
              <p className="text-2xl font-semibold text-foreground">{summary.totalPermits || 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Completed</p>
              <p className="text-2xl font-semibold text-green-600">{summary.completed || 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">In Progress</p>
              <p className="text-2xl font-semibold text-blue-600">{summary.inProgress || 0}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Projected Completion Window</p>
              <p className="text-2xl font-semibold text-foreground">
                {summary.totalEstimatedDays ? `${summary.totalEstimatedDays} days` : 'N/A'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Based on longest dependency path</p>
            </div>
          </div>

          {/* Timeline Range */}
          {summary.earliestStartDate && summary.latestCompletionDate && (
            <div className="rounded-lg border border-border bg-surface p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Timeline Range</p>
                  <p className="text-sm font-medium text-foreground">
                    {format(new Date(summary.earliestStartDate), 'MMM d, yyyy')} →{' '}
                    {format(new Date(summary.latestCompletionDate), 'MMM d, yyyy')}
                  </p>
                </div>
                {summary.totalProcessingDelays > 0 && (
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Processing Delays</p>
                    <p className="text-sm font-medium text-orange-600">
                      +{summary.totalProcessingDelays} days
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline Graphic */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Timeline View</p>
            {datedPermits.length === 0 ? (
              <p className="text-sm text-muted-foreground">Timeline bars will appear once estimates are available.</p>
            ) : (
              <div className="space-y-3">
                {datedPermits.map((permit: any) => {
                  const startOffsetDays = minStart ? Math.max(0, differenceInDays(permit.start, minStart)) : 0;
                  const durationDays = Math.max(1, differenceInDays(permit.end, permit.start));
                  const leftPct = (startOffsetDays / totalSpanDays) * 100;
                  const widthPct = Math.max(2, (durationDays / totalSpanDays) * 100);

                  return (
                    <div key={`bar-${permit.permitId}`} className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-4 md:col-span-3 text-sm font-medium text-foreground truncate">
                        {permit.permitName}
                      </div>
                      <div className="col-span-8 md:col-span-9">
                        <div className="relative h-8 rounded bg-muted/40 border border-border">
                          <div
                            className="absolute top-1 h-6 rounded bg-primary/80 text-primary-foreground text-[11px] px-2 flex items-center whitespace-nowrap"
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            title={`${format(permit.start, 'MMM d')} - ${format(permit.end, 'MMM d')} (${durationDays} days)`}
                          >
                            {durationDays}d
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Compact Permit Breakdown */}
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Permit Breakdown ({permits.length}/{summary.totalPermits})
            </h2>

            {permits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No permits found for this client.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                      <th className="py-2 pr-3">Permit</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Duration</th>
                      <th className="py-2 pr-3">Start</th>
                      <th className="py-2 pr-3">Finish</th>
                      <th className="py-2">Dependency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permits.map((permit: any) => {
                      const start = toDate(permit.timeline?.estimatedStartDate || permit.timeline?.actualStartDate);
                      const end = toDate(permit.timeline?.currentEstimatedCompletionDate || permit.timeline?.initialEstimatedCompletionDate || permit.timeline?.actualCompletionDate);
                      const days = start && end ? Math.max(1, differenceInDays(end, start)) : permit.timeline?.currentEstimatedDays;
                      return (
                        <tr key={`row-${permit.permitId}`} className="border-b border-border/60 last:border-0">
                          <td className="py-3 pr-3 font-medium text-foreground">{permit.permitName}</td>
                          <td className="py-3 pr-3 text-muted-foreground">{permit.status}</td>
                          <td className="py-3 pr-3 text-foreground">{days ? `${days} days` : 'N/A'}</td>
                          <td className="py-3 pr-3 text-muted-foreground">{start ? format(start, 'MMM d, yyyy') : 'N/A'}</td>
                          <td className="py-3 pr-3 text-muted-foreground">{end ? format(end, 'MMM d, yyyy') : 'N/A'}</td>
                          <td className="py-3 text-muted-foreground">{permit.blockedBy || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
      </div>
    );
  }

  // Render single permit timeline
  if (timelineData) {
    return <PermitTimelineCard permit={timelineData} />;
  }

  return null;
}

function PermitTimelineCard({ permit }: { permit: TimelineData }) {
  const { timeline } = permit;
  const completionDate = timeline.currentEstimatedCompletionDate || timeline.initialEstimatedCompletionDate;
  const startDate = timeline.actualStartDate || timeline.estimatedStartDate;
  const isCompleted = permit.status === 'approved';
  const isOverdue = completionDate && isPast(new Date(completionDate)) && !isCompleted;
  const hasTimelineData = timeline.currentEstimatedDays || timeline.initialEstimatedDays;

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="font-medium text-foreground mb-2">{permit.permitName}</h4>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              permit.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
              permit.status === 'in-progress' || permit.status === 'submitted' ? 'bg-blue-100 text-blue-700 border-blue-200' :
              permit.status === 'action-required' ? 'bg-orange-100 text-orange-700 border-orange-200' :
              'bg-gray-100 text-gray-700 border-gray-200'
            }`}>
              {permit.status}
            </span>
            {permit.blockedBy && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-100 text-amber-700 border-amber-200">
                Depends on: {permit.blockedBy}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isCompleted && (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          )}
          {isOverdue && (
            <AlertCircle className="w-5 h-5 text-orange-600" />
          )}
        </div>
      </div>

      {hasTimelineData ? (
        <div className="space-y-3 pt-2 border-t border-border">
          {/* Estimated Days */}
          {timeline.currentEstimatedDays && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Estimated:</span>
              <span className="font-medium text-foreground">{timeline.currentEstimatedDays} days</span>
              {permit.dependencyDelayDays && permit.dependencyDelayDays > 0 && (
                <span className="text-amber-700 text-xs">
                  (+{permit.dependencyDelayDays} dependency delay)
                </span>
              )}
              {timeline.processingDelays && timeline.processingDelays > 0 && (
                <span className="text-orange-600 text-xs">
                  (+{timeline.processingDelays} processing delay)
                </span>
              )}
            </div>
          )}

          {/* Dates */}
          {startDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Start:</span>
              <span className="font-medium text-foreground">
                {format(new Date(startDate), 'MMM d, yyyy')}
              </span>
              {timeline.actualStartDate && (
                <span className="text-xs text-muted-foreground">(actual)</span>
              )}
            </div>
          )}

          {completionDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">Completion:</span>
              <span className={`font-medium ${isOverdue ? 'text-orange-600' : 'text-foreground'}`}>
                {format(new Date(completionDate), 'MMM d, yyyy')}
              </span>
              {timeline.actualCompletionDate && (
                <span className="text-xs text-muted-foreground">(actual)</span>
              )}
              {isOverdue && (
                <span className="text-xs text-orange-600">
                  ({differenceInDays(new Date(), new Date(completionDate))} days overdue)
                </span>
              )}
            </div>
          )}

          {/* Status History */}
          {timeline.statusHistory && timeline.statusHistory.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Status History</p>
              <div className="space-y-2">
                {timeline.statusHistory.slice(-3).reverse().map((entry: any, idx: number) => (
                  <div key={idx} className="text-xs flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <span className="font-medium text-foreground">{entry.status}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(entry.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">Timeline estimate unavailable for this permit right now.</p>
        </div>
      )}
    </div>
  );
}
