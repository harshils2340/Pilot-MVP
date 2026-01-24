'use client';

import { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  Tag, 
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  UserPlus,
  Activity,
  DollarSign
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
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
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
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
  expectedClosingDate?: string;
  activities?: Array<{
    _id?: string;
    type: 'email' | 'call' | 'task' | 'meeting';
    summary: string;
    scheduledDate: string;
    status: 'planned' | 'done' | 'canceled';
  }>;
  nextActivityDate?: string;
  emailCount: number;
  lastEmailDate?: string;
  tags?: string[];
}

interface PipelineStage {
  _id: string;
  name: string;
  sequence: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
}

export function LeadsKanban() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'call' as 'email' | 'call' | 'task' | 'meeting',
    summary: '',
    description: '',
    scheduledDate: '',
  });

  useEffect(() => {
    fetchStages();
    fetchLeads();
  }, []);

  const fetchStages = async () => {
    try {
      const response = await fetch('/api/crm/pipeline/stages');
      const data = await response.json();
      if (response.ok) {
        setStages(data.stages || []);
      }
    } catch (error) {
      console.error('Error fetching stages:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/crm/leads');
      const data = await response.json();
      
      if (response.ok) {
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = async (leadId: string, newStageId: string, newStageName: string, probability: number) => {
    try {
      const response = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stageId: newStageId,
          stageName: newStageName,
          probability: probability,
        }),
      });
      
      if (response.ok) {
        fetchLeads();
      }
    } catch (error) {
      console.error('Error updating lead stage:', error);
    }
  };

  const handleCreateActivity = async () => {
    if (!selectedLead || !newActivity.summary || !newActivity.scheduledDate) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`/api/crm/leads/${selectedLead._id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newActivity),
      });

      if (response.ok) {
        setShowActivityDialog(false);
        setNewActivity({ type: 'call', summary: '', description: '', scheduledDate: '' });
        fetchLeads();
        if (selectedLead) {
          const updated = await fetch(`/api/crm/leads/${selectedLead._id}`).then(r => r.json());
          setSelectedLead(updated.lead);
        }
      }
    } catch (error) {
      console.error('Error creating activity:', error);
    }
  };

  const getLeadsByStage = (stageId: string) => {
    return leads.filter(lead => lead.stageId === stageId || (!lead.stageId && stageId === stages[0]?._id));
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'call': return Phone;
      case 'meeting': return Calendar;
      default: return Activity;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-neutral-500">Loading pipeline...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-neutral-900">Leads Pipeline</h1>
            <p className="text-sm text-neutral-500 mt-1">
              Drag and drop leads between stages (Odoo CRM style)
            </p>
          </div>

          {/* Pipeline Stages */}
          <div className="flex gap-4 min-w-max">
            {stages.map((stage) => {
              const stageLeads = getLeadsByStage(stage._id);
              return (
                <div
                  key={stage._id}
                  className="flex-shrink-0 w-80 bg-neutral-100 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-neutral-900">{stage.name}</h3>
                      <p className="text-xs text-neutral-500">
                        {stage.probability}% probability • {stageLeads.length} leads
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {stageLeads.map((lead) => {
                      const StatusIcon = lead.status === 'converted' ? CheckCircle : 
                                        lead.status === 'lost' ? XCircle : Clock;
                      const NextActivity = lead.activities?.find(a => a.status === 'planned');
                      const ActivityIcon = NextActivity ? getActivityIcon(NextActivity.type) : null;

                      return (
                        <div
                          key={lead._id}
                          onClick={() => setSelectedLead(lead)}
                          className="bg-white border border-neutral-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-neutral-900">{lead.name}</h4>
                              {lead.company && (
                                <p className="text-xs text-neutral-500 mt-1">{lead.company}</p>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {stages.map((s) => (
                                  <DropdownMenuItem
                                    key={s._id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStageChange(lead._id, s._id, s.name, s.probability);
                                    }}
                                  >
                                    Move to {s.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2 text-neutral-600">
                              <Mail className="w-3 h-3" />
                              <span>{lead.email}</span>
                            </div>
                            
                            {lead.expectedRevenue && (
                              <div className="flex items-center gap-2 text-green-600 font-medium">
                                <DollarSign className="w-3 h-3" />
                                <span>${lead.expectedRevenue.toLocaleString()}</span>
                              </div>
                            )}

                            {NextActivity && ActivityIcon && (
                              <div className="flex items-center gap-2 text-blue-600">
                                <ActivityIcon className="w-3 h-3" />
                                <span>{NextActivity.summary}</span>
                                <span className="text-neutral-400">
                                  {formatDate(NextActivity.scheduledDate)}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-100 text-blue-700 text-xs">
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {lead.status}
                              </Badge>
                              {lead.probability !== undefined && (
                                <span className="text-neutral-500">
                                  {lead.probability}%
                                </span>
                              )}
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
        </div>
      </div>

      {/* Lead Detail Sidebar */}
      {selectedLead && (
        <div className="w-96 bg-white border-l border-neutral-200 flex flex-col">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Lead Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLead(null)}
              >
                ×
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-6 space-y-6">
            {/* Contact Info */}
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-neutral-500">Name:</span>
                  <span className="ml-2 text-neutral-900">{selectedLead.name}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Email:</span>
                  <span className="ml-2 text-neutral-900">{selectedLead.email}</span>
                </div>
                {selectedLead.phone && (
                  <div>
                    <span className="text-neutral-500">Phone:</span>
                    <span className="ml-2 text-neutral-900">{selectedLead.phone}</span>
                  </div>
                )}
                {selectedLead.company && (
                  <div>
                    <span className="text-neutral-500">Company:</span>
                    <span className="ml-2 text-neutral-900">{selectedLead.company}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pipeline Stage */}
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-3">Pipeline Stage</h3>
              <Select
                value={selectedLead.stageId || stages[0]?._id}
                onValueChange={(value) => {
                  const stage = stages.find(s => s._id === value);
                  if (stage) {
                    handleStageChange(selectedLead._id, stage._id, stage.name, stage.probability);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage._id} value={stage._id}>
                      {stage.name} ({stage.probability}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Activities */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-neutral-900">Activities</h3>
                <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Activity
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule Activity</DialogTitle>
                      <DialogDescription>
                        Create a follow-up activity for this lead
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <label className="text-sm font-medium">Type</label>
                        <Select
                          value={newActivity.type}
                          onValueChange={(value: any) => setNewActivity({ ...newActivity, type: value })}
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
                          placeholder="Activity description"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Scheduled Date *</label>
                        <Input
                          type="datetime-local"
                          value={newActivity.scheduledDate}
                          onChange={(e) => setNewActivity({ ...newActivity, scheduledDate: e.target.value })}
                        />
                      </div>
                      <Button onClick={handleCreateActivity} className="w-full">
                        Create Activity
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2">
                {selectedLead.activities && selectedLead.activities.length > 0 ? (
                  selectedLead.activities.map((activity, idx) => {
                    const ActivityIcon = getActivityIcon(activity.type);
                    return (
                      <div key={idx} className="p-3 bg-neutral-50 rounded border border-neutral-200">
                        <div className="flex items-center gap-2 mb-1">
                          <ActivityIcon className="w-4 h-4 text-neutral-600" />
                          <span className="font-medium text-sm">{activity.summary}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {activity.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-neutral-500">
                          {formatDate(activity.scheduledDate)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-neutral-500">No activities scheduled</p>
                )}
              </div>
            </div>

            {/* Email Activity */}
            <div>
              <h3 className="text-sm font-medium text-neutral-900 mb-3">Email Activity</h3>
              <div className="text-sm text-neutral-600">
                <span className="font-medium">{selectedLead.emailCount}</span> email{selectedLead.emailCount !== 1 ? 's' : ''} tracked
              </div>
              {selectedLead.lastEmailDate && (
                <div className="text-xs text-neutral-500 mt-1">
                  Last: {formatDate(selectedLead.lastEmailDate)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
