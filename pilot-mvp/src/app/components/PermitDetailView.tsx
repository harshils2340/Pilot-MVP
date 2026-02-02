import { ArrowLeft, FileText, MessageSquare, Clock, AlertCircle, Edit3, Lock, Send, MoreVertical, Info, Paperclip, Download, ExternalLink, CheckCircle2, Building2, Calendar, User2, Hash, CheckCircle, Circle, Plus, Upload, ChevronDown, ChevronRight, AtSign, Smile, MoreHorizontal, Pin, X, MessageCircle, Mail, User, Trash2, Link2, Copy, GitPullRequest, Sparkles, FileEdit, DollarSign, Eye } from 'lucide-react';
import { PermitDocumentReview } from './PermitDocumentReview';
import { RequestDocumentModal } from './RequestDocumentModal';
import { ReviewSection } from './ReviewSection';
import { useState, useEffect } from 'react';

interface PermitDetailViewProps {
  permitId: string;
  onBack: () => void;
  clientName?: string;
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

const mockComments: Comment[] = [
  {
    id: '1',
    author: { name: 'Sarah Chen', initials: 'SC', color: 'bg-green-500', role: 'consultant' },
    message: '@Michael can you handle the water supply calculations? Inspector Martinez specifically called this out and we need it before resubmission.',
    timestamp: '2h ago',
    fullTimestamp: 'Today at 2:15 PM',
    linkedTo: 'City Feedback: Floor Plan Revisions',
    resolved: false,
    reactions: [
      { emoji: '👍', count: 2, userReacted: false },
      { emoji: '✅', count: 1, userReacted: true },
    ],
    replies: [
      {
        id: 'r1',
        author: { name: 'Michael Park', initials: 'MP', color: 'bg-blue-500' },
        message: 'On it. Should have this done by EOD Thursday. Do we have the sink specs yet?',
        timestamp: '1h ago',
        reactions: [{ emoji: '👍', count: 1, userReacted: false }],
      },
      {
        id: 'r2',
        author: { name: 'Sarah Chen', initials: 'SC', color: 'bg-green-500' },
        message: 'Not yet - waiting on architect. Will send as soon as I get them.',
        timestamp: '45m ago',
      },
    ],
  },
  {
    id: '2',
    author: { name: 'Michael Park', initials: 'MP', color: 'bg-blue-500', role: 'consultant' },
    message: 'FYI - Inspector mentioned this might also affect the fire inspection requirements. Worth checking with the fire dept before resubmission to avoid another round of revisions.',
    timestamp: 'Yesterday',
    fullTimestamp: 'Jan 10 at 3:45 PM',
    resolved: false,
    pinned: true,
    reactions: [
      { emoji: '⚠️', count: 3, userReacted: true },
    ],
    attachments: [
      { name: 'fire_dept_requirements.pdf', size: '145 KB' },
    ],
  },
];

export function PermitDetailView({ permitId, onBack, clientName }: PermitDetailViewProps) {
  const [activeSection, setActiveSection] = useState<Section>('city-feedback');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [expandedFeedback, setExpandedFeedback] = useState<string>('1');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [cityEmails, setCityEmails] = useState<ClientEmail[]>([]);
  const [loadingCityEmails, setLoadingCityEmails] = useState(false);
  const [cityEmailResponses, setCityEmailResponses] = useState<Record<string, string>>({});
  const [documentRequests, setDocumentRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showDocumentReview, setShowDocumentReview] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [clientInfo, setClientInfo] = useState<{ id: string; name: string; email: string } | null>(null);

  // Mock data - would come from props or API
  const permit = {
    id: permitId,
    name: 'Health Department Plan Review',
    department: 'SF Dept. of Public Health',
    municipality: 'San Francisco',
    status: 'action-required' as const,
    order: 3,
    submittedDate: 'December 15, 2024',
    lastUpdated: 'December 18, 2024',
    blockedBy: null,
    blocks: ['Business Operating Permit', 'Building Modification Permit'],
    assignee: {
      name: 'Sarah Chen',
      initials: 'SC',
      color: 'bg-green-500',
    },
    applicationNumber: 'HP-2024-12345',
    governmentFee: 1250,
  };

  const [cityFeedback, setCityFeedback] = useState<CityFeedbackItem[]>([
    {
      id: '1',
      date: 'December 18, 2024',
      time: '10:34 AM',
      type: 'revision_required',
      author: 'Inspector J. Martinez',
      department: 'Plan Review Department',
      subject: 'Floor Plan Revisions Required',
      comment: 'Floor plan does not show required 3-compartment sink dimensions. Please revise to include precise measurements (minimum 18"x18" per compartment) and resubmit.\n\nAdditionally, please provide:\n- Updated equipment schedule\n- Sink specifications from manufacturer\n- Water supply calculations',
      attachments: [
        { name: 'rejection_notice_121824.pdf', size: '245 KB', type: 'pdf' },
        { name: 'marked_up_floor_plan.pdf', size: '1.2 MB', type: 'pdf' },
      ],
      status: 'in_progress',
      requiredDocuments: [
        'Updated floor plan with sink dimensions',
        'Equipment schedule',
        'Sink specifications',
        'Water supply calculations'
      ],
      uploadedDocuments: [
        { name: 'floor_plan_revised_v2.pdf', size: '1.8 MB', uploadedBy: 'Sarah Chen', uploadedAt: 'Jan 11 at 9:15 AM' }
      ],
      consultantResponse: 'We have updated the floor plan to include the 3-compartment sink with dimensions of 18"x18" per compartment as specified. The sink specifications from the manufacturer are attached.\n\nWe are finalizing the water supply calculations and will upload by end of day Thursday.'
    },
    {
      id: '2',
      date: 'December 16, 2024',
      time: '2:15 PM',
      type: 'comment',
      author: 'Plan Review Department',
      department: 'SF Dept. of Public Health',
      subject: 'Initial Review Complete',
      comment: 'Initial review complete. Equipment layout meets spacing requirements. Minor revisions needed for sink specifications. Overall plan looks good - should be straightforward once sink details are added.',
      attachments: [],
      status: 'addressed',
    },
  ]);

  const history = [
    {
      id: '1',
      date: 'December 18, 2024',
      time: '10:34 AM',
      action: 'Revision Requested',
      details: 'City requested floor plan updates for 3-compartment sink dimensions',
      actor: 'Inspector J. Martinez',
      type: 'city' as const,
    },
    {
      id: '2',
      date: 'December 16, 2024',
      time: '2:15 PM',
      action: 'Initial Review Completed',
      details: 'Plan review department completed first pass',
      actor: 'Plan Review Department',
      type: 'city' as const,
    },
    {
      id: '3',
      date: 'December 15, 2024',
      time: '9:00 AM',
      action: 'Submitted to City',
      details: 'Initial plan submitted for health department review',
      actor: 'Sarah Chen',
      type: 'team' as const,
    },
  ];

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
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'action-required':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          label: 'Action Required',
          className: 'bg-red-50 text-red-700 border-red-200',
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          label: 'Not Started',
          className: 'bg-neutral-100 text-neutral-600 border-neutral-200',
        };
    }
  };

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
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      default:
        return {
          icon: <Circle className="w-4 h-4" />,
          label: 'Not Started',
          className: 'bg-neutral-100 text-neutral-600 border-neutral-200',
        };
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: Comment = {
      id: String(comments.length + 1),
      author: { name: 'John Doe', initials: 'JD', color: 'bg-purple-500', role: 'consultant' },
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
          author: { name: 'John Doe', initials: 'JD', color: 'bg-purple-500' },
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
  }, [activeSection, permitId]);

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
      const res = await fetch(`/api/documents?permitId=${permitId}`);
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
            <div className="bg-white border border-neutral-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">Permit Information</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-1">Application Number</p>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-neutral-400" />
                    <p className="text-sm text-neutral-900 font-mono">{permit.applicationNumber}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-1">Order in Plan</p>
                  <p className="text-sm text-neutral-900">#{permit.order} of 6</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-1">Issuing Authority</p>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-neutral-400" />
                    <p className="text-sm text-neutral-900">{permit.department}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-1">Municipality</p>
                  <p className="text-sm text-neutral-900">{permit.municipality}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-1">Submitted</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <p className="text-sm text-neutral-900">{permit.submittedDate}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-1">Last Updated</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    <p className="text-sm text-neutral-900">{permit.lastUpdated}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-1">Assigned To</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full ${permit.assignee.color} text-white text-xs font-medium flex items-center justify-center`}>
                      {permit.assignee.initials}
                    </div>
                    <p className="text-sm text-neutral-900">{permit.assignee.name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-1">Current Status</p>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusConfig.className}`}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-1">Government Fee</p>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-neutral-400" />
                    <p className="text-sm font-semibold text-neutral-900">
                      {permit.governmentFee > 0 ? `$${permit.governmentFee.toLocaleString()}` : 'No fee'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dependencies */}
            {permit.blocks.length > 0 && (
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-neutral-900 mb-4">Dependencies</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 mb-2">This permit is blocking:</p>
                    <div className="space-y-2">
                      {permit.blocks.map((blocked, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <Lock className="w-4 h-4 text-amber-600" />
                          <span className="text-sm text-amber-900 font-medium">{blocked}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Required Documents */}
            <div className="bg-white border border-neutral-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">Required Documents</h3>
              <p className="text-sm text-neutral-600 mb-4">Documents needed to complete this permit application</p>
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <FileText className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">Floor Plan with Equipment Layout</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Detailed floor plan showing all equipment placement and dimensions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <FileText className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">Equipment Specifications</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Manufacturer specs for all food service equipment</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <FileText className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">Menu & Food Handling Procedures</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Description of food prep, storage, and handling processes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <FileText className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">Proof of Lease or Ownership</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Legal documentation of property rights</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Form Filling */}
            <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-neutral-900 mb-1">Government Form</h3>
                    <p className="text-sm text-neutral-600">
                      Click below to open the government portal. Our AI will help you fill the form using information from your documents.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                      <FileEdit className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-neutral-900">Health Permit Application (Form EH-01)</h4>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs font-medium">
                          Required
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mb-2">
                        Primary application form for food service establishment health permits
                      </p>
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          SF Dept. of Public Health
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          ~15 min to complete
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => window.open('https://www.sfdph.org/dph/EH/Food/default.asp', '_blank')}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm hover:shadow flex-shrink-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    Fill with AI
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
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
        
        return (
          <div className="space-y-4">
            {/* Summary Bar */}
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {totalCityItems} feedback item{totalCityItems !== 1 ? 's' : ''} from city
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {feedbackNotStarted} not started • {feedbackInProgress} in progress • {cityFeedback.length - feedbackNotStarted - feedbackInProgress} addressed
                      {unreadCityEmails > 0 && ` • ${unreadCityEmails} unread city email${unreadCityEmails !== 1 ? 's' : ''}`}
                      {unreadClientEmails > 0 && ` • ${unreadClientEmails} unread client email${unreadClientEmails !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                  {cityFeedback.length > 0 && (
                    <div className="h-2 w-48 bg-neutral-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${(cityFeedback.filter(f => f.status === 'addressed').length / cityFeedback.length) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                {allFeedbackAddressed && unreadCityEmails === 0 && unreadClientEmails === 0 ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Ready to Resubmit</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">
                      {feedbackInProgress + feedbackNotStarted + unreadCityEmails + unreadClientEmails} item{feedbackInProgress + feedbackNotStarted + unreadCityEmails + unreadClientEmails !== 1 ? 's' : ''} need attention
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Loading State for City Emails */}
            {loadingCityEmails && (
              <div className="bg-white border border-neutral-200 rounded-lg p-6 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-neutral-900 mx-auto mb-2"></div>
                <p className="text-xs text-neutral-600">Loading city emails...</p>
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
                        className={`bg-white border rounded-lg overflow-hidden ${
                          isUnread ? 'border-l-4 border-l-red-500 border-neutral-200' : 'border-l-4 border-l-blue-500 border-neutral-200'
                        }`}
                      >
                        {/* Header - Always Visible */}
                        <div
                          className={`px-6 py-4 cursor-pointer hover:bg-neutral-50 transition-colors ${
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
                                <ChevronDown className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className={`font-semibold text-base text-neutral-900 ${isUnread ? 'font-bold' : ''}`}>
                                    {email.subject}
                                  </h3>
                                  {isUnread && (
                                    <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                    email.priority === 'high' 
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : email.priority === 'medium'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                                  }`}>
                                    {email.priority}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-600">
                                  <span className="font-medium">{email.from.name || email.from.email}</span>
                                  <span className="text-neutral-400">•</span>
                                  <span>{formatEmailDate(email.receivedAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="border-t border-neutral-200">
                            {/* City's Message */}
                            <div className="px-6 py-4 bg-red-50/30">
                              <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">
                                City's Request:
                              </p>
                              <p className="text-sm text-neutral-900 leading-relaxed whitespace-pre-line mb-3">
                                {email.body}
                              </p>

                              {/* City Attachments */}
                              {email.attachments && email.attachments.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs font-medium text-neutral-500 mb-2">City Attachments</p>
                                  <div className="space-y-1.5">
                                    {email.attachments.map((attachment, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between p-2 bg-white border border-neutral-200 rounded group hover:bg-neutral-50 cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-neutral-500" />
                                          <span className="text-xs font-medium text-neutral-900">{attachment.filename}</span>
                                          <span className="text-xs text-neutral-500">{(attachment.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <Download className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Your Response to City */}
                            <div className="px-6 py-4 border-t border-neutral-200 bg-blue-50">
                              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
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
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                                placeholder="Explain what you fixed and how you addressed the city's concerns. This will be included when you resubmit..."
                              />
                              <div className="flex items-center justify-between mt-3">
                                <p className="text-xs text-neutral-500">This response will be sent to the city when you resubmit</p>
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
                                    className="px-3 py-1.5 bg-white border border-neutral-300 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-colors"
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
                                    className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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
                <div className="bg-white border border-neutral-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-neutral-900">Client Messages</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">
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
                        className={`bg-white border rounded-lg overflow-hidden ${
                          isUnread ? 'border-l-4 border-l-blue-500 border-neutral-200' : 'border-neutral-200'
                        }`}
                      >
                        {/* Header - Always Visible */}
                        <div
                          className={`px-6 py-4 cursor-pointer hover:bg-neutral-50 transition-colors ${
                            isUnread ? 'bg-blue-50/30' : ''
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
                                <ChevronDown className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className={`font-semibold text-base text-neutral-900 ${isUnread ? 'font-bold' : ''}`}>
                                    {email.subject}
                                  </h3>
                                  {isUnread && (
                                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                  )}
                                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                    Client
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-600">
                                  <span className="font-medium">{email.from.name || email.from.email}</span>
                                  {email.clientName && (
                                    <>
                                      <span className="text-neutral-400">•</span>
                                      <span>{email.clientName}</span>
                                    </>
                                  )}
                                  <span className="text-neutral-400">•</span>
                                  <span>{formatEmailDate(email.receivedAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="border-t border-neutral-200">
                            {/* Client's Message */}
                            <div className="px-6 py-4 bg-blue-50/30">
                              <p className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">
                                Client's Message:
                              </p>
                              <p className="text-sm text-neutral-900 leading-relaxed whitespace-pre-line mb-3">
                                {email.body}
                              </p>

                              {/* Client Attachments */}
                              {email.attachments && email.attachments.length > 0 && (
                                <div className="mt-3">
                                  <p className="text-xs font-medium text-neutral-500 mb-2">Attachments</p>
                                  <div className="space-y-1.5">
                                    {email.attachments.map((attachment, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center justify-between p-2 bg-white border border-neutral-200 rounded group hover:bg-neutral-50 cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-4 h-4 text-neutral-500" />
                                          <span className="text-xs font-medium text-neutral-900">{attachment.filename}</span>
                                          <span className="text-xs text-neutral-500">{(attachment.size / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <Download className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Your Response to Client */}
                            <div className="px-6 py-4 border-t border-neutral-200 bg-blue-50">
                              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
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
                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                                placeholder="Type your reply to the client here..."
                              />
                              <div className="flex items-center justify-between mt-3">
                                <p className="text-xs text-neutral-500">This reply will be sent to the client</p>
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
                                    className="px-3 py-1.5 bg-white border border-neutral-300 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-50 transition-colors"
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
                                    className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
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
                <div key={feedback.id} className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                  {/* Header - Always Visible */}
                  <div 
                    className={`px-6 py-4 cursor-pointer hover:bg-neutral-50 transition-colors ${
                      feedback.type === 'revision_required' 
                        ? 'border-l-4 border-l-red-500' 
                        : 'border-l-4 border-l-blue-500'
                    }`}
                    onClick={() => setExpandedFeedback(isExpanded ? '' : feedback.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-base text-neutral-900">
                              {feedback.subject}
                            </h3>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusConfig.className}`}>
                              {statusConfig.icon}
                              {statusConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-neutral-600">
                            <span className="font-medium">{feedback.author}</span>
                            <span className="text-neutral-400">•</span>
                            <span>{feedback.date} at {feedback.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-neutral-200">
                      {/* City's Comment */}
                      <div className="px-6 py-4 bg-neutral-50">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">City's Request</p>
                        <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                          {feedback.comment}
                        </p>

                        {/* City Attachments */}
                        {feedback.attachments.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-neutral-500 mb-2">City Attachments</p>
                            <div className="space-y-2">
                              {feedback.attachments.map((attachment, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors group cursor-pointer"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                                      <FileText className="w-4 h-4 text-red-600" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-neutral-900">{attachment.name}</p>
                                      <p className="text-xs text-neutral-500">{attachment.size}</p>
                                    </div>
                                  </div>
                                  <Download className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Required Documents */}
                      {feedback.requiredDocuments && feedback.requiredDocuments.length > 0 && (
                        <div className="px-6 py-4 border-t border-neutral-200">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Required Documents</p>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors">
                              <Upload className="w-3.5 h-3.5" />
                              Upload File
                            </button>
                          </div>
                          <div className="space-y-2">
                            {feedback.requiredDocuments.map((doc, idx) => {
                              const uploaded = feedback.uploadedDocuments?.find(u => u.name.toLowerCase().includes(doc.toLowerCase().split(' ')[0]));
                              return (
                                <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    {uploaded ? (
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-neutral-300" />
                                    )}
                                    <div>
                                      <p className="text-sm font-medium text-neutral-900">{doc}</p>
                                      {uploaded && (
                                        <p className="text-xs text-neutral-500">{uploaded.uploadedBy} • {uploaded.uploadedAt}</p>
                                      )}
                                    </div>
                                  </div>
                                  {uploaded ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-neutral-500">{uploaded.size}</span>
                                      <Download className="w-4 h-4 text-neutral-400 cursor-pointer hover:text-neutral-600" />
                                    </div>
                                  ) : (
                                    <button className="text-xs text-blue-600 font-medium hover:text-blue-700">
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
                              <p className="text-xs font-medium text-neutral-500 mb-2">Additional Documents</p>
                              {feedback.uploadedDocuments
                                .filter(uploaded => !feedback.requiredDocuments?.some(req => uploaded.name.toLowerCase().includes(req.toLowerCase().split(' ')[0])))
                                .map((doc, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-neutral-50 border border-neutral-200 rounded-lg mb-2">
                                    <div className="flex items-center gap-3">
                                      <FileText className="w-4 h-4 text-neutral-500" />
                                      <div>
                                        <p className="text-sm font-medium text-neutral-900">{doc.name}</p>
                                        <p className="text-xs text-neutral-500">{doc.uploadedBy} • {doc.uploadedAt}</p>
                                      </div>
                                    </div>
                                    <span className="text-xs text-neutral-500">{doc.size}</span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Consultant Response */}
                      <div className="px-6 py-4 border-t border-neutral-200 bg-blue-50">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Your Response to City</p>
                        <textarea
                          rows={6}
                          value={cityEmailResponses[feedback.id] || feedback.consultantResponse || ''}
                          onChange={(e) => {
                            setCityEmailResponses({
                              ...cityEmailResponses,
                              [feedback.id]: e.target.value
                            });
                          }}
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                          placeholder="Explain what you fixed and how you addressed the city's concerns. This will be included when you resubmit..."
                        />
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs text-neutral-500">This response will be sent to the city when you resubmit</p>
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
                            className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                          >
                            Save Response
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="px-6 py-4 border-t border-neutral-200 bg-neutral-50">
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
                                className="flex items-center gap-2 px-3 py-1.5 border border-neutral-300 text-neutral-700 text-xs font-medium rounded-lg hover:bg-neutral-100 transition-colors"
                              >
                                <Circle className="w-4 h-4" />
                                Mark as Addressed
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-neutral-500">
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
            <div className="bg-white border border-neutral-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-md">
                  All
                </button>
                <button className="px-3 py-1.5 text-neutral-600 text-xs font-medium rounded-md hover:bg-neutral-100">
                  Unresolved ({comments.filter(c => !c.resolved).length})
                </button>
                <button className="px-3 py-1.5 text-neutral-600 text-xs font-medium rounded-md hover:bg-neutral-100">
                  Mentions
                </button>
                <button className="px-3 py-1.5 text-neutral-600 text-xs font-medium rounded-md hover:bg-neutral-100 ml-auto">
                  <Pin className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add Comment */}
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-sm font-medium flex-shrink-0 text-white">
                  JD
                </div>
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                    placeholder="Add a comment... (@mention teammates, # to reference feedback)"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors" title="Attach file">
                        <Paperclip className="w-4 h-4 text-neutral-500" />
                      </button>
                      <button className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors" title="Mention teammate">
                        <AtSign className="w-4 h-4 text-neutral-500" />
                      </button>
                      <button className="p-1.5 hover:bg-neutral-100 rounded-md transition-colors" title="Add emoji">
                        <Smile className="w-4 h-4 text-neutral-500" />
                      </button>
                    </div>
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className={`bg-white border rounded-lg overflow-hidden transition-colors ${
                    comment.resolved 
                      ? 'border-neutral-200 opacity-60' 
                      : comment.pinned 
                      ? 'border-amber-300 bg-amber-50'
                      : 'border-neutral-200'
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
                          <span className="font-semibold text-sm text-neutral-900">{comment.author.name}</span>
                          {comment.author.role === 'client' && (
                            <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">Client</span>
                          )}
                          <span className="text-xs text-neutral-500">{comment.fullTimestamp}</span>
                          {comment.pinned && (
                            <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                          )}
                        </div>
                        {comment.linkedTo && (
                          <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 inline-flex">
                            <FileText className="w-3 h-3" />
                            <span>Re: {comment.linkedTo}</span>
                          </div>
                        )}
                        <p className="text-sm text-neutral-900 leading-relaxed">{comment.message}</p>
                        
                        {/* Attachments */}
                        {comment.attachments && comment.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {comment.attachments.map((attachment, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-neutral-50 border border-neutral-200 rounded group hover:bg-neutral-100 cursor-pointer">
                                <FileText className="w-4 h-4 text-neutral-500" />
                                <span className="text-xs text-neutral-700">{attachment.name}</span>
                                <span className="text-xs text-neutral-400">{attachment.size}</span>
                                <Download className="w-3.5 h-3.5 text-neutral-400 ml-auto opacity-0 group-hover:opacity-100" />
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
                                    : 'bg-neutral-100 border border-neutral-200 hover:border-neutral-300'
                                }`}
                              >
                                <span>{reaction.emoji}</span>
                                <span className="text-neutral-700 font-medium">{reaction.count}</span>
                              </button>
                            ))}
                            <button className="p-1 hover:bg-neutral-100 rounded transition-colors">
                              <Smile className="w-4 h-4 text-neutral-400" />
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
                              : 'text-neutral-400 hover:bg-neutral-100'
                          }`}
                          title={comment.resolved ? 'Mark unresolved' : 'Mark resolved'}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:bg-neutral-100 rounded transition-colors">
                          <MoreVertical className="w-4 h-4 text-neutral-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="border-t border-neutral-200 bg-neutral-50/50">
                      <div className="px-4 py-3 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex gap-2">
                            <div className={`w-6 h-6 rounded-full ${reply.author.color} flex items-center justify-center text-xs font-medium flex-shrink-0 text-white`}>
                              {reply.author.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-xs text-neutral-900">{reply.author.name}</span>
                                <span className="text-xs text-neutral-500">{reply.timestamp}</span>
                              </div>
                              <p className="text-xs text-neutral-700 leading-relaxed">{reply.message}</p>
                              {reply.reactions && reply.reactions.length > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  {reply.reactions.map((reaction, idx) => (
                                    <button
                                      key={idx}
                                      className="flex items-center gap-1 px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded text-xs hover:border-neutral-300"
                                    >
                                      <span>{reaction.emoji}</span>
                                      <span className="text-neutral-700 font-medium">{reaction.count}</span>
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
                    <div className="border-t border-neutral-200 bg-neutral-50/50 p-3">
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
                            className="w-full px-2 py-1.5 border border-neutral-200 rounded text-xs focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                            placeholder="Write a reply..."
                          />
                          <div className="flex items-center gap-2 mt-1.5">
                            <button
                              onClick={() => handleAddReply(comment.id)}
                              disabled={!replyText.trim()}
                              className="px-2 py-1 bg-neutral-900 text-white text-xs font-medium rounded hover:bg-neutral-800 transition-colors disabled:opacity-50"
                            >
                              Reply
                            </button>
                            <button
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText('');
                              }}
                              className="px-2 py-1 text-neutral-600 text-xs font-medium rounded hover:bg-neutral-100"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-neutral-200 px-4 py-2">
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="text-xs text-neutral-600 hover:text-neutral-900 font-medium"
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
          <div className="bg-white border border-neutral-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-6">Activity Timeline</h3>
            <div className="space-y-1">
              {history.map((event, index) => (
                <div key={event.id} className="flex gap-4 group">
                  <div className="flex flex-col items-center pt-1">
                    <div className={`w-2 h-2 rounded-full ${
                      event.type === 'city' 
                        ? 'bg-blue-500' 
                        : event.type === 'team' 
                        ? 'bg-green-500' 
                        : 'bg-neutral-400'
                    }`} />
                    {index < history.length - 1 && (
                      <div className="w-px flex-1 bg-neutral-200 mt-1" style={{ minHeight: '40px' }} />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-neutral-900">{event.action}</span>
                          {event.type === 'city' && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">City</span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600 mb-1">{event.details}</p>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <User2 className="w-3.5 h-3.5" />
                          <span>{event.actor}</span>
                          <span className="text-neutral-300">•</span>
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

        const handleCopyLink = (requestId: string) => {
          const uploadUrl = `${window.location.origin}/client-portal?requestId=${requestId}`;
          navigator.clipboard.writeText(uploadUrl);
          // You could add a toast notification here
        };

        return (
          <div className="space-y-6">
            {/* Documents Attached Section */}
            <div className="bg-white border border-neutral-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                    {totalDocuments} document{totalDocuments !== 1 ? 's' : ''} attached to this permit
                  </h3>
                  <p className="text-sm text-neutral-500">
                    {documentsFromClient} from client • {documentsFromTeam} from team • {documentsFromGovernment} from government
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowDocumentReview(true)}
                    className="flex items-center gap-2 px-3 py-2 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <GitPullRequest className="w-4 h-4" />
                    Review Documents
                  </button>
                  <button 
                    onClick={() => setShowRequestModal(true)}
                    className="flex items-center gap-2 px-3 py-2 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
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
                          formData.append('clientId', clientInfo?.id || '');
                          formData.append('permitId', permitId);
                          formData.append('permitName', permit.name);
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
                    className="flex items-center gap-2 px-3 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Document
                  </button>
                </div>
              </div>
            </div>

            {/* Document Requests Section */}
            <div className="bg-white border border-neutral-200 rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">Document Requests</h3>
                <p className="text-sm text-neutral-500">
                  {pendingRequests} pending • {uploadedRequests} uploaded
                </p>
              </div>

              <div className="space-y-4">
                {documentRequests.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <Mail className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
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
                      <div key={request.id} className="border-t border-neutral-200 pt-4 first:border-t-0 first:pt-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-neutral-900">{request.title}</h4>
                              {isPending && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded text-xs font-medium flex items-center gap-1">
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
                            <p className="text-xs text-neutral-500 mb-2">
                              Requested from {request.clientEmail || request.clientName || 'client'} • {requestedDate} at {requestedTime}
                            </p>
                            {request.description && (
                              <p className="text-sm text-neutral-600 mb-3">{request.description}</p>
                            )}
                          </div>
                        </div>
                        
                        {isPending && (
                          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                readOnly
                                value={uploadUrl}
                                className="flex-1 px-3 py-2 bg-white border border-neutral-300 rounded text-sm text-neutral-900"
                              />
                              <button
                                onClick={() => handleCopyLink(request.id)}
                                className="flex items-center gap-2 px-3 py-2 bg-neutral-900 text-white text-sm font-medium rounded hover:bg-neutral-800 transition-colors"
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
            <div className="bg-white border border-neutral-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-neutral-900">All Documents</h3>
              </div>
              
              {/* Required Documents */}
              <div className="mb-6">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Required Documents</p>
                <div className="space-y-2">
                  {[
                    { name: 'Permit Application Form', required: true, uploaded: true, uploadedBy: 'Sarah Chen', uploadedAt: 'Dec 10, 2024' },
                    { name: 'Site Plan / Floor Plan', required: true, uploaded: true, uploadedBy: 'Michael Park', uploadedAt: 'Dec 12, 2024' },
                    { name: 'Equipment Specifications', required: true, uploaded: false },
                    { name: 'Insurance Certificate', required: true, uploaded: false },
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                      <div className="flex items-center gap-3">
                        {doc.uploaded ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-neutral-300" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{doc.name}</p>
                          {doc.uploaded && (
                            <p className="text-xs text-neutral-500">{doc.uploadedBy} • {doc.uploadedAt}</p>
                          )}
                        </div>
                      </div>
                      {doc.uploaded ? (
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors">
                          Upload
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Documents */}
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Additional Documents</p>
                <div className="space-y-2">
                  {[
                    { name: 'City Feedback Response - Dec 15.pdf', size: '245 KB', uploadedBy: 'Sarah Chen', uploadedAt: 'Dec 16, 2024' },
                    { name: 'Revised Floor Plan v2.pdf', size: '1.2 MB', uploadedBy: 'Michael Park', uploadedAt: 'Dec 18, 2024' },
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{doc.name}</p>
                          <p className="text-xs text-neutral-500">{doc.size} • {doc.uploadedBy} • {doc.uploadedAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 text-neutral-400 hover:text-neutral-600 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-neutral-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submission History */}
            <div className="bg-white border border-neutral-200 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">Submission History</h3>
              <div className="space-y-3">
                {[
                  { version: 'Initial Submission', date: 'Dec 10, 2024', status: 'Revision Required', files: 3 },
                  { version: 'Resubmission #1', date: 'Dec 18, 2024', status: 'Under Review', files: 5 },
                ].map((submission, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{submission.version}</p>
                      <p className="text-xs text-neutral-500">{submission.date} • {submission.files} files</p>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                      submission.status === 'Under Review' 
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      {submission.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'review':
        const documentReviews = [
          {
            id: '1',
            documentName: 'floor_plan_revised_v2.pdf',
            documentType: 'Floor Plan',
            uploadedBy: 'Sarah Chen',
            uploadedAt: 'Jan 11 at 9:15 AM',
            size: '1.8 MB',
            status: 'changes_requested' as const,
            reviewers: [
              {
                name: 'Michael Park',
                initials: 'MP',
                color: 'bg-blue-600',
                status: 'changes_requested' as const,
                reviewedAt: 'Jan 11 at 11:30 AM',
              },
            ],
            comments: [
              {
                id: 'rc1',
                author: { name: 'Michael Park', initials: 'MP', color: 'bg-blue-600' },
                message: 'The 3-compartment sink dimensions look good now, but I noticed the water supply line routing isn\'t shown. Can you add that detail before we submit?',
                timestamp: 'Jan 11 at 11:30 AM',
                type: 'change_request' as const,
                documentName: 'floor_plan_revised_v2.pdf',
              },
            ],
          },
          {
            id: '2',
            documentName: 'sink_specifications_kohler.pdf',
            documentType: 'Equipment Specification',
            uploadedBy: 'Sarah Chen',
            uploadedAt: 'Jan 11 at 10:00 AM',
            size: '456 KB',
            status: 'pending_review' as const,
            reviewers: [],
            comments: [],
          },
          {
            id: '3',
            documentName: 'water_supply_calculations.pdf',
            documentType: 'Engineering Calculation',
            uploadedBy: 'Michael Park',
            uploadedAt: 'Jan 11 at 2:00 PM',
            size: '234 KB',
            status: 'pending_review' as const,
            reviewers: [],
            comments: [],
          },
        ];
        return (
          <ReviewSection reviews={documentReviews} />
        );
    }
  };

  const sections = [
    { id: 'overview' as Section, label: 'Overview', icon: Eye },
    { id: 'city-feedback' as Section, label: 'City Feedback', icon: AlertCircle, badge: cityFeedback.filter(f => f.status !== 'addressed').length + cityEmails.filter(e => e.status === 'unread').length },
    { id: 'documents' as Section, label: 'Documents', icon: FileText },
    { id: 'review' as Section, label: 'Review', icon: GitPullRequest },
    { id: 'discussion' as Section, label: 'Discussion', icon: MessageCircle, badge: comments.filter(c => !c.resolved).length },
    { id: 'history' as Section, label: 'History', icon: Clock },
  ];

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Permit Plan
          </button>
          {clientName && (
            <span className="text-sm text-neutral-400">•</span>
          )}
          {clientName && (
            <span className="text-sm text-neutral-500">{clientName}</span>
          )}
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-semibold">
              {permit.order}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900 mb-1">{permit.name}</h1>
              <p className="text-sm text-neutral-500">{permit.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${statusConfig.className}`}>
              {statusConfig.icon}
              {statusConfig.label}
            </span>
            <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-200">
          <button 
            disabled={!allFeedbackAddressed}
            onClick={async () => {
              try {
                // Find the most recent city email to reply to
                const mostRecentCityEmail = cityEmails
                  .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())[0];

                if (!mostRecentCityEmail && cityEmails.length === 0) {
                  alert('No city email found to reply to. Please ensure you have received feedback from the city.');
                  return;
                }

                // Collect all responses
                const responses: string[] = [];
                
                // Add responses from city emails
                cityEmails.forEach((email) => {
                  const response = cityEmailResponses[email._id];
                  if (response && response.trim()) {
                    responses.push(`Response to: ${email.subject}\n${response}`);
                  }
                });

                // Add responses from mock feedback items
                cityFeedback.forEach((feedback) => {
                  const response = cityEmailResponses[feedback.id] || feedback.consultantResponse;
                  if (response && response.trim()) {
                    responses.push(`Response to: ${feedback.comment.substring(0, 50)}...\n${response}`);
                  }
                });

                if (responses.length === 0) {
                  alert('Please add responses to city feedback before resubmitting.');
                  return;
                }

                // Compile the email body
                const emailBody = `Dear City Official,

We have addressed all the feedback items and are resubmitting our permit application.

${responses.join('\n\n---\n\n')}

Please review our updated submission. We believe all concerns have been addressed.

Thank you,
${permit.assignee.name || 'Permit Consultant'}`;

                // Send email reply to the most recent city email
                const targetEmail = mostRecentCityEmail || cityEmails[0];
                const recipientEmail = targetEmail?.from?.email;

                if (!recipientEmail) {
                  alert('Cannot resubmit: No city email address found.');
                  return;
                }

                const response = await fetch('/api/emails/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    permitId: permitId,
                    permitName: permit.name,
                    subject: `Re: ${targetEmail?.subject || 'Permit Resubmission'} - ${permit.name}`,
                    to: recipientEmail,
                    body: emailBody,
                    direction: 'outbound',
                    inReplyTo: targetEmail?.metadata?.messageId || targetEmail?._id,
                    threadId: targetEmail?.threadId || targetEmail?._id
                  })
                });

                if (response.ok) {
                  const result = await response.json();
                  alert('Resubmission email sent successfully to the city!');
                  
                  // Mark all city emails as read
                  for (const email of cityEmails) {
                    if (email.status === 'unread') {
                      await handleMarkCityEmailAsRead(email._id);
                    }
                  }
                } else {
                  const error = await response.json();
                  alert(`Failed to send resubmission: ${error.error || 'Unknown error'}`);
                }
              } catch (error) {
                console.error('Error sending resubmission:', error);
                alert('Failed to send resubmission email. Please try again.');
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              allFeedbackAddressed
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            Resubmit to City
          </button>
          <button className="px-3 py-1.5 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-xs font-medium text-neutral-700">
            Add City Feedback
          </button>
          <button className="px-3 py-1.5 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-xs font-medium text-neutral-700">
            Mark Approved
          </button>
          {!allFeedbackAddressed && (
            <p className="text-xs text-neutral-500 ml-auto">
              Address all city feedback items to enable resubmission
            </p>
          )}
        </div>
      </div>

      {/* Content - Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Section Navigation */}
        <aside className="w-56 bg-white border-r border-neutral-200 overflow-auto">
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
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{section.label}</span>
                    </div>
                    {section.badge !== undefined && section.badge > 0 && (
                      <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                        activeSection === section.id
                          ? 'bg-white text-neutral-900'
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
        <main className="flex-1 overflow-auto bg-neutral-50">
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Document Review Modal */}
      {showDocumentReview && (
        <PermitDocumentReview
          permitId={permitId}
          permitName={permit.name}
          isOpen={showDocumentReview}
          onClose={() => setShowDocumentReview(false)}
        />
      )}

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
    </div>
  );
}