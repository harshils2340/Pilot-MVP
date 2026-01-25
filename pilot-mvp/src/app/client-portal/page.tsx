'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DocumentsView } from '../components/DocumentsView';
import { ClientBilling } from '../components/ClientBilling';
import { FileText, Upload, Inbox, CheckCircle2, Clock, AlertCircle, DollarSign } from 'lucide-react';

type Tab = 'documents' | 'requests' | 'shared' | 'billing';

const MOCK_REQUESTS = [
  {
    id: 'req-1',
    title: 'Updated floor plan with sink dimensions',
    description: 'Please upload the revised floor plan showing 3-compartment sink dimensions.',
    status: 'pending',
    createdAt: '2026-01-12T12:00:00.000Z',
    expiresAt: '2026-02-05T12:00:00.000Z',
  },
  {
    id: 'req-2',
    title: 'Equipment schedule',
    description: 'Provide the updated equipment schedule for the plan review resubmission.',
    status: 'pending',
    createdAt: '2026-01-14T09:30:00.000Z',
  },
];

// No mock shared documents - will fetch real ones from API

const getLocalRequests = (clientId: string) => {
  try {
    const stored = JSON.parse(localStorage.getItem('pilotDocumentRequests') || '[]');
    return stored.filter((req: any) => req.clientId === clientId);
  } catch (error) {
    console.error('Failed to read local requests:', error);
    return [];
  }
};

function ClientPortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>('documents');
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientEmail, setClientEmail] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>('Client');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get client info from URL params or localStorage
    const id = searchParams.get('clientId') || localStorage.getItem('clientId');
    const email = searchParams.get('email') || localStorage.getItem('clientEmail');
    const name = searchParams.get('name') || localStorage.getItem('clientName') || 'Client';

    if (id) {
      setClientId(id);
      localStorage.setItem('clientId', id);
    }
    if (email) {
      setClientEmail(email);
      localStorage.setItem('clientEmail', email);
    }
    if (name) {
      setClientName(name);
      localStorage.setItem('clientName', name);
    }

    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-neutral-600">Loading...</div>
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Access Denied</h1>
          <p className="text-neutral-600">Please use the invitation link provided by your consultant.</p>
        </div>
      </div>
    );
  }

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
              <p className="text-neutral-500 text-xs">Client Portal</p>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Your Account</p>
          <p className="text-sm font-medium text-neutral-900 bg-blue-50 px-2 py-1 rounded">
            {clientName}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <button
            onClick={() => setActiveTab('documents')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'documents'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-sm">Documents</span>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'requests'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Inbox className="w-5 h-5" />
            <span className="text-sm">Requests</span>
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'shared'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Upload className="w-5 h-5" />
            <span className="text-sm">Shared with Me</span>
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'billing'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-sm">Billing</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {activeTab === 'documents' && (
          <DocumentsView 
            clientId={clientId} 
            clientEmail={clientEmail || undefined}
            viewMode="client"
          />
        )}
        {activeTab === 'requests' && (
          <DocumentRequestsView clientId={clientId} />
        )}
        {activeTab === 'shared' && (
          <SharedDocumentsView clientId={clientId} />
        )}
        {activeTab === 'billing' && (
          <ClientBilling
            clientId={clientId}
            clientName={clientName}
            viewMode="client"
          />
        )}
      </main>
    </div>
  );
}

// Document Requests View Component
function DocumentRequestsView({ clientId }: { clientId: string }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch(`/api/documents/requests?clientId=${clientId}&status=pending`);
        if (res.ok) {
          const data = await res.json();
          const localRequests = getLocalRequests(clientId);
          const merged = [...localRequests, ...data];
          setRequests(merged.length > 0 ? merged : MOCK_REQUESTS);
        } else {
          const localRequests = getLocalRequests(clientId);
          setRequests(localRequests.length > 0 ? localRequests : MOCK_REQUESTS);
        }
      } catch (error) {
        console.error('Failed to fetch requests:', error);
        const localRequests = getLocalRequests(clientId);
        setRequests(localRequests.length > 0 ? localRequests : MOCK_REQUESTS);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [clientId]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-neutral-600">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Document Requests</h1>
        <p className="text-neutral-600">Requests from your consultant</p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <Inbox className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
          <p>No pending requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <DocumentRequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentRequestCard({ request }: { request: any }) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // TODO: Open submission modal/form
    alert('Submission form coming soon');
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-1">{request.title}</h3>
          <p className="text-sm text-neutral-600">{request.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          request.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
        }`}>
          {request.status}
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>Requested {new Date(request.createdAt).toLocaleDateString()}</span>
        </div>
        {request.expiresAt && (
          <div className="flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            <span>Expires {new Date(request.expiresAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Response'}
      </button>
    </div>
  );
}

function SharedDocumentsView({ clientId }: { clientId: string }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await fetch(`/api/documents?clientId=${clientId}&status=shared`);
        if (res.ok) {
          const data = await res.json();
          setDocuments(Array.isArray(data) ? data : []);
        } else {
          setDocuments([]);
        }
      } catch (error) {
        console.error('Failed to fetch shared documents:', error);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [clientId]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-neutral-600">Loading shared documents...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Shared Documents</h1>
        <p className="text-neutral-600">Documents shared with you by your consultant</p>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          <Upload className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
          <p>No shared documents</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id || doc._id} className="bg-white border border-neutral-200 rounded-lg p-4">
              <FileText className="w-8 h-8 text-neutral-400 mb-2" />
              <h3 className="font-medium text-neutral-900 mb-1">{doc.name}</h3>
              <p className="text-xs text-neutral-500 mb-2">{doc.fileType?.toUpperCase() || 'FILE'}</p>
              <button
                onClick={() => {
                  if (doc.fileUrl?.startsWith('data:')) {
                    const newWindow = window.open();
                    if (newWindow) {
                      newWindow.document.write(`
                        <html>
                          <head><title>${doc.name}</title></head>
                          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;">
                            <iframe src="${doc.fileUrl}" style="width:100%;height:100%;border:none;"></iframe>
                          </body>
                        </html>
                      `);
                    }
                  } else {
                    window.open(doc.fileUrl, '_blank');
                  }
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                View Document
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



export default function ClientPortalPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="text-neutral-600">Loading...</div>
      </div>
    }>
      <ClientPortalContent />
    </Suspense>
  );
}
