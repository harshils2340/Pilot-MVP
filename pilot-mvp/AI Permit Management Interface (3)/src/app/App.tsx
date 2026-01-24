import { useState } from 'react';
import { WorkspaceDashboard } from './components/WorkspaceDashboard';
import { PermitDiscovery } from './components/PermitDiscovery';
import { PermitPlanTable } from './components/PermitPlanTable';
import { PermitInbox } from './components/PermitInbox';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { PermitManagement } from './components/PermitManagement';
import { PermitDetailView } from './components/PermitDetailView';
import { ClientView } from './components/ClientView';
import { ClientBilling } from './components/ClientBilling';
import { Users, Inbox, Archive, ArrowLeft, Settings, ListOrdered, Search, DollarSign } from 'lucide-react';
import pilotLogo from 'figma:asset/dc0f7d461ee354c6621e48294006c9f2e157c855.png';

type ClientScreen = 'discovery' | 'plan' | 'permit-detail' | 'billing';
type AuthScreen = 'signin' | 'signup';
type View = 'dashboard' | 'client' | 'permit-management' | 'inbox' | 'client-portal';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('signin');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ClientScreen>('plan');
  const [selectedPermit, setSelectedPermit] = useState<string | null>(null);

  const clientNavigation = [
    { id: 'plan' as ClientScreen, label: 'Permit Plan', icon: ListOrdered },
    { id: 'discovery' as ClientScreen, label: 'Permit Discovery', icon: Search },
    { id: 'billing' as ClientScreen, label: 'Billing', icon: DollarSign },
  ];

  const handleSignIn = () => {
    setIsAuthenticated(true);
  };

  const handleSignUp = () => {
    setIsAuthenticated(true);
  };

  const handleBackToDashboard = () => {
    setSelectedClient(null);
    setSelectedPermit(null);
    setCurrentView('dashboard');
  };

  const renderClientScreen = () => {
    switch (currentScreen) {
      case 'discovery':
        return (
          <PermitDiscovery
            onSelectPermit={(permitId) => {
              setSelectedPermit(permitId);
              setCurrentScreen('permit-detail');
            }}
          />
        );
      case 'plan':
        return (
          <PermitPlanTable
            clientId={selectedClient}
            onSelectPermit={(permitId) => {
              setSelectedPermit(permitId);
              setCurrentScreen('permit-detail');
            }}
          />
        );
      case 'permit-detail':
        return (
          <PermitDetailView
            permitId={selectedPermit || ''}
            onBack={() => setCurrentScreen('plan')}
          />
        );
      case 'billing':
        return (
          <ClientBilling
            clientId={selectedClient}
            onBack={() => setCurrentScreen('plan')}
          />
        );
      default:
        return <PermitPlanTable clientId={selectedClient} onSelectPermit={() => {}} />;
    }
  };

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    if (authScreen === 'signin') {
      return <SignIn onSignIn={handleSignIn} onSwitchToSignUp={() => setAuthScreen('signup')} />;
    } else {
      return <SignUp onSignUp={handleSignUp} onSwitchToSignIn={() => setAuthScreen('signin')} />;
    }
  }

  // Show Permit Management view
  if (currentView === 'permit-management') {
    return (
      <div className="flex h-screen bg-neutral-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
          <div className="px-6 py-5 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <img 
                src={pilotLogo} 
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
              onClick={handleBackToDashboard}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          <div className="flex-1"></div>

          <div className="p-4 border-t border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-medium">
                JD
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">John Doe</p>
                <p className="text-xs text-neutral-500">Consultant</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content - Permit Management */}
        <main className="flex-1 overflow-hidden">
          <PermitManagement />
        </main>
      </div>
    );
  }

  // Show dashboard if no client is selected
  if (currentView === 'dashboard') {
    return (
      <div className="flex h-screen bg-neutral-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
          <div className="px-6 py-5 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <img 
                src={pilotLogo} 
                alt="Pilot" 
                className="h-8 w-8"
              />
              <div>
                <h1 className="font-semibold text-neutral-900 text-lg">Pilot</h1>
                <p className="text-neutral-500 text-xs">Permit Management</p>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-neutral-900 text-white transition-colors"
            >
              <Users className="w-5 h-5" />
              <span className="text-sm">Clients</span>
            </button>
            <button
              onClick={() => setCurrentView('inbox')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <Inbox className="w-5 h-5" />
              <div className="flex items-center justify-between flex-1">
                <span className="text-sm">Permit Inbox</span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">4</span>
              </div>
            </button>
            <div className="pt-4 border-t border-neutral-200 mt-4">
              <button
                onClick={() => setCurrentView('permit-management')}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm">Permit Management</span>
              </button>
              <button
                onClick={() => setCurrentView('client-portal')}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors mt-1"
              >
                <Users className="w-5 h-5" />
                <span className="text-sm">Preview Client Portal</span>
              </button>
            </div>
          </nav>

          <div className="p-4 border-t border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-medium">
                JD
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">John Doe</p>
                <p className="text-xs text-neutral-500">Consultant</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content - Dashboard */}
        <main className="flex-1 overflow-auto">
          <WorkspaceDashboard
            onSelectClient={(clientId) => {
              setSelectedClient(clientId);
              setCurrentView('client');
              setCurrentScreen('plan');
            }}
            onStartPermit={() => {}}
          />
        </main>
      </div>
    );
  }

  // Show Client Portal Preview
  if (currentView === 'client-portal') {
    return <ClientView onBack={() => setCurrentView('dashboard')} />;
  }

  // Show Permit Inbox view
  if (currentView === 'inbox') {
    return (
      <div className="flex h-screen bg-neutral-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
          <div className="px-6 py-5 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <img 
                src={pilotLogo} 
                alt="Pilot" 
                className="h-8 w-8"
              />
              <div>
                <h1 className="font-semibold text-neutral-900 text-lg">Pilot</h1>
                <p className="text-neutral-500 text-xs">Permit Management</p>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              <Users className="w-5 h-5" />
              <span className="text-sm">Clients</span>
            </button>
            <button
              onClick={() => setCurrentView('inbox')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-neutral-900 text-white transition-colors"
            >
              <Inbox className="w-5 h-5" />
              <div className="flex items-center justify-between flex-1">
                <span className="text-sm">Permit Inbox</span>
                <span className="px-2 py-0.5 bg-red-500 text-white rounded text-xs font-medium">4</span>
              </div>
            </button>
            <div className="pt-4 border-t border-neutral-200 mt-4">
              <button
                onClick={() => setCurrentView('permit-management')}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm">Permit Management</span>
              </button>
            </div>
          </nav>

          <div className="p-4 border-t border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-medium">
                JD
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">John Doe</p>
                <p className="text-xs text-neutral-500">Consultant</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content - Permit Inbox */}
        <main className="flex-1 overflow-hidden">
          <PermitInbox
            onSelectPermit={(permitId, clientName) => {
              setSelectedClient(clientName);
              setSelectedPermit(permitId);
              setCurrentView('client');
              setCurrentScreen('permit-detail');
            }}
          />
        </main>
      </div>
    );
  }

  // Show client workspace with tabs
  if (currentView === 'client' && selectedClient) {
    const clientScreens = [
      { id: 'discovery' as ClientScreen, label: 'Permit Discovery', icon: Search },
      { id: 'plan' as ClientScreen, label: 'Permit Plan', icon: ListOrdered },
      { id: 'billing' as ClientScreen, label: 'Billing', icon: DollarSign },
    ];

    // Show permit detail without left sidebar
    if (currentScreen === 'permit-detail' && selectedPermit) {
      return (
        <div className="flex h-screen bg-white">
          <PermitDetailView 
            permitId={selectedPermit} 
            onBack={() => {
              setCurrentScreen('plan');
              setSelectedPermit(null);
            }}
          />
        </div>
      );
    }

    return (
      <div className="flex h-screen bg-white">
        {/* Left Sidebar - Client Navigation */}
        <aside className="w-64 border-r border-neutral-200 flex flex-col">
          {/* Logo and Back */}
          <div className="p-4 border-b border-neutral-200">
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setSelectedClient(null);
              }}
              className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-4 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Clients
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-neutral-900 truncate">The Daily Grind</h2>
                <p className="text-xs text-neutral-500">Coffee Shop</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 overflow-auto">
            <div className="space-y-1">
              {clientScreens.map((screen) => {
                const Icon = screen.icon;
                return (
                  <button
                    key={screen.id}
                    onClick={() => setCurrentScreen(screen.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentScreen === screen.id
                        ? 'bg-neutral-900 text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {screen.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Settings */}
          <div className="p-3 border-t border-neutral-200">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-100 transition-colors">
              <Settings className="w-4 h-4" />
              Client Settings
            </button>
          </div>
        </aside>

        {/* Main Content */}
        {currentScreen === 'discovery' && (
          <PermitDiscovery 
            clientId={selectedClient}
            clientName="The Daily Grind Coffee Shop"
          />
        )}
        {currentScreen === 'plan' && (
          <PermitPlanTable
            clientId={selectedClient}
            clientName="The Daily Grind Coffee Shop"
            onSelectPermit={(permitId) => {
              setSelectedPermit(permitId);
              setCurrentScreen('permit-detail');
            }}
          />
        )}
        {currentScreen === 'billing' && (
          <ClientBilling />
        )}
      </div>
    );
  }
}