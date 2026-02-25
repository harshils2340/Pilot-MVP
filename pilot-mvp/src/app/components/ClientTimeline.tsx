'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, CalendarDays, AlertTriangle, Loader2, Lock } from 'lucide-react';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

type PermitStatus = 'approved' | 'submitted' | 'in-progress' | 'not-started' | 'blocked';

interface Permit {
  id: string;
  name: string;
  authority: string;
  status: PermitStatus;
  estimatedStart: string;
  estimatedCompletion: string;
  actualCompletion?: string;
  estimatedDays: number;
  latestUpdate?: string;
  blockedBy?: string;
}

interface TimelineSummary {
  totalPermits: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  earliestStartDate?: string;
  latestCompletionDate?: string;
  totalEstimatedDays?: number;
}

interface ApiPermit {
  permitId: string;
  permitName: string;
  authority?: string;
  status: string;
  blockedBy?: string;
  lastActivity?: string;
  timeline: {
    estimatedStartDate?: string;
    currentEstimatedCompletionDate?: string;
    initialEstimatedCompletionDate?: string;
    actualCompletionDate?: string;
    actualStartDate?: string;
    currentEstimatedDays?: number;
    initialEstimatedDays?: number;
  };
}

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PermitStatus, {
  label: string;
  pillStyle: string;
  nodeStyle: string;
  icon: React.ReactNode;
}> = {
  approved: {
    label: 'Approved',
    pillStyle: 'bg-neutral-900 text-white',
    nodeStyle: 'bg-neutral-900 border-neutral-900',
    icon: <CheckCircle2 className="w-4 h-4 text-white" />,
  },
  submitted: {
    label: 'Submitted to City',
    pillStyle: 'bg-blue-600 text-white',
    nodeStyle: 'bg-blue-600 border-blue-600',
    icon: <Loader2 className="w-4 h-4 text-white animate-spin" />,
  },
  'in-progress': {
    label: 'In Progress',
    pillStyle: 'bg-blue-100 text-blue-700',
    nodeStyle: 'bg-blue-100 border-blue-300',
    icon: <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />,
  },
  'not-started': {
    label: 'Not Started',
    pillStyle: 'bg-neutral-100 text-neutral-400',
    nodeStyle: 'bg-white border-neutral-300',
    icon: <div className="w-3 h-3 rounded-full border-2 border-neutral-300" />,
  },
  blocked: {
    label: 'Waiting',
    pillStyle: 'bg-amber-100 text-amber-700',
    nodeStyle: 'bg-amber-50 border-amber-300',
    icon: <Lock className="w-3.5 h-3.5 text-amber-500" />,
  },
};

function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return Number.isNaN(d.getTime()) ? '' : format(d, 'MMM d, yyyy');
}

function mapApiStatusToPermitStatus(apiStatus: string, blockedBy?: string): PermitStatus {
  if (blockedBy && apiStatus === 'not-started') return 'blocked';
  if (apiStatus === 'action-required') return 'in-progress';
  if (['approved', 'submitted', 'in-progress', 'not-started'].includes(apiStatus)) {
    return apiStatus as PermitStatus;
  }
  return 'not-started';
}

function mapApiPermitToPermit(api: ApiPermit): Permit {
  const t = api.timeline || {};
  const startDate = t.actualStartDate || t.estimatedStartDate;
  const completionDate = t.actualCompletionDate || t.currentEstimatedCompletionDate || t.initialEstimatedCompletionDate;
  const estimatedDays =
    t.currentEstimatedDays ??
    t.initialEstimatedDays ??
    (startDate && completionDate
      ? Math.ceil(
          (new Date(completionDate).getTime() - new Date(startDate).getTime()) / (86400 * 1000)
        )
      : 0);

  // Only show lastActivity as latestUpdate if it looks like human text (not an ISO timestamp)
  const latestUpdate =
    api.lastActivity && !/^\d{4}-\d{2}-\d{2}[T\s]/.test(api.lastActivity.trim())
      ? api.lastActivity
      : undefined;

  return {
    id: api.permitId,
    name: api.permitName,
    authority: api.authority || 'City',
    status: mapApiStatusToPermitStatus(api.status, api.blockedBy),
    estimatedStart: formatDate(startDate),
    estimatedCompletion: formatDate(completionDate),
    actualCompletion: t.actualCompletionDate ? formatDate(t.actualCompletionDate) : undefined,
    estimatedDays,
    latestUpdate,
    blockedBy: api.blockedBy,
  };
}

// ─── Permit row ────────────────────────────────────────────────────────────────

