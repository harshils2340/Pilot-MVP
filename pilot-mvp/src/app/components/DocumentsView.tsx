'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, Upload, Folder, FolderOpen, Search, MoreVertical, 
  Share2, Download, Trash2, Calendar, User, 
  CheckCircle2, Plus, X, Loader2, Send, ChevronRight, ChevronDown, File
} from 'lucide-react';
import { RequestDocumentModal } from './RequestDocumentModal';

interface Document {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  workspace: string;
  folder?: string;
  tags: string[];
  status: 'draft' | 'shared' | 'signed' | 'archived';
  uploadedBy: {
    userName: string;
    userEmail: string;
    isClient: boolean;
  };
  metadata?: {
    permitId?: string;
    permitName?: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface DocumentsViewProps {
  clientId: string;
  consultantId?: string;
  clientEmail?: string;
  clientName?: string;
  consultantName?: string;
  viewMode?: 'consultant' | 'client';
}

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
}

const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'doc-1',
    name: 'Health Dept Plan Review - Revision Notes',
    fileName: 'plan_review_notes.pdf',
    fileUrl: '/file.svg',
    fileType: 'pdf',
    fileSize: 245000,
    workspace: 'permits',
    folder: 'Permits/City Feedback',
    tags: ['needs-review', 'urgent'],
    status: 'shared',
    uploadedBy: {
      userName: 'Sarah Chen',
      userEmail: 'sarah@pilot.com',
      isClient: false,
    },
    metadata: {
      permitName: 'Health Department Plan Review',
      description: 'City feedback and required revisions summary.',
    },
    createdAt: '2026-01-10T10:15:00.000Z',
    updatedAt: '2026-01-10T10:15:00.000Z',
  },
  {
    id: 'doc-2',
    name: 'Sink Specs - Manufacturer Sheet',
    fileName: 'sink_specs.pdf',
    fileUrl: '/file.svg',
    fileType: 'pdf',
    fileSize: 132000,
    workspace: 'permits',
    folder: 'Permits/Plans',
    tags: ['equipment'],
    status: 'draft',
    uploadedBy: {
      userName: 'Client',
      userEmail: 'client@example.com',
      isClient: true,
    },
    metadata: {
      description: 'Manufacturer specs for 3-compartment sink.',
    },
    createdAt: '2026-01-12T08:30:00.000Z',
    updatedAt: '2026-01-12T08:30:00.000Z',
  },
  {
    id: 'doc-3',
    name: 'Signed Engagement Letter',
    fileName: 'engagement_letter.pdf',
    fileUrl: '/file.svg',
    fileType: 'pdf',
    fileSize: 98000,
    workspace: 'contracts',
    folder: 'Contracts/Engagement',
    tags: ['signed'],
    status: 'signed',
    uploadedBy: {
      userName: 'Michael Park',
      userEmail: 'michael@pilot.com',
      isClient: false,
    },
    metadata: {
      description: 'Signed engagement letter for consulting services.',
    },
    createdAt: '2026-01-08T15:45:00.000Z',
    updatedAt: '2026-01-08T15:45:00.000Z',
  },
];

// Folder structure - simple nested tree
const FOLDER_STRUCTURE: FolderNode[] = [
  {
    name: 'General',
    path: 'General',
    children: [
      { name: 'Onboarding', path: 'General/Onboarding', children: [] },
      { name: 'Brand Assets', path: 'General/Brand Assets', children: [] },
    ],
  },
  {
    name: 'Permits',
    path: 'Permits',
    children: [
      { name: 'Applications', path: 'Permits/Applications', children: [] },
      { name: 'Plans', path: 'Permits/Plans', children: [] },
      { name: 'City Feedback', path: 'Permits/City Feedback', children: [] },
    ],
  },
  {
    name: 'Contracts',
    path: 'Contracts',
    children: [
      { name: 'Engagement', path: 'Contracts/Engagement', children: [] },
      { name: 'Amendments', path: 'Contracts/Amendments', children: [] },
    ],
  },
  {
    name: 'Invoices',
    path: 'Invoices',
    children: [],
  },
];

