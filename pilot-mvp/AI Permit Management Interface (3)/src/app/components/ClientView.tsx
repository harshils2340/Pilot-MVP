import { Upload, FileText, Download, CheckCircle, AlertCircle, ArrowLeft, DollarSign, Clock, Calendar, Home, Receipt, FolderOpen, HelpCircle, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface DocumentRequest {
  id: string;
  documentType: string;
  description: string;
  requestedAt: string;
  dueDate?: string;
  status: 'pending' | 'uploaded' | 'approved';
  permitName?: string;
  uploadedFile?: {
    name: string;
    size: string;
    uploadedAt: string;
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
  pdfUrl?: string;
}

interface ClientViewProps {
  onBack?: () => void;
}

type Tab = 'dashboard' | 'documents' | 'invoices';

export function ClientView({ onBack }: ClientViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [uploadingTo, setUploadingTo] = useState<string | null>(null);

  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([
    {
      id: 'req-1',
      documentType: 'Proof of Insurance',
      description: 'General liability insurance certificate with minimum $1M coverage',
      requestedAt: 'Jan 10, 2025',
      dueDate: 'Jan 20, 2025',
      status: 'pending',
      permitName: 'Health Department Plan Review',
    },
    {
      id: 'req-2',
      documentType: 'Updated Floor Plans',
      description: 'Revised floor plan showing 3-compartment sink dimensions',
      requestedAt: 'Jan 12, 2025',
      dueDate: 'Jan 18, 2025',
      status: 'pending',
      permitName: 'Health Department Plan Review',
    },
    {
      id: 'req-3',
      documentType: 'Lease Agreement',
      description: 'Signed lease agreement for 245 Valencia Street',
      requestedAt: 'Jan 8, 2025',
      status: 'approved',
      permitName: 'Business Operating Permit',
      uploadedFile: {
        name: 'lease_agreement_2024.pdf',
        size: '256 KB',
        uploadedAt: 'Jan 8 at 2:30 PM',
      },
    },
    {
      id: 'req-4',
      documentType: 'Certificate of Incorporation',
      description: 'State-issued certificate of incorporation',
      requestedAt: 'Jan 5, 2025',
      status: 'uploaded',
      permitName: 'Business Operating Permit',
      uploadedFile: {
        name: 'incorporation_certificate.pdf',
        size: '189 KB',
        uploadedAt: 'Jan 6 at 11:15 AM',
      },
    },
  ]);

  const [invoices] = useState<Invoice[]>([
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2025-001',
      date: 'Jan 1, 2025',
      dueDate: 'Jan 31, 2025',
      amount: 4500,
      status: 'pending',
      description: 'Permit consulting services - January 2025',
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-2024-012',
      date: 'Dec 1, 2024',
      dueDate: 'Dec 31, 2024',
      amount: 3800,
      status: 'paid',
      description: 'Initial permit discovery and planning',
    },
  ]);

  const projectStatus = 'in-progress'; // 'not-started' | 'in-progress' | 'submitted' | 'completed'

  const getProjectStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          label: 'All Permits Approved',
          description: 'Your permits have been approved and are ready',
          color: 'text-green-700',
          bg: 'bg-green-50',
          border: 'border-green-200',
        };
      case 'submitted':
        return {
          icon: <Clock className="w-5 h-5" />,
          label: 'Under Review',
          description: 'Your permits are being reviewed by the city',
          color: 'text-blue-700',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
        };
      case 'in-progress':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          label: 'In Progress',
          description: 'Your consultant is preparing your permits',
          color: 'text-amber-700',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
        };
      case 'not-started':
        return {
          icon: <Clock className="w-5 h-5" />,
          label: 'Getting Started',
          description: 'Your consultant is beginning the permit process',
          color: 'text-neutral-700',
          bg: 'bg-neutral-50',
          border: 'border-neutral-200',
        };
      default:
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          label: 'In Progress',
          description: 'Your consultant is working on your permits',
          color: 'text-neutral-700',
          bg: 'bg-neutral-50',
          border: 'border-neutral-200',
        };
    }
  };

  const getInvoiceStatusConfig = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return {
          label: 'Paid',
          className: 'bg-green-50 text-green-700 border-green-200',
        };
      case 'overdue':
        return {
          label: 'Overdue',
          className: 'bg-red-50 text-red-700 border-red-200',
        };
      default:
        return {
          label: 'Pending',
          className: 'bg-amber-50 text-amber-700 border-amber-200',
        };
    }
  };

  const handleFileUpload = (requestId: string) => {
    // Simulate file upload
    setUploadingTo(requestId);
    setTimeout(() => {
      setDocumentRequests(documentRequests.map(req =>
        req.id === requestId
          ? {
              ...req,
              status: 'uploaded' as const,
              uploadedFile: {
                name: 'uploaded_document.pdf',
                size: '324 KB',
                uploadedAt: new Date().toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                }),
              },
            }
          : req
      ));
      setUploadingTo(null);
    }, 1500);
  };

  const pendingRequests = documentRequests.filter(req => req.status === 'pending').length;
  const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
  const totalPending = invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0);
  const statusConfig = getProjectStatusConfig(projectStatus);

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: Home },
    { id: 'documents' as Tab, label: 'Documents', icon: FolderOpen, badge: pendingRequests },
    { id: 'invoices' as Tab, label: 'Invoices', icon: Receipt, badge: pendingInvoices },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Project Status */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-neutral-900 mb-4">Project Status</h2>
        <div className={`flex items-start gap-4 p-4 rounded-lg border-2 ${statusConfig.border} ${statusConfig.bg}`}>
          <div className={statusConfig.color}>
            {statusConfig.icon}
          </div>
          <div className="flex-1">
            <h3 className={`text-base font-semibold ${statusConfig.color} mb-1`}>
              {statusConfig.label}
            </h3>
            <p className="text-sm text-neutral-700">
              {statusConfig.description}
            </p>
          </div>
        </div>
      </div>

      {/* Action Items Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Documents Needed */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900">Documents Needed</h3>
            <button
              onClick={() => setActiveTab('documents')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          {pendingRequests > 0 ? (
            <>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-amber-600">{pendingRequests}</span>
                <span className="text-sm text-neutral-600">document{pendingRequests > 1 ? 's' : ''} pending</span>
              </div>
              <p className="text-xs text-neutral-500 mb-4">
                Please upload these documents to keep your permits moving forward
              </p>
              <button
                onClick={() => setActiveTab('documents')}
                className="w-full px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
              >
                Upload Documents
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
              <p className="text-sm text-neutral-600 text-center">
                All documents uploaded
              </p>
            </div>
          )}
        </div>

        {/* Invoices */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-neutral-900">Invoices</h3>
            <button
              onClick={() => setActiveTab('invoices')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          </div>
          {pendingInvoices > 0 ? (
            <>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-neutral-900">${totalPending.toLocaleString()}</span>
              </div>
              <p className="text-xs text-neutral-500 mb-4">
                {pendingInvoices} pending invoice{pendingInvoices > 1 ? 's' : ''}
              </p>
              <button
                onClick={() => setActiveTab('invoices')}
                className="w-full px-4 py-2 border border-neutral-300 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
              >
                View Invoices
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
              <p className="text-sm text-neutral-600 text-center">
                All invoices paid
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">Recent Updates</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3 pb-3 border-b border-neutral-100">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-2" />
            <div className="flex-1">
              <p className="text-sm text-neutral-900 font-medium">Document requested</p>
              <p className="text-xs text-neutral-600 mt-0.5">Proof of Insurance needed for Health Department permit</p>
              <p className="text-xs text-neutral-500 mt-1">2 days ago</p>
            </div>
          </div>
          <div className="flex items-start gap-3 pb-3 border-b border-neutral-100">
            <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
            <div className="flex-1">
              <p className="text-sm text-neutral-900 font-medium">Document approved</p>
              <p className="text-xs text-neutral-600 mt-0.5">Lease Agreement has been approved</p>
              <p className="text-xs text-neutral-500 mt-1">5 days ago</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
            <div className="flex-1">
              <p className="text-sm text-neutral-900 font-medium">Permit submitted</p>
              <p className="text-xs text-neutral-600 mt-0.5">Business Operating Permit submitted to city</p>
              <p className="text-xs text-neutral-500 mt-1">1 week ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      {/* Header with count */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Document Requests</h2>
            <p className="text-sm text-neutral-600 mt-1">
              {pendingRequests > 0 
                ? `${pendingRequests} document${pendingRequests > 1 ? 's' : ''} need your attention`
                : 'All requested documents have been uploaded'
              }
            </p>
          </div>
          {pendingRequests > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">
                {pendingRequests} Action{pendingRequests > 1 ? 's' : ''} Required
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Document list */}
      <div className="space-y-4">
        {documentRequests.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-lg p-12 text-center">
            <FileText className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-sm text-neutral-500">
              No documents requested yet
            </p>
          </div>
        ) : (
          documentRequests.map((request) => {
            const isUploading = uploadingTo === request.id;
            
            return (
              <div
                key={request.id}
                className={`bg-white border-2 rounded-lg p-6 transition-all ${
                  request.status === 'pending'
                    ? 'border-amber-300 shadow-sm'
                    : request.status === 'approved'
                    ? 'border-green-200'
                    : 'border-neutral-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-neutral-900">
                        {request.documentType}
                      </h4>
                      {request.status === 'approved' ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded text-xs font-medium text-green-700">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approved
                        </div>
                      ) : request.status === 'uploaded' ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700">
                          <Clock className="w-3.5 h-3.5" />
                          Under Review
                        </div>
                      ) : request.dueDate ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded text-xs font-medium text-amber-700">
                          <Calendar className="w-3.5 h-3.5" />
                          Due {request.dueDate}
                        </div>
                      ) : null}
                    </div>
                    <p className="text-sm text-neutral-600 mb-2">
                      {request.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      {request.permitName && (
                        <>
                          <span>For: {request.permitName}</span>
                          <span className="text-neutral-300">•</span>
                        </>
                      )}
                      <span>Requested {request.requestedAt}</span>
                    </div>
                  </div>
                </div>

                {request.uploadedFile ? (
                  <div className={`flex items-center justify-between p-4 border-2 rounded-lg ${
                    request.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        request.status === 'approved' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        <FileText className={`w-5 h-5 ${
                          request.status === 'approved' ? 'text-green-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">
                          {request.uploadedFile.name}
                        </p>
                        <p className="text-xs text-neutral-600">
                          {request.uploadedFile.size} • Uploaded {request.uploadedFile.uploadedAt}
                        </p>
                      </div>
                    </div>
                    <Download className="w-5 h-5 text-neutral-400 cursor-pointer hover:text-neutral-600" />
                  </div>
                ) : (
                  <button
                    onClick={() => handleFileUpload(request.id)}
                    disabled={isUploading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Upload className="w-5 h-5" />
                    {isUploading ? 'Uploading...' : 'Upload Document'}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Invoices</h2>
            <p className="text-sm text-neutral-600 mt-1">
              {pendingInvoices > 0 
                ? `${pendingInvoices} pending invoice${pendingInvoices > 1 ? 's' : ''} • $${totalPending.toLocaleString()} due`
                : 'All invoices are paid'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Invoice list */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Invoice
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {invoices.map((invoice) => {
              const statusConfig = getInvoiceStatusConfig(invoice.status);
              return (
                <tr key={invoice.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-neutral-900">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">Due {invoice.dueDate}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-neutral-700">{invoice.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-neutral-700">{invoice.date}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-neutral-900">
                      ${invoice.amount.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${statusConfig.className}`}>
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 hover:bg-neutral-100 rounded transition-colors" title="Download PDF">
                        <Download className="w-4 h-4 text-neutral-600" />
                      </button>
                      {invoice.status === 'pending' && (
                        <button className="px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded hover:bg-neutral-800 transition-colors">
                          Pay Now
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-neutral-200">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 mb-4 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          )}
          <h1 className="text-lg font-semibold text-neutral-900">Client Portal</h1>
          <p className="text-sm text-neutral-600 mt-1">The Daily Grind</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </div>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      activeTab === tab.id
                        ? 'bg-white text-neutral-900'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Help Section */}
        <div className="p-4 border-t border-neutral-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Need Help?</h3>
                <p className="text-xs text-blue-700">
                  Contact your consultant
                </p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-blue-900">Sarah Chen</span>
              </div>
              <a href="mailto:sarah@consultingfirm.com" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
                <ExternalLink className="w-3 h-3" />
                sarah@consultingfirm.com
              </a>
              <a href="tel:4155550123" className="block text-blue-600 hover:text-blue-700">
                (415) 555-0123
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'documents' && renderDocuments()}
          {activeTab === 'invoices' && renderInvoices()}
        </div>
      </main>
    </div>
  );
}
