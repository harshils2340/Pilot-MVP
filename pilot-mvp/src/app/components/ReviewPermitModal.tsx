'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, FileText, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';

interface ReviewError {
  field: string;
  severity: 'error' | 'warning';
  message: string;
  suggestion?: string;
}

interface ReviewResult {
  isValid: boolean;
  errors: ReviewError[];
  warnings: ReviewError[];
  score: number;
  summary: string;
}

interface ReviewPermitModalProps {
  permitId: string;
  permitName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewPermitModal({
  permitId,
  permitName,
  isOpen,
  onClose,
}: ReviewPermitModalProps) {
  const [loading, setLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReview = useCallback(async () => {
    setLoading(true);
    setError(null);
    setReviewResult(null);

    try {
      // Try management endpoint first (for client-specific permits)
      let response = await fetch(`/api/permits/management/${permitId}/review`, {
        method: 'POST',
      });

      // If not found, try master permit library endpoint
      if (response.status === 404) {
        response = await fetch(`/api/permits/${permitId}/review`, {
          method: 'POST',
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to review permit');
      }

      const result: ReviewResult = await response.json();
      setReviewResult(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred while reviewing the permit');
    } finally {
      setLoading(false);
    }
  }, [permitId]);

  useEffect(() => {
    if (isOpen && permitId) {
      handleReview();
    } else {
      // Reset state when modal closes
      setReviewResult(null);
      setError(null);
      setLoading(false);
    }
  }, [isOpen, permitId, handleReview]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Review Permit: {permitName}
          </DialogTitle>
          <DialogDescription>
            Validating permit completeness and readiness for submission
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-neutral-600 mb-4" />
            <p className="text-neutral-600 font-medium">Reviewing permit...</p>
            <p className="text-sm text-neutral-500 mt-2">
              Checking required fields, completeness, and validation rules
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 mb-1">Review Error</h4>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={handleReview}
                  className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {reviewResult && !loading && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div
              className={`border-2 rounded-lg p-6 ${getScoreBgColor(reviewResult.score)}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Review Summary</h3>
                  <p className="text-sm text-neutral-700">{reviewResult.summary}</p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(reviewResult.score)}`}>
                    {reviewResult.score}%
                  </div>
                  <div className="text-xs text-neutral-600 mt-1">Completeness Score</div>
                </div>
              </div>

              <div className="flex gap-4 mt-4 pt-4 border-t border-neutral-200">
                <div className="flex items-center gap-2">
                  {reviewResult.isValid ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    {reviewResult.errors.length} Error{reviewResult.errors.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium">
                    {reviewResult.warnings.length} Warning{reviewResult.warnings.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Errors Section */}
            {reviewResult.errors.length > 0 && (
              <div className="border border-red-200 rounded-lg bg-red-50">
                <div className="bg-red-100 px-4 py-3 border-b border-red-200 rounded-t-lg">
                  <h4 className="font-semibold text-red-900 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Errors ({reviewResult.errors.length})
                  </h4>
                  <p className="text-xs text-red-700 mt-1">
                    These issues must be fixed before submission
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  {reviewResult.errors.map((err, index) => (
                    <div
                      key={index}
                      className="bg-white border border-red-200 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded">
                              {err.field}
                            </span>
                            <span className="text-xs text-red-600">Error</span>
                          </div>
                          <p className="font-medium text-neutral-900 mb-1">{err.message}</p>
                          {err.suggestion && (
                            <p className="text-sm text-neutral-600">{err.suggestion}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings Section */}
            {reviewResult.warnings.length > 0 && (
              <div className="border border-yellow-200 rounded-lg bg-yellow-50">
                <div className="bg-yellow-100 px-4 py-3 border-b border-yellow-200 rounded-t-lg">
                  <h4 className="font-semibold text-yellow-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Warnings ({reviewResult.warnings.length})
                  </h4>
                  <p className="text-xs text-yellow-700 mt-1">
                    These should be addressed for better completeness
                  </p>
                </div>
                <div className="p-4 space-y-3">
                  {reviewResult.warnings.map((warning, index) => (
                    <div
                      key={index}
                      className="bg-white border border-yellow-200 rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">
                              {warning.field}
                            </span>
                            <span className="text-xs text-yellow-600">Warning</span>
                          </div>
                          <p className="font-medium text-neutral-900 mb-1">{warning.message}</p>
                          {warning.suggestion && (
                            <p className="text-sm text-neutral-600">{warning.suggestion}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Success State */}
            {reviewResult.isValid && reviewResult.warnings.length === 0 && (
              <div className="border border-green-200 rounded-lg bg-green-50 p-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">
                      Permit is Ready for Submission
                    </h4>
                    <p className="text-sm text-green-700">
                      All required fields are complete and validated. You can proceed with submission.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Close
              </button>
              {reviewResult && (
                <button
                  onClick={handleReview}
                  className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Review Again
                </button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
