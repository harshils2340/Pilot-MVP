'use client';

import { useState } from 'react';
import WorkspaceDashboard from './components/WorkspaceDashboard';
import { PermitDiscovery } from './components/PermitDiscovery';
import { FormFilling } from './components/FormFilling';
import { RegulatoryMemory } from './components/RegulatoryMemory';
import { CollaborationView } from './components/CollaborationView';
import { StatusTracking } from './components/StatusTracking';
import { FileText, Search, History, Users, Trello, Home as HomeIcon } from 'lucide-react';

type Screen =
  | 'dashboard'
  | 'discovery'
  | 'form'
  | 'memory'
  | 'collaboration'
  | 'tracking';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedPermit, setSelectedPermit] = useState<string | null>(null);

  const navigation = [
    { id: 'dashboard' as Screen, label: 'Dashboard', icon: HomeIcon },
    { id: 'discovery' as Screen, label: 'Permit Discovery', icon: Search },
    { id: 'form' as Screen, label: 'Form Filling', icon: FileText },
    { id: 'memory' as Screen, label: 'Regulatory Memory', icon: History },
    { id: 'collaboration' as Screen, label: 'Collaboration', icon: Users },
    { id: 'tracking' as Screen, label: 'Status & Tracking', icon: Trello },
  ];

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <WorkspaceDashboard
            onSelectClient={(clientId: string) => {
              setSelectedClient(clientId);
              setCurrentScreen('tracking');
            }}
            onStartPermit={() => setCurrentScreen('discovery')}
          />
        );
      case 'discovery':
        return (
          <PermitDiscovery
            onSelectPermit={(permitId: string) => {
              setSelectedPermit(permitId);
              setCurrentScreen('form');
            }}
          />
        );
      case 'form':
        return <FormFilling permitId={selectedPermit ?? ''} />;
      case 'memory':
        return <RegulatoryMemory clientId={selectedClient ?? ''} />;
      case 'collaboration':
        return <CollaborationView permitId={selectedPermit ?? ''} />;
      case 'tracking':
        return (
          <StatusTracking
            clientId={selectedClient ?? ''}
            onEditPermit={(permitId: string) => {
              setSelectedPermit(permitId);
              setCurrentScreen('form');
            }}
          />
        );
      default:
        return <WorkspaceDashboard onSelectClient={() => {}} onStartPermit={() => {}} />;
    }
  };

  return (
    <div className="flex h-screen bg-neutral-50 text-neutral-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-neutral-200 flex items-center gap-3">
          <img src="/pilotLogo.png" alt="Pilot Logo" className="h-8 w-8" />
          <div>
            <h1 className="font-semibold text-lg">Pilot</h1>
            <p className="text-xs text-neutral-500">Compliance Platform</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentScreen(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-colors ${
                  currentScreen === item.id
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-neutral-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-medium">
            JD
          </div>
          <div>
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-neutral-500">Consultant</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{renderScreen()}</main>
    </div>
  );
}
