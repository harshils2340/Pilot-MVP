import { AlertCircle, Clock, ChevronRight, Search, Filter, Mail, ExternalLink, Send, RefreshCw, Trash2, X, CheckSquare, Square, Reply, Forward, Archive, Printer, Copy, FileText } from 'lucide-react';
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
  const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);

  // Fetch test mode configuration and emails
  useEffect(() => {
    const fetchData = async () => {
      let searchTimeout: NodeJS.Timeout | null = null; // Declare outside try block for finally access
      
      try {
        setLoading(true);
        
        // Fetch test mode configuration
        const configRes = await fetch('/api/emails/config');
        const config = await configRes.json();
        setTestMode(config.test || false);
        
        // Set timeout to stop email searching after 5 seconds (4-6 second range)
        searchTimeout = setTimeout(() => {
          console.log('⏱️ Email search timeout (5 seconds) - stopping search and showing current results');
          setLoading(false);
        }, 5000); // 5 seconds timeout
        
        // Display existing emails immediately (don't wait for sync)
        // This stops loading and shows results right away
        try {
          const initialEmailsRes = await fetch('/api/emails?status=all&limit=25');
          const initialEmailsData = await initialEmailsRes.json();
          setEmails(initialEmailsData.emails || []);
          setLoading(false); // Stop loading immediately to show current results
          console.log(`✅ Displayed ${initialEmailsData.emails?.length || 0} existing emails immediately`);
          console.log(`✅ Fetching done - Results displayed on website`);
        } catch (initError) {
          console.error('Error fetching initial emails:', initError);
        }
        
        // Sync emails from ALL Gmail tokens in database (not just logged-in user)
        // This will sync emails from all registered Gmail accounts
        let emailsFetched = false;
        
        try {
          // Sync emails from all Gmail accounts in background (non-blocking)
          // This runs after displaying existing emails, so sync log appears but doesn't block UI
          // Sync all emails with keywords (permits, licensing, licencing), regardless of sender
          const syncResponse = await fetch('/api/gmail/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              // No userId specified = sync from ALL Gmail tokens in database
              allowedSenders: [], // Empty array = sync all emails (not just from specific senders)
              maxResults: 25, // Search only latest 25 emails per Gmail account for faster results
            }),
          });
            
          if (syncResponse.ok) {
            const syncData = await syncResponse.json();
            const ingestedCount = syncData.ingested || 0;
            const syncedAccounts = syncData.syncedAccounts || [];
            console.log(`✅ Gmail sync completed: ${ingestedCount} emails ingested from ${syncedAccounts.length} account(s) (${syncedAccounts.join(', ')})`);
            console.log(`📧 Filtering: registered clients OR permit keywords`);
            
            // Always refresh email list after sync (even if no new emails were ingested)
            // This ensures the page shows the current state (empty or with emails)
            const refreshRes = await fetch('/api/emails?status=all&limit=25');
            const refreshData = await refreshRes.json();
            setEmails(refreshData.emails || []);
            emailsFetched = true;
            console.log(`🔄 Email list refreshed: ${refreshData.emails?.length || 0} emails now displayed`);
            console.log(`✅ Fetching done - Results displayed on website`);
            
            // Clear timeout since we got a response
            if (searchTimeout) clearTimeout(searchTimeout);
            
            // Stop loading immediately after checking emails - show empty state if no emails found
            setLoading(false);
            
            if (ingestedCount === 0 && refreshData.emails?.length === 0) {
              console.log(`ℹ️ No emails found after searching through all Gmail accounts. Displaying empty state immediately.`);
            }
          } else {
            const errorData = await syncResponse.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Gmail sync failed:', errorData);
            // Clear timeout on error
            if (searchTimeout) clearTimeout(searchTimeout);
            // Stop loading even if sync failed
            setLoading(false);
          }
        } catch (syncError) {
          console.error('Gmail sync error:', syncError);
          // Clear timeout on error
          if (searchTimeout) clearTimeout(searchTimeout);
          // Stop loading even if sync errored
          setLoading(false);
        }
        
        // Always fetch emails if not already fetched from sync above
        // When test=false, we'll show them in card format
        // When test=true, we'll show them in email format
        // This ensures we show the current state even if sync failed
        if (!emailsFetched) {
          try {
          const emailsRes = await fetch('/api/emails?status=all&limit=25');
          const emailsData = await emailsRes.json();
          console.log(`✅ Fetched ${emailsData.emails?.length || 0} emails from API`);
          console.log(`✅ Fetching done - Results displayed on website`);
          setEmails(emailsData.emails || []);
          // Clear timeout after fetching emails
          if (searchTimeout) clearTimeout(searchTimeout);
          // Stop loading immediately after fetching emails
          setLoading(false);
          } catch (fetchError) {
            console.error('Error fetching emails:', fetchError);
            if (searchTimeout) clearTimeout(searchTimeout);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error fetching inbox data:', error);
        // Clear timeout on error
        if (searchTimeout) clearTimeout(searchTimeout);
        // Set loading to false on error so empty state can show
        setLoading(false);
      } finally {
        // Ensure timeout is cleared and loading is always false after all operations complete
        if (searchTimeout) clearTimeout(searchTimeout);
        setLoading(false);
      }
    };
    
    fetchData();
    
    // DISABLED: Auto-refresh removed to prevent continuous scanning
    // User can manually refresh if needed
    // The initial sync will run once when page loads, then stop
    /* const interval = setInterval(async () => {
      const userEmail = localStorage.getItem('userEmail');
      
      // Sync new emails from ALL Gmail accounts in database
      try {
        const syncResponse = await fetch('/api/gmail/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // No userId specified = sync from ALL Gmail tokens in database
            allowedSenders: [], // Empty array = sync all emails with keywords
            maxResults: 25, // Search only latest 25 emails per Gmail account for faster results
          }),
        });
        
        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          if (syncData.ingested > 0) {
            const syncedAccounts = syncData.syncedAccounts || [];
            console.log(`✅ Synced ${syncData.ingested} new emails from ${syncedAccounts.length} account(s) (${syncedAccounts.join(', ')})`);
            
            // Immediately refresh email list after sync to show new emails right away
            fetch('/api/emails?status=all&limit=25')
              .then(res => res.json())
              .then(data => {
                console.log(`🔄 Email list refreshed: ${data.emails?.length || 0} emails now displayed`);
                setEmails(data.emails || []);
              })
              .catch(err => console.error('Error refreshing emails:', err));
          }
        }
      } catch (syncError: any) {
        console.error('Gmail sync error during refresh:', syncError);
      }
      
      // Also refresh email list even if sync had no new emails (for manually added emails)
      if (true) {
        // Refresh email list even if user is not logged in (for manually added emails)
        fetch('/api/emails?status=all&limit=25')
          .then(res => res.json())
          .then(data => {
            console.log(`✅ Refreshed: ${data.emails?.length || 0} emails (filtered: registered clients OR permit keywords)`);
            setEmails(data.emails || []);
          })
          .catch(err => console.error('Error refreshing emails:', err));
      }
    }, 10000); // Every 10 seconds for faster email updates */
    
    // No interval cleanup needed since interval is disabled
    // return () => clearInterval(interval);
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
        const emailsRes = await fetch('/api/emails?status=all&limit=25');
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

  const handleToggleSelectEmail = (emailId: string) => {
    setSelectedEmailIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedEmailIds.size === sortedEmails.length) {
      setSelectedEmailIds(new Set());
    } else {
      setSelectedEmailIds(new Set(sortedEmails.map(e => e._id)));
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    if (!confirm('Are you sure you want to delete this email?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setEmails(emails.filter(e => e._id !== emailId));
        setSelectedEmailIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(emailId);
          return newSet;
        });
        if (selectedEmail?._id === emailId) {
          setSelectedEmail(null);
        }
      } else {
        const error = await response.json();
        alert(`Failed to delete email: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      alert('Failed to delete email');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedEmailIds.size === 0) {
      return;
    }

    const count = selectedEmailIds.size;
    if (!confirm(`Are you sure you want to delete ${count} email(s)?`)) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch('/api/emails/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailIds: Array.from(selectedEmailIds) })
      });
      
      if (response.ok) {
        const result = await response.json();
        setEmails(emails.filter(e => !selectedEmailIds.has(e._id)));
        if (selectedEmail && selectedEmailIds.has(selectedEmail._id)) {
          setSelectedEmail(null);
        }
        setSelectedEmailIds(new Set());
        alert(`Successfully deleted ${result.deletedCount} email(s)`);
      } else {
        const error = await response.json();
        alert(`Failed to delete emails: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error bulk deleting emails:', error);
      alert('Failed to delete emails');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleMultiSelectMode = () => {
    setMultiSelectMode(prev => {
      const newMode = !prev;
      if (!newMode) {
        // Clear selection when exiting multi-select mode
        setSelectedEmailIds(new Set());
      }
      return newMode;
    });
  };

  // Filter emails
  const filteredEmails = emails.filter((email) => {
    const matchesSearch =
      email.permitName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = filterPriority === 'all' || email.priority === filterPriority;
    
    return matchesSearch && matchesPriority;
  });

  // Separate permit-related/client emails from other emails
  // Permit-related emails are those that:
  // 1. Have "Permit" in subject or body
  // 2. Have a permitName containing "Permit"
  // 3. Are associated with a permit (have permitId)
  // 4. Are from clients (have clientId)
  // BUT exclude promotional/marketing emails even if they contain "permit"
  const excludedDomains = [
    'expedia.com',
    'expedia.ca',
    'booking.com',
    'airbnb.com',
    'amazon.com',
    'ebay.com',
    'paypal.com',
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'linkedin.com',
    'pinterest.com',
    'groupon.com',
    'coupons.com',
    'retailmenot.com',
    'shopify.com',
    'etsy.com',
    'netflix.com',
    'spotify.com',
    'applemusic.com',
    'uber.com',
    'lyft.com',
    'doordash.com',
    'ubereats.com',
  ];
  
  const permitRelatedEmails = filteredEmails.filter((email) => {
    // First check if this is a promotional email - exclude it from permit-related
    const fromEmail = (email.from?.email || '').toLowerCase();
    const isPromotionalEmail = excludedDomains.some(domain => 
      fromEmail.includes(`@${domain}`) || fromEmail.endsWith(domain)
    );
    
    if (isPromotionalEmail) {
      return false; // Always exclude promotional emails from permit-related section
    }
    
    const subject = (email.subject || '').toLowerCase();
    const body = (email.body || '').toLowerCase();
    const permitName = (email.permitName || '').toLowerCase().trim();
    
    const hasPermitInSubject = subject.includes('permit');
    const hasPermitInBody = body.includes('permit');
    const hasPermitInName = permitName.includes('permit');
    const hasPermitId = !!email.permitId;
    const hasClientId = !!email.clientId;
    
    return hasPermitInSubject || hasPermitInBody || hasPermitInName || hasPermitId || hasClientId;
  });
  
  const otherEmails = filteredEmails.filter((email) => {
    const subject = (email.subject || '').toLowerCase();
    const body = (email.body || '').toLowerCase();
    const permitName = (email.permitName || '').toLowerCase().trim();
    
    const hasPermitInSubject = subject.includes('permit');
    const hasPermitInBody = body.includes('permit');
    const hasPermitInName = permitName.includes('permit');
    const hasPermitId = !!email.permitId;
    const hasClientId = !!email.clientId;
    
    return !(hasPermitInSubject || hasPermitInBody || hasPermitInName || hasPermitId || hasClientId);
  });
  
  // Sort each group by most recent first
  const sortedPermitRelatedEmails = [...permitRelatedEmails].sort((a, b) => {
    return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
  });
  
  const sortedOtherEmails = [...otherEmails].sort((a, b) => {
    return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
  });
  
  // Combine for backward compatibility (used in stats)
  const sortedEmails = [...sortedPermitRelatedEmails, ...sortedOtherEmails];

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
                onClick={toggleMultiSelectMode}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  multiSelectMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {multiSelectMode ? (
                  <>
                    <CheckSquare className="w-4 h-4" />
                    <span>Multi-Select</span>
                  </>
                ) : (
                  <>
                    <Square className="w-4 h-4" />
                    <span>Multi-Select</span>
                  </>
                )}
              </button>
              {multiSelectMode && selectedEmailIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected ({selectedEmailIds.size})</span>
                </button>
              )}
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
                  <p className="text-neutral-500 text-sm mt-4">No Email Received</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Select All Checkbox - Only show in multi-select mode */}
                  {multiSelectMode && sortedEmails.length > 0 && (
                    <div className="bg-white rounded-lg border border-neutral-200 p-4 flex items-center gap-3">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900"
                      >
                        {selectedEmailIds.size === sortedEmails.length ? (
                          <CheckSquare className="w-5 h-5 text-neutral-900" />
                        ) : (
                          <Square className="w-5 h-5 text-neutral-400" />
                        )}
                        <span className="font-medium">
                          {selectedEmailIds.size === sortedEmails.length ? 'Deselect All' : 'Select All'}
                        </span>
                      </button>
                      {selectedEmailIds.size > 0 && (
                        <span className="text-sm text-neutral-600">
                          {selectedEmailIds.size} email(s) selected
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Permit-related and client emails */}
                  {sortedPermitRelatedEmails.map((email) => (
                    <div
                      key={email._id}
                      className={`bg-white rounded-lg border p-6 hover:border-neutral-300 hover:shadow-md transition-all ${
                        email.status === 'unread' ? 'border-l-4 border-l-blue-500' : 'border-neutral-200'
                      } ${multiSelectMode && selectedEmailIds.has(email._id) ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        {multiSelectMode && (
                          <div className="flex-shrink-0 pt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSelectEmail(email._id);
                              }}
                              className="text-neutral-400 hover:text-neutral-900 transition-colors"
                            >
                              {selectedEmailIds.has(email._id) ? (
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        )}
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
                                <span>{email.permitName || 'No Permit'}</span>
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
                              {testMode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEmail(email._id);
                                  }}
                                  disabled={isDeleting}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  
                  {/* Horizontal divider between permit-related and other emails */}
                  {sortedPermitRelatedEmails.length > 0 && sortedOtherEmails.length > 0 && (
                    <div className="my-6 border-t border-neutral-300">
                      <div className="flex items-center justify-center pt-4">
                        <span className="text-sm text-neutral-500 bg-neutral-50 px-4 py-1 rounded-full">
                          Other Emails
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Other emails */}
                  {sortedOtherEmails.map((email) => (
                    <div
                      key={email._id}
                      className={`bg-white rounded-lg border p-6 hover:border-neutral-300 hover:shadow-md transition-all ${
                        email.status === 'unread' ? 'border-l-4 border-l-blue-500' : 'border-neutral-200'
                      } ${multiSelectMode && selectedEmailIds.has(email._id) ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        {multiSelectMode && (
                          <div className="flex-shrink-0 pt-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSelectEmail(email._id);
                              }}
                              className="text-neutral-400 hover:text-neutral-900 transition-colors"
                            >
                              {selectedEmailIds.has(email._id) ? (
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        )}
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
                                <span>{email.permitName || 'No Permit'}</span>
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
                              {testMode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEmail(email._id);
                                  }}
                                  disabled={isDeleting}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  {/* Select All Checkbox for City Feedback Mode - Only show in multi-select mode */}
                  {multiSelectMode && sortedEmails.length > 0 && testMode && (
                    <div className="bg-white rounded-lg border border-neutral-200 p-4 flex items-center gap-3">
                      <button
                        onClick={handleSelectAll}
                        className="flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900"
                      >
                        {selectedEmailIds.size === sortedEmails.length ? (
                          <CheckSquare className="w-5 h-5 text-neutral-900" />
                        ) : (
                          <Square className="w-5 h-5 text-neutral-400" />
                        )}
                        <span className="font-medium">
                          {selectedEmailIds.size === sortedEmails.length ? 'Deselect All' : 'Select All'}
                        </span>
                      </button>
                      {selectedEmailIds.size > 0 && (
                        <>
                          <span className="text-sm text-neutral-600">
                            {selectedEmailIds.size} email(s) selected
                          </span>
                          <button
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                            className="ml-auto flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Selected</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Permit-related and client emails */}
                  {sortedPermitRelatedEmails.map((email) => {
                    const daysWaiting = calculateDaysWaiting(email.receivedAt);
                    const feedbackDate = new Date(email.receivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const authority = email.permitDetails?.authority || 'Unknown Authority';
                    const municipality = email.permitDetails?.municipality || email.permitDetails?.jurisdiction?.city || 'Unknown';
                    const summary = email.body.length > 100 ? email.body.substring(0, 100) + '...' : email.body;
                    
                    return (
                      <div
                        key={email._id}
                        onClick={() => {
                          if (!multiSelectMode) {
                            setSelectedEmail(email);
                            if (email.status === 'unread') {
                              handleMarkAsRead(email._id);
                            }
                            if (email.permitId) {
                              onSelectPermit(email.permitId, email.clientName || 'Unknown Client');
                            }
                          }
                        }}
                  className={`bg-white rounded-lg border p-6 hover:border-neutral-300 hover:shadow-md transition-all ${
                    multiSelectMode && selectedEmailIds.has(email._id) ? 'ring-2 ring-blue-500 border-blue-500' : 'border-neutral-200'
                  } ${!multiSelectMode ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-start gap-6">
                    {multiSelectMode && testMode && (
                      <div className="flex-shrink-0 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelectEmail(email._id);
                          }}
                          className="text-neutral-400 hover:text-neutral-900 transition-colors"
                        >
                          {selectedEmailIds.has(email._id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    )}
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
                        <div className="flex items-center gap-2 ml-4">
                          {testMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEmail(email._id);
                              }}
                              disabled={isDeleting}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete email"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                        </div>
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
                  
                  {/* Horizontal divider between permit-related and other emails */}
                  {sortedPermitRelatedEmails.length > 0 && sortedOtherEmails.length > 0 && (
                    <div className="my-6 border-t border-neutral-300">
                      <div className="flex items-center justify-center pt-4">
                        <span className="text-sm text-neutral-500 bg-neutral-50 px-4 py-1 rounded-full">
                          Other Emails
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Other emails */}
                  {sortedOtherEmails.map((email) => {
                    const daysWaiting = calculateDaysWaiting(email.receivedAt);
                    const feedbackDate = new Date(email.receivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const authority = email.permitDetails?.authority || 'Unknown Authority';
                    const municipality = email.permitDetails?.municipality || email.permitDetails?.jurisdiction?.city || 'Unknown';
                    const summary = email.body.length > 100 ? email.body.substring(0, 100) + '...' : email.body;
                    
                    return (
                      <div
                        key={email._id}
                        onClick={() => {
                          if (!multiSelectMode) {
                            setSelectedEmail(email);
                            if (email.status === 'unread') {
                              handleMarkAsRead(email._id);
                            }
                            if (email.permitId) {
                              onSelectPermit(email.permitId, email.clientName || 'Unknown Client');
                            }
                          }
                        }}
                  className={`bg-white rounded-lg border p-6 hover:border-neutral-300 hover:shadow-md transition-all ${
                    multiSelectMode && selectedEmailIds.has(email._id) ? 'ring-2 ring-blue-500 border-blue-500' : 'border-neutral-200'
                  } ${!multiSelectMode ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-start gap-6">
                    {multiSelectMode && testMode && (
                      <div className="flex-shrink-0 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelectEmail(email._id);
                          }}
                          className="text-neutral-400 hover:text-neutral-900 transition-colors"
                        >
                          {selectedEmailIds.has(email._id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    )}
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
                        <div className="flex items-center gap-2 ml-4">
                          {testMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEmail(email._id);
                              }}
                              disabled={isDeleting}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete email"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                        </div>
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

      {/* Email Detail Modal - Enhanced UI */}
      {selectedEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="p-6 border-b border-neutral-200 flex-shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-semibold text-neutral-900">{selectedEmail.subject}</h2>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selectedEmail.priority)}`}>
                      {selectedEmail.priority}
                    </span>
                    {selectedEmail.status === 'unread' && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-neutral-600">
                    <div>
                      <span className="font-medium text-neutral-700">From:</span>
                      <span className="ml-2">{selectedEmail.from.name || selectedEmail.from.email}</span>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">To:</span>
                      <span className="ml-2">{selectedEmail.to.name || selectedEmail.to.email}</span>
                    </div>
                    {selectedEmail.permitName && (
                      <div>
                        <span className="font-medium text-neutral-700">Permit:</span>
                        <span className="ml-2">{selectedEmail.permitName}</span>
                      </div>
                    )}
                    {selectedEmail.clientName && (
                      <div>
                        <span className="font-medium text-neutral-700">Client:</span>
                        <span className="ml-2">{selectedEmail.clientName}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-neutral-700">Date:</span>
                      <span className="ml-2">{new Date(selectedEmail.receivedAt).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}</span>
                    </div>
                    <div>
                      <span className="font-medium text-neutral-700">Direction:</span>
                      <span className="ml-2 capitalize">{selectedEmail.direction}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="ml-4 p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-4 border-t border-neutral-100">
                <button
                  onClick={() => {
                    setEmailComposerData({
                      to: selectedEmail.from.email,
                      subject: `Re: ${selectedEmail.subject}`,
                      body: `\n\n--- Original Message ---\n${selectedEmail.body}`,
                      permitId: selectedEmail.permitId || '',
                      permitName: selectedEmail.permitName || ''
                    });
                    setSelectedEmail(null);
                    setShowEmailComposer(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <Reply className="w-4 h-4" />
                  Reply
                </button>
                <button
                  onClick={() => {
                    setEmailComposerData({
                      to: '',
                      subject: `Fwd: ${selectedEmail.subject}`,
                      body: `\n\n--- Forwarded Message ---\n${selectedEmail.body}`,
                      permitId: selectedEmail.permitId || '',
                      permitName: selectedEmail.permitName || ''
                    });
                    setSelectedEmail(null);
                    setShowEmailComposer(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <Forward className="w-4 h-4" />
                  Forward
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedEmail.body);
                    alert('Email content copied to clipboard');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                  title="Copy email content"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                  title="Print email"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                {testMode && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this email?')) {
                        handleDeleteEmail(selectedEmail._id);
                        setSelectedEmail(null);
                      }
                    }}
                    disabled={isDeleting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 overflow-auto p-6">
              {selectedEmail.htmlBody ? (
                <div 
                  className="prose max-w-none email-body"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: '#1f2937'
                  }}
                />
              ) : (
                <div className="prose max-w-none">
                  <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed">{selectedEmail.body}</p>
                </div>
              )}

              {/* Attachments */}
              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="mt-8 pt-6 border-t border-neutral-200">
                  <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Attachments ({selectedEmail.attachments.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedEmail.attachments.map((att, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-neutral-200 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-neutral-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{att.filename}</p>
                            <p className="text-xs text-neutral-500">
                              {att.contentType} • {(att.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        {att.url && (
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-sm bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Permit Details */}
              {selectedEmail.permitDetails && (
                <div className="mt-8 pt-6 border-t border-neutral-200">
                  <h3 className="font-semibold text-neutral-900 mb-4">Permit Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedEmail.permitDetails.authority && (
                      <div>
                        <span className="font-medium text-neutral-700">Authority:</span>
                        <span className="ml-2 text-neutral-600">{selectedEmail.permitDetails.authority}</span>
                      </div>
                    )}
                    {selectedEmail.permitDetails.municipality && (
                      <div>
                        <span className="font-medium text-neutral-700">Municipality:</span>
                        <span className="ml-2 text-neutral-600">{selectedEmail.permitDetails.municipality}</span>
                      </div>
                    )}
                    {selectedEmail.permitDetails.jurisdiction && (
                      <>
                        {selectedEmail.permitDetails.jurisdiction.city && (
                          <div>
                            <span className="font-medium text-neutral-700">City:</span>
                            <span className="ml-2 text-neutral-600">{selectedEmail.permitDetails.jurisdiction.city}</span>
                          </div>
                        )}
                        {selectedEmail.permitDetails.jurisdiction.province && (
                          <div>
                            <span className="font-medium text-neutral-700">Province:</span>
                            <span className="ml-2 text-neutral-600">{selectedEmail.permitDetails.jurisdiction.province}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-sm text-neutral-600 flex-shrink-0">
              <div className="flex items-center gap-4">
                <span>Email ID: {selectedEmail._id}</span>
                {selectedEmail.threadId && (
                  <span>Thread: {selectedEmail.threadId}</span>
                )}
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="px-4 py-2 bg-white border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Close
              </button>
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
