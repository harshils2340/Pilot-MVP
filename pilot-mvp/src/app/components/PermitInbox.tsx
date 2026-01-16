import { AlertCircle, Clock, ChevronRight, Search, Filter, Mail, ExternalLink, Send, RefreshCw, Trash2, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PermitEmail {
  _id: string;
  permitId?: string;
  permitName?: string;
  clientId?: string;
  clientName?: string;
  subject: string;
  from: {
    email: string;
    name?: string;
  };
  to: {
    email: string;
    name?: string;
  };
  body: string;
  htmlBody?: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    url?: string;
  }>;
  direction: 'inbound' | 'outbound';
  status: 'unread' | 'read' | 'replied' | 'archived';
  priority: 'high' | 'medium' | 'low';
  receivedAt: string;
  sentAt?: string;
  threadId?: string;
  inReplyTo?: string;
  permitDetails?: {
    authority?: string;
    municipality?: string;
    jurisdiction?: {
      city?: string;
      province?: string;
      country?: string;
    };
  };
}

interface PermitInboxItem {
  id: string;
  permitName: string;
  clientName: string;
  authority: string;
  municipality: string;
  feedbackDate: string;
  daysWaiting: number;
  priority: 'high' | 'medium' | 'low';
  summary: string;
}

const mockInboxItems: PermitInboxItem[] = [
  {
    id: '1',
    permitName: 'Health Department Plan Review',
    clientName: 'Urban Eats Restaurant Group',
    authority: 'SF Dept. of Public Health',
    municipality: 'San Francisco',
    feedbackDate: 'Dec 18, 2024',
    daysWaiting: 5,
    priority: 'high',
    summary: 'Floor plan revisions required - sink dimensions missing',
  },
  {
    id: '2',
    permitName: 'Conditional Use Permit',
    clientName: 'GreenSpace Co-Working',
    authority: 'SF Planning Department',
    municipality: 'San Francisco',
    feedbackDate: 'Dec 12, 2024',
    daysWaiting: 11,
    priority: 'high',
    summary: 'Neighborhood notification incomplete - need proof of mailing',
  },
  {
    id: '3',
    permitName: 'Sign Permit',
    clientName: 'Bloom Coffee',
    authority: 'City of Oakland',
    municipality: 'Oakland',
    feedbackDate: 'Dec 16, 2024',
    daysWaiting: 7,
    priority: 'medium',
    summary: 'Sign dimensions exceed zoning allowance - need variance or redesign',
  },
  {
    id: '4',
    permitName: 'Building Permit',
    clientName: 'TechHub Office Space',
    authority: 'SF Dept. of Building Inspection',
    municipality: 'San Francisco',
    feedbackDate: 'Dec 10, 2024',
    daysWaiting: 13,
    priority: 'high',
    summary: 'Structural engineer stamp missing on plans',
  },
];

interface PermitInboxProps {
  onSelectPermit: (permitId: string, clientName: string) => void;
}

