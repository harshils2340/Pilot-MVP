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
  AlertCircle,
  Clock,
  X,
  Filter,
  Search,
  Archive,
  Trash2,
  ExternalLink,
  Download,
  Eye,
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
      // Fetch documents from clients (recent uploads)
      const docsRes = await fetch('/api/documents?sortBy=createdAt');
      const docs = await docsRes.ok ? await docsRes.json() : [];
      
      // Fetch recent leads
      const leadsRes = await fetch('/api/crm/leads');
      const leadsData = await leadsRes.ok ? await leadsRes.json() : { leads: [] };
      
      // Fetch recent emails
      const emailsRes = await fetch('/api/emails?status=unread&limit=20');
      const emailsData = await emailsRes.ok ? await emailsRes.json() : { emails: [] };

      // Transform into notifications
      const allNotifications: Notification[] = [];

      // Document notifications (from clients, last 7 days)
      const recentDocs = docs
        .filter((doc: any) => {
          const docDate = new Date(doc.createdAt);
          const daysAgo = (Date.now() - docDate.getTime()) / (1000 * 60 * 60 * 24);
          return doc.uploadedBy?.isClient && daysAgo <= 7;
        })
        .slice(0, 10)
        .map((doc: any) => ({
          id: `doc-${doc.id}`,
          type: 'document' as const,
          title: 'New Document Received',
          message: `${doc.uploadedBy?.userName || 'Client'} uploaded "${doc.name}"`,
          timestamp: new Date(doc.createdAt),
          read: false,
          priority: doc.metadata?.priority || 'medium' as const,
          actionUrl: `/clients/${doc.clientId}`,
          metadata: {
            senderName: doc.uploadedBy?.userName,
            documentName: doc.name,
            documentId: doc.id,
            clientId: doc.clientId,
            fileType: doc.fileType,
            fileSize: doc.fileSize,
          },
        }));

      // Lead notifications (recently created or updated)
      const recentLeads = (leadsData.leads || [])
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
      const emailNotifications = (emailsData.emails || [])
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
      notif.metadata?.leadName?.toLowerCase().includes(searchQuery.toLowerCase());

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
    switch (type) {
      case 'document':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'lead':
        return <UserPlus className="w-5 h-5 text-purple-500" />;
      case 'permit':
        return <Calendar className="w-5 h-5 text-green-500" />;
      case 'email':
        return <Mail className="w-5 h-5 text-amber-500" />;
      case 'deadline':
        return <Clock className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-neutral-500" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
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
    <div className="h-full flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Notifications</h1>
            <p className="text-sm text-neutral-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNotifications}
              className="flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
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
            placeholder="Search notifications..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'unread', 'document', 'lead', 'email'] as FilterType[]).map((filterType) => {
            const count = getNotificationTypeCount(filterType);
            return (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                  filter === filterType
                    ? 'bg-neutral-900 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <span>{filterType.charAt(0).toUpperCase() + filterType.slice(1)}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    filter === filterType
                      ? 'bg-white/20 text-white'
                      : 'bg-neutral-200 text-neutral-600'
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
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
              <p className="text-sm text-neutral-500">Loading notifications...</p>
            </div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
            <Bell className="w-12 h-12 mb-3 text-neutral-300" />
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs mt-1">
              {searchQuery ? 'Try a different search term' : "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredNotifications.map((notification, index) => {
              const isToday = notification.timestamp.toDateString() === new Date().toDateString();
              const isYesterday = notification.timestamp.toDateString() === new Date(Date.now() - 86400000).toDateString();
              const showDateDivider = index === 0 || 
                (index > 0 && filteredNotifications[index - 1].timestamp.toDateString() !== notification.timestamp.toDateString());
              
              return (
                <div key={notification.id}>
                  {showDateDivider && (
                    <div className="px-4 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {isToday ? 'Today' : isYesterday ? 'Yesterday' : notification.timestamp.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric',
                        year: notification.timestamp.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      })}
                    </div>
                  )}
                  <div
                    onClick={() => handleNotificationClick(notification)}
                    className={`relative border-l-4 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      notification.read 
                        ? 'bg-white border-neutral-200' 
                        : `${getPriorityColor(notification.priority)} border-l-4`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`text-sm font-semibold ${notification.read ? 'text-neutral-700' : 'text-neutral-900'}`}>
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            {notification.metadata && (
                              <div className="flex items-center gap-4 text-xs text-neutral-500 mb-2 flex-wrap">
                                {notification.metadata.senderName && (
                                  <span className="flex items-center gap-1.5">
                                    <UserPlus className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate max-w-[150px]">{notification.metadata.senderName}</span>
                                  </span>
                                )}
                                {notification.metadata.documentName && (
                                  <span className="flex items-center gap-1.5">
                                    <FileText className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate max-w-[200px]" title={notification.metadata.documentName}>
                                      {notification.metadata.documentName}
                                    </span>
                                  </span>
                                )}
                                {notification.metadata.leadName && (
                                  <span className="flex items-center gap-1.5">
                                    <UserPlus className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate max-w-[150px]">{notification.metadata.leadName}</span>
                                  </span>
                                )}
                                {notification.metadata.clientName && (
                                  <span className="flex items-center gap-1.5">
                                    <UserPlus className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate max-w-[150px]">{notification.metadata.clientName}</span>
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-neutral-400">
                              <span>{formatTimeAgo(notification.timestamp)}</span>
                              {notification.priority === 'urgent' && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                                  Urgent
                                </span>
                              )}
                              {notification.priority === 'high' && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">
                                  High
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="flex-shrink-0 p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                            title={notification.read ? 'Mark as unread' : 'Mark as read'}
                          >
                            {notification.read ? (
                              <CheckCheck className="w-4 h-4" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
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
