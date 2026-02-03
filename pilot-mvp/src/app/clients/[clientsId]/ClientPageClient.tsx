'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { EnhancedPermitPlan } from '../../components/EnhancedPermitPlan';
import { PermitDiscovery } from '../../components/PermitDiscovery';
import { PermitDetailView } from '../../components/PermitDetailView';
import { ClientBilling } from '../../components/ClientBilling';
import { EnhancedDocumentsView } from '../../components/EnhancedDocumentsView';
import { InviteClientModal } from '../../components/InviteClientModal';
import { ListOrdered, Search, ArrowLeft, LogOut, DollarSign, FileText, UserPlus } from 'lucide-react';

type Tab = 'plan' | 'discovery' | 'permit-detail' | 'billing' | 'documents';

interface Client {
  _id: string;
  businessName: string;
  jurisdiction: string;
  activePermits: number;
  status: 'draft' | 'submitted' | 'approved' | 'action-required';
  lastActivity: string;
  completionRate: number;
  contactInfo?: {
    email?: string;
    name?: string;
  };
}

interface ClientPageClientProps {
  clientId: string;
  client: Client | null;
}

export function ClientPageClient({ clientId, client }: ClientPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const [selectedPermit, setSelectedPermit] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Sync tab with URL query params on mount and when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab') as Tab | null;
    if (tab && ['plan', 'discovery', 'permit-detail', 'billing', 'documents'].includes(tab)) {
      setActiveTab(tab);
    }
    const permitId = searchParams.get('permit');
    if (permitId) {
      setSelectedPermit(permitId);
      if (!tab) {
        setActiveTab('permit-detail');
      }
    } else if (!tab) {
      // Default to 'plan' if no tab in URL
      setActiveTab('plan');
    }
  }, [searchParams]);

  const clientNavigation = [
    { id: 'plan' as Tab, label: 'Permit Plan', icon: ListOrdered },
    { id: 'discovery' as Tab, label: 'Permit Discovery', icon: Search },
    { id: 'documents' as Tab, label: 'Documents', icon: FileText },
    { id: 'billing' as Tab, label: 'Billing', icon: DollarSign },
  ];

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    router.push('/');
  };

  const handleTabChange = (tab: Tab) => {
    if (tab === 'plan') {
      setSelectedPermit(null);
      setActiveTab('plan');
      router.push(`/clients/${clientId}?tab=plan`);
    } else {
      if (tab !== 'permit-detail') {
        setSelectedPermit(null);
      }
      setActiveTab(tab);
      router.push(`/clients/${clientId}?tab=${tab}`);
    }
  };

  const handlePermitSelect = (permitId: string) => {
    setSelectedPermit(permitId);
    setActiveTab('permit-detail');
    router.push(`/clients/${clientId}?tab=permit-detail&permit=${permitId}`);
  };

  const handleBackToPlan = () => {
    setSelectedPermit(null);
    setActiveTab('plan');
    router.push(`/clients/${clientId}?tab=plan`);
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'discovery':
        return (
          <PermitDiscovery
            clientId={clientId}
            clientName={client?.businessName || 'Client'}
            onAddPermits={(permits) => {
              // Handle adding permits - switch back to plan view
              console.log('Adding permits:', permits);
              setActiveTab('plan');
            }}
          />
        );
          case 'plan':
            return (
              <EnhancedPermitPlan
                clientId={clientId}
                clientName={client?.businessName || 'Client'}
                onSelectPermit={handlePermitSelect}
              />
            );
      case 'permit-detail':
        return (
          <PermitDetailView
            permitId={selectedPermit || ''}
            onBack={handleBackToPlan}
          />
        );
      case 'billing':
        return (
          <ClientBilling
            clientId={clientId}
            clientName={client?.businessName || 'Client'}
          />
        );
      case 'documents':
        return (
          <EnhancedDocumentsView
            clientId={clientId}
            consultantId={clientId} // TODO: Get actual consultant ID from auth
            clientName={client?.businessName || 'Client'}
            clientEmail={client?.contactInfo?.email}
            consultantName="Consultant" // TODO: Get from auth
            viewMode="consultant"
          />
        );
          default:
            return (
              <EnhancedPermitPlan
                clientId={clientId}
                clientName={client?.businessName || 'Client'}
                onSelectPermit={handlePermitSelect}
              />
            );
    }
  };

  // When viewing permit detail, hide the left sidebar
  if (activeTab === 'permit-detail') {
    return (
      <div className="h-screen bg-page-bg">
        <PermitDetailView
          permitId={selectedPermit || ''}
          onBack={handleBackToPlan}
          clientName={client?.businessName}
        />
        {/* Invite Client Modal */}
        {showInviteModal && (
          <InviteClientModal
            clientId={clientId}
            clientName={client?.businessName || 'Client'}
            clientEmail={client?.contactInfo?.email}
            onClose={() => setShowInviteModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-page-bg">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-surface border-r border-surface-border flex flex-col">
        <div className="px-6 py-5 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <img 
              src="/file.svg" 
              alt="Pilot" 
              className="h-8 w-8"
            />
            <div>
              <h1 className="font-semibold text-foreground text-lg">Pilot</h1>
              <p className="text-muted-foreground text-xs">Compliance Platform</p>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="p-4 border-b border-surface-border">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Clients</span>
          </button>
        </div>

        {/* Client Name Display */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Client</p>
          <p className="text-sm font-medium text-foreground bg-primary/10 px-2 py-1 rounded mb-2">
            {client?.businessName || 'Loading...'}
          </p>
          <button
            onClick={() => setShowInviteModal(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite Client
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-4">
          {clientNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-surface-border">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-foreground">
                JD
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">John Doe</p>
                <p className="text-xs text-muted-foreground">Consultant</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-page-bg">{renderTab()}</main>

      {/* Invite Client Modal */}
      {showInviteModal && (
        <InviteClientModal
          clientId={clientId}
          clientName={client?.businessName || 'Client'}
          clientEmail={client?.contactInfo?.email}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}