export function PermitInbox({ onSelectPermit }: PermitInboxProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [emails, setEmails] = useState<PermitEmail[]>([]);
  const [testMode, setTestMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<PermitEmail | null>(null);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailComposerData, setEmailComposerData] = useState({
    to: '',
    subject: '',
    body: '',
    permitId: '',
    permitName: ''
  });

  // Fetch test mode configuration and emails
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch test mode configuration
        const configRes = await fetch('/api/emails/config');
        const config = await configRes.json();
        setTestMode(config.test || false);
        
        // Always fetch emails (for both test=true and test=false)
        // When test=false, we'll show them in card format
        // When test=true, we'll show them in email format
        const emailsRes = await fetch('/api/emails?status=all&limit=100');
        const emailsData = await emailsRes.json();
        setEmails(emailsData.emails || []);
      } catch (error) {
        console.error('Error fetching inbox data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Refresh emails every 30 seconds
    const interval = setInterval(() => {
      fetch('/api/emails?status=all&limit=100')
        .then(res => res.json())
        .then(data => setEmails(data.emails || []))
        .catch(err => console.error('Error refreshing emails:', err));
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-neutral-50 text-neutral-600 border-neutral-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const calculateDaysWaiting = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  const handleMarkAsRead = async (emailId: string) => {
    try {
      await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' })
      });
      setEmails(emails.map(e => e._id === emailId ? { ...e, status: 'read' as const } : e));
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  const handleSendEmail = async () => {
    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permitId: emailComposerData.permitId,
          permitName: emailComposerData.permitName,
          subject: emailComposerData.subject,
          to: { email: emailComposerData.to },
          body: emailComposerData.body,
          direction: 'outbound'
        })
      });
      
      if (response.ok) {
        setShowEmailComposer(false);
        setEmailComposerData({ to: '', subject: '', body: '', permitId: '', permitName: '' });
        // Refresh emails
        const emailsRes = await fetch('/api/emails?status=all&limit=100');
        const emailsData = await emailsRes.json();
        setEmails(emailsData.emails || []);
      } else {
        const error = await response.json();
        alert(`Failed to send email: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    }
  };

  const openEmailApp = () => {
    // Open default email client or webmail
    // You can customize this URL based on your email provider
    const emailUrl = process.env.NEXT_PUBLIC_EMAIL_APP_URL || 'https://mail.google.com';
    window.open(emailUrl, '_blank');
  };

  // Filter emails
  const filteredEmails = emails.filter((email) => {
    const matchesSearch =
      email.permitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = filterPriority === 'all' || email.priority === filterPriority;
    
    return matchesSearch && matchesPriority;
  });

  // Sort emails by most recent first (already sorted by backend, but ensure it)
  const sortedEmails = [...filteredEmails].sort((a, b) => {
    return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
  });

  // Filter mock items (for city feedback mode)
  const filteredItems = mockInboxItems.filter((item) => {
    const matchesSearch =
      item.permitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
    
    return matchesSearch && matchesPriority;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    // Sort by priority first (high > medium > low), then by days waiting
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.daysWaiting - a.daysWaiting;
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin mx-auto mb-2" />
          <p className="text-neutral-600">Loading inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
          <h1 className="text-neutral-900 mb-1">Permit Inbox</h1>
            <p className="text-neutral-600">
              {testMode 
                ? 'Email messages for permits' 
                : 'All permits requiring action across clients'}
            </p>
          </div>
          {testMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEmailComposer(true)}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Send Email</span>
              </button>
              <button
                onClick={openEmailApp}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Email App</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search permits, clients, or feedback..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilterPriority('all')}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                filterPriority === 'all'
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterPriority('high')}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                filterPriority === 'high'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              High
            </button>
            <button
              onClick={() => setFilterPriority('medium')}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                filterPriority === 'medium'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-neutral-600 border-neutral-300 hover:bg-neutral-50'
              }`}
            >
              Medium
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-neutral-200 px-8 py-4">
        {testMode ? (
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-neutral-500 mb-1">Total Emails</p>
              <p className="text-2xl font-semibold text-neutral-900">{emails.length}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Unread</p>
              <p className="text-2xl font-semibold text-red-600">
                {emails.filter(e => e.status === 'unread').length}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Inbound</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {emails.filter(e => e.direction === 'inbound').length}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Outbound</p>
              <p className="text-2xl font-semibold text-neutral-900">
                {emails.filter(e => e.direction === 'outbound').length}
              </p>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-neutral-500 mb-1">Total Action Required</p>
              <p className="text-2xl font-semibold text-neutral-900">{sortedEmails.length}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">High Priority</p>
            <p className="text-2xl font-semibold text-red-600">
                {sortedEmails.filter(e => e.priority === 'high').length}
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Average Wait Time</p>
            <p className="text-2xl font-semibold text-neutral-900">
                {sortedEmails.length > 0 
                  ? Math.round(sortedEmails.reduce((sum, email) => sum + calculateDaysWaiting(email.receivedAt), 0) / sortedEmails.length)
                  : 0} days
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500 mb-1">Clients Affected</p>
            <p className="text-2xl font-semibold text-neutral-900">
                {new Set(sortedEmails.map(e => e.clientName).filter(Boolean)).size}
            </p>
          </div>
        </div>
        )}
      </div>

      {/* Inbox Items */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          {testMode ? (
            // Email Mode
            <>
              {sortedEmails.length === 0 ? (
                <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
                  <Mail className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                  <h3 className="font-medium text-neutral-900 mb-2">No emails found</h3>
                  <p className="text-neutral-600 mb-4">No permit-related emails in your inbox.</p>
                  <button
                    onClick={() => setShowEmailComposer(true)}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    Send First Email
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedEmails.map((email) => (
                    <div
                      key={email._id}
                      className={`bg-white rounded-lg border p-6 hover:border-neutral-300 hover:shadow-md transition-all ${
                        email.status === 'unread' ? 'border-l-4 border-l-blue-500' : 'border-neutral-200'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {email.direction === 'inbound' ? (
                            <Mail className={`w-6 h-6 ${email.status === 'unread' ? 'text-blue-600' : 'text-neutral-400'}`} />
                          ) : (
                            <Send className="w-6 h-6 text-neutral-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div 
                              className="flex-1 cursor-pointer"
                              onClick={() => {
                                setSelectedEmail(email);
                                if (email.status === 'unread') {
                                  handleMarkAsRead(email._id);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-medium text-neutral-900 ${email.status === 'unread' ? 'font-semibold' : ''}`}>
                                  {email.subject}
                                </h3>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(email.priority)}`}>
                                  {email.priority}
                                </span>
                                {email.status === 'unread' && (
                                  <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                                <span className="font-medium">
                                  {email.direction === 'inbound' 
                                    ? `${email.from.name || email.from.email}` 
                                    : `To: ${email.to.name || email.to.email}`}
                                </span>
                                <span className="text-neutral-400">•</span>
                                <span>{email.permitName}</span>
                                {email.clientName && (
                                  <>
                                    <span className="text-neutral-400">•</span>
                                    <span>{email.clientName}</span>
                                  </>
                                )}
                              </div>
                              <p className="text-sm text-neutral-700 line-clamp-2">
                                {email.body.substring(0, 150)}...
                              </p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {testMode && email.direction === 'outbound' && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirm('Are you sure you want to delete this email?')) {
                                      try {
                                        const response = await fetch(`/api/emails/${email._id}`, {
                                          method: 'DELETE'
                                        });
                                        if (response.ok) {
                                          setEmails(emails.filter(e => e._id !== email._id));
                                          if (selectedEmail?._id === email._id) {
                                            setSelectedEmail(null);
                                          }
                                        } else {
                                          alert('Failed to delete email');
                                        }
                                      } catch (error) {
                                        console.error('Error deleting email:', error);
                                        alert('Failed to delete email');
                                      }
                                    }
                                  }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete email"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0 cursor-pointer" 
                                onClick={() => {
                                  setSelectedEmail(email);
                                  if (email.status === 'unread') {
                                    handleMarkAsRead(email._id);
                                  }
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-4 pt-3 border-t border-neutral-100 text-sm text-neutral-600">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              <span>{formatDate(email.receivedAt)}</span>
                            </div>
                            <span className="text-neutral-400">•</span>
                            <span className="capitalize">{email.direction}</span>
                            {email.attachments && email.attachments.length > 0 && (
                              <>
                                <span className="text-neutral-400">•</span>
                                <span>{email.attachments.length} attachment(s)</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // City Feedback Mode - Show client emails in card format
            <>
              {sortedEmails.length === 0 ? (
            <div className="bg-white rounded-lg border border-neutral-200 p-12 text-center">
              <AlertCircle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="font-medium text-neutral-900 mb-2">No permits requiring action</h3>
              <p className="text-neutral-600">All permits are either approved or awaiting city response.</p>
            </div>
          ) : (
            <div className="space-y-3">
                  {sortedEmails.map((email) => {
                    const daysWaiting = calculateDaysWaiting(email.receivedAt);
                    const feedbackDate = new Date(email.receivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const authority = email.permitDetails?.authority || 'Unknown Authority';
                    const municipality = email.permitDetails?.municipality || email.permitDetails?.jurisdiction?.city || 'Unknown';
                    const summary = email.body.length > 100 ? email.body.substring(0, 100) + '...' : email.body;
                    
                    return (
                      <div
                        key={email._id}
                        onClick={() => {
                          setSelectedEmail(email);
                          if (email.status === 'unread') {
                            handleMarkAsRead(email._id);
                          }
                          if (email.permitId) {
                            onSelectPermit(email.permitId, email.clientName || 'Unknown Client');
                          }
                        }}
                  className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-neutral-300 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <AlertCircle className="w-8 h-8 text-amber-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-neutral-900 text-lg">
                                    {email.permitName || email.subject}
                            </h3>
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPriorityColor(email.priority)}`}>
                                    {email.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                                  <span className="font-medium">{email.clientName || email.from.name || email.from.email}</span>
                            <span className="text-neutral-400">•</span>
                                  <span>{authority}</span>
                            <span className="text-neutral-400">•</span>
                                  <span>{municipality}</span>
                          </div>
                                <p className="text-sm text-neutral-700">{summary}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-neutral-400 ml-4 flex-shrink-0" />
                      </div>

                      <div className="flex items-center gap-4 pt-3 border-t border-neutral-100 text-sm text-neutral-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                                <span>Feedback received {feedbackDate}</span>
                        </div>
                        <span className="text-neutral-400">•</span>
                              <span className={daysWaiting > 10 ? 'text-red-600 font-medium' : ''}>
                                Waiting {daysWaiting} days
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Email Detail Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-neutral-900">{selectedEmail.subject}</h2>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  ×
                </button>
              </div>
              <div className="space-y-2 text-sm text-neutral-600">
                <div>
                  <span className="font-medium">From:</span> {selectedEmail.from.name || selectedEmail.from.email}
                </div>
                <div>
                  <span className="font-medium">To:</span> {selectedEmail.to.name || selectedEmail.to.email}
                </div>
                <div>
                  <span className="font-medium">Permit:</span> {selectedEmail.permitName}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {formatDate(selectedEmail.receivedAt)}
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="prose max-w-none">
                <p className="text-neutral-700 whitespace-pre-wrap">{selectedEmail.body}</p>
              </div>
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <h3 className="font-medium text-neutral-900 mb-3">Attachments</h3>
                  <div className="space-y-2">
                    {selectedEmail.attachments.map((att, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                        <span className="text-sm text-neutral-700">{att.filename}</span>
                        <span className="text-xs text-neutral-500">{(att.size / 1024).toFixed(1)} KB</span>
                </div>
              ))}
                  </div>
                </div>
              )}
              <div className="mt-6 pt-6 border-t border-neutral-200 flex gap-3">
                <button
                  onClick={() => {
                    setEmailComposerData({
                      to: selectedEmail.from.email,
                      subject: `Re: ${selectedEmail.subject}`,
                      body: `\n\n--- Original Message ---\n${selectedEmail.body}`,
                      permitId: selectedEmail.permitId,
                      permitName: selectedEmail.permitName
                    });
                    setSelectedEmail(null);
                    setShowEmailComposer(true);
                  }}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Reply
                </button>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
            </div>
          )}

      {/* Email Composer Modal */}
      {showEmailComposer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-neutral-200">
              <h2 className="text-xl font-semibold text-neutral-900">Send Email</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">To</label>
                <input
                  type="email"
                  value={emailComposerData.to}
                  onChange={(e) => setEmailComposerData({ ...emailComposerData, to: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="recipient@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailComposerData.subject}
                  onChange={(e) => setEmailComposerData({ ...emailComposerData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="Email subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Permit</label>
                <input
                  type="text"
                  value={emailComposerData.permitName}
                  onChange={(e) => setEmailComposerData({ ...emailComposerData, permitName: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  placeholder="Permit name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Message</label>
                <textarea
                  value={emailComposerData.body}
                  onChange={(e) => setEmailComposerData({ ...emailComposerData, body: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
                  placeholder="Your message..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-neutral-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEmailComposer(false);
                  setEmailComposerData({ to: '', subject: '', body: '', permitId: '', permitName: '' });
                }}
                className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Send
              </button>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}
