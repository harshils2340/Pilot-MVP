import { ArrowLeft, FileText, MessageSquare, Clock, AlertCircle, Edit3, Lock, Send, MoreVertical, Info, Paperclip, Download, ExternalLink, CheckCircle2, Building2, Calendar, User2, Hash, CheckCircle, Circle, Plus, Upload, ChevronDown, ChevronRight, AtSign, Smile, MoreHorizontal, Pin, X, MessageCircle, Mail, User, Trash2, Link2, Copy, GitPullRequest, Sparkles, FileEdit, DollarSign, Eye, Loader2 } from 'lucide-react';
import { RequestDocumentModal } from './RequestDocumentModal';
import { ReviewSection } from './ReviewSection';
import { FillablePDFModal } from './FillablePDFModal';
import { LiveFillModal } from './LiveFillModal';
import { toast } from 'sonner';
import { useState, useEffect, useMemo, useRef } from 'react';
import { getPermitById } from '../lib/permits/demoData';
import { SIDEWALK_CAFE_FILL_STEPS, SIDEWALK_CAFE_PDF_URL } from '../lib/permits/liveFillData';

type PermitStatus = 'not-started' | 'in-progress' | 'submitted' | 'action-required' | 'approved';

interface PermitDetailViewProps {
  permitId: string;
  onBack: () => void;
  clientName?: string;
  clientId?: string; // Used for form filling and status persistence
}

interface Reply {
  id: string;
  author: {
    name: string;
    initials: string;
    color: string;
  };
  message: string;
  timestamp: string;
  reactions?: { emoji: string; count: number; userReacted: boolean }[];
}

interface Comment {
  id: string;
  author: {
    name: string;
    initials: string;
    color: string;
    role: 'consultant' | 'client';
  };
  message: string;
  timestamp: string;
  fullTimestamp: string;
  linkedTo?: string;
  resolved?: boolean;
  pinned?: boolean;
  reactions: { emoji: string; count: number; userReacted: boolean }[];
  replies?: Reply[];
  attachments?: { name: string; size: string }[];
}

interface CityFeedbackItem {
  id: string;
  date: string;
  time: string;
  type: 'revision_required' | 'comment' | 'question';
  author: string;
  department: string;
  subject: string;
  comment: string;
  attachments: { name: string; size: string; type: string }[];
  status: 'not_started' | 'in_progress' | 'addressed';
  requiredDocuments?: string[];
  uploadedDocuments?: { name: string; size: string; uploadedBy: string; uploadedAt: string }[];
  consultantResponse?: string;
}

type Section = 'overview' | 'city-feedback' | 'documents' | 'review' | 'discussion' | 'history';

interface ClientEmail {
  _id: string;
  permitId: string;
  permitName: string;
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
  metadata?: {
    messageId?: string;
    headers?: Record<string, string>;
    consultantResponse?: string;
  };
}

