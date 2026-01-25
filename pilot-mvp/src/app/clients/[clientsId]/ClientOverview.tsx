







'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PermitDiscovery } from './PermitDiscovery';
import { FormFilling } from './FormFilling';
import { RegulatoryMemory } from './RegulatoryMemory';
import { CollaborationView } from './CollaborationView';
import { StatusTracking } from './StatusTracking';

type Tab = 'discovery' | 'form' | 'memory' | 'collaboration' | 'tracking';

interface Client {
  _id: string;
  businessName: string;
  jurisdiction: string;
  activePermits: number;
  status: 'draft' | 'submitted' | 'approved' | 'action-required';
  lastActivity: string;
  completionRate: number;
}

interface ClientOverviewProps {
  clientId?: string;        // Optional for new permit
  isNewPermit?: boolean;    // True if starting a new permit
}

export default function ClientOverview({
  clientId,
  isNewPermit = false,
}: ClientOverviewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('discovery');
  const [client, setClient] = useState<Client | null>(null);

  // Fetch client data dynamically only if we have a clientId and not new permit
  useEffect(() => {
    if (!clientId || isNewPermit) return;

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
  }, [clientId, isNewPermit]);

  // Heading text
  const heading = isNewPermit
    ? 'New Permit Discovery'
    : client?.businessName || 'Client Workspace';

  // Tabs to display
  const tabs: Tab[] = isNewPermit
    ? ['discovery'] // Only Discovery tab for new permits
    : ['discovery', 'form', 'memory', 'collaboration', 'tracking'];

  // Render active tab
  const renderTab = () => {
    const idForChild = clientId ?? undefined; // ✅ Pass undefined, not null
    switch (activeTab) {
      case 'discovery':
        return <PermitDiscovery clientId={idForChild} isNewPermit={isNewPermit} />;
      case 'form':
        return <FormFilling clientId={idForChild} />;
      case 'memory':
        return <RegulatoryMemory clientId={idForChild} />;
      case 'collaboration':
        return <CollaborationView clientId={idForChild} />;
      case 'tracking':
        return <StatusTracking clientId={idForChild} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Back to Dashboard */}
      <div className="sticky top-4 z-50">
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800 shadow"
        >
          &larr; Back to Dashboard
        </button>
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold mb-4">{heading}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 sticky top-16 bg-neutral-50 z-40 p-2 border-b border-neutral-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab
                ? 'bg-neutral-900 text-white'
                : 'bg-neutral-100 text-neutral-700'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Render active tab */}
      <div>{renderTab()}</div>
    </div>
  );
}
