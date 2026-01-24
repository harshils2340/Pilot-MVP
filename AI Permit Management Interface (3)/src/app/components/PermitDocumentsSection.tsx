import { FileText, Upload, Download, CheckCircle, Clock, Circle, User2, Building2, Mail, Link2, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface DocumentFile {
  id: string;
  name: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  source: 'client' | 'consultant' | 'government';
  status: 'requested' | 'received' | 'approved';
  type: string;
}

interface DocumentRequest {
  id: string;
  documentType: string;
  requestedFrom: string;
  requestedAt: string;
  status: 'pending' | 'uploaded' | 'approved';
  uploadLink?: string;
  uploadedFile?: DocumentFile;
}

export function PermitDocumentsSection() {
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const [documents, setDocuments] = useState<DocumentFile[]>([
    {
      id: 'doc-1',
      name: 'floor_plan_revised_v2.pdf',
      size: '1.8 MB',
      uploadedBy: 'Sarah Chen',
      uploadedAt: 'Jan 11 at 9:15 AM',
      source: 'consultant',
      status: 'approved',
      type: 'Floor Plan',
    },
    {
      id: 'doc-2',
      name: 'sink_specs_acme_industrial.pdf',
      size: '450 KB',
      uploadedBy: 'Sarah Chen',
      uploadedAt: 'Jan 11 at 10:22 AM',
      source: 'consultant',
      status: 'approved',
      type: 'Specifications',
    },
    {
      id: 'doc-3',
      name: 'business_license.pdf',
      size: '256 KB',
      uploadedBy: 'Maria Rodriguez (Client)',
      uploadedAt: 'Jan 8 at 2:30 PM',
      source: 'client',
      status: 'received',
      type: 'License',
    },
    {
      id: 'doc-4',
      name: 'rejection_notice_121824.pdf',
      size: '245 KB',
      uploadedBy: 'SF Dept. of Public Health',
      uploadedAt: 'Dec 18 at 10:34 AM',
      source: 'government',
      status: 'received',
      type: 'Notice',
    },
  ]);

  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([
    {
      id: 'req-1',
      documentType: 'Proof of Insurance',
      requestedFrom: 'maria@clientbusiness.com',
      requestedAt: 'Jan 10 at 3:45 PM',
      status: 'pending',
      uploadLink: 'https://pilot.app/upload/abc123xyz',
    },
    {
      id: 'req-2',
      documentType: 'Lease Agreement',
      requestedFrom: 'maria@clientbusiness.com',
      requestedAt: 'Jan 8 at 1:20 PM',
      status: 'uploaded',
      uploadedFile: {
        id: 'doc-3',
        name: 'business_license.pdf',
        size: '256 KB',
        uploadedBy: 'Maria Rodriguez (Client)',
        uploadedAt: 'Jan 8 at 2:30 PM',
        source: 'client',
        status: 'received',
        type: 'License',
      },
    },
  ]);

  const getSourceConfig = (source: DocumentFile['source']) => {
    switch (source) {
      case 'client':
        return {
          icon: <User2 className="w-4 h-4" />,
          label: 'Client',
          color: 'text-blue-700',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
        };
      case 'consultant':
        return {
          icon: <User2 className="w-4 h-4" />,
          label: 'Consultant',
          color: 'text-purple-700',
          bg: 'bg-purple-50',
          border: 'border-purple-200',
        };
      case 'government':
        return {
          icon: <Building2 className="w-4 h-4" />,
          label: 'Government',
          color: 'text-neutral-700',
          bg: 'bg-neutral-50',
          border: 'border-neutral-200',
        };
    }
  };

  const getStatusConfig = (status: DocumentFile['status']) => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Approved',
          color: 'text-green-700',
          bg: 'bg-green-50',
          border: 'border-green-200',
        };
      case 'received':
        return {
          icon: <Clock className="w-4 h-4" />,
          label: 'Received',
          color: 'text-blue-700',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
        };
      case 'requested':
        return {
          icon: <Circle className="w-4 h-4" />,
          label: 'Requested',
          color: 'text-neutral-600',
          bg: 'bg-neutral-50',
          border: 'border-neutral-200',
        };
    }
  };

  const getRequestStatusConfig = (status: DocumentRequest['status']) => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Approved',
          color: 'text-green-700',
          bg: 'bg-green-50',
          border: 'border-green-200',
        };
      case 'uploaded':
        return {
          icon: <Clock className="w-4 h-4" />,
          label: 'Uploaded',
          color: 'text-blue-700',
          bg: 'bg-blue-50',
          border: 'border-blue-200',
        };
      case 'pending':
        return {
          icon: <Mail className="w-4 h-4" />,
          label: 'Waiting for Upload',
          color: 'text-amber-700',
          bg: 'bg-amber-50',
          border: 'border-amber-200',
        };
    }
  };

  const handleRequestDocument = () => {
    if (!selectedDocType || !clientEmail) return;
    
    const newRequest: DocumentRequest = {
      id: `req-${documentRequests.length + 1}`,
      documentType: selectedDocType,
      requestedFrom: clientEmail,
      requestedAt: new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit' 
      }),
      status: 'pending',
      uploadLink: `https://pilot.app/upload/${Math.random().toString(36).substr(2, 9)}`,
    };

    setDocumentRequests([newRequest, ...documentRequests]);
    setShowRequestDialog(false);
    setSelectedDocType('');
    setClientEmail('');
  };

  const copyUploadLink = (link: string) => {
    navigator.clipboard.writeText(link);
  };

  // Group documents by source
  const clientDocs = documents.filter(d => d.source === 'client');
  const consultantDocs = documents.filter(d => d.source === 'consultant');
  const governmentDocs = documents.filter(d => d.source === 'government');

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="bg-white border border-neutral-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm font-semibold text-neutral-900">
                {documents.length} documents attached to this permit
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {clientDocs.length} from client • {consultantDocs.length} from team • {governmentDocs.length} from government
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowRequestDialog(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-neutral-300 text-neutral-900 text-sm font-medium rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Request from Client
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors">
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          </div>
        </div>
      </div>

      {/* Document Requests */}
      {documentRequests.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
            <h3 className="text-sm font-semibold text-neutral-900">Document Requests</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {documentRequests.filter(r => r.status === 'pending').length} pending • {documentRequests.filter(r => r.status === 'uploaded').length} uploaded
            </p>
          </div>
          <div className="divide-y divide-neutral-200">
            {documentRequests.map((request) => {
              const statusConfig = getRequestStatusConfig(request.status);
              
              return (
                <div key={request.id} className="p-4 hover:bg-neutral-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-neutral-900">{request.documentType}</h4>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-600 mb-2">
                        <span>Requested from {request.requestedFrom}</span>
                        <span className="text-neutral-400">•</span>
                        <span>{request.requestedAt}</span>
                      </div>
                      
                      {request.status === 'pending' && request.uploadLink && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded text-xs font-mono text-neutral-600 truncate">
                            {request.uploadLink}
                          </div>
                          <button
                            onClick={() => copyUploadLink(request.uploadLink!)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 text-white text-xs font-medium rounded hover:bg-neutral-800 transition-colors flex-shrink-0"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            Copy Link
                          </button>
                        </div>
                      )}

                      {request.uploadedFile && (
                        <div className="mt-2 flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{request.uploadedFile.name}</p>
                              <p className="text-xs text-neutral-500">
                                {request.uploadedFile.uploadedBy} • {request.uploadedFile.uploadedAt}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-neutral-500">{request.uploadedFile.size}</span>
                            <Download className="w-4 h-4 text-neutral-400 cursor-pointer hover:text-neutral-600" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Documents */}
      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
          <h3 className="text-sm font-semibold text-neutral-900">All Documents</h3>
          <p className="text-xs text-neutral-500 mt-0.5">Complete document history for this permit</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Document</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Uploaded By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide">Size</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {documents.map((doc) => {
                const sourceConfig = getSourceConfig(doc.source);
                const statusConfig = getStatusConfig(doc.status);
                
                return (
                  <tr key={doc.id} className="hover:bg-neutral-50 transition-colors group">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-neutral-400" />
                        <span className="text-sm font-medium text-neutral-900">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${sourceConfig.bg} ${sourceConfig.color} ${sourceConfig.border} border`}>
                        {sourceConfig.icon}
                        {sourceConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}>
                        {statusConfig.icon}
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-neutral-600">{doc.uploadedBy}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-neutral-600">{doc.uploadedAt}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-sm text-neutral-500">{doc.size}</span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 hover:bg-neutral-100 rounded transition-colors">
                          <Download className="w-4 h-4 text-neutral-600" />
                        </button>
                        <button className="p-1.5 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Document Dialog */}
      {showRequestDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h3 className="text-lg font-semibold text-neutral-900">Request Document from Client</h3>
              <p className="text-sm text-neutral-500 mt-1">
                Client will receive an email with a secure upload link
              </p>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Document Type
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                >
                  <option value="">Select document type...</option>
                  <option value="Proof of Insurance">Proof of Insurance</option>
                  <option value="Lease Agreement">Lease Agreement</option>
                  <option value="Business License">Business License</option>
                  <option value="Certificate of Incorporation">Certificate of Incorporation</option>
                  <option value="Financial Statements">Financial Statements</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Client Email
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowRequestDialog(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestDocument}
                disabled={!selectedDocType || !clientEmail}
                className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}