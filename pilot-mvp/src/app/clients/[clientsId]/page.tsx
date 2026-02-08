
'use client';

import { useState, useEffect, Suspense } from 'react';
import { ClientPageClient } from './ClientPageClient';
import { getClientById } from '../../lib/mockClients';

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

        if (res.ok) {
          const data: Client = await res.json();
          setClient(data);
          return;
        }
      } catch (err) {
        console.error('Failed to fetch client from API:', err);
      }

      // Fallback to local mock data (works even if MongoDB is down)
      const mock = getClientById(clientId);
      if (mock) {
        setClient({
          _id: mock.id,
          businessName: mock.businessName,
          jurisdiction: mock.jurisdiction,
          activePermits: mock.activePermits,
          status: mock.status as Client['status'],
          lastActivity: mock.lastActivity,
          completionRate: mock.completionRate,
        });
      } else {
        setClient(null);
      }
    };

    fetchClient();
  }, [clientId]);

  if (!clientId) {
    return <div className="flex h-screen items-center justify-center bg-page-bg text-foreground">Loading...</div>;
  }

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-page-bg text-foreground">Loading...</div>}>
      <ClientPageContent clientId={clientId} client={client} />
    </Suspense>
  );
}
