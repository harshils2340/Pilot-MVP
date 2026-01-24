'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Mail,
  Phone,
  ArrowLeft,
  Plus,
  Trash2,
  Activity,
  Calendar,
  Star,
  Clock,
  FileText,
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog';
import { Textarea } from '@/app/components/ui/textarea';

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
  expectedClosingDate?: string;
  activities?: Array<{
    _id?: string;
    type: 'email' | 'call' | 'task' | 'meeting';
    summary: string;
    scheduledDate: string;
    status: 'planned' | 'done' | 'canceled';
  }>;
  emailCount: number;
  lastEmailDate?: string;
  firstEmailDate?: string;
  emails?: Array<{
    emailId: string;
    subject: string;
    receivedAt: string;
    direction: 'inbound' | 'outbound';
  }>;
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
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

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'email': return Mail;
    case 'call': return Phone;
    case 'meeting': return Calendar;
    default: return Activity;
  }
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || null;

  const [lead, setLead] = useState<Lead | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'call' as 'email' | 'call' | 'task' | 'meeting',
    summary: '',
    description: '',
    scheduledDate: '',
  });

  const fetchLead = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/crm/leads/${id}`);
      const data = await res.json();
      if (res.ok && data.lead) setLead(data.lead);
      else setLead(null);
    } catch {
      setLead(null);
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
    if (id) {
      setLoading(true);
      fetchLead();
    } else {
      setLoading(false);
      setLead(null);
    }
  }, [id]);

  const handleStatusChange = async (newStatus: Lead['status']) => {
    if (!lead) return;
    try {
      const res = await fetch(`/api/crm/leads/${lead._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setLead(data.lead);
      }
    } catch (e) {
      console.error('Error updating status:', e);
    }
  };

  const handleStageChange = async (stageId: string, stageName: string, probability: number) => {
    if (!lead) return;
    try {
      const res = await fetch(`/api/crm/leads/${lead._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId, stageName, probability }),
      });
      if (res.ok) {
        const data = await res.json();
        setLead(data.lead);
      }
    } catch (e) {
      console.error('Error updating stage:', e);
    }
  };

  const handleDeleteLead = async () => {
    if (!lead || !confirm('Are you sure you want to delete this lead?')) return;
    try {
      const res = await fetch(`/api/crm/leads/${lead._id}`, { method: 'DELETE' });
      if (res.ok) router.push('/?view=leads');
    } catch (e) {
      console.error('Error deleting lead:', e);
    }
  };

  const handleCreateActivity = async () => {
    if (!lead || !newActivity.summary || !newActivity.scheduledDate) {
      alert('Please fill in summary and scheduled date');
      return;
    }
    try {
      const res = await fetch(`/api/crm/leads/${lead._id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newActivity),
      });
      if (res.ok) {
        setShowActivityDialog(false);
        setNewActivity({ type: 'call', summary: '', description: '', scheduledDate: '' });
        await fetchLead();
      }
    } catch (e) {
      console.error('Error creating activity:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-neutral-600">Lead not found.</p>
        <Button variant="outline" onClick={() => router.push('/?view=leads')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leads
        </Button>
      </div>
    );
  }

  const latestEmail = lead.emails && lead.emails.length > 0
    ? [...lead.emails].sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())[0]
    : null;

  const tags = lead.tags?.length ? lead.tags : (lead.stageName ? [lead.stageName] : [lead.status]);
  const stars = Math.min(5, Math.round((lead.probability ?? 0) / 20));
  const nextActivity = lead.activities?.find((a) => a.status === 'planned');
  const hasCall = lead.activities?.some((a) => a.type === 'call');
  const hasNotes = !!(lead.notes && lead.notes.trim());

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar: Back to Leads only */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/?view=leads')}
          className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Button>
      </div>

      {/* Lead details – Image 1 style card + sections */}
      <div className="max-w-2xl mx-auto py-8 px-6">
        {/* Image 1–style lead card */}
        <div className="bg-white rounded-xl border-2 border-neutral-200 shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-xl font-bold text-neutral-900 leading-tight flex-1">
                {lead.name}
              </h1>
              <Button variant="outline" size="sm" onClick={handleDeleteLead} className="text-red-600 border-red-200 hover:bg-red-50 flex-shrink-0">
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
            {(lead.expectedRevenue != null && lead.expectedRevenue > 0) && (
              <p className="text-lg font-semibold text-emerald-600 mb-2">
                ${lead.expectedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
            {lead.company && (
              <p className="text-sm text-neutral-500 mb-3">{lead.company}</p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium ${TAG_COLORS[idx % TAG_COLORS.length]}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i <= stars ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'}`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-sm text-neutral-600" title="Emails">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  {lead.emailCount ?? 0}
                </span>
                {hasCall && (
                  <span className="text-neutral-500" title="Has call activity">
                    <Phone className="w-4 h-4 text-emerald-600 inline" />
                  </span>
                )}
                {nextActivity && (
                  <span className="inline-flex items-center gap-1 text-sm text-blue-600" title="Next activity">
                    {nextActivity.type === 'meeting' ? (
                      <Calendar className="w-4 h-4" />
                    ) : nextActivity.type === 'call' ? (
                      <Phone className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    <span className="truncate max-w-[120px]">{nextActivity.summary}</span>
                  </span>
                )}
                {hasNotes && (
                  <span className="text-neutral-500" title="Has notes">
                    <FileText className="w-4 h-4 text-emerald-600 inline" />
                  </span>
                )}
              </div>
              <div
                className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-base font-semibold text-neutral-700 flex-shrink-0"
                title={lead.name}
              >
                {(lead.name || '?').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Detail sections – inside same image-style card */}
          <div className="border-t border-neutral-200 p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-500 uppercase tracking-wider">Status</label>
                <Select value={lead.status} onValueChange={(v) => handleStatusChange(v as Lead['status'])}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {stages.length > 0 && (
                <div>
                  <label className="text-xs text-neutral-500 uppercase tracking-wider">Stage</label>
                  <Select
                    value={lead.stageId || stages[0]?._id}
                    onValueChange={(v) => {
                      const s = stages.find((x) => x._id === v);
                      if (s) handleStageChange(s._id, s.name, s.probability);
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((s) => (
                        <SelectItem key={s._id} value={s._id}>
                          {s.name} ({s.probability}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-2">Contact</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-neutral-400" />
                  <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                    {lead.email}
                  </a>
                </div>
                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-neutral-400" />
                    <span>{lead.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-neutral-900">Activities</h3>
                <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule activity</DialogTitle>
                      <DialogDescription>Create a follow-up activity for this lead.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm font-medium">Type</label>
                        <Select
                          value={newActivity.type}
                          onValueChange={(v: 'email' | 'call' | 'task' | 'meeting') =>
                            setNewActivity({ ...newActivity, type: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="call">Call</SelectItem>
                            <SelectItem value="task">Task</SelectItem>
                            <SelectItem value="meeting">Meeting</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Summary *</label>
                        <Input
                          value={newActivity.summary}
                          onChange={(e) => setNewActivity({ ...newActivity, summary: e.target.value })}
                          placeholder="Activity summary"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={newActivity.description}
                          onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                          placeholder="Description"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Scheduled date *</label>
                        <Input
                          type="datetime-local"
                          value={newActivity.scheduledDate}
                          onChange={(e) => setNewActivity({ ...newActivity, scheduledDate: e.target.value })}
                        />
                      </div>
                      <Button onClick={handleCreateActivity} className="w-full">
                        Create activity
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2">
                {lead.activities && lead.activities.length > 0 ? (
                  lead.activities.map((a, idx) => {
                    const Icon = getActivityIcon(a.type);
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-start gap-2"
                      >
                        <Icon className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm text-neutral-900">{a.summary}</p>
                          <p className="text-xs text-neutral-500">
                            {formatDateTime(a.scheduledDate)} · {a.status}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-neutral-500">No activities scheduled.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-2">Emails</h3>
              <p className="text-sm text-neutral-600">
                <span className="font-medium text-neutral-900">{lead.emailCount}</span> tracked
              </p>
              {lead.firstEmailDate && (
                <p className="text-xs text-neutral-500 mt-1">
                  First: {formatDateTime(lead.firstEmailDate)}
                </p>
              )}
              {lead.lastEmailDate && (
                <p className="text-xs text-neutral-500">Last: {formatDateTime(lead.lastEmailDate)}</p>
              )}
              {lead.emails && lead.emails.length > 0 && (
                <div className="mt-2 space-y-2">
                  {lead.emails.slice(0, 5).map((e, idx) => (
                    <div key={idx} className="p-2 rounded border border-neutral-200 text-xs">
                      <p className="font-medium text-neutral-900 truncate">{e.subject}</p>
                      <p className="text-neutral-500">
                        {formatDateTime(e.receivedAt)} · {e.direction}
                      </p>
                    </div>
                  ))}
                  {lead.emails.length > 5 && (
                    <p className="text-xs text-neutral-500">+{lead.emails.length - 5} more</p>
                  )}
                </div>
              )}
            </div>

            {latestEmail && (
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-2">Follow up</h3>
                <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-700">
                  {formatDateTime(latestEmail.receivedAt)} - {latestEmail.direction}
                </div>
              </div>
            )}

            {lead.notes && (
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-2">Notes</h3>
                <p className="text-sm text-neutral-600 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-neutral-200 text-xs text-neutral-500 space-y-1">
              <p>Source: {lead.source || 'Unknown'}</p>
              <p>Created: {formatDateTime(lead.createdAt)}</p>
              <p>Updated: {formatDateTime(lead.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
