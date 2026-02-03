'use client';

import { useState } from 'react';
import {
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Inbox,
  Loader2,
  MoreVertical,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

const TAG_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-red-100 text-red-700',
  'bg-blue-100 text-blue-700',
  'bg-amber-200/80 dark:bg-amber-500/20 text-amber-950 dark:text-amber-200',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
];

export interface LeadDetailLead {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  status: string;
  stageId?: string;
  stageName?: string;
  probability?: number;
  expectedRevenue?: number;
  expectedClosingDate?: string;
  emailCount?: number;
  lastEmailDate?: string;
  notes?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  activities?: Array<{
    type: string;
    summary?: string;
    scheduledDate?: string;
    status?: string;
  }>;
}

export interface LeadDetailEmail {
  _id: string;
  subject: string;
  from: { email: string; name?: string };
  to: { email: string; name?: string };
  body: string;
  htmlBody?: string;
  direction: 'inbound' | 'outbound';
  status: string;
  receivedAt: string;
  permitId?: string;
  permitName?: string;
  clientId?: string;
  clientName?: string;
  attachments?: Array<{ filename: string; contentType: string; size: number; url?: string }>;
}

function isPermitOrClientEmail(e: LeadDetailEmail): boolean {
  return !!(e.permitId || e.permitName || e.clientId || e.clientName);
}

export interface PipelineStage {
  _id: string;
  name: string;
  sequence: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
}

interface LeadDetailViewProps {
  lead: LeadDetailLead;
  emails: LeadDetailEmail[];
  emailsLoading: boolean;
  stages: PipelineStage[];
  onBack: () => void;
  onStageChange: (leadId: string, stageId: string, stageName: string, probability: number) => Promise<void>;
  onDelete: (leadId: string) => Promise<void>;
}

