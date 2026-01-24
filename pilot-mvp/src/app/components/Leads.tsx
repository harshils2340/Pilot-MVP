'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Phone,
  Search,
  RefreshCw,
  MoreVertical,
  Trash2,
  Calendar,
  Clock,
  Plus,
  Star,
  FileText,
  LayoutGrid,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  stageId?: string;
  stageName?: string;
  probability?: number;
  expectedRevenue?: number;
  activities?: Array<{
    _id?: string;
    type: 'email' | 'call' | 'task' | 'meeting';
    summary: string;
    scheduledDate: string;
    status: 'planned' | 'done' | 'canceled';
  }>;
  emailCount: number;
  lastEmailDate?: string;
  tags?: string[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PipelineStage {
  _id: string;
  name: string;
  sequence: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
}

const TAG_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-red-100 text-red-700',
  'bg-blue-100 text-blue-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-sky-100 text-sky-700',
];

const COLUMN_MIN_W = 280;
const PAGE_SIZE = 10;

export function Leads() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChip, setFilterChip] = useState<string>('all');
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
  const [addLeadStage, setAddLeadStage] = useState<PipelineStage | null>(null);
  const [newLead, setNewLead] = useState({ name: '', email: '', company: '' });
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [movingStage, setMovingStage] = useState<{ stage: PipelineStage; count: number } | null>(null);
  const [lastMovedLeadIds, setLastMovedLeadIds] = useState<Set<string>>(new Set());

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      const res = await fetch(`/api/crm/leads?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setLeads(data.leads || []);
      else setLeads([]);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStages = async () => {
    try {
      const res = await fetch('/api/crm/pipeline/stages');
      const data = await res.json();
      if (res.ok) setStages(data.stages || []);
      else setStages([]);
    } catch {
      setStages([]);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [searchQuery]);

  useEffect(() => {
    setDisplayLimit(PAGE_SIZE);
  }, [searchQuery, filterChip]);

  useEffect(() => {
    setSelectedLeadIds(new Set());
    setLastMovedLeadIds(new Set());
  }, [searchQuery, filterChip]);

  const getLeadsByStage = (stageId: string) => {
    return leads.filter(
      (l) => l.stageId === stageId || (!l.stageId && stageId === stages[0]?._id)
    );
  };

  const getStageRevenue = (stageId: string) => {
    return getLeadsByStage(stageId).reduce((sum, l) => sum + (l.expectedRevenue || 0), 0);
  };

  const filteredLeadsByStage = (stageId: string) => {
    const stageLeads = getLeadsByStage(stageId);
    const searchFiltered = !searchQuery.trim()
      ? stageLeads
      : stageLeads.filter((l) => {
          const q = searchQuery.toLowerCase();
          return (
            l.name?.toLowerCase().includes(q) ||
            l.company?.toLowerCase().includes(q) ||
            l.email?.toLowerCase().includes(q)
          );
        });
    const visibleIds = new Set(visibleLeads.map((l) => l._id));
    return searchFiltered.filter((l) => visibleIds.has(l._id));
  };

  const visibleStages =
    filterChip === 'pre-sales'
      ? stages.filter((s) => !s.isWon && !s.isLost)
      : stages;

  const visibleStageIds = new Set(visibleStages.map((s) => s._id));
  const leadsInVisibleStages = leads.filter((l) => {
    const sid = l.stageId || stages[0]?._id;
    return sid && visibleStageIds.has(sid);
  });

  const stageSeqMap = new Map(visibleStages.map((s) => [s._id, s.sequence]));
  const getLeadSeq = (l: Lead) => {
    const sid = l.stageId || stages[0]?._id;
    return stageSeqMap.get(sid) ?? 999;
  };

  const orderedLeads = [...leadsInVisibleStages].sort((a, b) => {
    const sa = getLeadSeq(a);
    const sb = getLeadSeq(b);
    if (sa !== sb) return sa - sb;
    const da = new Date(a.lastEmailDate || a.updatedAt || 0).getTime();
    const db = new Date(b.lastEmailDate || b.updatedAt || 0).getTime();
    return db - da;
  });

  const baseVisible = orderedLeads.slice(0, displayLimit);
  const baseIds = new Set(baseVisible.map((l) => l._id));
  const extraMoved = lastMovedLeadIds.size
    ? orderedLeads.filter((l) => lastMovedLeadIds.has(l._id) && !baseIds.has(l._id))
    : [];
  const visibleLeads = extraMoved.length ? [...baseVisible, ...extraMoved] : baseVisible;
  const totalLeads = leadsInVisibleStages.length;
  const rangeEnd = Math.min(displayLimit, totalLeads);
  const hasMore = displayLimit < totalLeads;

  const toggleSelect = (id: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedLeadIds(new Set(visibleLeads.map((l) => l._id)));
  };

  const clearSelection = () => setSelectedLeadIds(new Set());

  const isSelected = (id: string) => selectedLeadIds.has(id);

  const updateLeadStageLocal = (
    leadId: string,
    stageId: string,
    stageName: string,
    probability: number,
    status?: Lead['status']
  ) => {
    setLeads((prev) =>
      prev.map((l) =>
        l._id === leadId
          ? { ...l, stageId, stageName, probability, ...(status != null && { status }) }
          : l
      )
    );
  };

  const handleStageChange = async (
    leadId: string,
    stageId: string,
    stageName: string,
    probability: number
  ) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId, stageName, probability }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const s = stages.find((x) => x._id === stageId);
        const status = s?.isWon ? 'converted' : s?.isLost ? 'lost' : undefined;
        updateLeadStageLocal(leadId, stageId, stageName, probability, status);
        setLastMovedLeadIds((prev) => new Set(prev).add(leadId));
      } else {
        console.error('Stage update failed:', data);
        alert(data.error || 'Failed to move lead');
      }
    } catch (e) {
      console.error('Error updating stage:', e);
      alert('Failed to move lead');
    }
  };

  const handleMoveSelectedToStage = async (stage: PipelineStage) => {
    const ids = Array.from(selectedLeadIds);
    if (ids.length === 0) return;
    setMovingStage({ stage, count: ids.length });
    try {
      let ok = 0;
      let fail = 0;
      const movedIds: string[] = [];
      const { _id: stageId, name: stageName, probability } = stage;
      const status = stage.isWon ? 'converted' : stage.isLost ? 'lost' : undefined;
      for (const leadId of ids) {
        const res = await fetch(`/api/crm/leads/${leadId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stageId, stageName, probability }),
        });
        if (res.ok) {
          ok++;
          movedIds.push(leadId);
          updateLeadStageLocal(leadId, stageId, stageName, probability, status);
        } else fail++;
      }
      if (movedIds.length) setLastMovedLeadIds((prev) => new Set([...prev, ...movedIds]));
      clearSelection();
      if (fail > 0) alert(`Moved ${ok} leads. ${fail} failed.`);
    } catch (e) {
      console.error('Error moving leads:', e);
      alert('Failed to move leads');
    } finally {
      setMovingStage(null);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, { method: 'DELETE' });
      if (res.ok) await fetchLeads();
    } catch (e) {
      console.error('Error deleting lead:', e);
    }
  };

  const handleAddLead = async () => {
    if (!addLeadStage || !newLead.name.trim() || !newLead.email.trim()) {
      alert('Name and email are required');
      return;
    }
    try {
      const createRes = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newLead.name.trim(),
          email: newLead.email.trim(),
          company: newLead.company.trim() || undefined,
          source: 'manual',
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) {
        alert(createData.error || 'Failed to create lead');
        return;
      }
      const leadId = createData.lead?._id;
      if (leadId) {
        await fetch(`/api/crm/leads/${leadId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stageId: addLeadStage._id,
            stageName: addLeadStage.name,
            probability: addLeadStage.probability,
          }),
        });
      }
      setAddLeadStage(null);
      setNewLead({ name: '', email: '', company: '' });
      await fetchLeads();
      if (leadId) router.push(`/leads/${leadId}`);
    } catch (e) {
      console.error('Error adding lead:', e);
      alert('Failed to add lead');
    }
  };

  const priorityStars = (p?: number) => Math.min(5, Math.round((p ?? 0) / 20));

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header – Opportunities, search, filters */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-neutral-500" />
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">Opportunities</h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                Pipeline · Permit-related leads
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-neutral-50 border-neutral-200 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'pre-sales'].map((chip) => (
              <button
                key={chip}
                onClick={() => setFilterChip(chip)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterChip === chip
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {chip === 'all' ? 'All' : 'Pre-Sales'}
              </button>
            ))}
          </div>

          {selectedLeadIds.size > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-neutral-600">
                <span className="font-medium text-neutral-900">{selectedLeadIds.size}</span> selected
              </span>
              {movingStage ? (
                <span className="text-sm text-neutral-500 px-3 py-2">
                  Moving {movingStage.count} to {movingStage.stage.name}…
                </span>
              ) : (
                <Select
                  value=""
                  onValueChange={(stageId) => {
                    const s = stages.find((x) => x._id === stageId);
                    if (s) handleMoveSelectedToStage(s);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Move to…" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s) => (
                      <SelectItem key={s._id} value={s._id}>
                        Move to {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button variant="ghost" size="sm" onClick={clearSelection} disabled={!!movingStage}>
                Clear
              </Button>
            </div>
          )}

          {totalLeads > 0 && selectedLeadIds.size === 0 && !loading && (
            <Button variant="outline" size="sm" onClick={selectAllVisible}>
              Select all
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLastMovedLeadIds(new Set());
              fetchLeads();
            }}
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-neutral-500">Loading...</p>
          </div>
        ) : visibleStages.length === 0 ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-neutral-500">No pipeline stages.</p>
          </div>
        ) : totalLeads === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Mail className="w-12 h-12 text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No leads yet</h3>
            <p className="text-sm text-neutral-500 max-w-md">
              {searchQuery
                ? 'No matches for your search. Try a different query.'
                : 'Permit-related leads will appear here when emails about permits or licensing are received.'}
            </p>
          </div>
        ) : (
          <div className="flex gap-5 min-w-max pb-4">
            {visibleStages.map((stage) => {
              const stageLeads = filteredLeadsByStage(stage._id);
              const revenue = getStageRevenue(stage._id);
              const revDisplay =
                revenue > 0 ? revenue.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0';
              const totalInStage = getLeadsByStage(stage._id).length;

              return (
                <div
                  key={stage._id}
                  className="flex-shrink-0 flex flex-col rounded-xl border border-neutral-200 bg-neutral-50/80 overflow-hidden shadow-sm"
                  style={{ minWidth: COLUMN_MIN_W, width: COLUMN_MIN_W }}
                >
                  <div className="p-4 bg-white border-b border-neutral-200">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="font-semibold text-neutral-900">{stage.name}</h2>
                      <button
                        onClick={() => setAddLeadStage(stage)}
                        className="w-7 h-7 rounded flex items-center justify-center text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 transition-colors"
                        title="Add lead"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-200 overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(100, stage.probability)}%` }}
                      />
                    </div>
                    <p className="text-sm font-medium text-neutral-600">
                      {revDisplay} – {totalInStage} lead{totalInStage !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[220px]">
                    {stageLeads.map((lead) => {
                      const tags = lead.tags?.length
                        ? lead.tags
                        : lead.stageName
                          ? [lead.stageName]
                          : [lead.status];
                      const stars = priorityStars(lead.probability);
                      const nextActivity = lead.activities?.find((a) => a.status === 'planned');
                      const hasCall = lead.activities?.some((a) => a.type === 'call');
                      const hasNotes = !!(lead.notes && lead.notes.trim());

                      return (
                        <div
                          key={lead._id}
                          onClick={() => router.push(`/leads/${lead._id}`)}
                          className={`bg-white rounded-lg border shadow-sm p-4 cursor-pointer hover:shadow-md hover:border-neutral-300 transition-all ${
                            isSelected(lead._id) ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-neutral-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div
                              className="flex items-center gap-2 flex-1 min-w-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={isSelected(lead._id)}
                                onCheckedChange={() => toggleSelect(lead._id)}
                                aria-label={`Select ${lead.name}`}
                                className="shrink-0"
                              />
                              <h3 className="font-semibold text-neutral-900 text-sm leading-tight truncate">
                                {lead.name}
                              </h3>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 flex-shrink-0"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                {stages.map((s) => (
                                  <DropdownMenuItem
                                    key={s._id}
                                    onClick={() =>
                                      handleStageChange(lead._id, s._id, s.name, s.probability)
                                    }
                                  >
                                    Move to {s.name}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem
                                  onClick={() => handleDeleteLead(lead._id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {(lead.expectedRevenue != null && lead.expectedRevenue > 0) && (
                            <p className="text-sm font-semibold text-emerald-600 mb-1">
                              $
                              {lead.expectedRevenue.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </p>
                          )}
                          {lead.company && (
                            <p className="text-xs text-neutral-500 mb-2">{lead.company}</p>
                          )}
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {tags.slice(0, 3).map((tag, idx) => (
                                <span
                                  key={idx}
                                  className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${TAG_COLORS[idx % TAG_COLORS.length]}`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i <= stars ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex items-center gap-0.5 text-xs text-neutral-500"
                                title="Emails"
                              >
                                <Mail className="w-3 h-3 text-emerald-600" />
                                {lead.emailCount ?? 0}
                              </span>
                              {hasCall && (
                                <span title="Call">
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                </span>
                              )}
                              {nextActivity && (
                                <span
                                  className="inline-flex items-center gap-0.5 text-xs text-blue-600 truncate max-w-[80px]"
                                  title={nextActivity.summary}
                                >
                                  {nextActivity.type === 'meeting' ? (
                                    <Calendar className="w-3 h-3 flex-shrink-0" />
                                  ) : nextActivity.type === 'call' ? (
                                    <Phone className="w-3 h-3 flex-shrink-0" />
                                  ) : (
                                    <Clock className="w-3 h-3 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{nextActivity.summary}</span>
                                </span>
                              )}
                              {hasNotes && (
                                <span title="Notes">
                                  <FileText className="w-3 h-3 text-emerald-600" />
                                </span>
                              )}
                            </div>
                            <div
                              className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-medium text-neutral-600 flex-shrink-0"
                              title={lead.name}
                            >
                              {(lead.name || '?').charAt(0).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination footer – only when we have leads in visible stages */}
      {!loading && totalLeads > 0 && (
        <div className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-3 border-t border-neutral-200 bg-white">
          <p className="text-sm text-neutral-600">
            <span className="font-medium text-neutral-900">
              {totalLeads === 0 ? '0' : `1–${rangeEnd}`} of {totalLeads}
            </span>
            <span className="text-neutral-500 ml-1">
              lead{totalLeads !== 1 ? 's' : ''}
            </span>
          </p>
          {hasMore ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisplayLimit((prev) => prev + PAGE_SIZE)}
              className="min-w-[100px]"
            >
              Load More
            </Button>
          ) : (
            <span className="text-xs text-neutral-400">All leads displayed</span>
          )}
        </div>
      )}

      {/* Add lead dialog */}
      <Dialog open={!!addLeadStage} onOpenChange={(open) => !open && setAddLeadStage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add lead</DialogTitle>
            <DialogDescription>
              Create a new lead in {addLeadStage?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={newLead.name}
                onChange={(e) => setNewLead((p) => ({ ...p, name: e.target.value }))}
                placeholder="Lead name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={newLead.email}
                onChange={(e) => setNewLead((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Company</label>
              <Input
                value={newLead.company}
                onChange={(e) => setNewLead((p) => ({ ...p, company: e.target.value }))}
                placeholder="Company"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddLead} className="flex-1">
                Create lead
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAddLeadStage(null);
                  setNewLead({ name: '', email: '', company: '' });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
