'use client';

// Trigger Vercel deployment

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WorkspaceDashboard } from './components/WorkspaceDashboard';
import { PermitDiscovery } from './components/PermitDiscovery';
import { PermitPlan } from './components/PermitPlan';
import { PermitInbox } from './components/PermitInbox';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { PermitManagement } from './components/PermitManagement';
import { PermitDetailView } from './components/PermitDetailView';
import { ClientOnboarding } from './components/ClientOnboarding';
import { Users, Inbox, Archive, ArrowLeft, Settings, ListOrdered, Search } from 'lucide-react';

type ClientScreen = 'discovery' | 'plan' | 'permit-detail';
type AuthScreen = 'signin' | 'signup';
type View = 'dashboard' | 'client' | 'permit-management' | 'inbox' | 'add-client';

export default function App() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('signin');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<ClientScreen>('plan');
  const [selectedPermit, setSelectedPermit] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showClientOnboarding, setShowClientOnboarding] = useState(false);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  // Load auth state from localStorage and URL params on mount
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      // Check URL params for OAuth callback
      const params = new URLSearchParams(window.location.search);
      if (params.get('auth') === 'success') {
        const email = params.get('email');
        const name = params.get('name');
        if (email) {
          setUserEmail(email);
          setUserName(name ? decodeURIComponent(name) : email);
          setIsAuthenticated(true);
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userEmail', email);
          localStorage.setItem('userName', name ? decodeURIComponent(name) : email);
          // Clean up URL
          window.history.replaceState({}, '', '/');
        }
      } else {
        // Check localStorage for existing session
        const authStatus = localStorage.getItem('isAuthenticated');
        const storedEmail = localStorage.getItem('userEmail');
        const storedName = localStorage.getItem('userName');
        if (authStatus === 'true' && storedEmail) {
          setIsAuthenticated(true);
          setUserEmail(storedEmail);
          setUserName(storedName);
        }
      }
    }
  }, []);

  const clientNavigation = [
    { id: 'plan' as ClientScreen, label: 'Permit Plan', icon: ListOrdered },
    { id: 'discovery' as ClientScreen, label: 'Permit Discovery', icon: Search },
  ];

  const handleSignIn = (email: string, name: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    setUserName(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userName', name);
    }
  };

  const handleSignUp = () => {
    // Sign up also uses Google OAuth
    handleSignIn('', '');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserName(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
    }
  };

  const handleBackToDashboard = () => {
    setSelectedClient(null);
    setSelectedPermit(null);
    setCurrentView('dashboard');
    // Don't use router.push to avoid page reload - use state management
  };

  const renderClientScreen = () => {
    switch (currentScreen) {
      case 'discovery':
        return (
          <PermitDiscovery
            clientId={selectedClient || ''}
            clientName={selectedClient || 'Client'}
            onAddPermits={(permits) => {
              // Handle adding permits
              console.log('Adding permits:', permits);
              setCurrentScreen('plan');
            }}
          />
        );
      case 'plan':
        return (
          <PermitPlan
            clientId={selectedClient}
            clientName={selectedClient || 'Client'}
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
      default:
        return <PermitPlan clientId={selectedClient} clientName={selectedClient || 'Client'} onSelectPermit={() => {}} />;
    }
  };

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

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
                src="/file.svg" 
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
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">{userName || 'User'}</p>
                <p className="text-xs text-neutral-500">{userEmail || 'user@example.com'}</p>
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

  // Show Permit Inbox view
  if (currentView === 'inbox') {
    return (
      <div className="flex h-screen bg-neutral-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
          <div className="px-6 py-5 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <img 
                src="/file.svg" 
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
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">{userName || 'User'}</p>
                <p className="text-xs text-neutral-500">{userEmail || 'user@example.com'}</p>
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

  // Show client onboarding if triggered
  if (showClientOnboarding) {
    return (
      <div className="flex h-screen bg-neutral-50">
        <ClientOnboarding
          onComplete={(clientData) => {
            // Client created successfully
            setShowClientOnboarding(false);
            if (clientData._id) {
              // Navigate to the new client's page
              router.push(`/clients/${clientData._id}`);
            } else {
              // Refresh the dashboard to show new client
              setCurrentView('dashboard');
            }
          }}
          onCancel={() => {
            setShowClientOnboarding(false);
          }}
        />
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
                src="/file.svg" 
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
            </div>
          </nav>

          <div className="p-4 border-t border-neutral-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-medium">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">{userName || 'User'}</p>
                <p className="text-xs text-neutral-500">{userEmail || 'user@example.com'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </aside>

        {/* Main Content - Dashboard */}
        <main className="flex-1 overflow-auto">
          <WorkspaceDashboard
            onStartPermit={() => {
              setShowClientOnboarding(true);
            }}
          />
        </main>
      </div>
    );
  }

  // Show client workspace with tabs
  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        <div className="px-6 py-5 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <img 
              src="/file.svg" 
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
            <span>Back to Clients</span>
          </button>
        </div>

        {/* Client Name Display */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Current Client</p>
          <p className="text-sm font-medium text-neutral-900">{selectedClient}</p>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-4">
          {clientNavigation.map((item) => {
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
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-medium">
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900">{userName || 'User'}</p>
              <p className="text-xs text-neutral-500">{userEmail || 'user@example.com'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{renderClientScreen()}</main>
    </div>
  );
}
