'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, CheckCircle2, XCircle, MessageSquare, FileText, 
  AlertCircle, User, Clock, Send, Eye, Download,
  GitPullRequest, ThumbsUp, ThumbsDown, Mail, Upload
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
  createdAt: string;
}

interface Document {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  status: 'draft' | 'pending-review' | 'approved' | 'shared';
  uploadedBy: {
    userName: string;
    userEmail: string;
    isClient: boolean;
  };
  createdAt: string;
}

interface PermitDocumentReviewProps {
  permitId: string;
  permitName: string;
  isOpen: boolean;
  onClose: () => void;
}

// Hardcoded documents for Health Department Plan Review
const HARDCODED_DOCUMENTS: Document[] = [
  {
    id: 'doc-1',
    name: 'Updated floor plan with sink dimensions',
    fileName: 'floor_plan_revised_v2.pdf',
    fileUrl: '#',
    fileType: 'application/pdf',
    status: 'pending-review',
    uploadedBy: {
      userName: 'Sarah Chen',
      userEmail: 'sarah@consultant.com',
      isClient: false,
    },
    createdAt: new Date('2025-01-11').toISOString(),
  },
  {
    id: 'doc-2',
    name: 'Equipment schedule',
    fileName: 'equipment_schedule.pdf',
    fileUrl: '#',
    fileType: 'application/pdf',
    status: 'pending-review',
    uploadedBy: {
      userName: 'Sarah Chen',
      userEmail: 'sarah@consultant.com',
      isClient: false,
    },
    createdAt: new Date('2025-01-11').toISOString(),
  },
  {
    id: 'doc-3',
    name: 'Sink specifications',
    fileName: 'sink_specifications.pdf',
    fileUrl: '#',
    fileType: 'application/pdf',
    status: 'pending-review',
    uploadedBy: {
      userName: 'Sarah Chen',
      userEmail: 'sarah@consultant.com',
      isClient: false,
    },
    createdAt: new Date('2025-01-11').toISOString(),
  },
  {
    id: 'doc-4',
    name: 'Water supply calculations',
    fileName: 'water_supply_calculations.pdf',
    fileUrl: '#',
    fileType: 'application/pdf',
    status: 'pending-review',
    uploadedBy: {
      userName: 'Sarah Chen',
      userEmail: 'sarah@consultant.com',
      isClient: false,
    },
    createdAt: new Date('2025-01-11').toISOString(),
  },
];

const HARDCODED_COMMENTS: Record<string, ReviewComment[]> = {
  'doc-1': [
    {
      id: 'c1',
      documentId: 'doc-1',
      author: {
        userId: 'consultant-1',
        userName: 'John Doe',
        userEmail: 'john@consultant.com',
        role: 'consultant',
      },
      content: 'The sink dimensions look correct (18"x18" per compartment). Good work!',
      createdAt: new Date('2025-01-27T10:00:00').toISOString(),
    },
  ],
};

