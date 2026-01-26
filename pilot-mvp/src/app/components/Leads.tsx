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
  ArrowLeft,
  Download,
  Settings,
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
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setIsDragging(true);
    setDraggedLeadId(leadId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', leadId);
    // Add visual feedback to the dragged element
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedLeadId(null);
    setDragOverStageId(null);
    // Reset dragging flag after a short delay to allow drop to complete
    setTimeout(() => setIsDragging(false), 100);
  };

  const handleCardClick = (e: React.MouseEvent, leadId: string) => {
    // Don't navigate if we just finished dragging or if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input[type="checkbox"]') ||
      target.closest('[role="menuitem"]') ||
      isDragging
    ) {
      return;
    }
    router.push(`/leads/${leadId}`);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStageId(stageId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're leaving the column area
    const relatedTarget = e.relatedTarget as HTMLElement;
    const currentTarget = e.currentTarget as HTMLElement;
    if (!currentTarget.contains(relatedTarget)) {
      setDragOverStageId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, stage: PipelineStage) => {
    e.preventDefault();
    e.stopPropagation();
    
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (!leadId) return;

    setDragOverStageId(null);
    setDraggedLeadId(null);

    // Don't update if dropped in the same stage
    const lead = leads.find((l) => l._id === leadId);
    const currentStageId = lead?.stageId || stages[0]?._id;
    if (currentStageId === stage._id) return;

    // Update the lead's stage
    await handleStageChange(leadId, stage._id, stage.name, stage.probability);
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

  const handleExportLeads = () => {
    try {
      // Create CSV content
      const headers = ['Name', 'Email', 'Company', 'Phone', 'Stage', 'Status', 'Probability', 'Expected Revenue', 'Email Count', 'Created At'];
      const rows = leads.map((lead) => [
        lead.name || '',
        lead.email || '',
        lead.company || '',
        lead.phone || '',
        lead.stageName || lead.status || '',
        lead.status || '',
        lead.probability?.toString() || '0',
        lead.expectedRevenue?.toString() || '0',
        lead.emailCount?.toString() || '0',
        lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leads-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting leads:', error);
      alert('Failed to export leads');
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header – matches Workspace theme */}
      <div className="flex-shrink-0 bg-white px-8 py-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <div>
              <h1 className="text-neutral-900 mb-1">Leads</h1>
              <p className="text-neutral-600">Pipeline · Permit-related opportunities</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                // Open add lead dialog for the first stage
                if (stages.length > 0) {
                  setAddLeadStage(stages[0]);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium"
              title="Add New Lead"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
            </button>
            <button
              onClick={handleExportLeads}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
              title="Export Leads"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm font-medium"
              title="Pipeline Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'pre-sales'].map((chip) => (
              <button
                key={chip}
                onClick={() => setFilterChip(chip)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  filterChip === chip
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
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
                <span className="text-sm text-neutral-600 px-3 py-2">
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
                  <SelectTrigger className="w-[180px] border-neutral-300">
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
              <button
                type="button"
                onClick={clearSelection}
                disabled={!!movingStage}
                className="px-4 py-2 text-sm text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          )}

          {totalLeads > 0 && selectedLeadIds.size === 0 && !loading && (
            <button
              type="button"
              onClick={selectAllVisible}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Select all
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setLastMovedLeadIds(new Set());
              fetchLeads();
            }}
            title="Refresh"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto px-8 pb-8">
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
                  className={`flex-shrink-0 flex flex-col rounded-xl border overflow-hidden shadow-sm transition-all ${
                    dragOverStageId === stage._id
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-lg ring-2 ring-emerald-500/20'
                      : 'border-neutral-200 bg-neutral-50/80'
                  }`}
                  style={{ minWidth: COLUMN_MIN_W, width: COLUMN_MIN_W }}
                  onDragOver={(e) => handleDragOver(e, stage._id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage)}
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
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead._id)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => handleCardClick(e, lead._id)}
                          className={`bg-white rounded-lg border shadow-sm p-4 cursor-move hover:shadow-md hover:border-neutral-300 transition-all ${
                            isSelected(lead._id) ? 'border-emerald-500 ring-1 ring-emerald-500/30' : 'border-neutral-200'
                          } ${
                            draggedLeadId === lead._id ? 'opacity-50' : ''
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
