'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';

interface RequestDocumentModalProps {
  clientId: string;
  clientName: string;
  clientEmail: string;
  consultantId: string;
  consultantName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function RequestDocumentModal({
  clientId,
  clientName,
  clientEmail,
  consultantName,
  onClose,
  onSuccess,
}: RequestDocumentModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        id: `req-${Date.now()}`,
        title,
        description,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: dueDate ? new Date(dueDate).toISOString() : undefined,
        clientId,
      };
      const existing = JSON.parse(localStorage.getItem('pilotDocumentRequests') || '[]');
      existing.unshift(payload);
      localStorage.setItem('pilotDocumentRequests', JSON.stringify(existing));
    } catch (error) {
      console.error('Failed to store request locally:', error);
    }

    setTimeout(() => {
      setSubmitting(false);
      onSuccess();
    }, 400);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Request Document</h2>
            <p className="text-xs text-neutral-500">
              To {clientName} {clientEmail ? `(${clientEmail})` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Updated floor plan"
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what document you need..."
              rows={4}
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs text-neutral-600">
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
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
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
