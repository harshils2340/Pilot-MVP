'use client';

import { FileText, Download, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronRight, MessageCircle, XCircle, Loader2, Upload, RefreshCw, AlertTriangle, UserPlus, X, Eye, Dot } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DocumentCheck {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  startedAt?: string;
  completedAt?: string;
  details?: string;
}

interface ReviewComment {
  id: string;
  author: {
    name: string;
    initials: string;
    color: string;
  };
  message: string;
  timestamp: string;
  type: 'comment' | 'change_request' | 'approval';
  documentName?: string;
  resolved?: boolean;
}

interface DocumentReview {
  id: string;
  documentName: string;
  documentType: string;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
  status: 'pending_review' | 'approved' | 'changes_requested';
  checks?: DocumentCheck[];
  reviewers: {
    name: string;
    initials: string;
    color: string;
    status: 'pending' | 'approved' | 'changes_requested';
    reviewedAt?: string;
  }[];
  comments: ReviewComment[];
}

interface ReviewSectionProps {
  reviews: DocumentReview[];
  onUpdateReview?: (reviewId: string, status: DocumentReview['status']) => void;
}

// Mock available reviewers
const availableReviewers = [
  { name: 'Sarah Chen', initials: 'SC', color: 'bg-purple-600' },
  { name: 'Mike Torres', initials: 'MT', color: 'bg-blue-600' },
  { name: 'Lisa Park', initials: 'LP', color: 'bg-pink-600' },
  { name: 'James Wilson', initials: 'JW', color: 'bg-orange-600' },
];