// Tag colors like GitHub labels
const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'urgent': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  'needs-review': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  'approved': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  'signed': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  'draft': { bg: 'bg-neutral-100', text: 'text-neutral-600', border: 'border-neutral-200' },
  'equipment': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  'default': { bg: 'bg-neutral-100', text: 'text-neutral-600', border: 'border-neutral-200' },
};

function getTagColor(tag: string) {
  return TAG_COLORS[tag.toLowerCase()] || TAG_COLORS['default'];
}

export function DocumentsView({ 
  clientId, 
  consultantId, 
  clientEmail,
  clientName,
  consultantName,
  viewMode = 'consultant' 
}: DocumentsViewProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['General', 'Permits', 'Contracts']));
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clientInfo, setClientInfo] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetchDocuments();
    if (viewMode === 'consultant' && clientId) {
      fetchClientInfo();
    }
  }, [clientId, consultantId, viewMode]);

  const fetchClientInfo = async () => {
    try {
      const res = await fetch(`/api/clients/${encodeURIComponent(clientId)}`);
      if (res.ok) {
        const client = await res.json();
        setClientInfo({
          name: client.businessName || clientName || 'Client',
          email: client.contactInfo?.email || clientEmail || '',
        });
      } else {
        setClientInfo({
          name: clientName || 'Client',
          email: clientEmail || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch client info:', error);
      setClientInfo({
        name: clientName || 'Client',
        email: clientEmail || '',
      });
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ clientId });
      if (consultantId) params.append('consultantId', consultantId);

      const res = await fetch(`/api/documents?${params}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.documents || [];
        setDocuments(list.length > 0 ? list : MOCK_DOCUMENTS);
      } else {
        setDocuments(MOCK_DOCUMENTS);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setDocuments(MOCK_DOCUMENTS);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', clientId);
      if (consultantId) formData.append('consultantId', consultantId);
      formData.append('folder', selectedPath || 'General');
      formData.append('uploadedBy', JSON.stringify({
        userId: consultantId || clientId,
        userName: 'User',
        userEmail: clientEmail || '',
        isClient: viewMode === 'client',
      }));

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const newDoc = await res.json();
        setDocuments([newDoc, ...documents]);
        setShowUploadModal(false);
      } else {
        alert('Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesPath = !selectedPath || doc.folder?.startsWith(selectedPath);
    const matchesSearch = !searchQuery || 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.metadata?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPath && matchesSearch;
  });

  const getDocumentCountForPath = (path: string) => {
    return documents.filter(doc => doc.folder?.startsWith(path)).length;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Recursive folder tree component
  const FolderTree = ({ nodes, depth = 0 }: { nodes: FolderNode[]; depth?: number }) => {
    return (
      <div className={depth > 0 ? 'ml-4' : ''}>
        {nodes.map((node) => {
          const isExpanded = expandedFolders.has(node.path);
          const isSelected = selectedPath === node.path;
          const hasChildren = node.children.length > 0;
          const docCount = getDocumentCountForPath(node.path);

          return (
            <div key={node.path}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleFolder(node.path);
                  }
                  setSelectedPath(isSelected ? null : node.path);
                }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors group ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {/* Expand/collapse chevron */}
                <span className="w-4 h-4 flex items-center justify-center">
                  {hasChildren ? (
                    isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                    )
                  ) : (
                    <span className="w-3.5" />
                  )}
                </span>

                {/* Folder icon */}
                {hasChildren ? (
                  isExpanded ? (
                    <FolderOpen className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Folder className="w-4 h-4 text-amber-500" />
                  )
                ) : (
                  <Folder className="w-4 h-4 text-neutral-400" />
                )}

                {/* Folder name */}
                <span className="flex-1 text-left truncate">{node.name}</span>

                {/* Document count badge */}
                {docCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-neutral-200 text-neutral-600 rounded-full">
                    {docCount}
                  </span>
                )}
              </button>

              {/* Children */}
              {hasChildren && isExpanded && (
                <FolderTree nodes={node.children} depth={depth + 1} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Documents</h1>
            <p className="text-sm text-neutral-500">
              {selectedPath ? selectedPath.replace('/', ' / ') : 'All files'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === 'consultant' && clientInfo && (
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <Send className="w-4 h-4" />
                Request
              </button>
            )}
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Folder Tree */}
        <aside className="w-56 border-r border-neutral-200 overflow-y-auto p-3">
          {/* All Files option */}
          <button
            onClick={() => setSelectedPath(null)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm mb-2 transition-colors ${
              selectedPath === null
                ? 'bg-blue-50 text-blue-700'
                : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <span className="w-4" />
            <Folder className="w-4 h-4 text-neutral-500" />
            <span className="flex-1 text-left">All Files</span>
            <span className="px-1.5 py-0.5 text-xs bg-neutral-200 text-neutral-600 rounded-full">
              {documents.length}
            </span>
          </button>

          <div className="h-px bg-neutral-200 my-2" />

          {/* Folder tree */}
          <FolderTree nodes={FOLDER_STRUCTURE} />
        </aside>

        {/* Main Content - File List */}
        <main className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
              <span className="ml-2 text-sm text-neutral-500">Loading...</span>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
              <Folder className="w-12 h-12 mb-3 text-neutral-300" />
              <p className="text-sm font-medium">No files here</p>
              <p className="text-xs mt-1">Upload a document to get started</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0">
                <tr>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">
                    Name
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3 w-32">
                    Size
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3 w-32">
                    Modified
                  </th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3 w-24">
                    Tags
                  </th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredDocuments.map((doc) => (
                  <DocumentRow key={doc.id} document={doc} formatFileSize={formatFileSize} />
                ))}
              </tbody>
            </table>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">Upload Document</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedPath && (
              <p className="text-sm text-neutral-500 mb-4">
                Uploading to: <span className="font-medium text-neutral-700">{selectedPath}</span>
              </p>
            )}

            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-neutral-400 transition-colors">
              <Upload className="w-8 h-8 mx-auto mb-3 text-neutral-400" />
              <p className="text-sm text-neutral-600 mb-3">Drag and drop or click to upload</p>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-4 py-2 bg-neutral-900 text-white text-sm rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                {uploading ? 'Uploading...' : 'Choose File'}
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Request Document Modal */}
      {showRequestModal && clientInfo && consultantId && (
        <RequestDocumentModal
          clientId={clientId}
          clientName={clientInfo.name}
          clientEmail={clientInfo.email}
          consultantId={consultantId}
          consultantName={consultantName || 'Consultant'}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            fetchDocuments();
            setShowRequestModal(false);
          }}
        />
      )}
    </div>
  );
}

function DocumentRow({ document, formatFileSize }: { document: Document; formatFileSize: (bytes: number) => string }) {
  const [showMenu, setShowMenu] = useState(false);

  const getFileIcon = () => {
    const type = document.fileType?.toLowerCase();
    if (type === 'pdf') {
      return <FileText className="w-4 h-4 text-red-500" />;
    }
    if (['doc', 'docx'].includes(type)) {
      return <FileText className="w-4 h-4 text-blue-500" />;
    }
    if (['xls', 'xlsx'].includes(type)) {
      return <FileText className="w-4 h-4 text-green-500" />;
    }
    if (['jpg', 'jpeg', 'png', 'gif'].includes(type)) {
      return <FileText className="w-4 h-4 text-purple-500" />;
    }
    return <File className="w-4 h-4 text-neutral-400" />;
  };

  return (
    <tr className="hover:bg-neutral-50 transition-colors group">
      <td className="px-4 py-3">
        <a
          href={document.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 hover:text-blue-600"
        >
          {getFileIcon()}
          <div>
            <p className="text-sm font-medium text-neutral-900 group-hover:text-blue-600">
              {document.name}
            </p>
            <p className="text-xs text-neutral-500">{document.fileName}</p>
          </div>
        </a>
      </td>
      <td className="px-4 py-3 text-sm text-neutral-500">
        {formatFileSize(document.fileSize)}
      </td>
      <td className="px-4 py-3 text-sm text-neutral-500">
        {new Date(document.updatedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {document.tags.slice(0, 2).map((tag) => {
            const colors = getTagColor(tag);
            return (
              <span
                key={tag}
                className={`px-2 py-0.5 text-xs font-medium rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}
              >
                {tag}
              </span>
            );
          })}
          {document.tags.length > 2 && (
            <span className="px-2 py-0.5 text-xs text-neutral-500">
              +{document.tags.length - 2}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 text-neutral-400 hover:text-neutral-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-4 top-10 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <div className="h-px bg-neutral-200 my-1" />
              <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
}
