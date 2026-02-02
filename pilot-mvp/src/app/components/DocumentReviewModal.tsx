'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, CheckCircle2, XCircle, MessageSquare, FileText, 
  AlertCircle, User, Clock, Send, Eye, Download,
  GitBranch, GitMerge, GitPullRequest, ThumbsUp, ThumbsDown
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';

interface ReviewComment {
  id: string;
  documentId: string;
  author: {
    userId: string;
    userName: string;
    userEmail: string;
    role: 'consultant' | 'client';
  };
  content: string;
  position?: {
    page?: number;
    x?: number;
    y?: number;
    quote?: string; // Selected text quote
  };
  status: 'pending' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  replies?: ReviewComment[];
}

interface Review {
  id: string;
  documentId: string;
  requestedBy: {
    userId: string;
    userName: string;
    userEmail: string;
  };
  requestedAt: string;
  status: 'open' | 'approved' | 'changes-requested' | 'closed';
  reviewers: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    status: 'pending' | 'approved' | 'changes-requested' | 'dismissed';
    reviewedAt?: string;
    comment?: string;
  }>;
  comments: ReviewComment[];
  version: number;
}

interface DocumentReviewModalProps {
  documentId: string;
  documentName: string;
  documentUrl: string;
  documentType: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewComplete?: () => void;
}