function PermitRow({ permit, isLast }: { permit: Permit; isLast: boolean }) {
  const cfg = STATUS_CONFIG[permit.status];
  const isMuted = permit.status === 'not-started' || permit.status === 'blocked';

  return (
    <div className="flex gap-3">
      {/* Node + line */}
      <div className="flex flex-col items-center flex-shrink-0 w-7">
        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center z-10 ${cfg.nodeStyle}`}>
          {cfg.icon}
        </div>
        {!isLast && <div className="flex-1 w-px bg-neutral-200 my-1" />}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-5 rounded-xl border overflow-hidden transition-all duration-300 ease-out ${
        permit.status === 'submitted' ? 'border-blue-200' :
        permit.status === 'blocked'   ? 'border-amber-200' :
        'border-neutral-200'
      }`}>
        <div className="px-5 py-4">
          {/* Name + status + dates */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                <h3 className={`text-sm font-semibold ${isMuted ? 'text-neutral-400' : 'text-neutral-900'}`}>
                  {permit.name}
                </h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cfg.pillStyle}`}>
                  {cfg.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-400 flex-wrap">
                <span>{permit.authority}</span>
                <span>·</span>
                {permit.actualCompletion ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Done {permit.actualCompletion}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    Est. {permit.estimatedCompletion}
                  </span>
                )}
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ~{permit.estimatedDays} days
                </span>
              </div>
            </div>
          </div>

          {/* Latest update (consultant note) */}
          {permit.latestUpdate && (
            <p className={`mt-3 text-xs leading-relaxed break-words ${
              permit.status === 'submitted' ? 'text-blue-700' : 'text-neutral-500'
            }`}>
              {permit.latestUpdate}
            </p>
          )}

          {/* Blocked notice */}
          {permit.blockedBy && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Starts after <span className="font-medium">{permit.blockedBy}</span> is approved</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface ClientTimelineProps {
  clientId: string;
}

export function ClientTimeline({ clientId }: ClientTimelineProps) {
  const [data, setData] = useState<{ summary: TimelineSummary; permits: ApiPermit[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchTimeline = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/clients/${encodeURIComponent(clientId)}/timeline`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || `Failed to fetch timeline (${response.status})`);
        }
        const json = await response.json();
        if (json.error) throw new Error(json.error);
        if (!cancelled) {
          setData({
            summary: json.summary || {},
            permits: json.permits || [],
          });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load timeline');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (clientId) fetchTimeline();
    return () => { cancelled = true; };
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
        <span className="ml-2 text-sm text-neutral-500">Loading timeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 px-6 py-5">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">Error loading timeline</span>
        </div>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, permits } = data;
  const mappedPermits = permits.map(mapApiPermitToPermit);
  const approvedCount = summary.completed ?? mappedPermits.filter((p) => p.status === 'approved').length;

  // Project dates (earliest start → latest completion)
  const projectStart = summary.earliestStartDate
    ? new Date(summary.earliestStartDate).getTime()
    : new Date().getTime();
  const projectEnd = summary.latestCompletionDate
    ? new Date(summary.latestCompletionDate).getTime()
    : projectStart + 180 * 86400 * 1000; // fallback ~6 months
  const todayMs = Date.now();

  // Progress bar driven by permit approvals (not calendar time) — moves when permits get approved
  const totalPermits = permits.length || 1;
  const approvalPct = totalPermits > 0 ? (approvedCount / totalPermits) * 100 : 0;
  const displayPct = Math.min(100, Math.max(approvalPct, approvalPct === 0 ? 2 : 0));
  const weeksIn = Math.max(0, Math.round((todayMs - projectStart) / (7 * 86400 * 1000)));
  const weeksLeft = Math.max(0, Math.round((projectEnd - todayMs) / (7 * 86400 * 1000)));
  const projectedOpening = formatDate(summary.latestCompletionDate) || format(new Date(projectEnd), 'MMM d, yyyy');

  return (
    <div className="w-full min-w-0 p-6 md:p-8 lg:p-10">
      <div className="mx-auto max-w-4xl space-y-8">
      {/* ── Opening date + progress bar ─────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-xl px-8 pt-7 pb-8 transition-all duration-300">
        <div className="flex items-start justify-between gap-6 flex-wrap mb-8">
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-1.5">
              Projected Opening
            </p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl font-bold text-neutral-900">{projectedOpening}</h2>
              <span className="text-sm text-neutral-400">~{weeksLeft} weeks away</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900">{approvedCount}<span className="text-neutral-300">/{permits.length}</span></p>
              <p className="text-xs text-neutral-400 mt-0.5">Permits approved</p>
            </div>
            <div className="w-px h-10 bg-neutral-200" />
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-900">{weeksIn}</p>
              <p className="text-xs text-neutral-400 mt-0.5">Weeks in</p>
            </div>
          </div>
        </div>

        {/* Progress bar — driven by permit approvals; moves when permits get approved */}
        <div className="relative pb-2">
          <div className="flex justify-between mb-2 text-xs text-neutral-400">
            <span>{formatDate(summary.earliestStartDate) || format(new Date(projectStart), 'MMM yyyy')}</span>
            <span>{format(new Date(projectEnd), 'MMM yyyy')}</span>
          </div>

          <div className="h-3 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-900 rounded-full transition-[width] duration-700 ease-out"
              style={{ width: `${displayPct}%` }}
              role="progressbar"
              aria-valuenow={approvedCount}
              aria-valuemin={0}
              aria-valuemax={totalPermits}
              aria-label={`${approvedCount} of ${totalPermits} permits approved`}
            />
          </div>
        </div>
      </div>

      {/* ── Permit timeline ────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-neutral-900">Permits</h3>
          <div className="flex items-center gap-4 text-xs text-neutral-400 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neutral-900 inline-block" /> Approved</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Submitted</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Waiting</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border border-neutral-300 inline-block" /> Upcoming</span>
          </div>
        </div>

        <div>
          {mappedPermits.length === 0 ? (
            <p className="text-sm text-neutral-500 py-4">No permits yet. Add permits from the Plan tab.</p>
          ) : (
            mappedPermits.map((permit, i) => (
              <PermitRow key={permit.id} permit={permit} isLast={i === mappedPermits.length - 1} />
            ))
          )}
        </div>
      </div>

      <p className="text-xs text-neutral-400 pb-2">
        Timeline estimates are based on typical processing times. Your consultant updates this as permits progress.
      </p>
      </div>
    </div>
  );
}
