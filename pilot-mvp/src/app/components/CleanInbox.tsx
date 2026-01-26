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
} from 'lucide-react';
import { Button } from './ui/button';

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

export function CleanInbox() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [docsRes, leadsRes, emailsRes, clientsRes, permitsRes, requestsRes] = await Promise.all([
        fetch('/api/documents?sortBy=createdAt'),
        fetch('/api/crm/leads'),
        fetch('/api/emails?status=unread&limit=20'),
        fetch('/api/clients'),
        fetch('/api/permits/management'),
        fetch('/api/documents/requests?status=pending'),
      ]);

      const docs = docsRes.ok ? await docsRes.json() : [];
      const leadsData = leadsRes.ok ? await leadsRes.json() : { leads: [] };
      const emailsData = emailsRes.ok ? await emailsRes.json() : { emails: [] };
      const clientsRaw = clientsRes.ok ? await clientsRes.json() : null;
      const clientsList = Array.isArray(clientsRaw) ? clientsRaw : (clientsRaw?.clients ?? []);
      const permitsList = permitsRes.ok ? await permitsRes.json() : [];
      const pendingRaw = requestsRes.ok ? await requestsRes.json() : null;
      const pendingRequests = Array.isArray(pendingRaw) ? pendingRaw : [];

      const clientNameMap: Record<string, string> = {};
      (clientsList || []).forEach((c: any) => {
        const id = c._id ?? c.id;
        if (id) clientNameMap[String(id)] = c.businessName || c.contactInfo?.name || 'Client';
      });

      const permitsByClient: Record<string, { name: string; permitId?: string }[]> = {};
      (permitsList || []).forEach((p: any) => {
        const cid = p.clientId;
        if (!cid) return;
        if (!permitsByClient[cid]) permitsByClient[cid] = [];
        permitsByClient[cid].push({ name: p.name || 'Permit', permitId: p.permitId });
      });

      const pendingByClient: Record<string, any[]> = {};
      (pendingRequests || []).forEach((r: any) => {
        const cid = r.clientId;
        if (!pendingByClient[cid]) pendingByClient[cid] = [];
        pendingByClient[cid].push(r);
      });

      const allNotifications: Notification[] = [];

      const clientDocs = (docs || [])
        .filter((doc: any) => {
          const docDate = new Date(doc.createdAt);
          const daysAgo = (Date.now() - docDate.getTime()) / (1000 * 60 * 60 * 24);
          return doc.uploadedBy?.isClient && daysAgo <= 14;
        })
        .slice(0, 20);

      const fulfilledClients = new Set<string>();
      for (const doc of clientDocs) {
        const clientName = clientNameMap[doc.clientId] || doc.uploadedBy?.userName || 'Client';
        const permitName = doc.metadata?.permitName ?? permitsByClient[doc.clientId]?.[0]?.name ?? null;
        const hadPending = (pendingByClient[doc.clientId]?.length ?? 0) > 0;
        const shouldFulfill = hadPending && !fulfilledClients.has(doc.clientId);

        if (shouldFulfill) {
          fulfilledClients.add(doc.clientId);
          try {
            await fetch('/api/documents/requests/fulfill', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clientId: doc.clientId, documentId: doc.id }),
            });
          } catch (_) {}
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

      // Lead notifications (recently created or updated)
      const recentLeads = ((leadsData && leadsData.leads) || [])
        .filter((lead: any) => {
          const leadDate = new Date(lead.updatedAt || lead.createdAt);
          const daysAgo = (Date.now() - leadDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysAgo <= 7;
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

      // Email notifications (unread emails)
      const emailNotifications = ((emailsData && emailsData.emails) || [])
        .slice(0, 10)
        .map((email: any) => ({
          id: `email-${email._id}`,
          type: 'email' as const,
          title: 'New Email Received',
          message: `From ${email.from?.name || email.from?.email}: ${email.subject}`,
          timestamp: new Date(email.receivedAt),
          read: email.status === 'read',
          priority: email.priority || 'medium' as const,
          actionUrl: `/clients/${email.clientId || ''}`,
          metadata: {
            senderName: email.from?.name,
            senderEmail: email.from?.email,
            subject: email.subject,
            emailId: email._id,
            clientName: email.clientName,
          },
        }));

      allNotifications.push(...recentDocs, ...recentLeads, ...emailNotifications);
      
      // Sort by timestamp (newest first)
      allNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setNotifications(allNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
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
      notif.metadata?.documentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.metadata?.leadName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.metadata?.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.metadata?.permitName?.toLowerCase().includes(searchQuery.toLowerCase());

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
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
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
        return <Bell className={`${classes} text-neutral-500`} />;
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
        return 'bg-neutral-100';
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
        return 'border-l-neutral-300 bg-white';
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
    <div className="h-full flex flex-col bg-neutral-50/80">
      {/* Header */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b border-neutral-200/80 shadow-sm px-6 py-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">Notifications</h1>
              <p className="text-sm text-neutral-500 mt-0.5">
                {unreadCount > 0 ? (
                  <span className="font-medium text-neutral-700">{unreadCount} unread</span>
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
                className="flex items-center gap-2 border-neutral-200 hover:bg-neutral-50"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNotifications}
              className="flex items-center gap-2 border-neutral-200 hover:bg-neutral-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by sender, subject, or keyword..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50/80 border border-neutral-200 rounded-xl text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300 transition-colors"
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
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800'
                }`}
              >
                <span>{filterType.charAt(0).toUpperCase() + filterType.slice(1)}</span>
                {count > 0 && (
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-lg ${
                    isActive ? 'bg-white/20' : 'bg-neutral-200/80 text-neutral-600'
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
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-neutral-600">Loading notifications...</p>
            <p className="text-xs text-neutral-400 mt-1">Checking documents, leads, and emails</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-base font-semibold text-neutral-800 mb-1">
              {searchQuery ? 'No matches' : 'All caught up'}
            </p>
            <p className="text-sm text-neutral-500 text-center max-w-[280px]">
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
              const showLead = m?.leadName && notification.type === 'lead';
              const showDoc = m?.documentName && notification.type === 'document';
              const showClient = m?.clientName && notification.type === 'email' && m.clientName !== m.senderName;

              return (
                <div key={notification.id} className="group">
                  {showDateDivider && (
                    <div className="sticky top-0 z-10 flex items-center gap-3 py-3 px-1 bg-neutral-50/95 backdrop-blur-sm">
                      <div className="h-px flex-1 bg-neutral-200" />
                      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
                        {isToday ? 'Today' : isYesterday ? 'Yesterday' : notification.timestamp.toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: notification.timestamp.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        })}
                      </span>
                      <div className="h-px flex-1 bg-neutral-200" />
                    </div>
                  )}
                  <div
                    onClick={() => handleNotificationClick(notification)}
                    className={`relative border-l-4 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${
                      notification.read 
                        ? 'bg-white border-neutral-200 shadow-sm' 
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
                              <h3 className={`text-sm font-semibold ${notification.read ? 'text-neutral-600' : 'text-neutral-900'}`}>
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-sky-500 rounded-full flex-shrink-0 ring-2 ring-sky-100" />
                              )}
                            </div>
                            <p className="text-sm text-neutral-600 mb-2 line-clamp-2 leading-relaxed">
                              {notification.message}
                            </p>
                            {(showSender || showLead || showDoc || showClient) && (
                              <div className="flex items-center gap-3 text-xs text-neutral-500 mb-2 flex-wrap">
                                {showSender && (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neutral-100">
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
                            <div className="flex items-center gap-3 text-xs text-neutral-400">
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                              title={notification.read ? 'Mark unread' : 'Mark read'}
                            >
                              {notification.read ? (
                                <CheckCheck className="w-4 h-4" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                            {notification.actionUrl && (
                              <span className="p-1.5 text-neutral-400 rounded-lg" aria-hidden>
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
    </div>
  );
}
