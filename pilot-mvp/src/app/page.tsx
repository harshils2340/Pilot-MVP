'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WorkspaceDashboard from './components/WorkspaceDashboard';
import { SignIn } from './components/SignIn';
import { SignUp } from './components/SignUp';
import { ClientOnboarding } from './components/ClientOnboarding';
import { LogOut } from 'lucide-react';

type AuthScreen = 'signin' | 'signup';

export default function MainDashboardPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('signin');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Load auth state from localStorage on mount (client-side only)
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const authStatus = localStorage.getItem('isAuthenticated');
      if (authStatus === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleSignIn = () => {
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('isAuthenticated', 'true');
    }
  };

  const handleSignUp = () => {
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('isAuthenticated', 'true');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowOnboarding(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('isAuthenticated');
    }
    router.push('/');
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

  // Show client onboarding if active
  if (showOnboarding) {
    return (
      <div className="flex h-screen bg-neutral-50">
        {/* Sidebar */}
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
          <div className="flex-1"></div>
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

        {/* Main Content - Onboarding */}
        <main className="flex-1 overflow-auto">
          <ClientOnboarding
            onComplete={(clientData) => {
              setShowOnboarding(false);
              // Navigate to the new client's workspace
              if (clientData._id) {
                router.push(`/clients/${clientData._id}`);
              } else {
                // Fallback: navigate using business name
                router.push(`/clients/${encodeURIComponent(clientData.businessName)}`);
              }
            }}
            onCancel={() => setShowOnboarding(false)}
          />
        </main>
      </div>
    );
  }

  // Show main dashboard
  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
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
        <div className="flex-1"></div>
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

      {/* Main Content - Dashboard */}
      <main className="flex-1 overflow-auto">
        <WorkspaceDashboard
          onSelectClient={(clientId: string) => {
            router.push(`/clients/${clientId}`);
          }}
          onNewClient={() => setShowOnboarding(true)}
        />
      </main>
    </div>
  );
}
