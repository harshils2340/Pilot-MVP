'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Bell,
  Check,
  CheckCheck,
  FileText,
  UserPlus,
  Mail,
  Calendar,
  Clock,
  Search,
  RefreshCw,
  ChevronRight,
  Inbox,
  ExternalLink,
  Settings,
  Download,
  Save,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  BookOpen,
  PlayCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from './ui/sheet';

interface Notification {
  id: string;
  type: 'document' | 'lead' | 'permit' | 'email' | 'deadline' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  metadata?: {
    senderName?: string;
    documentName?: string;
    leadName?: string;
    permitName?: string;
    clientName?: string;
    [key: string]: any;
  };
}

type FilterType = 'all' | 'unread' | 'document' | 'lead' | 'permit' | 'email' | 'deadline';

interface CleanInboxProps {
  onAddLeadFromEmail?: (name: string, email: string) => void;
}

export function CleanInbox({ onAddLeadFromEmail }: CleanInboxProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [gmailAddonCardExpanded, setGmailAddonCardExpanded] = useState(true);
  const [gmailAddonExpanded, setGmailAddonExpanded] = useState(false);
  const [copiedStep, setCopiedStep] = useState<number | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [panelFormData, setPanelFormData] = useState<{
    name: string;
    email: string;
    company: string;
    phone: string;
    notes: string;
  }>({
    name: '',
    email: '',
    company: '',
    phone: '',
    notes: '',
  });

  useEffect(() => {
    // Initial load - show loading state immediately
    setLoading(true);
    // Fetch immediately
    fetchNotifications();
    // Poll for new notifications every 20 seconds (reduced frequency for better performance)
    const interval = setInterval(() => {
      fetchNotifications();
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      // Optimize: Fetch only recent data with limits and parallel requests
      // Use smaller limits to reduce data transfer and processing time
      const [docsRes, leadsRes, emailsRes, clientsRes, permitsRes, requestsRes] = await Promise.all([
        fetch('/api/documents?sortBy=createdAt&limit=30'), // Limit to 30 most recent (filtered to 20 client docs)
        fetch('/api/crm/leads?limit=15'), // Limit to 15 most recent leads (filtered to 10 recent)
        fetch('/api/emails/for-notifications'), // Already optimized endpoint (limited to 30)
        fetch('/api/clients?limit=100'), // Limit clients for name mapping (only IDs needed)
        fetch('/api/permits/management?limit=50'), // Limit permits (only for client mapping)
        fetch('/api/documents/requests?status=pending&limit=30'), // Limit pending requests
      ]);

      // Parse responses in parallel
      const [docs, leadsData, emailsData, clientsRaw, permitsList, pendingRaw] = await Promise.all([
        docsRes.ok ? docsRes.json() : Promise.resolve([]),
        leadsRes.ok ? leadsRes.json() : Promise.resolve({ leads: [] }),
        emailsRes.ok ? emailsRes.json() : Promise.resolve({ emails: [] }),
        clientsRes.ok ? clientsRes.json() : Promise.resolve(null),
        permitsRes.ok ? permitsRes.json() : Promise.resolve([]),
        requestsRes.ok ? requestsRes.json() : Promise.resolve(null),
      ]);

      const clientsList = Array.isArray(clientsRaw) ? clientsRaw : (clientsRaw?.clients ?? []);
      const pendingRequests = Array.isArray(pendingRaw) ? pendingRaw : [];

      // Optimize: Build maps more efficiently
      const clientNameMap: Record<string, string> = {};
      for (const c of clientsList || []) {
        const id = c._id ?? c.id;
        if (id) {
          clientNameMap[String(id)] = c.businessName || c.contactInfo?.name || 'Client';
        }
      }

      const permitsByClient: Record<string, { name: string; permitId?: string }[]> = {};
      for (const p of permitsList || []) {
        const cid = p.clientId;
        if (cid) {
          if (!permitsByClient[cid]) permitsByClient[cid] = [];
          permitsByClient[cid].push({ name: p.name || 'Permit', permitId: p.permitId });
        }
      }

      const pendingByClient: Record<string, any[]> = {};
      for (const r of pendingRequests || []) {
        const cid = r.clientId;
        if (cid) {
          if (!pendingByClient[cid]) pendingByClient[cid] = [];
          pendingByClient[cid].push(r);
        }
      }

      const allNotifications: Notification[] = [];

      // Optimize: Filter and limit documents early
      const now = Date.now();
      const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);
      const clientDocs = (docs || [])
        .filter((doc: any) => {
          if (!doc.uploadedBy?.isClient) return false;
          const docDate = new Date(doc.createdAt).getTime();
          return docDate >= fourteenDaysAgo;
        })
        .slice(0, 20);

      const fulfilledClients = new Set<string>();
      const fulfillPromises: Promise<void>[] = [];
      
      for (const doc of clientDocs) {
        const clientName = clientNameMap[doc.clientId] || doc.uploadedBy?.userName || 'Client';
        const permitName = doc.metadata?.permitName ?? permitsByClient[doc.clientId]?.[0]?.name ?? null;
        const hadPending = (pendingByClient[doc.clientId]?.length ?? 0) > 0;
        const shouldFulfill = hadPending && !fulfilledClients.has(doc.clientId);

        if (shouldFulfill) {
          fulfilledClients.add(doc.clientId);
          // Fire and forget - don't wait for fulfill API calls
          fulfillPromises.push(
            fetch('/api/documents/requests/fulfill', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clientId: doc.clientId, documentId: doc.id }),
            }).then(() => {}).catch(() => {}) // Silently fail
          );
        }

        const title = hadPending
          ? 'Document request fulfilled'
          : 'Document received';
        const message = permitName
          ? `Document for ${clientName} for ${permitName} has been received.`
          : `Document for ${clientName} has been received.`;
        const detail = doc.uploadedBy?.userName && doc.uploadedBy.userName !== clientName
          ? ` Uploaded by ${doc.uploadedBy.userName}: "${doc.name}".`
          : ` "${doc.name}".`;

        allNotifications.push({
          id: `doc-${doc.id}`,
          type: 'document',
          title,
          message: `${message}${detail}`,
          timestamp: new Date(doc.createdAt),
          read: false,
          priority: (doc.metadata?.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
          actionUrl: `/clients/${doc.clientId}`,
          metadata: {
            senderName: doc.uploadedBy?.userName,
            documentName: doc.name,
            documentId: doc.id,
            clientId: doc.clientId,
            clientName,
            permitName: permitName || undefined,
            fileType: doc.fileType,
            fileSize: doc.fileSize,
          },
        });
      }

      // Don't wait for fulfill API calls - let them run in background
      Promise.all(fulfillPromises).catch(() => {});

      // Lead notifications (recently created or updated) - already limited by API
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      const recentLeads = ((leadsData && leadsData.leads) || [])
        .filter((lead: any) => {
          const leadDate = new Date(lead.updatedAt || lead.createdAt).getTime();
          return leadDate >= sevenDaysAgo;
        })
        .slice(0, 10)
        .map((lead: any) => ({
          id: `lead-${lead._id}`,
          type: 'lead' as const,
          title: 'New Lead Added',
          message: `New lead "${lead.name}" added to ${lead.stageName || 'pipeline'}`,
          timestamp: new Date(lead.createdAt),
          read: false,
          priority: 'medium' as const,
          actionUrl: `/leads/${lead._id}`,
          metadata: {
            leadName: lead.name,
            leadId: lead._id,
            stageName: lead.stageName,
            company: lead.company,
          },
        }));

      // Email notifications (from any client or about any lead; from /api/emails/for-notifications)
      const emailNotifications = ((emailsData && emailsData.emails) || [])
        .slice(0, 30)
        .map((email: any) => ({
          id: `email-${email._id}`,
          type: 'email' as const,
          title: 'New Email Received',
          message: `From ${email.from?.name || email.from?.email || 'Unknown'}: ${email.subject || '(No subject)'}`,
          timestamp: new Date(email.receivedAt),
          read: email.status === 'read',
          priority: (email.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent',
          actionUrl: email.clientId ? `/clients/${email.clientId}` : undefined,
          metadata: {
            senderName: email.from?.name,
            senderEmail: email.from?.email,
            subject: email.subject,
            emailId: email._id,
            clientName: email.clientName,
            clientId: email.clientId,
            leadId: email.leadId,
            leadName: email.leadName,
          },
        }));

      allNotifications.push(...recentLeads, ...emailNotifications);
      
      // Sort by timestamp (newest first) - use efficient sort
      allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Limit total notifications to improve performance
      const limitedNotifications = allNotifications.slice(0, 50);
      
      setNotifications(limitedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Set empty array on error to prevent infinite loading
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notif.read) ||
      (filter === notif.type);
    
    const matchesSearch = !searchQuery || 
      notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.metadata?.senderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.metadata?.senderEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.metadata?.documentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.metadata?.leadName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.metadata?.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.metadata?.permitName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof notif.metadata?.subject === 'string' && notif.metadata.subject.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Extract data from notification metadata
    const m = notification.metadata || {};
    setPanelFormData({
      name: m.senderName || m.leadName || notification.message.split('"')[1] || '',
      email: m.senderEmail || m.email || '',
      company: m.company || m.clientName || '',
      phone: m.phone || '',
      notes: notification.message || '',
    });
    
    setSelectedNotification(notification);
  };

  const handleClosePanel = () => {
    setSelectedNotification(null);
    setPanelFormData({
      name: '',
      email: '',
      company: '',
      phone: '',
      notes: '',
    });
  };

  const handleSaveChanges = () => {
    if (!selectedNotification) return;
    
    // Update notification metadata with form data
    const updatedNotifications = notifications.map(n => {
      if (n.id === selectedNotification.id) {
        return {
          ...n,
          metadata: {
            ...n.metadata,
            senderName: panelFormData.name,
            senderEmail: panelFormData.email,
            company: panelFormData.company,
            phone: panelFormData.phone,
          },
          message: panelFormData.notes || n.message,
        };
      }
      return n;
    });
    
    setNotifications(updatedNotifications);
    toast.success('Changes saved successfully');
  };

  const handleAddToLead = async () => {
    if (!panelFormData.email) {
      toast.error('Email is required to add a lead');
      return;
    }
    
    if (!panelFormData.name) {
      toast.error('Name is required to add a lead');
      return;
    }

    try {
      // Always use direct API call to ensure all form data is sent
      const response = await fetch('/api/gmail/lead-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: panelFormData.name.trim(),
          email: panelFormData.email.trim(),
          company: panelFormData.company.trim() || undefined,
          phone: panelFormData.phone.trim() || undefined,
          notes: panelFormData.notes.trim() || undefined,
          source: 'email',
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success('Lead added successfully', {
          description: `${data.lead.name} has been added to Leads${data.lead.company ? ` (${data.lead.company})` : ''}`,
          duration: 4000,
        });
        
        // Also call the handler if provided (for navigation)
        if (onAddLeadFromEmail) {
          onAddLeadFromEmail(panelFormData.name, panelFormData.email);
        }
        
        handleClosePanel();
        
        // Refresh notifications to show the new lead notification
        setTimeout(() => {
          fetchNotifications();
        }, 500);
      } else {
        toast.error('Failed to add lead', {
          description: data.error || 'Please try again',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error adding lead:', error);
      toast.error('Error adding lead', {
        description: 'Please check your connection and try again',
        duration: 3000,
      });
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const classes = 'w-4 h-4';
    switch (type) {
      case 'document':
        return <FileText className={`${classes} text-blue-600`} />;
      case 'lead':
        return <UserPlus className={`${classes} text-violet-600`} />;
      case 'permit':
        return <Calendar className={`${classes} text-emerald-600`} />;
      case 'email':
        return <Mail className={`${classes} text-amber-600`} />;
      case 'deadline':
        return <Clock className={`${classes} text-rose-600`} />;
      default:
        return <Bell className={`${classes} text-muted-foreground`} />;
    }
  };

  const getIconBg = (type: Notification['type']) => {
    switch (type) {
      case 'document':
        return 'bg-blue-100';
      case 'lead':
        return 'bg-violet-100';
      case 'permit':
        return 'bg-emerald-100';
      case 'email':
        return 'bg-amber-100';
      case 'deadline':
        return 'bg-rose-100';
      default:
        return 'bg-muted';
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-rose-500 bg-rose-50/50';
      case 'high':
        return 'border-l-amber-500 bg-amber-50/50';
      case 'medium':
        return 'border-l-sky-500 bg-sky-50/50';
      default:
        return 'border-l-border bg-surface';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
  };

  const getNotificationTypeCount = (type: FilterType) => {
    if (type === 'all') return notifications.length;
    if (type === 'unread') return unreadCount;
    return notifications.filter(n => n.type === type).length;
  };

  return (
    <div className="h-full flex flex-col bg-page-bg">
      {/* Header */}
      <div className="flex-shrink-0 bg-surface/95 backdrop-blur-sm border-b border-border shadow-sm px-6 py-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">Notifications</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {unreadCount > 0 ? (
                  <span className="font-medium text-foreground">{unreadCount} unread</span>
                ) : (
                  <span className="text-emerald-600">All caught up!</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="flex items-center gap-2 border-border hover:bg-accent text-foreground"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNotifications}
              className="flex items-center gap-2 border-border hover:bg-accent text-foreground"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Enhanced Gmail Add-on Section */}
        <div className="mb-6 bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className={`p-5 bg-muted/50 ${gmailAddonCardExpanded ? 'border-b border-border' : ''}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-foreground">Gmail Add-on</h3>
                    <span className="px-2 py-0.5 bg-muted rounded-full text-xs font-medium text-muted-foreground">
                      Available
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Add leads directly from Gmail. View client information instantly when opening emails.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGmailAddonCardExpanded(!gmailAddonCardExpanded)}
                className="p-1.5 hover:bg-accent rounded-lg transition-colors shrink-0 text-muted-foreground hover:text-foreground"
                title={gmailAddonCardExpanded ? 'Collapse' : 'Expand'}
              >
                {gmailAddonCardExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {gmailAddonCardExpanded && (
            <>
            {/* Quick Actions */}
            <div className="p-5 bg-surface border-b border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  onClick={() => window.open('https://script.google.com/home', '_blank')}
                  variant="outline"
                  className="border-border hover:bg-accent text-foreground h-auto py-3 flex flex-col items-center gap-2"
                >
                  <ExternalLink className="w-5 h-5" />
                  <span className="text-sm font-medium">Open Apps Script</span>
                  <span className="text-xs text-muted-foreground">Start Setup</span>
                </Button>
                <Button
                  onClick={() => {
                    const instructions = `Gmail Add-on Setup Instructions:

1. Go to https://script.google.com
2. Click "+ New Project"
3. Copy Code.gs from pilot-mvp/gmail-addon/Code.gs
4. Enable appsscript.json (Project Settings → Show appsscript.json)
5. Copy appsscript.json from pilot-mvp/gmail-addon/appsscript.json
6. Click Deploy → New deployment → Add-on
7. Authorize permissions
8. Open Gmail and check the sidebar when viewing emails`;
                    navigator.clipboard.writeText(instructions);
                    toast.success('Setup instructions copied!', {
                      description: 'Paste them in a text editor for reference',
                    });
                    setCopiedStep(null);
                  }}
                  variant="outline"
                  className="border-border hover:bg-accent text-foreground h-auto py-3 flex flex-col items-center gap-2"
                >
                  <Copy className="w-5 h-5" />
                  <span className="text-sm font-medium">Copy Instructions</span>
                  <span className="text-xs text-muted-foreground">Quick Reference</span>
                </Button>
                <Button
                  onClick={() => window.open('https://mail.google.com', '_blank')}
                  className="bg-primary hover:opacity-90 text-primary-foreground h-auto py-3 flex flex-col items-center gap-2"
                >
                  <Mail className="w-5 h-5" />
                  <span className="text-sm font-medium">Open Gmail</span>
                  <span className="text-xs text-primary-foreground/80">Test Add-on</span>
                </Button>
              </div>
            </div>

            {/* Expandable Details */}
            <div className="bg-surface">
              <button
                onClick={() => setGmailAddonExpanded(!gmailAddonExpanded)}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-accent transition-colors border-t border-border"
              >
                <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  {gmailAddonExpanded ? 'Hide' : 'Show'} Setup Guide
                </span>
                {gmailAddonExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {gmailAddonExpanded && (
                <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
                  {/* Features List */}
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-muted-foreground" />
                      What You Can Do
                    </h4>
                    <ul className="space-y-2 text-sm text-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span>View client/lead info automatically when opening emails</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span>Add leads directly from Gmail with pre-filled information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span>Quick access to Pilot dashboard from Gmail sidebar</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <span>No need to switch between Gmail and Pilot</span>
                      </li>
                    </ul>
                  </div>

                  {/* Step-by-Step Guide */}
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-muted-foreground" />
                      Quick Setup Steps
                    </h4>
                    <ol className="space-y-3">
                      {[
                        { step: 1, text: 'Go to Google Apps Script and create a new project' },
                        { step: 2, text: 'Copy Code.gs content from pilot-mvp/gmail-addon/Code.gs' },
                        { step: 3, text: 'Enable appsscript.json in Project Settings' },
                        { step: 4, text: 'Copy appsscript.json content from pilot-mvp/gmail-addon/appsscript.json' },
                        { step: 5, text: 'Deploy → New deployment → Select "Add-on"' },
                        { step: 6, text: 'Authorize permissions and complete deployment' },
                        { step: 7, text: 'Open Gmail and check the sidebar when viewing emails' },
                      ].map(({ step, text }) => (
                        <li key={step} className="flex items-start gap-3 text-sm">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                            {step}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <span className="text-foreground">{text}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(text);
                                setCopiedStep(step);
                                toast.success(`Step ${step} copied!`);
                                setTimeout(() => setCopiedStep(null), 2000);
                              }}
                              className="ml-2 text-muted-foreground hover:text-foreground text-xs inline-flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              {copiedStep === step ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Help Section */}
                  <div className="bg-muted/50 border border-border rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-foreground mb-1">Need Help?</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          Check the detailed setup guide in <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-foreground">pilot-mvp/gmail-addon/YOUR_WORK_STEPS.md</code>
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const helpText = `For detailed setup instructions, see:
pilot-mvp/gmail-addon/YOUR_WORK_STEPS.md

Common Issues:
- Add-on not appearing: Wait 2-3 minutes after deployment
- Permission errors: Check OAuth consent screen settings
- API errors: Verify the API is deployed and accessible`;
                            navigator.clipboard.writeText(helpText);
                            toast.success('Help text copied!');
                          }}
                          className="text-xs border-border text-foreground hover:bg-accent"
                        >
                          <Copy className="w-3 h-3 mr-1.5" />
                          Copy Troubleshooting Tips
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            </>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by sender, subject, or keyword..."
            className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-border transition-colors text-foreground"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'unread', 'document', 'lead', 'email'] as FilterType[]).map((filterType) => {
            const count = getNotificationTypeCount(filterType);
            const isActive = filter === filterType;
            return (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3.5 py-2 text-sm font-medium rounded-xl transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <span>{filterType.charAt(0).toUpperCase() + filterType.slice(1)}</span>
                {count > 0 && (
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-lg ${
                    isActive ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-auto bg-page-bg">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-muted-foreground">Loading notifications...</p>
            <p className="text-xs text-muted-foreground mt-1">Checking documents, leads, and emails</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">
              {searchQuery ? 'No matches' : 'All caught up'}
            </p>
            <p className="text-sm text-muted-foreground text-center max-w-[280px]">
              {searchQuery ? 'Try a different search term or clear filters.' : "You have no new notifications. We'll alert you when something arrives."}
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-5 space-y-1">
            {filteredNotifications.map((notification, index) => {
              const isToday = notification.timestamp.toDateString() === new Date().toDateString();
              const isYesterday = notification.timestamp.toDateString() === new Date(Date.now() - 86400000).toDateString();
              const showDateDivider = index === 0 || 
                (index > 0 && filteredNotifications[index - 1].timestamp.toDateString() !== notification.timestamp.toDateString());
              const m = notification.metadata;
              const showSender = m?.senderName && (notification.type !== 'lead' || m.senderName !== m.leadName);
              const showLead = m?.leadName && (notification.type === 'lead' || (notification.type === 'email' && m.leadId));
              const showDoc = m?.documentName && notification.type === 'document';
              const showClient = m?.clientName && notification.type === 'email' && m.clientName !== m.senderName;

              return (
                <div key={notification.id} className="group">
                  {showDateDivider && (
                    <div className="sticky top-0 z-10 flex items-center gap-3 py-3 px-1 bg-page-bg/95 backdrop-blur-sm">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                        {isToday ? 'Today' : isYesterday ? 'Yesterday' : notification.timestamp.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: notification.timestamp.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        })}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}
                  <div
                    onClick={() => handleNotificationClick(notification)}
                    className={`relative border-l-4 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${
                      notification.read 
                        ? 'bg-surface border-border shadow-sm' 
                        : `${getPriorityColor(notification.priority)} border-l-4 shadow-sm`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${getIconBg(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <h3 className={`text-sm font-semibold ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0 ring-2 ring-sky-100" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
                              {notification.message}
                            </p>
                            {(showSender || showLead || showDoc || showClient) && (
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 flex-wrap">
                                {showSender && (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted">
                                    <UserPlus className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate max-w-[140px]">{m.senderName}</span>
                                  </span>
                                )}
                                {showLead && (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-50 text-violet-700">
                                    <UserPlus className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate max-w-[140px]">{m.leadName}</span>
                                  </span>
                                )}
                                {showDoc && (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-sky-50 text-sky-700" title={m.documentName}>
                                    <FileText className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate max-w-[180px]">{m.documentName}</span>
                                  </span>
                                )}
                                {showClient && (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 text-amber-700">
                                    <span className="truncate max-w-[120px]">{m.clientName}</span>
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{formatTimeAgo(notification.timestamp)}</span>
                              {notification.priority === 'urgent' && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-lg font-semibold">
                                  Urgent
                                </span>
                              )}
                              {notification.priority === 'high' && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg font-semibold">
                                  High
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            {notification.type === 'email' && onAddLeadFromEmail && notification.metadata?.senderEmail && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const m = notification.metadata;
                                  onAddLeadFromEmail(
                                    m?.senderName || m?.senderEmail || 'Unknown',
                                    m?.senderEmail || ''
                                  );
                                }}
                                className="p-2 text-violet-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
                                title="Add as lead"
                              >
                                <UserPlus className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                              title={notification.read ? 'Mark unread' : 'Mark read'}
                            >
                              {notification.read ? (
                                <CheckCheck className="w-4 h-4" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            {notification.actionUrl && (
                              <span className="p-1.5 text-muted-foreground rounded-lg" aria-hidden>
                                <ChevronRight className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notification Detail Panel */}
      <Sheet open={!!selectedNotification} onOpenChange={(open) => !open && handleClosePanel()}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
          {selectedNotification && (
            <div className="flex flex-col h-full">
              {/* Header */}
              <SheetHeader className="px-6 py-5 border-b border-border">
                <SheetTitle className="text-lg font-semibold text-emerald-600 mb-1">
                  {selectedNotification.title}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedNotification.message}
                </p>
              </SheetHeader>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Name
                    </label>
                    <input
                      type="text"
                      value={panelFormData.name}
                      onChange={(e) => setPanelFormData({ ...panelFormData, name: e.target.value })}
                      className="w-full px-0 py-2 border-0 border-b border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      placeholder="Enter name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Email
                    </label>
                    <input
                      type="email"
                      value={panelFormData.email}
                      onChange={(e) => setPanelFormData({ ...panelFormData, email: e.target.value })}
                      className="w-full px-0 py-2 border-0 border-b border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      placeholder="Enter email"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Company
                    </label>
                    <input
                      type="text"
                      value={panelFormData.company}
                      onChange={(e) => setPanelFormData({ ...panelFormData, company: e.target.value })}
                      className="w-full px-0 py-2 border-0 border-b border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      placeholder="Enter company"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={panelFormData.phone}
                      onChange={(e) => setPanelFormData({ ...panelFormData, phone: e.target.value })}
                      className="w-full px-0 py-2 border-0 border-b border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Note
                    </label>
                    <textarea
                      value={panelFormData.notes}
                      onChange={(e) => setPanelFormData({ ...panelFormData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-0 py-2 border-0 border-b border-border bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                      placeholder="Enter notes or additional information"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="px-6 py-4 border-t border-border bg-muted/50">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={handleClosePanel}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleAddToLead}
                    disabled={!panelFormData.name || !panelFormData.email}
                    className="px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add to Lead
                  </button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
