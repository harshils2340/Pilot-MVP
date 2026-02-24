'use client';

import { useMemo, useState } from 'react';
import { Copy, ExternalLink, Mail } from 'lucide-react';

interface InviteClientModalProps {
  clientId: string;
  clientName: string;
  clientEmail?: string;
  onClose: () => void;
}

export function InviteClientModal({ clientId, clientName, clientEmail, onClose }: InviteClientModalProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({
      clientId,
      name: clientName,
    });
    return origin ? `${origin}/client-portal?${params.toString()}` : '';
  }, [clientId, clientName]);

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Failed to copy invite link:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-neutral-900">Invite Client</h3>
        <p className="mt-2 text-sm text-neutral-600">
          Share this link so {clientName} can access their portal.
        </p>

        <div className="mt-4">
          <label className="block text-xs font-medium text-neutral-500 mb-1">Invite link</label>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={inviteUrl || 'Generating link...'}
              className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-700 bg-neutral-50"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 text-xs bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <a
            href={inviteUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 text-xs border border-neutral-200 rounded-lg hover:bg-neutral-50"
          >
            <ExternalLink className="w-3 h-3" />
            Open portal
          </a>
          <button
            onClick={() => alert('Email invite coming soon')}
            className="flex items-center gap-2 px-3 py-2 text-xs border border-neutral-200 rounded-lg hover:bg-neutral-50"
          >
            <Mail className="w-3 h-3" />
            Send email
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
