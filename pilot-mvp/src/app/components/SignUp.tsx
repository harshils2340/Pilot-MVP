'use client';

import { useState } from 'react';

interface SignUpProps {
  onSignUp: () => void;
  onSwitchToSignIn: () => void;
}

export function SignUp({ onSignUp, onSwitchToSignIn }: SignUpProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignUp();
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/file.svg" alt="Pilot" className="h-10 w-10" />
            <h1 className="text-2xl font-semibold text-neutral-900">Pilot</h1>
          </div>
          <p className="text-neutral-600">Compliance Platform for Consultants</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white rounded-lg border border-neutral-200 p-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">Create your account</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Company name
              </label>
              <input
                type="text"
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                placeholder="Acme Consulting"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                placeholder="••••••••"
                required
              />
              <p className="text-xs text-neutral-500 mt-1.5">Must be at least 8 characters</p>
            </div>

            <div className="flex items-start">
              <input type="checkbox" className="w-4 h-4 border-neutral-300 rounded mt-0.5" required />
              <label className="ml-2 text-sm text-neutral-600">
                I agree to the{' '}
                <button type="button" className="text-neutral-900 hover:underline">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button type="button" className="text-neutral-900 hover:underline">
                  Privacy Policy
                </button>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-neutral-900 text-white py-2.5 rounded-lg hover:bg-neutral-800 transition-colors font-medium"
            >
              Create account
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Already have an account?{' '}
              <button
                onClick={onSwitchToSignIn}
                className="text-neutral-900 font-medium hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-500 mt-6">
          © 2026 Pilot. Built for compliance professionals.
        </p>
      </div>
    </div>
  );
}

