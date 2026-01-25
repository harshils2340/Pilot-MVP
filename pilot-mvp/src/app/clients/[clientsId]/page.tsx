
'use client';

import { useState, useEffect, Suspense } from 'react';
import { ClientPageClient } from './ClientPageClient';

interface Client {
  _id: string;
  businessName: string;
  jurisdiction: string;
  activePermits: number;
  status: 'draft' | 'submitted' | 'approved' | 'action-required';
  lastActivity: string;
  completionRate: number;
}

interface ClientPageProps {
  params: Promise<{
    clientsId: string;
  }>;
}

function ClientPageContent({ clientId, client }: { clientId: string; client: Client | null }) {
  return <ClientPageClient clientId={clientId} client={client} />;
}

export default function ClientPage({ params }: ClientPageProps) {
  const [clientId, setClientId] = useState<string>('');
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    params.then(({ clientsId }) => {
      setClientId(clientsId);
    });
  }, [params]);

  useEffect(() => {
    if (!clientId) return;

    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/clients/${encodeURIComponent(clientId)}`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          setClient(null);
          return;
        }

        const data: Client = await res.json();
        setClient(data);
      } catch (err) {
        console.error('Failed to fetch client:', err);
        setClient(null);
      }
    };

    fetchClient();
  }, [clientId]);

  if (!clientId) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <ClientPageContent clientId={clientId} client={client} />
    </Suspense>
  );
}