export function LeadDetailView({
  lead,
  emails,
  emailsLoading,
  stages,
  onBack,
  onStageChange,
  onDelete,
}: LeadDetailViewProps) {
  const [expandedEmailIds, setExpandedEmailIds] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState(false);

  // Calculate actual email count and last email date from the fetched emails array
  const actualEmailCount = emails.length;
  const lastEmailDate = emails.length > 0
    ? emails.reduce((latest, email) => {
        const emailDate = new Date(email.receivedAt);
        return emailDate > latest ? emailDate : latest;
      }, new Date(emails[0].receivedAt))
    : null;

  const toggleEmailExpanded = (id: string) => {
    setExpandedEmailIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMoveToStage = async (s: PipelineStage) => {
    if (updating) return;
    setUpdating(true);
    try {
      await onStageChange(lead._id, s._id, s.name, s.probability);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    if (updating) return;
    setUpdating(true);
    try {
      await onDelete(lead._id);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-page-bg">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground -ml-2"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Button>
        </div>

        {/* Main Card */}
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-border px-6 py-5 bg-surface">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold text-foreground truncate mb-2">{lead.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex px-2.5 py-0.5 rounded-md bg-violet-100 text-violet-700 text-sm font-medium">
                    {lead.stageName || lead.status || 'Lead'}
                  </span>
                  {lead.source && (
                    <span className="text-sm text-muted-foreground">via {lead.source}</span>
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0 h-9 w-9" disabled={updating}>
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {stages.map((s) => (
                    <DropdownMenuItem key={s._id} onClick={() => handleMoveToStage(s)} disabled={updating}>
                      Move to {s.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600" disabled={updating}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="divide-y divide-neutral-200">
            {/* Contact */}
            <section className="px-6 py-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contact</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                    <Mail className="w-4 h-4" />
                  </div>
                  <a href={`mailto:${lead.email}`} className="text-sky-600 hover:underline truncate">
                    {lead.email}
                  </a>
                </div>
                {lead.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                      <Phone className="w-4 h-4" />
                    </div>
                    <a href={`tel:${lead.phone}`} className="text-foreground">
                      {lead.phone}
                    </a>
                  </div>
                )}
                {lead.company && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-200/80 dark:bg-amber-500/20 text-amber-950 dark:text-amber-200">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-foreground">{lead.company}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Pipeline */}
            <section className="px-6 py-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pipeline</h2>
              <div className="flex flex-wrap gap-2">
                {lead.stageName && (
                  <span className="inline-flex px-2.5 py-1 rounded-lg bg-violet-100 text-violet-700 text-sm font-medium">
                    {lead.stageName}
                  </span>
                )}
                {lead.source && (
                  <span className="inline-flex px-2.5 py-1 rounded-lg bg-muted text-muted-foreground text-sm">
                    Source: {lead.source}
                  </span>
                )}
                {lead.probability != null && (
                  <span className="inline-flex px-2.5 py-1 rounded-lg bg-amber-200/80 dark:bg-amber-500/20 text-amber-950 dark:text-amber-200 text-sm">
                    {lead.probability}% probability
                  </span>
                )}
              </div>
            </section>

            {/* Revenue & dates */}
            {((lead.expectedRevenue != null && lead.expectedRevenue > 0) ||
              lead.expectedClosingDate ||
              actualEmailCount > 0 ||
              lead.createdAt ||
              lead.updatedAt) && (
              <section className="px-6 py-5">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Revenue &amp; dates
                </h2>
                <div className="space-y-2 text-sm text-foreground">
                  {lead.expectedRevenue != null && lead.expectedRevenue > 0 && (
                    <p className="font-semibold text-emerald-600">
                      $
                      {lead.expectedRevenue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      expected revenue
                    </p>
                  )}
                  {lead.expectedClosingDate && (
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400 shrink-0" />
                      Expected close {new Date(lead.expectedClosingDate).toLocaleDateString()}
                    </p>
                  )}
                  {actualEmailCount > 0 && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
                      {actualEmailCount} email{actualEmailCount !== 1 ? 's' : ''}
                      {lastEmailDate &&
                        ` · Last ${lastEmailDate.toLocaleDateString()}`}
                    </p>
                  )}
                  {(lead.createdAt || lead.updatedAt) && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                      {lead.createdAt && <>Created {new Date(lead.createdAt).toLocaleDateString()}</>}
                      {lead.updatedAt && lead.createdAt !== lead.updatedAt && (
                        <>{lead.createdAt ? ' · ' : ''}Updated {new Date(lead.updatedAt).toLocaleDateString()}</>
                      )}
                    </p>
                  )}
                </div>
              </section>
            )}

            {lead.notes && lead.notes.trim() && (
              <section className="px-6 py-5">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Notes</h2>
                <p className="text-sm text-foreground whitespace-pre-wrap rounded-lg bg-muted p-4 border border-neutral-100">
                  {lead.notes}
                </p>
              </section>
            )}

            {lead.tags && lead.tags.length > 0 && (
              <section className="px-6 py-5">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tags</h2>
                <div className="flex flex-wrap gap-1.5">
                  {lead.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${TAG_COLORS[idx % TAG_COLORS.length]}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {lead.activities && lead.activities.length > 0 && (
              <section className="px-6 py-5">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Activities
                </h2>
                <ul className="space-y-2">
                  {lead.activities.slice(0, 10).map((act, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm rounded-lg bg-muted/50 p-3 border border-border"
                    >
                      <FileText className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-neutral-800">{act.type}</p>
                        {act.summary && <p className="text-neutral-600 text-xs mt-0.5">{act.summary}</p>}
                        {act.scheduledDate && (
                          <p className="text-muted-foreground text-xs mt-1">
                            {new Date(act.scheduledDate).toLocaleDateString()}
                            {act.status && ` · ${act.status}`}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Emails */}
            <section className="px-6 py-5">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-neutral-400" />
                Emails received on website
              </h2>
              {emailsLoading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading emails…</span>
                </div>
              ) : emails.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 rounded-lg bg-muted/50 border border-border px-4">
                  No emails found for this lead.
                </p>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const permitClientEmails = emails.filter(isPermitOrClientEmail);
                    const otherEmails = emails.filter((e) => !isPermitOrClientEmail(e));
                    const renderEmailList = (list: LeadDetailEmail[]) => (
                      <div className="space-y-2">
                        {list.map((email) => (
                          <Collapsible
                            key={email._id}
                            open={expandedEmailIds.has(email._id)}
                            onOpenChange={() => toggleEmailExpanded(email._id)}
                          >
                            <div className="rounded-lg border border-border overflow-hidden bg-surface shadow-sm hover:shadow-md hover:border-neutral-300 transition-all">
                              <CollapsibleTrigger asChild>
                                <button
                                  type="button"
                                  className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-accent transition-colors"
                                  aria-expanded={expandedEmailIds.has(email._id)}
                                  title={expandedEmailIds.has(email._id) ? 'Retract email' : 'Expand email'}
                                >
                                  <span className="mt-0.5 shrink-0 text-neutral-400">
                                    {expandedEmailIds.has(email._id) ? (
                                      <ChevronUp className="w-4 h-4" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {email.subject || '(No subject)'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {email.direction === 'inbound'
                                        ? `${email.from?.name || email.from?.email || 'Unknown'} → You`
                                        : `You → ${email.to?.name || email.to?.email || 'Unknown'}`}
                                    </p>
                                    <p className="text-xs text-neutral-400 mt-0.5">
                                      {new Date(email.receivedAt).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  </div>
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="border-t border-border px-3 py-3 bg-muted/50">
                                  {email.htmlBody ? (
                                    <div
                                      className="prose prose-sm max-w-none text-foreground text-sm email-body"
                                      dangerouslySetInnerHTML={{ __html: email.htmlBody }}
                                      style={{
                                        fontFamily: 'system-ui, -apple-system, sans-serif',
                                        lineHeight: 1.5,
                                        wordBreak: 'break-word',
                                      }}
                                    />
                                  ) : (
                                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                      {email.body || '—'}
                                    </p>
                                  )}
                                  {email.attachments && email.attachments.length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                      {email.attachments.length} attachment
                                      {email.attachments.length !== 1 ? 's' : ''}
                                    </p>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </div>
                          </Collapsible>
                        ))}
                      </div>
                    );
                    return (
                      <>
                        {permitClientEmails.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">
                              Permit &amp; Client Related ({permitClientEmails.length})
                            </p>
                            {renderEmailList(permitClientEmails)}
                          </div>
                        )}
                        {permitClientEmails.length > 0 && otherEmails.length > 0 && (
                          <div className="border-t border-border my-4" role="separator" aria-hidden />
                        )}
                        {otherEmails.length > 0 && (
                          <div>
                            {permitClientEmails.length === 0 && (
                              <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                                All Emails ({otherEmails.length})
                              </p>
                            )}
                            {renderEmailList(otherEmails)}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
