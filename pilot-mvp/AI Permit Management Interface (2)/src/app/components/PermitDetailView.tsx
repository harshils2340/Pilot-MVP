import { ArrowLeft, FileText, MessageSquare, Clock, AlertCircle, Edit3, Lock, Send, MoreVertical, Info, Paperclip, Download, ExternalLink, CheckCircle2, Building2, Calendar, User2, Hash, CheckCircle, Circle, Plus, Upload, ChevronDown, ChevronRight, AtSign, Smile, MoreHorizontal, Pin, X, MessageCircle } from 'lucide-react';
import { useState } from 'react';

interface PermitDetailViewProps {
  permitId: string;
  onBack: () => void;
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

type Section = 'overview' | 'city-feedback' | 'discussion' | 'history';

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

export function PermitDetailView({ permitId, onBack }: PermitDetailViewProps) {
  const [activeSection, setActiveSection] = useState<Section>('city-feedback');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [expandedFeedback, setExpandedFeedback] = useState<string>('1');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

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
          </div>
        );

      case 'city-feedback':
        return (
          <div className="space-y-4">
            {/* Summary Bar */}
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      {cityFeedback.length} feedback items from city
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {feedbackNotStarted} not started • {feedbackInProgress} in progress • {cityFeedback.length - feedbackNotStarted - feedbackInProgress} addressed
                    </p>
                  </div>
                  <div className="h-2 w-48 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 transition-all duration-300"
                      style={{ width: `${(cityFeedback.filter(f => f.status === 'addressed').length / cityFeedback.length) * 100}%` }}
                    />
                  </div>
                </div>
                {allFeedbackAddressed ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Ready to Resubmit</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">{feedbackInProgress + feedbackNotStarted} items need attention</span>
                  </div>
                )}
              </div>
            </div>

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
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                          placeholder="Explain what you fixed and how you addressed the city's concerns. This will be included when you resubmit..."
                          defaultValue={feedback.consultantResponse}
                        />
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs text-neutral-500">This response will be sent to the city when you resubmit</p>
                          <button className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors">
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
    }
  };

  const sections = [
    { id: 'overview' as Section, label: 'Overview', icon: Info },
    { id: 'city-feedback' as Section, label: 'City Feedback', icon: AlertCircle, badge: cityFeedback.filter(f => f.status !== 'addressed').length },
    { id: 'discussion' as Section, label: 'Discussion', icon: MessageCircle, badge: comments.filter(c => !c.resolved).length },
    { id: 'history' as Section, label: 'History', icon: Clock },
  ];

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-3 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Permit Plan
        </button>

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
    </div>
  );
}