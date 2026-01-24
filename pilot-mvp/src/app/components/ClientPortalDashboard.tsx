'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, DollarSign, Home, AlertCircle, CheckCircle2, Clock, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useRouter } from 'next/navigation';

interface DocumentRequest {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  permitName?: string;
}

interface Invoice {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate?: string;
  description?: string;
}

interface RecentUpdate {
  id: string;
  type: 'document_requested' | 'document_approved' | 'invoice_sent' | 'status_update';
  title: string;
  description: string;
  date: string;
  status?: 'pending' | 'approved' | 'completed';
}

interface ClientPortalDashboardProps {
  clientId?: string;
  clientName?: string;
  onBack?: () => void;
}

export function ClientPortalDashboard({ clientId, clientName = 'Client', onBack }: ClientPortalDashboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<RecentUpdate[]>([]);
  const [projectStatus, setProjectStatus] = useState<'in_progress' | 'completed' | 'on_hold'>('in_progress');

  useEffect(() => {
    fetchDashboardData();
  }, [clientId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch document requests
      if (clientId) {
        try {
          const requestsRes = await fetch(`/api/documents/requests?clientId=${clientId}&status=pending`);
          if (requestsRes.ok) {
            const requestsData = await requestsRes.json();
            setDocumentRequests(Array.isArray(requestsData) ? requestsData : requestsData.requests || []);
          }
        } catch (error) {
          console.error('Error fetching document requests:', error);
        }

        // Fetch invoices
        try {
          const invoicesRes = await fetch(`/api/billing/invoices?clientId=${clientId}&status=pending`);
          if (invoicesRes.ok) {
            const invoicesData = await invoicesRes.json();
            setInvoices(Array.isArray(invoicesData) ? invoicesData : invoicesData.invoices || []);
          }
        } catch (error) {
          console.error('Error fetching invoices:', error);
        }
      }

      // Generate recent updates from documents and invoices
      const updates: RecentUpdate[] = [];
      
      documentRequests.slice(0, 3).forEach((req) => {
        updates.push({
          id: `update-${req.id}`,
          type: 'document_requested',
          title: 'Document requested',
          description: req.description || req.title,
          date: req.createdAt,
          status: 'pending',
        });
      });

      // Add mock recent updates if none exist
      if (updates.length === 0) {
        updates.push(
          {
            id: 'update-1',
            type: 'document_requested',
            title: 'Document requested',
            description: 'Proof of Insurance needed for Health Department permit',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
          },
          {
            id: 'update-2',
            type: 'document_approved',
            title: 'Document approved',
            description: 'Lease Agreement has been approved',
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'approved',
          }
        );
      }

      setRecentUpdates(updates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUpdateIcon = (type: RecentUpdate['type']) => {
    switch (type) {
      case 'document_requested':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'document_approved':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'invoice_sent':
        return <DollarSign className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-neutral-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const pendingDocumentsCount = documentRequests.filter(r => r.status === 'pending').length || 2;
  const pendingInvoicesCount = invoices.filter(i => i.status === 'pending').length || 1;
  const totalPendingAmount = invoices
    .filter(i => i.status === 'pending')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0) || 4500;

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

        {/* Back Navigation */}
        {onBack && (
          <div className="px-4 pt-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        )}

        {/* Client Info */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Client Portal</p>
          <p className="text-sm font-medium text-neutral-900 bg-blue-50 px-2 py-1 rounded">
            The Daily Grind
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <button
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-neutral-900 text-white transition-colors mb-1"
          >
            <Home className="w-5 h-5" />
            <span className="text-sm">Dashboard</span>
          </button>
          <button
            onClick={() => router.push(`/client-portal?clientId=${clientId}&tab=documents`)}
            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors mb-1"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              <span className="text-sm">Documents</span>
            </div>
            {pendingDocumentsCount > 0 && (
              <Badge className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingDocumentsCount}
              </Badge>
            )}
          </button>
          <button
            onClick={() => router.push(`/client-portal?clientId=${clientId}&tab=billing`)}
            className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-colors mb-1"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5" />
              <span className="text-sm">Invoices</span>
            </div>
            {pendingInvoicesCount > 0 && (
              <Badge className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendingInvoicesCount}
              </Badge>
            )}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Client Portal</h1>
            <p className="text-neutral-600">The Daily Grind</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-neutral-500">Loading dashboard...</div>
            </div>
          ) : (
            <>
              {/* Project Status Card */}
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Project Status</h2>
                <div className="bg-yellow-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-yellow-900 mb-1">In Progress</p>
                    <p className="text-sm text-yellow-800">Your consultant is preparing your permits</p>
                  </div>
                </div>
              </div>

              {/* Documents and Invoices Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Documents Needed Card */}
                <div className="bg-white border border-neutral-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-neutral-900">Documents Needed</h2>
                    <button
                      onClick={() => router.push(`/client-portal?clientId=${clientId}&tab=documents`)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="mb-4">
                    <p className="text-4xl font-bold text-orange-600 mb-2">
                      {pendingDocumentsCount}
                    </p>
                    <p className="text-sm text-neutral-600 mb-1">
                      documents pending
                    </p>
                    <p className="text-sm text-neutral-600">
                      Please upload these documents to keep your permits moving forward
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push(`/client-portal?clientId=${clientId}&tab=documents`)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </Button>
                </div>

                {/* Invoices Card */}
                <div className="bg-white border border-neutral-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-neutral-900">Invoices</h2>
                    <button
                      onClick={() => router.push(`/client-portal?clientId=${clientId}&tab=billing`)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="mb-4">
                    <p className="text-4xl font-bold text-neutral-900 mb-2">
                      ${totalPendingAmount.toLocaleString()}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {pendingInvoicesCount} pending invoice{pendingInvoicesCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push(`/client-portal?clientId=${clientId}&tab=billing`)}
                    variant="outline"
                    className="w-full border-neutral-300"
                  >
                    View Invoices
                  </Button>
                </div>
              </div>

              {/* Recent Updates */}
              <div className="bg-white border border-neutral-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Recent Updates</h2>
                <div className="space-y-4">
                  {recentUpdates.length === 0 ? (
                    <p className="text-neutral-500 text-center py-8">No recent updates</p>
                  ) : (
                    recentUpdates.map((update) => (
                      <div key={update.id} className="flex items-start gap-3 pb-4 border-b border-neutral-100 last:border-0 last:pb-0">
                        <div className="mt-1.5">
                          {getUpdateIcon(update.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900 mb-1">{update.title}</p>
                          <p className="text-sm text-neutral-600 mb-1">{update.description}</p>
                          <p className="text-xs text-neutral-500">{formatDate(update.date)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