export function PermitDocumentReview({
  permitId,
  permitName,
  isOpen,
  onClose,
}: PermitDocumentReviewProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [comments, setComments] = useState<Record<string, ReviewComment[]>>({});
  const [newComment, setNewComment] = useState('');
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'request-changes' | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const commentEndRef = useRef<HTMLDivElement>(null);

  // Mock current user
  const currentUser = {
    userId: 'consultant-1',
    userName: 'John Doe',
    userEmail: 'john@consultant.com',
    role: 'consultant' as const,
  };

  useEffect(() => {
    if (isOpen) {
      // Hardcode for Health Department Plan Review
      if (permitName === 'Health Department Plan Review' || permitId) {
        setDocuments(HARDCODED_DOCUMENTS);
        setComments(HARDCODED_COMMENTS);
        if (HARDCODED_DOCUMENTS.length > 0) {
          setSelectedDocument(HARDCODED_DOCUMENTS[0]);
        }
      }
    }
  }, [isOpen, permitId, permitName]);

  useEffect(() => {
    if (selectedDocument && comments[selectedDocument.id]?.length) {
      commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedDocument, comments]);

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedDocument) return;

    const comment: ReviewComment = {
      id: `comment-${Date.now()}`,
      documentId: selectedDocument.id,
      author: currentUser,
      content: newComment,
      createdAt: new Date().toISOString(),
    };

    setComments(prev => ({
      ...prev,
      [selectedDocument.id]: [...(prev[selectedDocument.id] || []), comment],
    }));
    setNewComment('');
  };

  const handleSubmitReview = async (decision: 'approve' | 'request-changes') => {
    if (!selectedDocument) return;
    if (decision === 'request-changes' && !reviewNote.trim()) {
      alert('Please provide feedback when requesting changes');
      return;
    }

    setSubmitting(true);
    try {
      // Update document status
      setDocuments(prev => prev.map(doc => 
        doc.id === selectedDocument.id 
          ? { ...doc, status: decision === 'approve' ? 'approved' : 'pending-review' }
          : doc
      ));

      // Add review comment if provided
      if (reviewNote.trim()) {
        const reviewComment: ReviewComment = {
          id: `review-${Date.now()}`,
          documentId: selectedDocument.id,
          author: currentUser,
          content: `Review: ${decision === 'approve' ? 'Approved' : 'Changes Requested'}\n\n${reviewNote}`,
          createdAt: new Date().toISOString(),
        };
        setComments(prev => ({
          ...prev,
          [selectedDocument.id]: [...(prev[selectedDocument.id] || []), reviewComment],
        }));
      }

      setReviewDecision(null);
      setReviewNote('');
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
      case 'pending-review':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-neutral-200">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <GitPullRequest className="w-5 h-5" />
            Review Documents: {permitName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-0 overflow-hidden">
          {/* Left: Document List */}
          <div className="w-72 flex flex-col border-r border-neutral-200 bg-white">
            <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
              <h3 className="text-sm font-semibold text-neutral-900">Documents to Review</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {documents.filter(d => d.status === 'pending-review').length} pending
              </p>
            </div>
            <div className="flex-1 overflow-auto">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocument(doc)}
                  className={`w-full text-left px-4 py-3 border-b border-neutral-100 transition-colors ${
                    selectedDocument?.id === doc.id 
                      ? 'bg-neutral-50 border-l-2 border-l-neutral-900' 
                      : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 mb-1 line-clamp-2">{doc.name}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${getStatusColor(doc.status)}`}>
                          {doc.status === 'approved' ? 'Approved' : 'Pending'}
                        </span>
                        {comments[doc.id]?.length > 0 && (
                          <span className="text-xs text-neutral-500 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {comments[doc.id].length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Review Panel */}
          {selectedDocument ? (
            <div className="flex-1 flex flex-col bg-white">
              {/* Document Preview Header */}
              <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-neutral-900 mb-1">{selectedDocument.name}</h3>
                  <p className="text-xs text-neutral-500">{selectedDocument.fileName}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => window.open(selectedDocument.fileUrl, '_blank')}
                    className="px-3 py-1.5 text-sm border border-neutral-300 text-neutral-700 rounded-lg hover:bg-white transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    className="px-3 py-1.5 text-sm border border-neutral-300 text-neutral-700 rounded-lg hover:bg-white transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Document Preview */}
                <div className="flex-1 overflow-auto bg-neutral-50 p-6">
                  <div className="flex items-center justify-center h-full text-neutral-500">
                    <div className="text-center max-w-md">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                      <p className="text-sm font-medium text-neutral-900 mb-1">{selectedDocument.name}</p>
                      <p className="text-xs text-neutral-400 mb-4">Document preview would appear here</p>
                      <button
                        onClick={() => window.open(selectedDocument.fileUrl, '_blank')}
                        className="px-4 py-2 text-sm border border-neutral-300 text-neutral-700 rounded-lg hover:bg-white transition-colors"
                      >
                        Open in New Tab
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments Sidebar */}
                <div className="w-96 border-l border-neutral-200 flex flex-col bg-white">
                  <div className="px-4 py-3 border-b border-neutral-200">
                    <h4 className="text-sm font-semibold text-neutral-900">Comments</h4>
                  </div>
                  <div className="flex-1 overflow-auto p-4 space-y-3">
                    {!comments[selectedDocument.id] || comments[selectedDocument.id].length === 0 ? (
                      <div className="text-center py-8 text-neutral-500">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                        <p className="text-sm">No comments yet</p>
                      </div>
                    ) : (
                      <>
                        {comments[selectedDocument.id].map((comment) => (
                          <div key={comment.id} className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                                {comment.author.userName.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-neutral-900">
                                    {comment.author.userName}
                                  </span>
                                  <span className="text-xs text-neutral-500">
                                    {new Date(comment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-sm text-neutral-700 whitespace-pre-wrap break-words">{comment.content}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={commentEndRef} />
                      </>
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="border-t border-neutral-200 p-4 bg-white">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none text-sm mb-2"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || submitting}
                      className="w-full px-3 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Add Comment
                    </button>
                  </div>

                  {/* Review Actions */}
                  {selectedDocument.status === 'pending-review' && (
                    <div className="border-t border-neutral-200 p-4 bg-neutral-50">
                      {!reviewDecision ? (
                        <div className="space-y-2">
                          <button
                            onClick={() => setReviewDecision('approve')}
                            className="w-full px-3 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => setReviewDecision('request-changes')}
                            className="w-full px-3 py-2 bg-white border border-neutral-300 text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            Request Changes
                          </button>
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
                            rows={3}
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none text-sm bg-white"
                            required={reviewDecision === 'request-changes'}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setReviewDecision(null);
                                setReviewNote('');
                              }}
                              className="flex-1 px-3 py-2 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleSubmitReview(reviewDecision)}
                              disabled={submitting || (reviewDecision === 'request-changes' && !reviewNote.trim())}
                              className="flex-1 px-3 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {submitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-400 bg-white">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p className="text-sm">Select a document to review</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

