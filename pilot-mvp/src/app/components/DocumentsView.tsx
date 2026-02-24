'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  FileText, Upload, Folder, FolderOpen, Search, MoreVertical, 
  Share2, Download, Trash2, Calendar, User, 
  CheckCircle2, Plus, X, Loader2, Send, ChevronRight, ChevronDown, File, Eye, GitPullRequest, FolderPlus
} from 'lucide-react';
import { RequestDocumentModal } from './RequestDocumentModal';
import { DocumentReviewModal } from './DocumentReviewModal';

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
  status: 'draft' | 'shared' | 'signed' | 'archived' | 'pending-review';
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

const DEFAULT_FOLDERS: FolderNode[] = [
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

function loadFolders(clientId: string): FolderNode[] {
  if (typeof window === 'undefined') return DEFAULT_FOLDERS;
  try {
    const stored = localStorage.getItem(`doc-folders-${clientId}`);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return DEFAULT_FOLDERS;
}

function saveFolders(clientId: string, folders: FolderNode[]) {
  try {
    localStorage.setItem(`doc-folders-${clientId}`, JSON.stringify(folders));
  } catch { /* ignore */ }
}

function addFolderToTree(nodes: FolderNode[], parentPath: string | null, name: string): FolderNode[] {
  if (!parentPath) {
    return [...nodes, { name, path: name, children: [] }];
  }
  return nodes.map((node) => {
    if (node.path === parentPath) {
      const newPath = `${parentPath}/${name}`;
      return { ...node, children: [...node.children, { name, path: newPath, children: [] }] };
    }
    if (node.children.length > 0) {
      return { ...node, children: addFolderToTree(node.children, parentPath, name) };
    }
    return node;
  });
}

function removeFolderFromTree(nodes: FolderNode[], targetPath: string): FolderNode[] {
  return nodes
    .filter((node) => node.path !== targetPath)
    .map((node) => ({
      ...node,
      children: removeFolderFromTree(node.children, targetPath),
    }));
}

function collectFolderPaths(node: FolderNode): string[] {
  return [node.path, ...node.children.flatMap(collectFolderPaths)];
}

function findFolderNode(nodes: FolderNode[], path: string): FolderNode | null {
  for (const node of nodes) {
    if (node.path === path) return node;
    const found = findFolderNode(node.children, path);
    if (found) return found;
  }
  return null;
}

// Tag colors like GitHub labels
const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'urgent': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  'needs-review': { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  'approved': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  'signed': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  'draft': { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  'equipment': { bg: 'bg-muted', text: 'text-foreground', border: 'border-border' },
  'default': { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
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
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['General', 'Permits', 'Contracts']));
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clientInfo, setClientInfo] = useState<{ name: string; email: string } | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [reviewingDocument, setReviewingDocument] = useState<Document | null>(null);
  const lastDocumentIdsRef = useRef<Set<string>>(new Set());
  const [folderStructure, setFolderStructure] = useState<FolderNode[]>(() => loadFolders(clientId));
  const [creatingFolderIn, setCreatingFolderIn] = useState<string | '__root__' | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocuments();
    if (viewMode === 'consultant' && clientId) {
      fetchClientInfo();
    }
  }, [clientId, consultantId, viewMode]);

  // Poll for new documents from clients (only for consultants)
  useEffect(() => {
    if (viewMode !== 'consultant' || !clientId) return;

    const pollInterval = setInterval(() => {
      fetchDocuments(true); // Silent fetch for polling
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [viewMode, clientId]);

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

  const fetchDocuments = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      // Don't filter by consultantId - fetch ALL documents for the client
      const params = new URLSearchParams({ clientId });

      const res = await fetch(`/api/documents?${params}`);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.documents || [];
        
        // Check for new documents from clients (only for consultants)
        if (viewMode === 'consultant' && lastDocumentIdsRef.current.size > 0) {
          const currentIds = new Set(list.map((d: Document) => d.id));
          const newDocuments = list.filter((doc: Document) => {
            const isNew = !lastDocumentIdsRef.current.has(doc.id);
            const isFromClient = doc.uploadedBy?.isClient === true;
            return isNew && isFromClient;
          });

          // Show notifications for new documents from clients
          newDocuments.forEach((doc: Document) => {
            const senderName = doc.uploadedBy?.userName || clientName || 'Client';
            const documentName = doc.name;
            const fileSize = formatFileSize(doc.fileSize);
            const fileType = doc.fileType?.toUpperCase() || 'FILE';
            
            toast.success('New Document Received', {
              description: `From: ${senderName} • ${documentName} (${fileType}, ${fileSize})`,
              duration: 6000,
              action: {
                label: 'View',
                onClick: () => handleViewDocument(doc),
              },
            });
          });
        }

        // Update last known document IDs
        lastDocumentIdsRef.current = new Set(list.map((d: Document) => d.id));
        setDocuments(list);
        
        if (!silent) {
          console.log(`📄 Loaded ${list.length} documents for client ${clientId}`);
        }
      } else {
        console.error('Failed to fetch documents:', await res.text());
        if (!silent) setDocuments([]);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      if (!silent) setDocuments([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB for base64 storage)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', clientId);
      if (consultantId) formData.append('consultantId', consultantId);
      formData.append('folder', selectedPath || 'General');
      formData.append('uploadedBy', JSON.stringify({
        userId: consultantId || clientId,
        userName: viewMode === 'client' ? (clientName || 'Client') : (consultantName || 'Consultant'),
        userEmail: clientEmail || '',
        isClient: viewMode === 'client',
      }));

      console.log('📤 Uploading document:', file.name, 'to folder:', selectedPath || 'General');

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const newDoc = await res.json();
        console.log('✅ Document uploaded successfully:', newDoc.name);
        
        // Show success notification
        toast.success('Document uploaded successfully', {
          description: `"${newDoc.name}" has been uploaded to ${selectedPath || 'General'}`,
          duration: 4000,
        });
        
        // Add the new document to the list immediately for instant feedback
        setDocuments(prev => [newDoc, ...prev]);
        lastDocumentIdsRef.current.add(newDoc.id);
        setShowUploadModal(false);
        
        // Reset the file input
        event.target.value = '';
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Upload failed:', errorData);
        alert(`Failed to upload file: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
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

  const handleViewDocument = (doc: Document) => {
    setViewingDocument(doc);
  };

  const handleCloseViewer = () => {
    setViewingDocument(null);
  };

  const handleCreateFolder = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) {
      setCreatingFolderIn(null);
      setNewFolderName('');
      return;
    }
    const parentPath = creatingFolderIn === '__root__' ? null : creatingFolderIn;
    const updated = addFolderToTree(folderStructure, parentPath, trimmed);
    setFolderStructure(updated);
    saveFolders(clientId, updated);
    if (parentPath) {
      setExpandedFolders((prev) => new Set([...prev, parentPath]));
    }
    toast.success('Folder created', {
      description: parentPath ? `"${trimmed}" added inside ${parentPath}` : `"${trimmed}" folder created`,
      duration: 3000,
    });
    setCreatingFolderIn(null);
    setNewFolderName('');
  };

  const handleDeleteFolder = (folderPath: string) => {
    const node = findFolderNode(folderStructure, folderPath);
    if (!node) return;

    const allPaths = collectFolderPaths(node);
    const docsInFolder = documents.filter(
      (doc) => doc.folder && allPaths.some((p) => doc.folder!.startsWith(p)),
    );

    const message = docsInFolder.length > 0
      ? `Delete "${node.name}" and its subfolders? ${docsInFolder.length} file(s) inside will be moved to "General".`
      : `Delete "${node.name}"${node.children.length > 0 ? ` and its ${node.children.length} subfolder(s)` : ''}?`;

    if (!confirm(message)) return;

    const updated = removeFolderFromTree(folderStructure, folderPath);
    setFolderStructure(updated);
    saveFolders(clientId, updated);

    if (selectedPath && allPaths.includes(selectedPath)) {
      setSelectedPath(null);
    }

    toast.success('Folder deleted', {
      description: `"${node.name}" has been removed`,
      duration: 3000,
    });
  };

  useEffect(() => {
    if (creatingFolderIn !== null && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [creatingFolderIn]);

  const renderNewFolderInput = (parentPath: string | '__root__') => {
    if (creatingFolderIn !== parentPath) return null;
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 ml-0">
        <FolderPlus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          key={`new-folder-${parentPath}`}
          ref={newFolderInputRef}
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreateFolder();
            if (e.key === 'Escape') { setCreatingFolderIn(null); setNewFolderName(''); }
          }}
          onBlur={handleCreateFolder}
          placeholder="Folder name…"
          className="flex-1 min-w-0 bg-background border border-border rounded px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
    );
  };

  const renderFolderTree = (nodes: FolderNode[], depth = 0): React.ReactNode => {
    return (
      <div className={depth > 0 ? 'ml-4' : ''}>
        {nodes.map((node) => {
          const isExpanded = expandedFolders.has(node.path);
          const isSelected = selectedPath === node.path;
          const hasChildren = node.children.length > 0 || creatingFolderIn === node.path;
          const docCount = getDocumentCountForPath(node.path);

          return (
            <div key={node.path}>
              <div className="relative group/folder">
                <button
                  onClick={() => {
                    if (node.children.length > 0 || creatingFolderIn === node.path) {
                      toggleFolder(node.path);
                    }
                    setSelectedPath(isSelected ? null : node.path);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  <span className="w-4 h-4 flex items-center justify-center">
                    {hasChildren ? (
                      isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      )
                    ) : (
                      <span className="w-3.5" />
                    )}
                  </span>

                  {node.children.length > 0 || creatingFolderIn === node.path ? (
                    isExpanded ? (
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Folder className="w-4 h-4 text-muted-foreground" />
                    )
                  ) : (
                    <Folder className="w-4 h-4 text-muted-foreground" />
                  )}

                  <span className="flex-1 text-left truncate">{node.name}</span>

                  {docCount > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-muted/80 text-muted-foreground rounded-md font-medium group-hover/folder:hidden">
                      {docCount}
                    </span>
                  )}
                </button>

                {/* Folder action buttons on hover (replace doc count) */}
                <div className={`absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover/folder:opacity-100 transition-opacity`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedFolders((prev) => new Set([...prev, node.path]));
                      setCreatingFolderIn(node.path);
                      setNewFolderName('');
                    }}
                    className={`p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent ${
                      isSelected ? 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/20' : ''
                    }`}
                    title="New subfolder"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(node.path);
                    }}
                    className={`p-1 rounded text-muted-foreground hover:text-red-500 hover:bg-red-500/10 ${
                      isSelected ? 'text-primary-foreground/70 hover:text-red-300 hover:bg-red-500/20' : ''
                    }`}
                    title="Delete folder"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Children + inline new-folder input */}
              {hasChildren && isExpanded && (
                <div className="ml-4">
                  {renderFolderTree(node.children, depth + 1)}
                  {renderNewFolderInput(node.path)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-page-bg">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-surface/95 backdrop-blur-sm px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">Documents</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {selectedPath ? selectedPath.replace('/', ' / ') : 'All files'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === 'consultant' && clientInfo && (
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-border text-foreground rounded-lg hover:bg-accent transition-all duration-200"
              >
                <Send className="w-4 h-4" />
                Request
              </button>
            )}
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="w-full pl-9 pr-3 py-2.5 bg-background/80 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Folder Tree */}
        <aside className="w-56 flex-shrink-0 border-r border-border overflow-y-auto p-4 bg-surface/80">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3 px-2">Folders</p>
          {/* All Files option */}
          <button
            onClick={() => setSelectedPath(null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-1 transition-all duration-200 ${
              selectedPath === null
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground hover:bg-accent'
            }`}
          >
            <Folder className={`w-4 h-4 flex-shrink-0 ${selectedPath === null ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="flex-1 text-left font-medium">All Files</span>
            <span className="px-2 py-0.5 text-xs bg-muted/80 text-muted-foreground rounded-md font-medium">
              {documents.length}
            </span>
          </button>

          <div className="h-px bg-border my-3" />

          {/* Folder tree */}
          {renderFolderTree(folderStructure)}

          {/* Inline root-level new folder input */}
          {renderNewFolderInput('__root__')}

          {/* New Folder button */}
          <button
            onClick={() => {
              setCreatingFolderIn('__root__');
              setNewFolderName('');
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 mt-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Folder</span>
          </button>
        </aside>

        {/* Main Content - File List */}
        <main className="flex-1 overflow-auto bg-page-bg/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 rounded-full border-2 border-border border-t-primary animate-spin mb-4" />
              <span className="text-sm text-muted-foreground">Loading documents...</span>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6">
              <div className="w-20 h-20 rounded-2xl bg-muted/60 flex items-center justify-center mb-5">
                <Folder className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-base font-medium text-foreground mb-1">No files here</p>
              <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
                Upload a document or select a different folder to get started
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-all duration-200"
              >
                <Upload className="w-4 h-4" />
                Upload Document
              </button>
            </div>
          ) : (
            <div className="p-4">
            <table className="w-full">
              <thead className="bg-surface/90 backdrop-blur-sm border-b border-border sticky top-0 z-10">
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">
                    Name
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-32">
                    Size
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-32">
                    Modified
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-24">
                    Tags
                  </th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-surface">
              {filteredDocuments.map((doc) => (
                  <DocumentRow 
                    key={doc.id} 
                    document={doc} 
                    formatFileSize={formatFileSize}
                    onDelete={(docId) => setDocuments(prev => prev.filter(d => d.id !== docId))}
                    onView={handleViewDocument}
                    onReview={setReviewingDocument}
                  />
                ))}
              </tbody>
            </table>
            </div>
          )}
        </main>
      </div>

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <DocumentViewer
          document={viewingDocument}
          onClose={handleCloseViewer}
        />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md border border-border shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Upload Document</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedPath && (
              <p className="text-sm text-muted-foreground mb-4 px-1">
                Uploading to: <span className="font-medium text-foreground">{selectedPath}</span>
              </p>
            )}

            <label
              htmlFor="file-upload"
              className="block border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer group"
            >
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                id="file-upload"
              />
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
              <p className="text-sm text-muted-foreground mb-1 group-hover:text-foreground transition-colors duration-300">Drag and drop or click to upload</p>
              <p className="text-xs text-muted-foreground mb-4">PDF, images, documents up to 10MB</p>
              <span className="inline-block px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg group-hover:opacity-90 transition-all duration-200 shadow-sm">
                {uploading ? 'Uploading...' : 'Choose File'}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Request Document Modal */}
      {reviewingDocument && (
        <DocumentReviewModal
          documentId={reviewingDocument.id}
          documentName={reviewingDocument.name}
          documentUrl={reviewingDocument.fileUrl}
          documentType={reviewingDocument.fileType}
          isOpen={!!reviewingDocument}
          onClose={() => {
            setReviewingDocument(null);
            fetchDocuments(); // Refresh to show updated review status
          }}
          onReviewComplete={() => {
            fetchDocuments(); // Refresh after review completion
          }}
        />
      )}
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

function DocumentRow({ 
  document, 
  formatFileSize,
  onDelete,
  onView,
  onReview,
}: { 
  document: Document; 
  formatFileSize: (bytes: number) => string;
  onDelete: (docId: string) => void;
  onView?: (doc: Document) => void;
  onReview?: (doc: Document) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    return <File className="w-4 h-4 text-muted-foreground" />;
  };

  const handleDownload = () => {
    // If fileUrl is a data URL, create a download link
    const link = window.document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.name || document.fileName;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    setShowMenu(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${document.name}"? This action cannot be undone.`)) {
      return;
    }
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        onDelete(document.id);
        toast.success('File deleted', {
          description: `"${document.name}" has been removed`,
          duration: 3000,
        });
      } else {
        toast.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    } finally {
      setDeleting(false);
      setShowMenu(false);
    }
  };

  const handleOpenFile = () => {
    // Use the enhanced viewer if available, otherwise fall back to opening in new window
    if (onView) {
      onView(document);
    } else {
      // Fallback: open in new window
      if (document.fileUrl.startsWith('data:')) {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>${document.name}</title></head>
              <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;">
                <iframe src="${document.fileUrl}" style="width:100%;height:100%;border:none;"></iframe>
              </body>
            </html>
          `);
        }
      } else {
        window.open(document.fileUrl, '_blank');
      }
    }
  };

  return (
    <tr className="hover:bg-accent/50 transition-colors duration-200 group">
      <td className="px-4 py-3">
        <button
          onClick={handleOpenFile}
          className="flex items-center gap-3 hover:text-primary text-left transition-colors duration-200"
        >
          <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0 group-hover:bg-muted transition-colors duration-200">
            {getFileIcon()}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground group-hover:text-primary">
              {document.name}
            </p>
            <p className="text-xs text-muted-foreground">{document.fileName}</p>
          </div>
        </button>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {formatFileSize(document.fileSize)}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {new Date(document.updatedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1 items-center">
          {          document.status === 'pending-review' && (
            <span
              className="px-2 py-1 text-xs font-medium rounded-lg border bg-muted text-foreground border-border flex items-center gap-1"
              title="Under review"
            >
              <GitPullRequest className="w-3 h-3" />
              Review
            </span>
          )}
          {(document.tags || []).slice(0, 2).map((tag) => {
            const colors = getTagColor(tag);
            return (
              <span
                key={tag}
                className={`px-2 py-1 text-xs font-medium rounded-lg border ${colors.bg} ${colors.text} ${colors.border}`}
              >
                {tag}
              </span>
            );
          })}
          {(document.tags || []).length > 2 && (
            <span className="px-2 py-0.5 text-xs text-muted-foreground">
              +{document.tags.length - 2}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 text-muted-foreground hover:text-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
          <MoreVertical className="w-4 h-4" />
          )}
        </button>

      {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-4 top-10 bg-surface border border-border rounded-xl shadow-xl z-20 py-1.5 min-w-[160px] animate-in fade-in slide-in-from-top-2 duration-200">
              {onView && (
                <button 
                  onClick={() => {
                    onView(document);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-accent flex items-center gap-2 transition-colors duration-150 rounded-lg mx-1"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
              )}
              <button 
                onClick={handleDownload}
                className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-accent flex items-center gap-2 transition-colors duration-150 rounded-lg mx-1">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              {onReview && (
                <button 
                  onClick={() => {
                    onReview(document);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-accent flex items-center gap-2 transition-colors duration-150 rounded-lg mx-1"
                >
                  <GitPullRequest className="w-4 h-4" />
                  Review
                </button>
              )}
              <div className="h-px bg-border my-1" />
              <button 
                onClick={handleDelete}
                className="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-500/10 flex items-center gap-2 transition-colors duration-150 rounded-lg mx-1"
              >
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

// Enhanced Document Viewer Component
function DocumentViewer({ 
  document, 
  onClose 
}: { 
  document: Document; 
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.name || document.fileName;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const isTextFile = ['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(
    document.fileType?.toLowerCase() || ''
  );

  useEffect(() => {
    if (!isTextFile) return;
    const url = document.fileUrl;
    if (url.startsWith('data:')) {
      try {
        const base64 = url.split(',')[1];
        if (base64) {
          setTextContent(atob(base64));
        } else {
          setTextContent(decodeURIComponent(url.split(',')[1] || ''));
        }
      } catch {
        setTextContent('Unable to decode file content.');
      }
      setLoading(false);
    } else {
      fetch(url)
        .then((r) => r.text())
        .then((t) => {
          setTextContent(t);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load file');
          setLoading(false);
        });
    }
  }, [document.fileUrl, isTextFile]);

  const getFileViewer = () => {
    const fileType = document.fileType?.toLowerCase();
    const fileUrl = document.fileUrl;

    if (fileType === 'pdf') {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          onError={() => {
            setError('Failed to load PDF');
            setLoading(false);
          }}
        />
      );
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType || '')) {
      return (
        <div className="flex items-center justify-center h-full bg-muted">
          <img
            src={fileUrl}
            alt={document.name}
            className="max-w-full max-h-full object-contain"
            onLoad={() => setLoading(false)}
            onError={() => {
              setError('Failed to load image');
              setLoading(false);
            }}
          />
        </div>
      );
    }

    if (isTextFile && textContent !== null) {
      return (
        <div className="w-full h-full overflow-auto bg-surface p-6">
          <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
            {textContent}
          </pre>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface p-8">
        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">
          {document.name}
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          This file type cannot be previewed. Please download to view.
        </p>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download File
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <FileText className="w-5 h-5 flex-shrink-0 text-foreground" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate text-foreground">{document.name}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span>From: {document.uploadedBy?.userName || 'Unknown'}</span>
              <span>·</span>
              <span>{new Date(document.createdAt).toLocaleDateString()}</span>
              <span>·</span>
              <span>{document.fileType?.toUpperCase() || 'FILE'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Document Content */}
      <div className="flex-1 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading document...</p>
            </div>
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors mx-auto"
              >
                <Download className="w-4 h-4" />
                Download Instead
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            {getFileViewer()}
          </div>
        )}
      </div>
    </div>
  );
}
