'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LeadDetailView } from '@/app/components/LeadDetailView';
import type { LeadDetailLead, LeadDetailEmail, PipelineStage } from '@/app/components/LeadDetailView';

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = typeof params?.leadId === 'string' ? params.leadId : '';

  const [lead, setLead] = useState<LeadDetailLead | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [emails, setEmails] = useState<LeadDetailEmail[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLead = useCallback(async () => {
    if (!leadId) return null;
    const res = await fetch(`/api/crm/leads/${leadId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.lead as LeadDetailLead;
  }, [leadId]);

  const fetchStages = useCallback(async () => {
    const res = await fetch('/api/crm/pipeline/stages', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.stages || []) as PipelineStage[];
  }, []);

  const fetchEmails = useCallback(async () => {
    if (!leadId) return [];
    const res = await fetch(`/api/crm/leads/${leadId}/emails`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.emails || []) as LeadDetailEmail[];
  }, [leadId]);

  useEffect(() => {
    if (!leadId) {
      setLoading(false);
      setError('Invalid lead');
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([fetchLead(), fetchStages()])
      .then(([l, s]) => {
        if (cancelled) return;
        setLead(l || null);
        setStages(s);
        if (!l) setError('Lead not found');
      })
      .catch(() => {
        if (!cancelled) {
          setError('Failed to load lead');
          setLead(null);
          setStages([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [leadId, fetchLead, fetchStages]);

  useEffect(() => {
    if (!leadId) return;
    let cancelled = false;
    setEmailsLoading(true);
    fetchEmails()
      .then((list) => {
        if (!cancelled) setEmails(list);
      })
      .catch(() => {
        if (!cancelled) setEmails([]);
      })
      .finally(() => {
        if (!cancelled) setEmailsLoading(false);
      });
    return () => { cancelled = true; };
  }, [leadId, fetchEmails]);

  const handleBack = useCallback(() => {
    router.push('/?view=leads');
  }, [router]);

  const handleStageChange = useCallback(
    async (lid: string, stageId: string, stageName: string, probability: number) => {
      const res = await fetch(`/api/crm/leads/${lid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId, stageName, probability }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to move lead');
      }
      setLead((prev) =>
        prev ? { ...prev, stageId, stageName, probability } : null
      );
    },
    []
  );

  const handleDelete = useCallback(
    async (lid: string) => {
      const res = await fetch(`/api/crm/leads/${lid}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete lead');
      router.push('/?view=leads');
    },
    [router]
  );

  if (!leadId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-neutral-500">Invalid lead.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
          <p className="mt-3 text-sm text-neutral-500">Loading lead…</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
        <p className="text-neutral-600">{error || 'Lead not found.'}</p>
        <button
          onClick={() => router.push('/?view=leads')}
          className="mt-4 text-sm text-sky-600 hover:underline"
        >
          Back to Leads
        </button>
      </div>
    );
  }

  return (
    <LeadDetailView
      lead={lead}
      emails={emails}
      emailsLoading={emailsLoading}
      stages={stages}
      onBack={handleBack}
      onStageChange={handleStageChange}
      onDelete={handleDelete}
    />
  );
}