export function DocumentReviewModal({
  documentId,
  documentName,
  documentUrl,
  documentType,
  isOpen,
  onClose,
  onReviewComplete,
}: DocumentReviewModalProps) {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'request-changes' | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const commentEndRef = useRef<HTMLDivElement>(null);

  // Mock current user (in real app, get from auth context)
  const currentUser = {
    userId: 'consultant-1',
    userName: 'John Doe',
    userEmail: 'john@consultant.com',
    role: 'consultant' as const,
  };

  useEffect(() => {
    if (isOpen && documentId) {
      fetchReview();
    }
  }, [isOpen, documentId]);

  useEffect(() => {
    if (review?.comments && review.comments.length > 0) {
      commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [review?.comments]);

  const fetchReview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/review`);
      if (response.ok) {
        const data = await response.json();
        setReview(data.review || null);
        if (data.review) {
          setViewingVersion(data.review.version);
        }
      } else if (response.status === 404) {
        // No review exists yet - that's okay
        setReview(null);
      }
    } catch (error) {
      console.error('Failed to fetch review:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReview = async () => {
    setSubmitting(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
        }),
      });

      if (!response.ok) throw new Error('Failed to request review');

      const data = await response.json();
      setReview(data.review);
      setViewingVersion(data.review.version);
    } catch (error) {
      console.error('Failed to request review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !review) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/review/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
        }),
      });

      if (!response.ok) throw new Error('Failed to add comment');

      const data = await response.json();
      setReview(data.review);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async (decision: 'approve' | 'request-changes') => {
    if (!reviewNote.trim() && decision === 'request-changes') {
      alert('Please provide feedback when requesting changes');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: decision,
          comment: reviewNote,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit review');

      const data = await response.json();
      setReview(data.review);
      setReviewDecision(null);
      setReviewNote('');

      if (onReviewComplete) {
        onReviewComplete();
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'changes-requested':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'open':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'changes-requested':
        return <XCircle className="w-4 h-4" />;
      case 'open':
        return <GitPullRequest className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const canReview = review && review.status === 'open' && 
    !review.reviewers.some(r => r.userId === currentUser.userId && r.status !== 'pending');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5" />
            Review: {documentName}
            {review && (
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(review.status)}`}>
                {getStatusIcon(review.status)}
                <span className="ml-1 capitalize">{review.status.replace('-', ' ')}</span>
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading review...</p>
            </div>
          </div>
        ) : !review ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <GitPullRequest className="w-16 h-16 text-neutral-300 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Review Requested</h3>
            <p className="text-neutral-600 text-center mb-6 max-w-md">
              Request a review to get feedback on this document before submission. 
              Reviewers can comment, approve, or request changes.
            </p>
            <Button
              onClick={handleRequestReview}
              disabled={submitting}
              className="bg-neutral-900 text-white hover:bg-neutral-800"
            >
              <GitPullRequest className="w-4 h-4 mr-2" />
              Request Review
            </Button>
          </div>
        ) : (
          <div className="flex-1 flex gap-4 overflow-hidden">
            {/* Left: Document Preview */}
            <div className="flex-1 flex flex-col border border-neutral-200 rounded-lg overflow-hidden">
              <div className="bg-neutral-50 px-4 py-2 border-b border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-neutral-600" />
                  <span className="text-sm font-medium text-neutral-900">Document Preview</span>
                  {viewingVersion && (
                    <span className="text-xs text-neutral-500">Version {viewingVersion}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(documentUrl, '_blank')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = documentUrl;
                      link.download = documentName;
                      link.click();
                    }}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-neutral-50 p-4">
                {documentType.startsWith('image/') ? (
                  <img 
                    src={documentUrl} 
                    alt={documentName}
                    className="max-w-full h-auto mx-auto"
                  />
                ) : documentType === 'application/pdf' ? (
                  <iframe
                    src={documentUrl}
                    className="w-full h-full min-h-[600px] border-0"
                    title={documentName}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-500">
                    <div className="text-center">
                      <FileText className="w-12 h-12 mx-auto mb-2 text-neutral-300" />
                      <p>Preview not available for this file type</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => window.open(documentUrl, '_blank')}
                      >
                        Open in New Tab
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Review Panel */}
            <div className="w-96 flex flex-col border border-neutral-200 rounded-lg overflow-hidden">
              {/* Review Info */}
              <div className="bg-neutral-50 px-4 py-3 border-b border-neutral-200">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-neutral-600" />
                  <span className="text-sm font-medium text-neutral-900">
                    {review.requestedBy.userName}
                  </span>
                  <span className="text-xs text-neutral-500">
                    requested review
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Clock className="w-3 h-3" />
                  {new Date(review.requestedAt).toLocaleDateString()}
                </div>
              </div>

              {/* Reviewers Status */}
              {review.reviewers.length > 0 && (
                <div className="px-4 py-3 border-b border-neutral-200 bg-white">
                  <h4 className="text-xs font-medium text-neutral-700 mb-2">Reviewers</h4>
                  <div className="space-y-2">
                    {review.reviewers.map((reviewer, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-medium">
                            {reviewer.userName.charAt(0)}
                          </div>
                          <span className="text-neutral-900">{reviewer.userName}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(reviewer.status)}`}>
                          {reviewer.status === 'approved' && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                          {reviewer.status === 'changes-requested' && <XCircle className="w-3 h-3 inline mr-1" />}
                          {reviewer.status.replace('-', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="flex-1 overflow-auto p-4 space-y-4">
                <h4 className="text-sm font-medium text-neutral-900 mb-3">Comments</h4>
                {review.comments.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                    <p className="text-sm">No comments yet</p>
                  </div>
                ) : (
                  <>
                    {review.comments.map((comment) => (
                      <div key={comment.id} className="bg-white border border-neutral-200 rounded-lg p-3">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-medium">
                            {comment.author.userName.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-neutral-900">
                                {comment.author.userName}
                              </span>
                              <span className="text-xs text-neutral-500">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-700">{comment.content}</p>
                            {comment.position?.quote && (
                              <div className="mt-2 p-2 bg-neutral-50 border-l-2 border-blue-500 rounded text-xs text-neutral-600 italic">
                                "{comment.position.quote}"
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={commentEndRef} />
                  </>
                )}
              </div>

              {/* Add Comment */}
              {review.status === 'open' && (
                <div className="border-t border-neutral-200 p-4 bg-white">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none text-sm"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || submitting}
                    size="sm"
                    className="mt-2 w-full bg-neutral-900 text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Add Comment
                  </Button>
                </div>
              )}

              {/* Review Actions */}
              {canReview && (
                <div className="border-t border-neutral-200 p-4 bg-white">
                  {!reviewDecision ? (
                    <div className="space-y-2">
                      <Button
                        onClick={() => setReviewDecision('approve')}
                        className="w-full bg-green-600 text-white hover:bg-green-700"
                        size="sm"
                      >
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => setReviewDecision('request-changes')}
                        className="w-full bg-red-600 text-white hover:bg-red-700"
                        size="sm"
                      >
                        <ThumbsDown className="w-4 h-4 mr-2" />
                        Request Changes
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder={
                          reviewDecision === 'approve'
                            ? 'Optional: Add a note...'
                            : 'Required: Explain what needs to be changed...'
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none text-sm"
                        required={reviewDecision === 'request-changes'}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setReviewDecision(null);
                            setReviewNote('');
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleSubmitReview(reviewDecision)}
                          disabled={submitting || (reviewDecision === 'request-changes' && !reviewNote.trim())}
                          size="sm"
                          className={`flex-1 ${
                            reviewDecision === 'approve'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          {submitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Review Complete Status */}
              {review.status !== 'open' && (
                <div className={`border-t border-neutral-200 p-4 ${getStatusColor(review.status)}`}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(review.status)}
                    <span className="text-sm font-medium capitalize">
                      {review.status === 'approved' && 'Review Approved'}
                      {review.status === 'changes-requested' && 'Changes Requested'}
                      {review.status === 'closed' && 'Review Closed'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