export function ReviewSection({ reviews: initialReviews, onUpdateReview }: ReviewSectionProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [expandedReview, setExpandedReview] = useState<string>('1');
  const [reviewingDocument, setReviewingDocument] = useState<string | null>(null);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [showAddReviewer, setShowAddReviewer] = useState<string | null>(null);
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);

  // Initialize checks for documents
  useEffect(() => {
    reviews.forEach((review) => {
      if (!review.checks || review.checks.length === 0) {
        // Start checks after a brief delay
        setTimeout(() => {
          const initialChecks: DocumentCheck[] = [
            { 
              id: 'ai-compliance', 
              name: 'AI Compliance Validation', 
              description: 'Validating document against SF Health Department requirements', 
              status: 'running',
              details: 'Analyzing document structure, required fields, and regulatory compliance...'
            },
            { 
              id: 'format-validation', 
              name: 'Format & Structure Check', 
              description: 'Verifying document format meets submission standards', 
              status: 'pending',
              details: 'Checking file format, dimensions, quality, and technical specifications...'
            },
            { 
              id: 'completeness', 
              name: 'Completeness Verification', 
              description: 'Ensuring all required information is present', 
              status: 'pending',
              details: 'Verifying all mandatory fields, signatures, and supporting documentation...'
            },
          ];

          setReviews(prev => prev.map(r => {
            if (r.id === review.id) {
              return { ...r, checks: initialChecks };
            }
            return r;
          }));

          // Simulate check progression
          runChecks(review.id, review.documentName);
        }, 500);
      }
    });
  }, []);

  const runChecks = (reviewId: string, documentName: string) => {
    // First check - AI Compliance (2.3s)
    setTimeout(() => {
      setReviews(prev => prev.map(r => {
        if (r.id === reviewId) {
          const updatedChecks = (r.checks || []).map(check => {
            if (check.id === 'ai-compliance') {
              const hasCriticalIssues = documentName.includes('floor_plan');
              return {
                ...check,
                status: hasCriticalIssues ? 'failed' as const : 'passed' as const,
                duration: 2.3,
                completedAt: 'Just now',
                details: hasCriticalIssues 
                  ? 'Critical compliance issues detected:\n• Missing water supply line routing to food prep areas\n• Sink dimensions not precisely specified (SF Health requires ±1/8" accuracy)\n• Scale indicator not clearly marked on drawing'
                  : 'Document meets all SF Health Department regulatory requirements'
              };
            }
            if (check.id === 'format-validation') {
              return { ...check, status: 'running' as const, startedAt: 'Just now' };
            }
            return check;
          });
          return { ...r, checks: updatedChecks };
        }
        return r;
      }));

      // Second check - Format Validation (1.5s)
      setTimeout(() => {
        setReviews(prev => prev.map(r => {
          if (r.id === reviewId) {
            const updatedChecks = (r.checks || []).map(check => {
              if (check.id === 'format-validation') {
                return { 
                  ...check, 
                  status: 'passed' as const, 
                  duration: 1.5, 
                  completedAt: 'Just now',
                  details: 'Document format validated successfully. PDF structure is valid, pages are properly sized, and text is machine-readable.'
                };
              }
              if (check.id === 'completeness') {
                return { ...check, status: 'running' as const, startedAt: 'Just now' };
              }
              return check;
            });
            return { ...r, checks: updatedChecks };
          }
          return r;
        }));

        // Third check - Completeness (1.8s)
        setTimeout(() => {
          setReviews(prev => prev.map(r => {
            if (r.id === reviewId) {
              const updatedChecks = (r.checks || []).map(check => {
                if (check.id === 'completeness') {
                  return { 
                    ...check, 
                    status: 'passed' as const, 
                    duration: 1.8, 
                    completedAt: 'Just now',
                    details: 'All required sections present. Document includes title block, measurements, annotations, and required certifications.'
                  };
                }
                return check;
              });
              return { ...r, checks: updatedChecks };
            }
            return r;
          }));
        }, 1800);
      }, 1500);
    }, 2300);
  };

  const rerunChecks = (reviewId: string, documentName: string) => {
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        const resetChecks: DocumentCheck[] = [
          { id: 'ai-compliance', name: 'AI Compliance Validation', description: 'Validating document against SF Health Department requirements', status: 'running' },
          { id: 'format-validation', name: 'Format & Structure Check', description: 'Verifying document format meets submission standards', status: 'pending' },
          { id: 'completeness', name: 'Completeness Verification', description: 'Ensuring all required information is present', status: 'pending' },
        ];
        return { ...r, checks: resetChecks };
      }
      return r;
    }));
    runChecks(reviewId, documentName);
  };

  const allChecksPassed = (checks?: DocumentCheck[]) => {
    return checks && checks.length > 0 ? checks.every(check => check.status === 'passed') : false;
  };

  const hasFailedChecks = (checks?: DocumentCheck[]) => {
    return checks ? checks.some(check => check.status === 'failed') : false;
  };

  const checksInProgress = (checks?: DocumentCheck[]) => {
    return checks ? checks.some(check => check.status === 'running' || check.status === 'pending') : true;
  };

  const addReviewer = (reviewId: string, reviewer: typeof availableReviewers[0]) => {
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        const alreadyAdded = r.reviewers.some(rev => rev.name === reviewer.name);
        if (!alreadyAdded) {
          return {
            ...r,
            reviewers: [
              ...r.reviewers,
              { ...reviewer, status: 'pending' as const }
            ]
          };
        }
      }
      return r;
    }));
    setShowAddReviewer(null);
  };

  const removeReviewer = (reviewId: string, reviewerName: string) => {
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        return {
          ...r,
          reviewers: r.reviewers.filter(rev => rev.name !== reviewerName)
        };
      }
      return r;
    }));
  };

  const handleSubmitReview = (reviewId: string, decision: 'approve' | 'request-changes' | 'comment') => {
    setReviews(prev => prev.map(r => {
      if (r.id === reviewId) {
        const newStatus = decision === 'approve' ? 'approved' : decision === 'request-changes' ? 'changes_requested' : r.status;
        return {
          ...r,
          status: newStatus,
          reviewers: r.reviewers.map(rev => {
            // Update current user's review status
            if (rev.name === 'You' || rev.name === 'Current User') {
              return {
                ...rev,
                status: decision === 'approve' ? 'approved' : decision === 'request-changes' ? 'changes_requested' : 'pending',
                reviewedAt: 'Just now',
              };
            }
            return rev;
          }),
          comments: newReviewComment.trim() ? [...r.comments, {
            id: `comment-${Date.now()}`,
            author: { name: 'You', initials: 'YU', color: 'bg-neutral-900' },
            message: newReviewComment,
            timestamp: 'Just now',
            type: decision === 'approve' ? 'approval' : decision === 'request-changes' ? 'change_request' : 'comment',
          }] : r.comments,
        };
      }
      return r;
    }));
    setReviewingDocument(null);
    setNewReviewComment('');
    if (onUpdateReview) {
      const updatedReview = reviews.find(r => r.id === reviewId);
      if (updatedReview) {
        const newStatus = decision === 'approve' ? 'approved' : decision === 'request-changes' ? 'changes_requested' : updatedReview.status;
        onUpdateReview(reviewId, newStatus);
      }
    }
  };

  const pendingCount = reviews.filter(r => r.status === 'pending_review').length;
  const changesRequestedCount = reviews.filter(r => r.status === 'changes_requested').length;

  return (
    <div className="space-y-3">
      {/* Summary Bar - GitHub Style */}
      <div className="bg-white border border-neutral-200 rounded-md px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-neutral-900">
              {reviews.length} {reviews.length === 1 ? 'document' : 'documents'}
            </span>
            <span className="text-neutral-400">·</span>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-neutral-600">{pendingCount} pending</span>
              {changesRequestedCount > 0 && (
                <span className="text-red-600 font-medium">{changesRequestedCount} changes requested</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Reviews */}
      <div className="space-y-3">
        {reviews.map((review) => {
          const isExpanded = expandedReview === review.id;
          const isReviewing = reviewingDocument === review.id;
          const checksPass = allChecksPassed(review.checks);
          const checksFailed = hasFailedChecks(review.checks);
          const checksRunning = checksInProgress(review.checks);

          return (
            <div key={review.id} className="bg-white border border-neutral-200 rounded-md overflow-hidden">
              {/* Header - GitHub PR Style */}
              <div
                className="px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => setExpandedReview(isExpanded ? '' : review.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-neutral-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-neutral-500" />
                    )}
                  </div>
                  <FileText className="w-5 h-5 text-neutral-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-neutral-900">
                        {review.documentName}
                      </h3>
                      <span className="text-neutral-500 text-sm">·</span>
                      <span className="text-sm text-neutral-600">{review.documentType}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-neutral-600">
                      <span>{review.uploadedBy} uploaded {review.uploadedAt}</span>
                      <span className="text-neutral-400">·</span>
                      <span>{review.size}</span>
                      {review.comments.length > 0 && (
                        <>
                          <span className="text-neutral-400">·</span>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            <span>{review.comments.length}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <button 
                    className="p-1.5 hover:bg-neutral-100 rounded transition-colors" 
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Download className="w-4 h-4 text-neutral-600" />
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-neutral-200">
                  {/* Checks Section - Exact GitHub Style */}
                  <div className="px-4 py-4">
                    {/* Checks Header */}
                    <div className="flex items-start gap-2 mb-3">
                      {checksRunning ? (
                        <Loader2 className="w-5 h-5 text-neutral-600 animate-spin mt-0.5" />
                      ) : checksPass ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-neutral-900">
                              {checksRunning 
                                ? `${(review.checks || []).filter(c => c.status === 'passed').length} / ${(review.checks || []).length} checks complete`
                                : checksPass 
                                  ? 'All checks have passed' 
                                  : 'Some checks were not successful'}
                            </h4>
                            <p className="text-xs text-neutral-600 mt-0.5">
                              {checksRunning 
                                ? 'Checks are currently running...'
                                : checksPass
                                  ? `${(review.checks || []).length} successful checks`
                                  : `${(review.checks || []).filter(c => c.status === 'failed').length} failing, ${(review.checks || []).filter(c => c.status === 'passed').length} successful`}
                            </p>
                          </div>
                          {!checksRunning && (
                            <button
                              onClick={() => rerunChecks(review.id, review.documentName)}
                              className="text-xs font-medium text-neutral-700 hover:text-neutral-900 px-2 py-1 hover:bg-neutral-100 rounded transition-colors"
                            >
                              Re-run checks
                            </button>
                          )}
                        </div>

                        {/* Individual Checks - GitHub List Style */}
                        <div className="mt-3 space-y-0 border border-neutral-200 rounded-md overflow-hidden">
                          {(review.checks || []).map((check, idx) => {
                            const isCheckExpanded = expandedCheck === check.id;
                            const showBottomBorder = idx < (review.checks || []).length - 1;
                            
                            return (
                              <div key={check.id}>
                                <div 
                                  className={`flex items-start gap-3 px-3 py-2.5 hover:bg-neutral-50 transition-colors ${showBottomBorder ? 'border-b border-neutral-200' : ''} cursor-pointer`}
                                  onClick={() => setExpandedCheck(isCheckExpanded ? null : check.id)}
                                >
                                  <div className="mt-0.5">
                                    {check.status === 'passed' ? (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    ) : check.status === 'failed' ? (
                                      <XCircle className="w-4 h-4 text-red-600" />
                                    ) : check.status === 'running' ? (
                                      <Loader2 className="w-4 h-4 text-neutral-600 animate-spin" />
                                    ) : (
                                      <div className="w-4 h-4 rounded-full border-2 border-neutral-300 bg-neutral-100" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-neutral-900">{check.name}</p>
                                      {check.duration && (
                                        <span className="text-xs text-neutral-500">{check.duration}s</span>
                                      )}
                                    </div>
                                    {!isCheckExpanded && (
                                      <p className="text-xs text-neutral-600 mt-0.5">{check.description}</p>
                                    )}
                                  </div>
                                  {(check.status === 'passed' || check.status === 'failed') && check.details && (
                                    <ChevronRight className={`w-4 h-4 text-neutral-400 mt-0.5 transition-transform ${isCheckExpanded ? 'rotate-90' : ''}`} />
                                  )}
                                </div>
                                
                                {/* Expanded Check Details */}
                                {isCheckExpanded && check.details && (
                                  <div className={`px-3 py-3 bg-neutral-50 text-xs text-neutral-700 ${showBottomBorder ? 'border-b border-neutral-200' : ''}`}>
                                    <p className="whitespace-pre-line leading-relaxed">{check.details}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Warning for failed checks */}
                        {checksFailed && (
                          <div className="mt-3 px-3 py-2.5 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-red-900">
                                  This document cannot be reviewed until checks pass
                                </p>
                                <p className="text-xs text-red-700 mt-1">
                                  Fix the failing checks and upload a new version to continue.
                                </p>
                                <button className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors">
                                  <Upload className="w-3 h-3" />
                                  Upload revised document
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Success message for passed checks */}
                        {checksPass && review.reviewers.length === 0 && (
                          <div className="mt-3 px-3 py-2.5 bg-green-50 border border-green-200 rounded-md">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-green-900">
                                  Checks passed — ready for review
                                </p>
                                <p className="text-xs text-green-700 mt-1">
                                  This document has passed all automated checks and can now be reviewed by your team.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reviewers Section - GitHub Sidebar Style but inline */}
                  {checksPass && (
                    <div className="border-t border-neutral-200 px-4 py-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-neutral-900">Reviewers</h4>
                          <p className="text-xs text-neutral-600 mt-0.5">
                            {review.reviewers.length === 0 
                              ? 'No reviewers — add someone to review this document'
                              : `${review.reviewers.filter(r => r.status === 'approved').length} approved, ${review.reviewers.filter(r => r.status === 'pending').length} pending`}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowAddReviewer(showAddReviewer === review.id ? null : review.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Request
                        </button>
                      </div>

                      {/* Add Reviewer Dropdown */}
                      {showAddReviewer === review.id && (
                        <div className="mb-3 border border-neutral-200 rounded-md bg-white shadow-sm">
                          <div className="px-3 py-2 border-b border-neutral-200 bg-neutral-50">
                            <p className="text-xs font-medium text-neutral-700">Request review from</p>
                          </div>
                          <div className="p-1">
                            {availableReviewers
                              .filter(ar => !review.reviewers.some(r => r.name === ar.name))
                              .map((reviewer) => (
                                <button
                                  key={reviewer.name}
                                  onClick={() => addReviewer(review.id, reviewer)}
                                  className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-neutral-100 rounded transition-colors text-left"
                                >
                                  <div className={`w-5 h-5 rounded-full ${reviewer.color} text-white text-[10px] font-semibold flex items-center justify-center`}>
                                    {reviewer.initials}
                                  </div>
                                  <span className="text-sm text-neutral-900">{reviewer.name}</span>
                                </button>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Reviewers List - GitHub Style */}
                      {review.reviewers.length > 0 ? (
                        <div className="space-y-2">
                          {review.reviewers.map((reviewer, idx) => (
                            <div key={idx} className="flex items-start gap-2 group">
                              <div className={`w-6 h-6 rounded-full ${reviewer.color} text-white text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                {reviewer.initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-neutral-900">{reviewer.name}</span>
                                  {reviewer.status === 'pending' && (
                                    <button
                                      onClick={() => removeReviewer(review.id, reviewer.name)}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-neutral-200 rounded transition-all"
                                    >
                                      <X className="w-3 h-3 text-neutral-600" />
                                    </button>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {reviewer.status === 'approved' ? (
                                    <>
                                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                                      <span className="text-xs font-medium text-green-700">Approved</span>
                                    </>
                                  ) : reviewer.status === 'changes_requested' ? (
                                    <>
                                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                                      <span className="text-xs font-medium text-red-700">Changes requested</span>
                                    </>
                                  ) : (
                                    <>
                                      <Dot className="w-3.5 h-3.5 text-amber-600" />
                                      <span className="text-xs text-neutral-600">Review requested</span>
                                    </>
                                  )}
                                  {reviewer.reviewedAt && (
                                    <>
                                      <span className="text-neutral-400">·</span>
                                      <span className="text-xs text-neutral-500">{reviewer.reviewedAt}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-neutral-500">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs">At least 1 approving review is required</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Comments Timeline - GitHub Style */}
                  {review.comments.length > 0 && (
                    <div className="border-t border-neutral-200 px-4 py-4">
                      <div className="space-y-3">
                        {review.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <div className={`w-7 h-7 rounded-full ${comment.author.color} text-white text-xs font-semibold flex items-center justify-center flex-shrink-0`}>
                              {comment.author.initials}
                            </div>
                            <div className="flex-1">
                              <div className={`border rounded-md overflow-hidden ${
                                comment.type === 'approval' ? 'border-green-300' :
                                comment.type === 'change_request' ? 'border-red-300' :
                                'border-neutral-200'
                              }`}>
                                <div className={`px-3 py-2 text-xs ${
                                  comment.type === 'approval' ? 'bg-green-50' :
                                  comment.type === 'change_request' ? 'bg-red-50' :
                                  'bg-neutral-50'
                                }`}>
                                  <span className="font-semibold text-neutral-900">{comment.author.name}</span>
                                  {comment.type === 'approval' ? (
                                    <span className="text-green-700 font-medium ml-1">approved this document</span>
                                  ) : comment.type === 'change_request' ? (
                                    <span className="text-red-700 font-medium ml-1">requested changes</span>
                                  ) : (
                                    <span className="text-neutral-600 ml-1">commented</span>
                                  )}
                                  <span className="text-neutral-500 ml-2">{comment.timestamp}</span>
                                </div>
                                {comment.message && (
                                  <div className="px-3 py-2.5 bg-white">
                                    <p className="text-sm text-neutral-900 leading-relaxed">{comment.message}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Actions - GitHub "Review changes" button style */}
                  {checksPass && (
                    <div className="border-t border-neutral-200 px-4 py-3 bg-neutral-50">
                      {!isReviewing ? (
                        <button
                          onClick={() => setReviewingDocument(review.id)}
                          className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
                        >
                          Review changes
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <textarea
                            value={newReviewComment}
                            onChange={(e) => setNewReviewComment(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white"
                            placeholder="Leave a comment (optional)"
                            autoFocus
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSubmitReview(review.id, 'approve')}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleSubmitReview(review.id, 'request-changes')}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                              >
                                Request changes
                              </button>
                              <button
                                onClick={() => handleSubmitReview(review.id, 'comment')}
                                className="px-3 py-1.5 border border-neutral-300 hover:border-neutral-400 text-neutral-700 hover:bg-white text-sm font-medium rounded transition-colors"
                              >
                                Comment
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                setReviewingDocument(null);
                                setNewReviewComment('');
                              }}
                              className="text-sm text-neutral-600 hover:text-neutral-900"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Waiting for checks message */}
                  {checksRunning && (
                    <div className="border-t border-neutral-200 px-4 py-3 bg-blue-50">
                      <div className="flex items-start gap-2">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            Waiting for checks to complete
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            Reviewers can be requested once all checks have passed.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