export function PermitDetailView({ permitId, onBack, clientName, clientId }: PermitDetailViewProps) {
  // Use clientId from URL if not provided as prop (for form filling)
  const [effectiveClientId, setEffectiveClientId] = useState<string | undefined>(clientId);
  useEffect(() => {
    if (!effectiveClientId && typeof window !== 'undefined') {
      const pathMatch = window.location.pathname.match(/\/clients\/([^\/\?]+)/);
      if (pathMatch?.[1]) setEffectiveClientId(pathMatch[1]);
    }
  }, [effectiveClientId]);
  // Default to overview when the permit has a fillable form, otherwise city-feedback
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [expandedFeedback, setExpandedFeedback] = useState<string>('1');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [cityEmails, setCityEmails] = useState<ClientEmail[]>([]);
  const [loadingCityEmails, setLoadingCityEmails] = useState(false);
  const [cityEmailResponses, setCityEmailResponses] = useState<Record<string, string>>({});
  const [documentRequests, setDocumentRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [clientInfo, setClientInfo] = useState<{ id: string; name: string; email: string } | null>(null);
  const [showFillModal, setShowFillModal] = useState(false);
  const [showLiveFill, setShowLiveFill] = useState(false);
  const [localStatus, setLocalStatus] = useState<PermitStatus | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const [requiredDocuments, setRequiredDocuments] = useState<{ name: string; description: string }[]>([]);
  const [loadingRequiredDocs, setLoadingRequiredDocs] = useState(false);
  const [totalPermitsInPlan, setTotalPermitsInPlan] = useState<number | null>(null);
  const [managementPermitData, setManagementPermitData] = useState<{
    id?: string;
    name?: string;
    authority?: string;
    municipality?: string;
    lastActivityDate?: string | Date;
    order?: number;
    requirements?: string[];
    fees?: string;
    estimatedTime?: string;
    blocks?: string[];
    blockedBy?: string;
    [k: string]: unknown;
  } | null>(null);

  // Look up permit by ID from shared demo data (or API in production)
  const demoPermitData = useMemo(() => getPermitById(permitId), [permitId]);

  // Prefer demo data; fallback to management fetch when demo returns null (e.g. management doc ids)
  const permitData = demoPermitData ?? managementPermitData;

  // Fetch permit list from management (for total count + permit details when demo returns null)
  useEffect(() => {
    if (!effectiveClientId || !permitId) return;
    fetch(`/api/permits/management?clientId=${encodeURIComponent(effectiveClientId)}&limit=500`)
      .then((r) => r.ok ? r.json() : [])
      .then((permits: unknown[]) => {
        const list = Array.isArray(permits) ? permits : [];
        setTotalPermitsInPlan(list.length);
        const found = list.find((p: unknown) => {
          const x = p as { id?: string; _id?: string };
          return (x.id || x._id) === permitId;
        });
        if (found && typeof found === 'object') {
          const f = found as Record<string, unknown>;
          setManagementPermitData({
            id: (f.id || f._id || permitId) as string,
            name: f.name as string,
            authority: f.authority as string,
            municipality: f.municipality as string,
            lastActivityDate: f.lastActivityDate as string | Date | undefined,
            order: f.order as number | undefined,
            requirements: f.requirements as string[] | undefined,
            fees: f.fees as string | undefined,
            estimatedTime: f.estimatedTime as string | undefined,
            blocks: (f.blocks as string[]) || [],
            blockedBy: f.blockedBy as string | undefined,
          });
        } else {
          setManagementPermitData(null);
        }
      })
      .catch(() => {});
  }, [effectiveClientId, permitId]);

  // Fetch required documents from LLM when permit loads
  useEffect(() => {
    if (!permitId) return;
    const pd = permitData;
    const name = pd?.name || '';
    const authority = pd?.authority || (pd as { department?: string })?.department || '';
    const municipality = pd?.municipality || '';
    if (!name) {
      setRequiredDocuments([]);
      return;
    }
    setLoadingRequiredDocs(true);
    setRequiredDocuments([]);
    fetch('/api/permits/required-documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        permitName: name,
        authority,
        municipality,
      }),
    })
      .then((r) => r.json())
      .then((data: { documents?: Array<{ name?: string; description?: string }> }) => {
        const docs = Array.isArray(data?.documents)
          ? data.documents
              .filter((d) => d && typeof d.name === 'string')
              .map((d) => ({
                name: String(d.name).trim(),
                description: typeof d.description === 'string' ? d.description.trim() : '',
              }))
          : [];
        setRequiredDocuments(docs);
      })
      .catch(() => setRequiredDocuments([]))
      .finally(() => setLoadingRequiredDocs(false));
  }, [permitId, permitData?.name, permitData?.authority, permitData?.municipality]);

  const fetchRequiredDocuments = () => {
    const pd = permitData;
    const name = pd?.name;
    const authority = pd?.authority || (pd as { department?: string })?.department;
    const municipality = pd?.municipality;
    if (!name) return;
    setLoadingRequiredDocs(true);
    fetch('/api/permits/required-documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permitName: name, authority, municipality }),
    })
      .then((r) => r.json())
      .then((data: { documents?: Array<{ name?: string; description?: string }> }) => {
        const docs = Array.isArray(data?.documents)
          ? data.documents
              .filter((d) => d && typeof d.name === 'string')
              .map((d) => ({
                name: String(d.name).trim(),
                description: typeof d.description === 'string' ? d.description.trim() : '',
              }))
          : [];
        setRequiredDocuments(docs);
      })
      .catch(() => setRequiredDocuments([]))
      .finally(() => setLoadingRequiredDocs(false));
  };

  // Fetch permit status from API when clientId + permitId (persists status)
  useEffect(() => {
    if (!effectiveClientId || !permitId) return;
    const abort = new AbortController();
    fetch(`/api/permits/management?clientId=${encodeURIComponent(effectiveClientId)}&limit=200`, {
      signal: abort.signal,
    })
      .then((r) => r.ok ? r.json() : [])
      .then((permits: { id?: string; _id?: string; status?: string }[]) => {
        const found = permits.find((p) => (p.id || p._id) === permitId);
        if (found?.status) {
          setLocalStatus(found.status as PermitStatus);
        }
      })
      .catch(() => {});
    return () => abort.abort();
  }, [effectiveClientId, permitId]);
  const effectiveStatus = localStatus ?? (permitData?.status as PermitStatus | undefined) ?? 'not-started';
  const pd = permitData as unknown as {
    applicationNumber?: string;
    governmentFee?: number;
    fees?: string;
    estimatedTime?: string;
    lastActivityDate?: string | Date;
  } | undefined;
  const permit = permitData
    ? {
        id: permitData.id,
        name: permitData.name,
        department: permitData.authority,
        municipality: permitData.municipality,
        status: effectiveStatus,
        order: permitData.order,
        submittedDate: (permitData as { submittedDate?: string }).submittedDate ?? '',
        lastUpdated: (() => {
          const lad = pd?.lastActivityDate;
          if (typeof lad === 'string') return lad;
          if (lad && typeof lad === 'object' && 'toLocaleDateString' in lad) return (lad as Date).toLocaleDateString?.() ?? '';
          return '';
        })(),
        blockedBy: permitData.blockedBy ?? null,
        blocks: permitData.blocks ?? [],
        formUrl: (permitData as { applyUrl?: string; sourceUrl?: string; formUrl?: string }).applyUrl
          || (permitData as { sourceUrl?: string }).sourceUrl
          || permitData.formUrl,
        formTitle: permitData.formTitle,
        formCode: permitData.formCode,
        assignee: permitData.assignee ?? {
          name: 'Unassigned',
          initials: '—',
          color: 'bg-muted',
        },
        applicationNumber: pd?.applicationNumber ?? '',
        governmentFee: typeof pd?.governmentFee === 'number' ? pd.governmentFee : (pd?.fees ? parseInt(String(pd.fees).replace(/\D/g, ''), 10) || 0 : 0),
        estimatedTime: pd?.estimatedTime ?? '',
      }
    : {
        id: permitId,
        name: permitId ? 'Unknown Permit' : 'Loading...',
        department: '',
        municipality: '',
        status: effectiveStatus,
        order: 0,
        submittedDate: '',
        lastUpdated: '',
        blockedBy: null,
        blocks: [] as string[],
        assignee: { name: 'Unassigned', initials: '—', color: 'bg-muted' },
        applicationNumber: '',
        governmentFee: 0,
        estimatedTime: '',
      };

  const [cityFeedback, setCityFeedback] = useState<CityFeedbackItem[]>([]);

  const [history] = useState<Array<{ id: string; date: string; time: string; action: string; details: string; actor: string; type: 'city' | 'team' }>>([]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          label: 'Approved',
          className: 'bg-green-50 text-green-700 border-green-200',
        };
      case 'submitted':
        return {
          icon: <Send className="w-4 h-4" />,
          label: 'Submitted',
          className: 'bg-muted text-foreground border-border',
        };
      case 'in-progress':
        return {
          icon: <Clock className="w-4 h-4" />,
          label: 'In Progress',
          className: 'bg-muted text-foreground border-border',
        };
      case 'action-required':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          label: 'Action Required',
          className: 'bg-red-50 text-red-700 border-red-200',
        };
      case 'not-started':
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          label: 'Not Started',
          className: 'bg-muted text-muted-foreground border-border',
        };
    }
  };

  const STATUS_OPTIONS: { value: PermitStatus; label: string }[] = [
    { value: 'not-started', label: 'Not Started' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'action-required', label: 'Action Required' },
    { value: 'approved', label: 'Approved' },
  ];

  const handleStatusChange = async (newStatus: PermitStatus) => {
    setShowStatusMenu(false);
    if (newStatus === effectiveStatus) return;
    setLocalStatus(newStatus);
    if ((effectiveClientId || clientId) && permitId) {
      setSavingStatus(true);
      try {
        const res = await fetch(`/api/permits/management/${permitId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          setLocalStatus(effectiveStatus);
          const err = await res.json();
          alert(err.error || 'Failed to update status');
        }
      } catch {
        setLocalStatus(effectiveStatus);
        alert('Failed to update status');
      } finally {
        setSavingStatus(false);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFeedbackStatusConfig = (status: CityFeedbackItem['status']) => {
    switch (status) {
      case 'addressed':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Addressed',
          className: 'bg-green-50 text-green-700 border-green-200',
        };
      case 'in_progress':
        return {
          icon: <Clock className="w-4 h-4" />,
          label: 'In Progress',
          className: 'bg-muted text-foreground border-border',
        };
      default:
        return {
          icon: <Circle className="w-4 h-4" />,
          label: 'Not Started',
          className: 'bg-muted text-muted-foreground border-border',
        };
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: String(comments.length + 1),
      author: { name: 'You', initials: 'You', color: 'bg-purple-500', role: 'consultant' },
      message: newComment,
      timestamp: 'Just now',
      fullTimestamp: 'Today at ' + new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      reactions: [],
    };
    
    setComments([comment, ...comments]);
    setNewComment('');
  };

  const handleAddReply = (commentId: string) => {
    if (!replyText.trim()) return;
    
    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        const newReply: Reply = {
          id: `r${(comment.replies?.length || 0) + 1}`,
          author: { name: 'You', initials: 'You', color: 'bg-purple-500' },
          message: replyText,
          timestamp: 'Just now',
        };
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply],
        };
      }
      return comment;
    });
    
    setComments(updatedComments);
    setReplyText('');
    setReplyingTo(null);
  };

  const toggleCommentResolved = (commentId: string) => {
    setComments(comments.map(comment =>
      comment.id === commentId ? { ...comment, resolved: !comment.resolved } : comment
    ));
  };

  const updateFeedbackStatus = (feedbackId: string, status: CityFeedbackItem['status']) => {
    setCityFeedback(cityFeedback.map(item =>
      item.id === feedbackId ? { ...item, status } : item
    ));
  };

  const statusConfig = getStatusConfig(permit.status);

  const allFeedbackAddressed = cityFeedback.every(item => item.status === 'addressed');
  const feedbackInProgress = cityFeedback.filter(item => item.status === 'in_progress').length;
  const feedbackNotStarted = cityFeedback.filter(item => item.status === 'not_started').length;

  const [clientEmails, setClientEmails] = useState<ClientEmail[]>([]);
  const [loadingClientEmails, setLoadingClientEmails] = useState(false);
  const [clientEmailResponses, setClientEmailResponses] = useState<Record<string, string>>({});
  const [testMode, setTestMode] = useState<boolean>(false);

  // Fetch test mode status
  useEffect(() => {
    const fetchTestMode = async () => {
      try {
        const response = await fetch('/api/emails/config');
        if (response.ok) {
          const data = await response.json();
          setTestMode(data.testMode || false);
        }
      } catch (error) {
        console.error('Error fetching test mode:', error);
      }
    };
    fetchTestMode();
  }, []);

  // Fetch city/authority emails for this permit
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        setLoadingCityEmails(true);
        setLoadingClientEmails(true);
        // Fetch all emails for this permit
        const response = await fetch(`/api/emails?permitId=${permitId}&status=all`);
        if (response.ok) {
          const data = await response.json();
          const allEmails = data.emails || [];
          
          // Filter for city/authority emails (emails from city domains or marked as city feedback)
          const cityEmailsList = allEmails.filter((email: ClientEmail) => {
            const fromEmail = email.from.email.toLowerCase();
            const isCityEmail = 
              fromEmail.includes('.gov') || 
              fromEmail.includes('city') || 
              fromEmail.includes('municipal') ||
              fromEmail.includes('department') ||
              email.metadata?.headers?.['X-City-Feedback'] === 'true' ||
              (!email.clientName && email.direction === 'inbound' && !fromEmail.includes('@'));
            
            return isCityEmail;
          });
          
          // Filter for client emails (emails that have clientName or are from non-city domains)
          const clientEmailsList = allEmails.filter((email: ClientEmail) => {
            const fromEmail = email.from.email.toLowerCase();
            const isClientEmail = 
              email.clientName ||
              (email.direction === 'inbound' && 
               !fromEmail.includes('.gov') && 
               !fromEmail.includes('city') && 
               !fromEmail.includes('municipal') &&
               !fromEmail.includes('department') &&
               email.metadata?.headers?.['X-City-Feedback'] !== 'true');
            
            return isClientEmail;
          });
          
          setCityEmails(cityEmailsList);
          setClientEmails(clientEmailsList);
          
          // Load saved responses for both
          const cityResponses: Record<string, string> = {};
          const clientResponses: Record<string, string> = {};
          
          cityEmailsList.forEach((email: ClientEmail) => {
            if (email.metadata?.consultantResponse) {
              cityResponses[email._id] = email.metadata.consultantResponse;
            }
          });
          
          clientEmailsList.forEach((email: ClientEmail) => {
            if (email.metadata?.consultantResponse) {
              clientResponses[email._id] = email.metadata.consultantResponse;
            }
          });
          
          setCityEmailResponses(cityResponses);
          setClientEmailResponses(clientResponses);
        }
      } catch (error) {
        console.error('Error fetching emails:', error);
      } finally {
        setLoadingCityEmails(false);
        setLoadingClientEmails(false);
      }
    };

    if (permitId) {
      fetchEmails();
    }
  }, [permitId]);

  // Fetch document requests and documents when documents section is active
  useEffect(() => {
    if (activeSection === 'documents' && permitId) {
      fetchDocumentRequests();
      fetchDocuments();
    }
  }, [activeSection, permitId, effectiveClientId]);

  const fetchDocumentRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(`/api/documents/requests?permitId=${permitId}`);
      if (res.ok) {
        const data = await res.json();
        setDocumentRequests(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch document requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams({ permitId, workspace: 'permits' });
      if (effectiveClientId) params.set('clientId', effectiveClientId);
      const res = await fetch(`/api/documents?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : data?.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  // Fetch client info for document requests
  useEffect(() => {
    const fetchClientInfo = async () => {
      if (!clientName) return;
      try {
        // Try to get client by name
        const res = await fetch(`/api/clients/${encodeURIComponent(clientName)}`);
        if (res.ok) {
          const client = await res.json();
          setClientInfo({
            id: client._id || client.id,
            name: client.businessName || clientName,
            email: client.contactInfo?.email || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch client info:', error);
        // Fallback to clientName only
        setClientInfo({
          id: '',
          name: clientName || 'Client',
          email: '',
        });
      }
    };
    fetchClientInfo();
  }, [clientName]);

  const formatEmailDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  };

  const handleMarkCityEmailAsRead = async (emailId: string) => {
    try {
      await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' })
      });
      setCityEmails(cityEmails.map(e => e._id === emailId ? { ...e, status: 'read' as const } : e));
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  const handleSaveCityResponse = async (emailId: string, response: string) => {
    try {
      await fetch(`/api/emails/${emailId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            consultantResponse: response
          }
        })
      });
      // Update local state
      setCityEmailResponses({
        ...cityEmailResponses,
        [emailId]: response
      });
    } catch (error) {
      console.error('Error saving response:', error);
      throw error;
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-surface border border-border rounded-lg p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Permit Information</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Application Number</p>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-foreground font-mono">
                      {permit.applicationNumber || '—'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Order in Plan</p>
                  <p className="text-sm text-foreground">
                    #{permit.order}
                    {totalPermitsInPlan != null ? ` of ${totalPermitsInPlan}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Issuing Authority</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-foreground">{permit.department}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Municipality</p>
                  <p className="text-sm text-foreground">{permit.municipality}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Submitted</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-foreground">{permit.submittedDate || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Last Updated</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm text-foreground">{permit.lastUpdated || '—'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Assigned To</p>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const a = (permit.assignee as { name?: string; initials?: string; color?: string } | undefined);
                      const safe = a && typeof a.name === 'string' && typeof a.initials === 'string' && typeof a.color === 'string'
                        ? a
                        : { name: 'Unassigned', initials: '—', color: 'bg-muted' };
                      return (
                        <>
                          <div className={`w-5 h-5 rounded-full ${safe.color} text-white text-xs font-medium flex items-center justify-center`}>
                            {safe.initials}
                          </div>
                          <p className="text-sm text-foreground">{safe.name}</p>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Current Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusConfig.className}`}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Government Fee</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">
                      {permit.governmentFee > 0 ? `$${permit.governmentFee.toLocaleString()}` : 'No fee'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dependencies */}
            {permit.blocks.length > 0 && (
              <div className="bg-surface border border-border rounded-lg p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Dependencies</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">This permit is blocking:</p>
                    <div className="space-y-2">
                      {permit.blocks.map((blocked, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-muted border border-border rounded-lg">
                          <Lock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground font-medium">{blocked}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Required Documents - dynamic from LLM */}
            <div className="bg-surface border border-border rounded-lg p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Required Documents</h3>
              {loadingRequiredDocs ? (
                <div className="flex items-center gap-3 py-6">
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Finding documents typically needed for this permit…
                  </p>
                </div>
              ) : requiredDocuments.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    These are the documents we think you&apos;ll need for this permit application.
                  </p>
                  <div className="space-y-2">
                    {requiredDocuments.map((doc, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-muted/50 border border-border rounded-lg">
                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{doc.name}</p>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-start gap-3">
                  <p className="text-sm text-muted-foreground">No documents listed for this permit.</p>
                  <button
                    onClick={fetchRequiredDocuments}
                    disabled={loadingRequiredDocs || !permit.name}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingRequiredDocs ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    Find required documents
                  </button>
                </div>
              )}
            </div>

            {/* AI Form Filling */}
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-muted to-muted/80 border-b border-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground mb-1">Government Form</h3>
                    <p className="text-sm text-muted-foreground">
                      Click below to open the government portal. Our AI will help you fill the form using information from your documents.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0">
                      <FileEdit className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-foreground">
                          {(permitData as { formTitle?: string })?.formTitle || permit.name || 'Form'} {(permitData as { formCode?: string })?.formCode && `(${(permitData as { formCode: string }).formCode})`}
                        </h4>
                        <span className="px-2 py-0.5 bg-muted text-muted-foreground border border-border rounded text-xs font-semibold">
                          Required
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Primary application form for {(permit.name || 'permit').toLowerCase()}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {permit.department}
                        </span>
                        {(permit as { estimatedTime?: string }).estimatedTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {(permit as { estimatedTime: string }).estimatedTime} to complete
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Always show Fill with AI button - navigates to separate page */}
                  <a
                    href={`/fill-form?clientId=${encodeURIComponent(effectiveClientId || clientId || '')}&permitId=${encodeURIComponent(permitId)}&permitName=${encodeURIComponent(permit.name || '')}&clientName=${encodeURIComponent(clientName || '')}&formTitle=${encodeURIComponent((permitData as { formTitle?: string; formCode?: string })?.formTitle && (permitData as { formCode?: string })?.formCode ? `${(permitData as { formTitle: string }).formTitle} (${(permitData as { formCode: string }).formCode})` : (permitData as { formTitle?: string })?.formTitle || permit.name || '')}`}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm hover:shadow flex-shrink-0 cursor-pointer"
                    style={{ opacity: (effectiveClientId || clientId) ? 1 : 0.5 }}
                    title={(effectiveClientId || clientId) ? 'Fill form with AI using your business data' : 'Client ID required - please refresh'}
                  >
                    <Sparkles className="w-4 h-4" />
                    Fill with AI
                  </a>
                  {(permitData as { formUrl?: string })?.formUrl && typeof (permitData as { formUrl?: string }).formUrl === 'string' && !(permitData as { formUrl: string }).formUrl.startsWith('/api/fill-pdf') && (
                    <a
                      href={(permitData as { formUrl: string }).formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-all flex-shrink-0"
                    >
                      <FileText className="w-4 h-4" />
                      View Form
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'city-feedback':
        // Combine mock city feedback with actual city emails
        const allCityFeedback = [...cityFeedback];
        const totalCityItems = allCityFeedback.length + cityEmails.length;
        const unreadCityEmails = cityEmails.filter(e => e.status === 'unread').length;
        const unreadClientEmails = clientEmails.filter(e => e.status === 'unread').length;

        // Google sign-in gate — email integration requires OAuth
        const isGoogleConnected = false; // TODO: wire to real auth state
        if (!isGoogleConnected) {
          return (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="max-w-md w-full text-center space-y-6">
                <div className="mx-auto w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
                  <Mail className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Connect your email to unlock City Feedback</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sign in with Google to let Pilot monitor your inbox for permit-related updates from the city.
                  </p>
                </div>

                <div className="text-left space-y-3 bg-muted/40 rounded-lg p-4 border border-border">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-blue-700 text-xs font-bold">1</span>
                    </div>
                    <p className="text-sm text-foreground"><span className="font-medium">Auto-detect permit emails</span> — Pilot filters your inbox and surfaces only messages related to your active permits</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-blue-700 text-xs font-bold">2</span>
                    </div>
                    <p className="text-sm text-foreground"><span className="font-medium">Draft & send replies in-app</span> — Respond to city feedback directly from Pilot without switching to your email client</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-blue-700 text-xs font-bold">3</span>
                    </div>
                    <p className="text-sm text-foreground"><span className="font-medium">Track resolution status</span> — Mark feedback as addressed, in-progress, or unresolved and see progress at a glance</p>
                  </div>
                </div>

                <button
                  onClick={() => {/* TODO: trigger Google OAuth flow */}}
                  className="inline-flex items-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all text-sm font-medium text-gray-700"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </button>
                <p className="text-xs text-muted-foreground">Pilot only reads permit-related emails. Your data stays private.</p>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {/* Summary Bar */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {totalCityItems} feedback item{totalCityItems !== 1 ? 's' : ''} from city
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {feedbackNotStarted} not started • {feedbackInProgress} in progress • {cityFeedback.length - feedbackNotStarted - feedbackInProgress} addressed
                      {unreadCityEmails > 0 && ` • ${unreadCityEmails} unread city email${unreadCityEmails !== 1 ? 's' : ''}`}
                      {unreadClientEmails > 0 && ` • ${unreadClientEmails} unread client email${unreadClientEmails !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  {cityFeedback.length > 0 && (
                    <div className="h-2 w-48 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${(cityFeedback.filter(f => f.status === 'addressed').length / cityFeedback.length) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                {allFeedbackAddressed && unreadCityEmails === 0 && unreadClientEmails === 0 ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 border border-border rounded-lg">
                    <CheckCircle className="w-4 h-4 text-foreground" />
                    <span className="text-sm font-medium text-foreground">Ready to Resubmit</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 border border-border rounded-lg">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      {feedbackInProgress + feedbackNotStarted + unreadCityEmails + unreadClientEmails} item{feedbackInProgress + feedbackNotStarted + unreadCityEmails + unreadClientEmails !== 1 ? 's' : ''} need attention
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Loading State for City Emails */}
            {loadingCityEmails && (
              <div className="bg-surface border border-border rounded-lg p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground mx-auto mb-2"></div>
                <p className="text-xs text-muted-foreground">Loading city emails...</p>
              </div>
            )}

            {/* City Emails from Database */}
            {!loadingCityEmails && cityEmails.length > 0 && (
              <div className="space-y-3">
                {cityEmails
                  .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
                  .map((email) => {
                    const isExpanded = expandedFeedback === email._id;
                    const isUnread = email.status === 'unread';
                    
                    return (
                      <div
                        key={email._id}
                        className={`bg-surface border rounded-lg overflow-hidden ${
                          isUnread ? 'border-l-4 border-l-red-500 border-border' : 'border-l-4 border-l-blue-500 border-border'
                        }`}
                      >
                        {/* Header - Always Visible */}
                        <div
                          className={`px-6 py-4 cursor-pointer hover:bg-accent transition-colors ${
                            isUnread ? 'bg-red-50/30' : ''
                          }`}
                          onClick={() => {
                            setExpandedFeedback(isExpanded ? '' : email._id);
                            if (isUnread) {
                              handleMarkCityEmailAsRead(email._id);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className={`font-semibold text-base text-foreground ${isUnread ? 'font-bold' : ''}`}>
                                    {email.subject}
                                  </h3>
                                  {isUnread && (
                                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                    email.priority === 'high' 
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : email.priority === 'medium'
                                      ? 'bg-muted text-muted-foreground border-border'
                                      : 'bg-muted/50 text-muted-foreground border-border'
                                  }`}>
                                    {email.priority}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="font-medium">{email.from.name || email.from.email}</span>
                                  <span className="text-muted-foreground">•</span>
                                  <span>{formatEmailDate(email.receivedAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="border-t border-border">
                            {/* City's Message */}
                            <div className="px-6 py-4 bg-red-50/30">
                              <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
                                City's Request:
                              </p>
                              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line mb-3">
                                {email.body}
                              </p>

                              {/* City Attachments */}
                              {email.attachments && email.attachments.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs font-medium text-muted-foreground mb-2">City Attachments</p>
                                  <div className="space-y-1.5">
                                    {email.attachments.map((attachment, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between p-2 bg-surface border border-border rounded group hover:bg-accent cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-muted-foreground" />
                                          <span className="text-xs font-medium text-foreground">{attachment.filename}</span>
                                          <span className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <Download className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Your Response to City */}
                            <div className="px-6 py-4 border-t border-border bg-muted">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Your Response to City
                              </p>
                              <textarea
                                rows={6}
                                value={cityEmailResponses[email._id] || ''}
                                onChange={(e) => {
                                  setCityEmailResponses({
                                    ...cityEmailResponses,
                                    [email._id]: e.target.value
                                  });
                                }}
                                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                                placeholder="Explain what you fixed and how you addressed the city's concerns. This will be included when you resubmit..."
                              />
                              <div className="flex items-center justify-between mt-3">
                                <p className="text-xs text-muted-foreground">This response will be sent to the city when you resubmit</p>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={async () => {
                                      try {
                                        await handleSaveCityResponse(email._id, cityEmailResponses[email._id] || '');
                                        alert('Response saved successfully');
                                      } catch (error) {
                                        console.error('Error saving response:', error);
                                        alert('Failed to save response');
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-surface border border-border text-foreground text-xs font-medium rounded-lg hover:bg-accent transition-colors"
                                  >
                                    Save Response
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const responseText = cityEmailResponses[email._id] || '';
                                        if (!responseText.trim()) {
                                          alert('Please enter a response before sending');
                                          return;
                                        }

                                        if (!email.from?.email) {
                                          alert('Cannot send email: No recipient email address found');
                                          return;
                                        }

                                        // Prepare email data (permitId and permitName are optional)
                                        const emailData: any = {
                                          subject: email.subject ? `Re: ${email.subject}` : 'Re: City Feedback',
                                          to: email.from.email,
                                          body: responseText,
                                          direction: 'outbound' as const
                                        };

                                        // Add optional fields only if they exist
                                        if (email.permitId || permitId) {
                                          emailData.permitId = email.permitId || permitId;
                                        }
                                        if (email.permitName || permit.name) {
                                          emailData.permitName = email.permitName || permit.name;
                                        }
                                        if (email.clientId) {
                                          emailData.clientId = email.clientId;
                                        }
                                        if (email.clientName) {
                                          emailData.clientName = email.clientName;
                                        }
                                        if (email.metadata?.messageId || email._id) {
                                          emailData.inReplyTo = email.metadata?.messageId || email._id;
                                        }
                                        if (email.threadId || email._id) {
                                          emailData.threadId = email.threadId || email._id;
                                        }

                                        console.log('Sending email with data:', emailData);

                                        const response = await fetch('/api/emails/send', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify(emailData)
                                        });
                                        
                                        if (response.ok) {
                                          const result = await response.json();
                                          alert('Email sent successfully!');
                                          // Mark original email as replied
                                          await handleMarkCityEmailAsRead(email._id);
                                          // Update status to replied
                                          await fetch(`/api/emails/${email._id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: 'replied' })
                                          });
                                          // Refresh emails to show the sent email
                                          window.location.reload();
                                        } else {
                                          const error = await response.json();
                                          alert(`Failed to send email: ${error.error || 'Unknown error'}`);
                                        }
                                      } catch (error) {
                                        console.error('Error sending email:', error);
                                        alert('Failed to send email');
                                      }
                                    }}
                                    disabled={!cityEmailResponses[email._id] || cityEmailResponses[email._id].trim().length === 0}
                                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    Send Reply
                                  </button>
                                  {testMode && (
                                    <button
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm('Are you sure you want to delete this email?')) {
                                          try {
                                            const response = await fetch(`/api/emails/${email._id}`, {
                                              method: 'DELETE'
                                            });
                                            if (response.ok) {
                                              setCityEmails(cityEmails.filter(e => e._id !== email._id));
                                              alert('Email deleted successfully');
                                            } else {
                                              alert('Failed to delete email');
                                            }
                                          } catch (error) {
                                            console.error('Error deleting email:', error);
                                            alert('Failed to delete email');
                                          }
                                        }
                                      }}
                                      className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1.5"
                                      title="Delete email"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Client Emails from Database */}
            {!loadingClientEmails && clientEmails.length > 0 && (
              <div className="space-y-3">
                <div className="bg-surface border border-border rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-foreground">Client Messages</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {clientEmails.length} message{clientEmails.length !== 1 ? 's' : ''} from client{clientEmails.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {clientEmails
                  .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
                  .map((email) => {
                    const isExpanded = expandedFeedback === `client-${email._id}`;
                    const isUnread = email.status === 'unread';
                    
                    return (
                      <div
                        key={email._id}
                        className={`bg-surface border rounded-lg overflow-hidden ${
                          isUnread ? 'border-l-4 border-l-blue-500 border-border' : 'border-border'
                        }`}
                      >
                        {/* Header - Always Visible */}
                        <div
                          className={`px-6 py-4 cursor-pointer hover:bg-accent transition-colors ${
                            isUnread ? 'bg-primary/10/30' : ''
                          }`}
                          onClick={() => {
                            setExpandedFeedback(isExpanded ? '' : `client-${email._id}`);
                            if (isUnread) {
                              handleMarkCityEmailAsRead(email._id);
                            }
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className={`font-semibold text-base text-foreground ${isUnread ? 'font-bold' : ''}`}>
                                    {email.subject}
                                  </h3>
                                  {isUnread && (
                                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                  )}
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground border border-border">
                                    Client
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span className="font-medium">{email.from.name || email.from.email}</span>
                                  {email.clientName && (
                                    <>
                                      <span className="text-muted-foreground">•</span>
                                      <span>{email.clientName}</span>
                                    </>
                                  )}
                                  <span className="text-muted-foreground">•</span>
                                  <span>{formatEmailDate(email.receivedAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="border-t border-border">
                            {/* Client's Message */}
                            <div className="px-6 py-4 bg-muted/30">
                              <p className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
                                Client's Message:
                              </p>
                              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line mb-3">
                                {email.body}
                              </p>

                              {/* Client Attachments */}
                              {email.attachments && email.attachments.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs font-medium text-muted-foreground mb-2">Attachments</p>
                                  <div className="space-y-1.5">
                                    {email.attachments.map((attachment, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between p-2 bg-surface border border-border rounded group hover:bg-accent cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-muted-foreground" />
                                          <span className="text-xs font-medium text-foreground">{attachment.filename}</span>
                                          <span className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <Download className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Your Response to Client */}
                            <div className="px-6 py-4 border-t border-border bg-muted">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Your Response to Client
                              </p>
                              <textarea
                                rows={6}
                                value={clientEmailResponses[email._id] || ''}
                                onChange={(e) => {
                                  setClientEmailResponses({
                                    ...clientEmailResponses,
                                    [email._id]: e.target.value
                                  });
                                }}
                                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                                placeholder="Type your reply to the client here..."
                              />
                              <div className="flex items-center justify-between mt-3">
                                <p className="text-xs text-muted-foreground">This reply will be sent to the client</p>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={async () => {
                                      try {
                                        await fetch(`/api/emails/${email._id}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            metadata: {
                                              ...email.metadata,
                                              consultantResponse: clientEmailResponses[email._id]
                                            }
                                          })
                                        });
                                        alert('Response saved successfully');
                                      } catch (error) {
                                        console.error('Error saving response:', error);
                                        alert('Failed to save response');
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-surface border border-border text-foreground text-xs font-medium rounded-lg hover:bg-accent transition-colors"
                                  >
                                    Save Draft
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const responseText = clientEmailResponses[email._id] || '';
                                        if (!responseText.trim()) {
                                          alert('Please enter a response before sending');
                                          return;
                                        }

                                        if (!email.from?.email) {
                                          alert('Cannot send email: No recipient email address found');
                                          return;
                                        }

                                        // Prepare email data (permitId and permitName are optional)
                                        const emailData: any = {
                                          subject: email.subject ? `Re: ${email.subject}` : 'Re: Client Inquiry',
                                          to: email.from.email,
                                          body: responseText,
                                          direction: 'outbound' as const
                                        };

                                        // Add optional fields only if they exist
                                        if (email.permitId || permitId) {
                                          emailData.permitId = email.permitId || permitId;
                                        }
                                        if (email.permitName || permit.name) {
                                          emailData.permitName = email.permitName || permit.name;
                                        }
                                        if (email.clientId) {
                                          emailData.clientId = email.clientId;
                                        }
                                        if (email.clientName) {
                                          emailData.clientName = email.clientName;
                                        }
                                        if (email.metadata?.messageId || email._id) {
                                          emailData.inReplyTo = email.metadata?.messageId || email._id;
                                        }
                                        if (email.threadId || email._id) {
                                          emailData.threadId = email.threadId || email._id;
                                        }

                                        console.log('Sending email with data:', emailData);

                                        const response = await fetch('/api/emails/send', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify(emailData)
                                        });
                                        
                                        if (response.ok) {
                                          const result = await response.json();
                                          alert('Email sent successfully to client!');
                                          // Mark original email as replied
                                          await handleMarkCityEmailAsRead(email._id);
                                          await fetch(`/api/emails/${email._id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: 'replied' })
                                          });
                                          // Clear the response text
                                          setClientEmailResponses({
                                            ...clientEmailResponses,
                                            [email._id]: ''
                                          });
                                        } else {
                                          const error = await response.json();
                                          alert(`Failed to send email: ${error.error || 'Unknown error'}`);
                                        }
                                      } catch (error) {
                                        console.error('Error sending email:', error);
                                        alert('Failed to send email');
                                      }
                                    }}
                                    disabled={!clientEmailResponses[email._id] || clientEmailResponses[email._id].trim().length === 0}
                                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                    Send Reply
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Feedback Items */}
            {cityFeedback.map((feedback) => {
              const statusConfig = getFeedbackStatusConfig(feedback.status);
              const isExpanded = expandedFeedback === feedback.id;
              
              return (
                <div key={feedback.id} className="bg-surface border border-border rounded-lg overflow-hidden">
                  {/* Header - Always Visible */}
                  <div 
                    className={`px-6 py-4 cursor-pointer hover:bg-accent transition-colors ${
                      feedback.type === 'revision_required' 
                        ? 'border-l-4 border-l-red-500' 
                        : 'border-l-4 border-l-blue-500'
                    }`}
                    onClick={() => setExpandedFeedback(isExpanded ? '' : feedback.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-base text-foreground">
                              {feedback.subject}
                            </h3>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusConfig.className}`}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">{feedback.author}</span>
                            <span className="text-muted-foreground">•</span>
                            <span>{feedback.date} at {feedback.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-border">
                      {/* City's Comment */}
                      <div className="px-6 py-4 bg-muted/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">City's Request</p>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                          {feedback.comment}
                        </p>

                        {/* City Attachments */}
                        {feedback.attachments.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">City Attachments</p>
                            <div className="space-y-2">
                              {feedback.attachments.map((attachment, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 bg-surface border border-border rounded-lg hover:bg-accent transition-colors group cursor-pointer"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                                      <FileText className="w-4 h-4 text-red-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-foreground">{attachment.name}</p>
                                      <p className="text-xs text-muted-foreground">{attachment.size}</p>
                                    </div>
                                  </div>
                                  <Download className="w-4 h-4 text-muted-foreground group-hover:text-muted-foreground" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Required Documents */}
                      {feedback.requiredDocuments && feedback.requiredDocuments.length > 0 && (
                        <div className="px-6 py-4 border-t border-border">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Required Documents</p>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-colors">
                              <Upload className="w-3.5 h-3.5" />
                              Upload File
                            </button>
                          </div>
                          <div className="space-y-2">
                            {feedback.requiredDocuments.map((doc, idx) => {
                              const uploaded = feedback.uploadedDocuments?.find(u => u.name.toLowerCase().includes(doc.toLowerCase().split(' ')[0]));
                              return (
                                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 border border-border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    {uploaded ? (
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-muted-foreground/60" />
                                    )}
                                    <div>
                                      <p className="text-sm font-medium text-foreground">{doc}</p>
                                      {uploaded && (
                                        <p className="text-xs text-muted-foreground">{uploaded.uploadedBy} • {uploaded.uploadedAt}</p>
                                      )}
                                    </div>
                                  </div>
                                  {uploaded ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">{uploaded.size}</span>
                                      <Download className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-muted-foreground" />
                                    </div>
                                  ) : (
                                    <button className="text-xs text-primary font-medium hover:text-foreground">
                                      Upload
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Additional uploaded documents */}
                          {feedback.uploadedDocuments && feedback.uploadedDocuments.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Additional Documents</p>
                              {feedback.uploadedDocuments
                                .filter(uploaded => !feedback.requiredDocuments?.some(req => uploaded.name.toLowerCase().includes(req.toLowerCase().split(' ')[0])))
                                .map((doc, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 border border-border rounded-lg mb-2">
                                    <div className="flex items-center gap-3">
                                      <FileText className="w-4 h-4 text-muted-foreground" />
                                      <div>
                                        <p className="text-sm font-medium text-foreground">{doc.name}</p>
                                        <p className="text-xs text-muted-foreground">{doc.uploadedBy} • {doc.uploadedAt}</p>
                                      </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{doc.size}</span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Consultant Response */}
                      <div className="px-6 py-4 border-t border-border bg-muted">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Response to City</p>
                        <textarea
                          rows={6}
                          value={cityEmailResponses[feedback.id] || feedback.consultantResponse || ''}
                          onChange={(e) => {
                            setCityEmailResponses({
                              ...cityEmailResponses,
                              [feedback.id]: e.target.value
                            });
                          }}
                          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                          placeholder="Explain what you fixed and how you addressed the city's concerns. This will be included when you resubmit..."
                        />
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs text-muted-foreground">This response will be sent to the city when you resubmit</p>
                          <button
                            onClick={async () => {
                              try {
                                // For mock feedback, we can store in local state or a separate API
                                // For now, just show success message
                                alert('Response saved successfully');
                              } catch (error) {
                                console.error('Error saving response:', error);
                                alert('Failed to save response');
                              }
                            }}
                            className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-colors"
                          >
                            Save Response
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="px-6 py-4 border-t border-border bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {feedback.status === 'addressed' ? (
                              <button 
                                onClick={() => updateFeedbackStatus(feedback.id, 'in_progress')}
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Marked as Addressed
                              </button>
                            ) : (
                              <button 
                                onClick={() => updateFeedbackStatus(feedback.id, 'addressed')}
                                className="flex items-center gap-2 px-3 py-1.5 border border-border text-foreground text-xs font-medium rounded-lg hover:bg-accent transition-colors"
                              >
                                <Circle className="w-4 h-4" />
                                Mark as Addressed
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Mark as addressed once all documents are uploaded and response is complete
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );


      case 'discussion':
        return (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-surface border border-border rounded-lg p-3">
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md">
                  All
                </button>
                <button className="px-3 py-1.5 text-muted-foreground text-xs font-medium rounded-md hover:bg-accent">
                  Unresolved ({comments.filter(c => !c.resolved).length})
                </button>
                <button className="px-3 py-1.5 text-muted-foreground text-xs font-medium rounded-md hover:bg-accent">
                  Mentions
                </button>
                <button className="px-3 py-1.5 text-muted-foreground text-xs font-medium rounded-md hover:bg-accent ml-auto">
                  <Pin className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add Comment */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium flex-shrink-0 text-muted-foreground">
                  You
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                    placeholder="Add a comment... (@mention teammates, # to reference feedback)"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-accent rounded-md transition-colors" title="Attach file">
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 hover:bg-accent rounded-md transition-colors" title="Mention teammate">
                        <AtSign className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 hover:bg-accent rounded-md transition-colors" title="Add emoji">
                        <Smile className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className={`bg-surface border rounded-lg overflow-hidden transition-colors ${
                    comment.resolved 
                      ? 'border-border opacity-60' 
                      : comment.pinned 
                      ? 'border-border bg-muted'
                      : 'border-border'
                  }`}
                >
                  {/* Comment Header */}
                  <div className="p-4 pb-3">
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full ${comment.author.color} flex items-center justify-center text-sm font-medium flex-shrink-0 text-white`}>
                        {comment.author.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-foreground">{comment.author.name}</span>
                          {comment.author.role === 'client' && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">Client</span>
                          )}
                          <span className="text-xs text-muted-foreground">{comment.fullTimestamp}</span>
                          {comment.pinned && (
                            <Pin className="w-3.5 h-3.5 text-muted-foreground fill-muted-foreground" />
                          )}
                        </div>
                        {comment.linkedTo && (
                          <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-muted border border-border rounded text-xs text-foreground inline-flex">
                            <FileText className="w-3 h-3" />
                            <span>Re: {comment.linkedTo}</span>
                          </div>
                        )}
                        <p className="text-sm text-foreground leading-relaxed">{comment.message}</p>
                        
                        {/* Attachments */}
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {comment.attachments.map((attachment, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-muted/50 border border-border rounded group hover:bg-accent cursor-pointer">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs text-foreground">{attachment.name}</span>
                                <span className="text-xs text-muted-foreground">{attachment.size}</span>
                                <Download className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reactions */}
                        {comment.reactions.length > 0 && (
                          <div className="flex items-center gap-1 mt-2">
                            {comment.reactions.map((reaction, idx) => (
                              <button
                                key={idx}
                                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                                  reaction.userReacted
                                    ? 'bg-blue-100 border border-blue-300'
                                    : 'bg-muted border border-border hover:border-border'
                                }`}
                              >
                                <span>{reaction.emoji}</span>
                                <span className="text-foreground font-medium">{reaction.count}</span>
                              </button>
                            ))}
                            <button className="p-1 hover:bg-accent rounded transition-colors">
                              <Smile className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-start gap-1">
                        <button 
                          onClick={() => toggleCommentResolved(comment.id)}
                          className={`p-1 rounded transition-colors ${
                            comment.resolved 
                              ? 'text-green-600 bg-green-50' 
                              : 'text-muted-foreground hover:bg-accent'
                          }`}
                          title={comment.resolved ? 'Mark unresolved' : 'Mark resolved'}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:bg-accent rounded transition-colors">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="border-t border-border bg-muted/50/50">
                      <div className="px-4 py-3 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-2">
                            <div className={`w-6 h-6 rounded-full ${reply.author.color} flex items-center justify-center text-xs font-medium flex-shrink-0 text-white`}>
                              {reply.author.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-xs text-foreground">{reply.author.name}</span>
                                <span className="text-xs text-muted-foreground">{reply.timestamp}</span>
                              </div>
                              <p className="text-xs text-foreground leading-relaxed">{reply.message}</p>
                              {reply.reactions && reply.reactions.length > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  {reply.reactions.map((reaction, idx) => (
                                    <button
                                      key={idx}
                                      className="flex items-center gap-1 px-1.5 py-0.5 bg-muted border border-border rounded text-xs hover:border-border"
                                    >
                                      <span>{reaction.emoji}</span>
                                      <span className="text-foreground font-medium">{reaction.count}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reply Input */}
                  {replyingTo === comment.id ? (
                    <div className="border-t border-border bg-muted/50/50 p-3">
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs font-medium flex-shrink-0 text-white">
                          JD
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={2}
                            autoFocus
                            className="w-full px-2 py-1.5 border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                            placeholder="Write a reply..."
                          />
                          <div className="flex items-center gap-2 mt-1.5">
                            <button
                              onClick={() => handleAddReply(comment.id)}
                              disabled={!replyText.trim()}
                              className="px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded hover:opacity-90 transition-colors disabled:opacity-50"
                            >
                              Reply
                            </button>
                            <button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText('');
                              }}
                              className="px-2 py-1 text-muted-foreground text-xs font-medium rounded hover:bg-accent"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-border px-4 py-2">
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="text-xs text-muted-foreground hover:text-foreground font-medium"
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="bg-surface border border-border rounded-lg p-6">
            <h3 className="text-sm font-semibold text-foreground mb-6">Activity Timeline</h3>
            <div className="space-y-1">
              {history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm">No activity yet</p>
                  <p className="text-xs mt-1">Activity will appear here as you submit and receive updates.</p>
                </div>
              ) : history.map((event, index) => (
                <div key={event.id} className="flex gap-4 group">
                  <div className="flex flex-col items-center pt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      event.type === 'city' 
                        ? 'bg-primary/100' 
                        : event.type === 'team' 
                        ? 'bg-green-500' 
                        : 'bg-muted'
                    }`} />
                    {index < history.length - 1 && (
                      <div className="w-px flex-1 bg-muted mt-1" style={{ minHeight: '40px' }} />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-foreground">{event.action}</span>
                          {event.type === 'city' && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-foreground text-xs font-medium rounded">City</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{event.details}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User2 className="w-3.5 h-3.5" />
                          <span>{event.actor}</span>
                          <span className="text-muted-foreground/60">•</span>
                          <span>{event.date} at {event.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'documents':
        // Calculate document counts by source
        const documentsFromClient = documents.filter(d => d.uploadedBy?.isClient).length;
        const documentsFromTeam = documents.filter(d => !d.uploadedBy?.isClient && d.metadata?.source !== 'government').length;
        const documentsFromGovernment = documents.filter(d => d.metadata?.source === 'government').length;
        const totalDocuments = documents.length;
        
        // Calculate request counts
        const pendingRequests = documentRequests.filter(r => r.status === 'pending').length;
        const uploadedRequests = documentRequests.filter(r => r.status === 'fulfilled').length;

        const handleCopyLink = (req: { id: string; clientId?: string; clientName?: string }) => {
          const params = new URLSearchParams({ requestId: req.id });
          const cid = req.clientId || effectiveClientId || clientInfo?.id;
          const cname = req.clientName || clientInfo?.name || clientName;
          if (cid) params.set('clientId', cid);
          if (cname) params.set('name', cname);
          const uploadUrl = `${window.location.origin}/client-portal?${params.toString()}`;
          navigator.clipboard.writeText(uploadUrl);
          toast.success('Copied');
        };

        return (
          <div className="space-y-6">
            {/* Documents Attached Section */}
            <div className="bg-surface border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {totalDocuments} document{totalDocuments !== 1 ? 's' : ''} attached to this permit
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {documentsFromClient} from client • {documentsFromTeam} from team • {documentsFromGovernment} from government
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowRequestModal(true)}
                    className="flex items-center gap-2 px-3 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-accent transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Request from Client
                  </button>
                  <button 
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.multiple = true;
                      input.onchange = async (e) => {
                        const files = (e.target as HTMLInputElement).files;
                        if (!files || files.length === 0) return;
                        
                        for (const file of Array.from(files)) {
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('clientId', effectiveClientId || clientInfo?.id || '');
                          formData.append('permitId', permitId);
                          formData.append('permitName', permit.name || '');
                          formData.append('workspace', 'permits');
                          
                          try {
                            const res = await fetch('/api/documents/upload', {
                              method: 'POST',
                              body: formData,
                            });
                            if (res.ok) {
                              fetchDocuments();
                            }
                          } catch (error) {
                            console.error('Failed to upload document:', error);
                          }
                        }
                      };
                      input.click();
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Document
                  </button>
                </div>
              </div>
            </div>

            {/* Document Requests Section */}
            <div className="bg-surface border border-border rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-1">Document Requests</h3>
                <p className="text-sm text-muted-foreground">
                  {pendingRequests} pending • {uploadedRequests} uploaded
                </p>
              </div>

              <div className="space-y-4">
                {documentRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                    <p className="text-sm">No document requests yet</p>
                  </div>
                ) : (
                  documentRequests.map((request) => {
                    const uploadUrl = `${window.location.origin}/client-portal?requestId=${request.id}`;
                    const isPending = request.status === 'pending';
                    const requestedDate = new Date(request.requestedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                    const requestedTime = new Date(request.requestedAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    });

                    return (
                      <div key={request.id} className="border-t border-border pt-4 first:border-t-0 first:pt-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-foreground">{request.title}</h4>
                              {isPending && (
                                <span className="px-2 py-0.5 bg-muted text-muted-foreground border border-border rounded text-xs font-semibold flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  Waiting for Upload
                                </span>
                              )}
                              {!isPending && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded text-xs font-medium flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Uploaded
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              Requested from {request.clientEmail || request.clientName || 'client'} • {requestedDate} at {requestedTime}
                            </p>
                            {request.description && (
                              <p className="text-sm text-muted-foreground mb-3">{request.description}</p>
                            )}
                          </div>
                        </div>
                        
                        {isPending && (
                          <div className="bg-muted/50 border border-border rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                readOnly
                                value={uploadUrl}
                                className="flex-1 px-3 py-2 bg-surface border border-border rounded text-sm text-foreground"
                              />
                              <button
                                onClick={() => handleCopyLink(request)}
                                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded hover:opacity-90 transition-colors"
                              >
                                <Link2 className="w-4 h-4" />
                                Copy Link
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Upload Area */}
            <div className="bg-surface border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">All Documents</h3>
              </div>
              
              {/* Required Documents */}
              <div className="mb-6">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Required Documents</p>
                <div className="space-y-2">
                  {loadingRequiredDocs ? (
                    <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading required documents…
                    </div>
                  ) : requiredDocuments.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground text-sm">
                      No required documents listed for this permit. You can upload documents above.
                    </div>
                  ) : requiredDocuments.map((reqDoc, idx) => {
                    const matchDoc = documents.find((d) => {
                      const reqLower = reqDoc.name.toLowerCase();
                      const docName = (d.name || '').toLowerCase();
                      const docCategory = (d.metadata?.category || '').toLowerCase();
                      return docName.includes(reqLower) || docCategory.includes(reqLower) || reqLower.includes(docName);
                    });
                    const uploaded = !!matchDoc;
                    const uploadedBy = matchDoc?.uploadedBy?.userName || '';
                    const uploadedAt = matchDoc?.createdAt
                      ? new Date(matchDoc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '';
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors">
                        <div className="flex items-center gap-3">
                          {uploaded ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground/60" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">{reqDoc.name}</p>
                            {uploaded && uploadedBy && (
                              <p className="text-xs text-muted-foreground">{uploadedBy} • {uploadedAt}</p>
                            )}
                          </div>
                        </div>
                        {uploaded ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => matchDoc?.fileUrl && window.open(matchDoc.fileUrl)}
                              className="p-1.5 text-muted-foreground hover:text-muted-foreground transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.onchange = async (e) => {
                                const files = (e.target as HTMLInputElement).files;
                                if (!files?.[0]) return;
                                const formData = new FormData();
                                formData.append('file', files[0]);
                                formData.append('clientId', effectiveClientId || clientInfo?.id || '');
                                formData.append('permitId', permitId);
                                formData.append('permitName', permit.name || '');
                                formData.append('workspace', 'permits');
                                formData.append('metadata', JSON.stringify({ category: reqDoc.name }));
                                try {
                                  const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
                                  if (res.ok) fetchDocuments();
                                } catch (err) { console.error(err); }
                              };
                              input.click();
                            }}
                            className="px-3 py-1 text-xs font-medium text-foreground border border-border rounded-md hover:bg-accent transition-colors"
                          >
                            Upload
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Additional Documents */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Additional Documents</p>
                <div className="space-y-2">
                  {(() => {
                    const matchesRequired = (d: any) => requiredDocuments.some((r) => {
                      const reqLower = r.name.toLowerCase();
                      const docName = (d.name || '').toLowerCase();
                      const docCategory = (d.metadata?.category || '').toLowerCase();
                      return docName.includes(reqLower) || docCategory.includes(reqLower) || reqLower.includes(docName);
                    });
                    const additionalDocs = documents.filter((d) => !matchesRequired(d));
                    if (additionalDocs.length === 0) {
                      return (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                          No additional documents yet. Upload optional documents above.
                        </div>
                      );
                    }
                    return additionalDocs.map((doc) => {
                      const sizeStr = doc.fileSize ? `${(doc.fileSize / 1024).toFixed(doc.fileSize > 1024 * 1024 ? 1 : 0)} ${doc.fileSize > 1024 * 1024 ? 'MB' : 'KB'}` : '';
                      const uploadedBy = doc.uploadedBy?.userName || '';
                      const uploadedAt = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                      return (
                        <div key={doc.id || doc._id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent transition-colors">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{[sizeStr, uploadedBy, uploadedAt].filter(Boolean).join(' • ')}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => doc.fileUrl && window.open(doc.fileUrl)}
                              className="p-1.5 text-muted-foreground hover:text-muted-foreground transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Submission History */}
            <div className="bg-surface border border-border rounded-lg p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Submission History</h3>
              <div className="space-y-3">
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                  <p className="text-sm">No submissions yet</p>
                  <p className="text-xs mt-1">Submission history will appear here once you submit this permit.</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'review':
        const documentReviews = documents.map((doc) => {
          const sizeStr = doc.fileSize ? `${(doc.fileSize / 1024).toFixed(doc.fileSize > 1024 * 1024 ? 1 : 0)} ${doc.fileSize > 1024 * 1024 ? 'MB' : 'KB'}` : '';
          const uploadedAt = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
          const reviewers = (doc.workflow?.reviewedBy || []).map((r: { userName?: string; reviewedAt?: Date; status?: string }) => {
            const name = r.userName || 'Reviewer';
            const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            return {
              name,
              initials,
              color: 'bg-blue-600',
              status: (r.status as 'pending' | 'approved' | 'changes_requested') || 'pending',
              reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toLocaleString('en-US') : undefined,
            };
          });
          const comments = (doc.workflow?.reviewedBy || [])
            .filter((r: { comments?: string }) => r.comments)
            .map((r: { userName?: string; comments?: string; reviewedAt?: Date }, i: number) => ({
              id: `rc-${doc.id}-${i}`,
              author: { name: r.userName || 'Reviewer', initials: (r.userName || 'R').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(), color: 'bg-blue-600' },
              message: r.comments || '',
              timestamp: r.reviewedAt ? new Date(r.reviewedAt).toLocaleString('en-US') : '',
              type: 'change_request' as const,
              documentName: doc.name,
            }));
          const status = (doc.workflow?.reviewedBy?.some((r: { status?: string }) => r.status === 'needs-revision' || r.status === 'rejected')
            ? 'changes_requested'
            : doc.workflow?.reviewedBy?.some((r: { status?: string }) => r.status === 'approved')
              ? 'approved'
              : 'pending_review') as 'pending_review' | 'approved' | 'changes_requested';
          return {
            id: doc.id || doc._id,
            documentName: doc.name || doc.fileName,
            documentType: doc.metadata?.category || 'Document',
            uploadedBy: doc.uploadedBy?.userName || 'Unknown',
            uploadedAt,
            size: sizeStr,
            status,
            reviewers,
            comments,
          };
        });
        if (documentReviews.length === 0) {
          return (
            <div className="bg-surface border border-border rounded-lg p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-sm font-semibold text-foreground mb-2">No documents to review</h3>
              <p className="text-sm text-muted-foreground">Upload documents in the Documents tab. Documents requiring review will appear here.</p>
            </div>
          );
        }
        return (
          <ReviewSection reviews={documentReviews} />
        );
    }
  };

  const hiddenSections = new Set<Section>(['discussion', 'history', 'review']);

  const sections = [
    { id: 'overview' as Section, label: 'Overview', icon: Eye },
    { id: 'city-feedback' as Section, label: 'City Feedback', icon: AlertCircle, badge: cityFeedback.filter(f => f.status !== 'addressed').length + cityEmails.filter(e => e.status === 'unread').length },
    { id: 'documents' as Section, label: 'Documents', icon: FileText },
    { id: 'review' as Section, label: 'Review', icon: GitPullRequest },
    { id: 'discussion' as Section, label: 'Discussion', icon: MessageCircle, badge: comments.filter(c => !c.resolved).length },
    { id: 'history' as Section, label: 'History', icon: Clock },
  ].filter(s => !hiddenSections.has(s.id));

  return (
    <div className="h-full flex flex-col bg-page-bg">
      {/* Header */}
      <div className="bg-surface border-b border-border px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Permit Plan
          </button>
          {clientName && (
            <span className="text-sm text-muted-foreground">•</span>
          )}
          {clientName && (
            <span className="text-sm text-muted-foreground">{clientName}</span>
          )}
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              {permit.order}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground mb-1">{permit.name}</h1>
              <p className="text-sm text-muted-foreground">{permit.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 relative" ref={statusMenuRef}>
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              disabled={savingStatus}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors hover:opacity-90 ${statusConfig.className} ${savingStatus ? 'opacity-60' : ''}`}
            >
              {statusConfig.icon}
              {statusConfig.label}
              <ChevronDown className={`w-4 h-4 transition-transform ${showStatusMenu ? 'rotate-180' : ''}`} />
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 hover:bg-accent transition-colors ${
                      opt.value === effectiveStatus ? 'bg-accent font-medium' : ''
                    }`}
                  >
                    {getStatusConfig(opt.value).icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Section Navigation */}
        <aside className="w-56 bg-surface border-r border-border overflow-auto">
          <nav className="p-3">
            <div className="space-y-0.5">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeSection === section.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-foreground hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{section.label}</span>
                    </div>
                    {section.badge !== undefined && section.badge > 0 && (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                        activeSection === section.id
                          ? 'bg-primary-foreground text-primary'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {section.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-page-bg">
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Request Document Modal */}
      {showRequestModal && clientInfo && (
        <RequestDocumentModal
          clientId={clientInfo.id}
          clientName={clientInfo.name}
          clientEmail={clientInfo.email}
          consultantId="consultant-1"
          consultantName="Consultant"
          permitId={permitId}
          permitName={permit.name}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            fetchDocumentRequests();
            setShowRequestModal(false);
          }}
        />
      )}

      {/* Fillable PDF Modal - uses AI-powered fill-pdf API */}
      {showFillModal && (
        <FillablePDFModal
          isOpen={showFillModal}
          onClose={() => {
            console.log('[PermitDetailView] Closing Fill with AI modal');
            setShowFillModal(false);
          }}
          permitName={permit.name}
          clientName={clientName}
          clientId={effectiveClientId || clientId}
          permitId={permitId}
          formTitle={
            (() => {
              const pd = permitData as { formTitle?: string; formCode?: string } | undefined;
              if (pd?.formTitle && pd?.formCode) return `${pd.formTitle} (${pd.formCode})`;
              return typeof pd?.formTitle === 'string' ? pd.formTitle : (permit.name || '');
            })()
          }
          pdfUrl={(effectiveClientId || clientId) ? `/api/fill-pdf?clientId=${encodeURIComponent(effectiveClientId || clientId || '')}&permitId=${encodeURIComponent(permitId)}` : undefined}
        />
      )}

    </div>
  );
}
