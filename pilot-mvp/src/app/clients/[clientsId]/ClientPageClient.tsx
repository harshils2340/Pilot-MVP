'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PermitDiscovery } from './PermitDiscovery';
import { FormFilling } from './FormFilling';
import { RegulatoryMemory } from './RegulatoryMemory';
import { CollaborationView } from './CollaborationView';
import { StatusTracking } from './StatusTracking';
import { FileText, Search, History, Users, Trello, ArrowLeft, LogOut } from 'lucide-react';

type Tab = 'tracking' | 'discovery' | 'form' | 'memory' | 'collaboration';

interface Client {
  _id: string;
  businessName: string;
  jurisdiction: string;
  activePermits: number;
  status: 'draft' | 'submitted' | 'approved' | 'action-required';
  lastActivity: string;
  completionRate: number;
}

interface ClientPageClientProps {
  clientId: string;
  client: Client | null;
}

export function ClientPageClient({ clientId, client }: ClientPageClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('tracking');

  const clientNavigation = [
    { id: 'tracking' as Tab, label: 'Status & Tracking', icon: Trello },
    { id: 'discovery' as Tab, label: 'Permit Discovery', icon: Search },
    { id: 'form' as Tab, label: 'Form Filling', icon: FileText },
    { id: 'memory' as Tab, label: 'Regulatory Memory', icon: History },
    { id: 'collaboration' as Tab, label: 'Collaboration', icon: Users },
  ];

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    router.push('/');
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'discovery':
        return <PermitDiscovery clientId={clientId} client={client} />;
      case 'form':
        return <FormFilling clientId={clientId} />;
      case 'memory':
        return <RegulatoryMemory clientId={clientId} />;
      case 'collaboration':
        return <CollaborationView clientId={clientId} />;
      case 'tracking':
        return <StatusTracking clientId={clientId} client={client} />;
    }
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        <div className="px-6 py-5 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <img 
              src="/pilotLogo.png" 
              alt="Pilot" 
              className="h-8 w-8"
            />
            <div>
              <h1 className="font-semibold text-neutral-900 text-lg">Pilot</h1>
              <p className="text-neutral-500 text-xs">Compliance Platform</p>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="p-4 border-b border-neutral-200">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Clients</span>
          </button>
        </div>

        {/* Client Name Display */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Current Client</p>
          <p className="text-sm font-medium text-neutral-900">{client?.businessName || clientId}</p>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-4">
          {clientNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-colors ${
                  activeTab === item.id
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-neutral-200">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-medium">
                JD
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">John Doe</p>
                <p className="text-xs text-neutral-500">Consultant</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{renderTab()}</main>
    </div>
  );
}
