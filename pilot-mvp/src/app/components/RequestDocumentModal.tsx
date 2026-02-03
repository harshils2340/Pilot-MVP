'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';

interface RequestDocumentModalProps {
  clientId: string;
  clientName: string;
  clientEmail: string;
  consultantId: string;
  consultantName: string;
  permitId?: string;
  permitName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RequestDocumentModal({
  clientId,
  clientName,
  clientEmail,
  consultantId,
  consultantName,
  permitId,
  permitName,
  onClose,
  onSuccess,
}: RequestDocumentModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/documents/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          clientName: clientName || undefined,
          title: title.trim() || 'Document request',
          description: description.trim() || undefined,
          consultantId: consultantId || undefined,
          consultantName: consultantName || undefined,
          permitId: permitId || undefined,
          permitName: permitName || undefined,
          expiresAt: dueDate ? new Date(dueDate).toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create request');
        setSubmitting(false);
        return;
      }
      onSuccess();
    } catch (e) {
      console.error('Failed to create document request:', e);
      setError('Failed to create request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-surface rounded-xl w-full max-w-lg border border-border shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Request Document</h2>
            <p className="text-xs text-muted-foreground">
              To {clientName} {clientEmail ? `(${clientEmail})` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Updated floor plan"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what document you need..."
              rows={4}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="bg-muted/50 border border-border rounded-lg p-3 text-xs text-muted-foreground">
            Request will be sent from {consultantName} with a secure upload link.
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
