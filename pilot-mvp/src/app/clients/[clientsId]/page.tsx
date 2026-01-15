// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { PermitDiscovery } from './PermitDiscovery';
// import { FormFilling } from './FormFilling';
// import { RegulatoryMemory } from './RegulatoryMemory';
// import { CollaborationView } from './CollaborationView';
// import { StatusTracking } from './StatusTracking';

// interface ClientPageProps {
//   params: {
//     clientId: string;
//   };
// }

// type Tab = 'discovery' | 'form' | 'memory' | 'collaboration' | 'tracking';

// interface Client {
//   _id: string;
//   businessName: string;
//   jurisdiction: string;
//   activePermits: number;
//   status: 'draft' | 'submitted' | 'approved' | 'action-required';
//   lastActivity: string;
//   completionRate: number;
// }

// export default function ClientOverviewPage({ params }: ClientPageProps) {
//   const { clientId } = params;
//   const router = useRouter();
//   const [activeTab, setActiveTab] = useState<Tab>('discovery');
//   const [client, setClient] = useState<Client | null>(null);
//   const [loading, setLoading] = useState(true);

//   // Fetch client data
//   useEffect(() => {
//     const fetchClient = async () => {
//       try {
//         const res = await fetch(`/api/clients/${clientId}`);
//         if (!res.ok) throw new Error('Failed to fetch client');
//         const data: Client = await res.json();
//         setClient(data);
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchClient();
//   }, [clientId]);

//   const renderTab = () => {
//     switch (activeTab) {
//       case 'discovery':
//         return <PermitDiscovery clientId={clientId} />;
//       case 'form':
//         return <FormFilling clientId={clientId} />;
//       case 'memory':
//         return <RegulatoryMemory clientId={clientId} />;
//       case 'collaboration':
//         return <CollaborationView clientId={clientId} />;
//       case 'tracking':
//         return <StatusTracking clientId={clientId} />;
//     }
//   };

//   if (loading) return <div className="p-8 text-neutral-600">Loading client...</div>;

//   return (
//     <div className="p-8 space-y-6">
//       {/* Sticky Back to Dashboard */}
//       <div className="sticky top-4 z-50">
//         <button
//           onClick={() => router.push('/')}
//           className="px-4 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800 shadow"
//         >
//           &larr; Back to Dashboard
//         </button>
//       </div>

//       {/* Client Workspace Heading */}
//       <h1 className="text-2xl font-bold mb-4">
//         {client ? `${client.businessName} Workspace` : 'Client Workspace'}
//       </h1>

//       {/* Tabs */}
//       <div className="flex gap-2 mb-6 sticky top-16 bg-neutral-50 z-40 p-2 border-b border-neutral-200">
//         {['discovery', 'form', 'memory', 'collaboration', 'tracking'].map((tab) => (
//           <button
//             key={tab}
//             onClick={() => setActiveTab(tab as Tab)}
//             className={`px-4 py-2 rounded ${
//               activeTab === tab ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700'
//             }`}
//           >
//             {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1')}
//           </button>
//         ))}
//       </div>

//       {/* Render active tab */}
//       <div>{renderTab()}</div>
//     </div>
//   );
// }





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
