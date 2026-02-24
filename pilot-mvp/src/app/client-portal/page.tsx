'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DocumentsView } from '../components/DocumentsView';
import { ClientBilling } from '../components/ClientBilling';
import { FileText, Upload, Inbox, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

type Tab = 'documents' | 'requests' | 'shared' | 'billing';

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
    const idFromUrl = searchParams.get('clientId');
    const nameFromUrl = searchParams.get('name');
    const requestIdFromUrl = searchParams.get('requestId');

    const applyClient = (cid: string, cname: string) => {
      setClientId(cid);
      setClientName(cname || 'Client');
      localStorage.setItem('clientId', cid);
      if (cname) localStorage.setItem('clientName', cname);
    };

    const fetchClientEmail = async (cid: string) => {
      try {
        const res = await fetch(`/api/clients/${encodeURIComponent(cid)}`);
        if (res.ok) {
          const client = await res.json();
          const email = (client.contactInfo as { email?: string } | undefined)?.email;
          const bizName = client.businessName || clientName;
          if (email) {
            setClientEmail(email);
            localStorage.setItem(`clientEmail_${cid}`, email);
          }
          if (bizName && !nameFromUrl) setClientName(bizName);
        }
      } catch {
        const stored = localStorage.getItem(`clientEmail_${cid}`);
        if (stored) setClientEmail(stored);
      }
    };

    const run = async () => {
      if (idFromUrl) {
        applyClient(idFromUrl, nameFromUrl || 'Client');
        const storedEmail = localStorage.getItem(`clientEmail_${idFromUrl}`);
        if (storedEmail) setClientEmail(storedEmail);
        else await fetchClientEmail(idFromUrl);
      } else if (requestIdFromUrl) {
        try {
          const res = await fetch(`/api/documents/requests?requestId=${encodeURIComponent(requestIdFromUrl)}`);
          if (res.ok) {
            const req = await res.json();
            const cid = req.clientId;
            const cname = req.clientName || 'Client';
            if (cid) {
              applyClient(cid, cname);
              const storedEmail = localStorage.getItem(`clientEmail_${cid}`);
              if (storedEmail) setClientEmail(storedEmail);
              else await fetchClientEmail(cid);
            }
          }
        } catch (e) {
          console.error('Failed to resolve request:', e);
        }
      } else {
        const storedId = localStorage.getItem('clientId');
        const storedName = localStorage.getItem('clientName') || 'Client';
        if (storedId) applyClient(storedId, storedName);
      }
      setLoading(false);
    };

    run();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Please use the invitation link provided by your consultant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-page-bg">
      {/* Sidebar */}
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
              <p className="text-muted-foreground text-xs">Client Portal</p>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your Account</p>
          <p className="text-sm font-medium text-foreground bg-muted px-2 py-1 rounded">
            {clientName}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <button
            onClick={() => setActiveTab('documents')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'documents'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="text-sm">Documents</span>
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'requests'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <Inbox className="w-5 h-5" />
            <span className="text-sm">Requests</span>
          </button>
          <button
            onClick={() => setActiveTab('shared')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 transition-colors ${
              activeTab === 'shared'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            <Upload className="w-5 h-5" />
            <span className="text-sm">Shared with Me</span>
          </button>
          {/* Billing tab hidden for client portal */}
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
        {/* Billing tab hidden for client portal */}
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
        const res = await fetch(`/api/documents/requests?clientId=${clientId}`);
        if (res.ok) {
          const data = await res.json();
          const apiRequests = Array.isArray(data) ? data : [];
          const localRequests = getLocalRequests(clientId);
          const seen = new Set(apiRequests.map((r: any) => r.id || r._id));
          const extra = localRequests.filter((r: any) => !seen.has(r.id || r._id));
          setRequests([...apiRequests, ...extra]);
        } else {
          setRequests(getLocalRequests(clientId));
        }
      } catch (error) {
        console.error('Failed to fetch requests:', error);
        setRequests(getLocalRequests(clientId));
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [clientId]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-muted-foreground">Loading requests...</div>
      </div>
    );
  }

  const pendingCount = requests.filter((r: any) => r.status === 'pending').length;
  const fulfilledCount = requests.filter((r: any) => r.status === 'fulfilled').length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Document Requests</h1>
        <p className="text-muted-foreground">
          {requests.length === 0
            ? 'Requests from your consultant'
            : `${requests.length} total • ${pendingCount} requested • ${fulfilledCount} sent`}
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Inbox className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
          <p>No pending requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <DocumentRequestCard key={request.id} request={request} clientId={clientId} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocumentRequestCard({ request, clientId }: { request: any; clientId: string }) {
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    const cid = request.clientId || clientId;
    if (!cid) {
      alert('Client ID is missing. Please refresh the page and try again.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSubmitting(true);
    try {
      const requestId = request.id || request._id;
      if (!requestId) {
        alert('Request ID is missing. Please refresh the page and try again.');
        setSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', cid);
      formData.append('folder', 'General'); // Default folder for requested documents
      formData.append('uploadedBy', JSON.stringify({
        userId: request.clientId,
        userName: 'Client',
        userEmail: '',
        isClient: true,
      }));
      formData.append('metadata', JSON.stringify({
        requestId: requestId,
        source: 'client',
        receivedVia: 'request',
      }));

      console.log('Uploading document for request:', requestId);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const newDoc = await res.json();
        console.log('Document uploaded successfully:', newDoc.id);
        
        // Mark request as fulfilled
        const fulfillRes = await fetch('/api/documents/requests/fulfill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: cid,
            documentId: newDoc.id,
            requestId: requestId,
          }),
        });

        const fulfillData = await fulfillRes.json().catch(() => ({}));
        console.log('Fulfill response:', fulfillData);

        if (fulfillRes.ok && fulfillData.modified > 0) {
          alert('Document uploaded successfully! The request has been marked as fulfilled.');
          window.location.reload();
        } else {
          console.error('Failed to fulfill request:', fulfillData);
          alert(`Document uploaded but failed to mark request as fulfilled: ${fulfillData.error || 'Unknown error'}. The document is still available in your Documents tab.`);
          window.location.reload();
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Upload failed:', errorData);
        alert(`Failed to upload file: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface border border-neutral-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">{request.title}</h3>
          <p className="text-sm text-muted-foreground">{request.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          request.status === 'pending' ? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground'
        }`}>
          {request.status}
        </span>
      </div>
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
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

      {request.status === 'pending' ? (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={submitting}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {submitting ? 'Uploading...' : 'Upload Document'}
          </button>
        </>
      ) : (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Request fulfilled
        </div>
      )}
    </div>
  );
}

function SharedDocumentsView({ clientId }: { clientId: string }) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await fetch(`/api/documents?clientId=${clientId}`);
        if (res.ok) {
          const data = await res.json();
          const docs = Array.isArray(data) ? data : [];
          setDocuments(docs);
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
        <div className="text-muted-foreground">Loading shared documents...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Shared Documents</h1>
        <p className="text-muted-foreground">Documents shared with you by your consultant</p>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Upload className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
          <p>No shared documents</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id || doc._id} className="bg-surface border border-neutral-200 rounded-lg p-4">
              <FileText className="w-8 h-8 text-neutral-400 mb-2" />
              <h3 className="font-medium text-foreground mb-1">{doc.name}</h3>
              <p className="text-xs text-muted-foreground mb-2">{doc.fileType?.toUpperCase() || 'FILE'}</p>
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
                className="text-sm text-primary hover:underline"
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
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <ClientPortalContent />
    </Suspense>
  );
}
