'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Construction } from 'lucide-react';

export default function LeadDetailPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push('/'), 4000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page-bg px-4">
      <div className="text-center max-w-md">
        <Construction className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Leads is Coming Soon</h2>
        <p className="text-muted-foreground mb-6">
          Our lead wizards are still in training. We&apos;re cooking up something great — check back soon!
        </p>
        <p className="text-xs text-muted-foreground/60 mb-4">Redirecting you to the dashboard...</p>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-sky-600 hover:underline"
        >
          Go to Dashboard now
        </button>
      </div>
    </div>
  );
}
