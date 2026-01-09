// 'use client';

// import { useEffect, useMemo, useState, useRef } from 'react';
// import {
//   Plus,
//   Search,
//   Filter,
//   MoreVertical,
//   CheckCircle2,
//   Clock,
//   AlertCircle,
//   FileText,
// } from 'lucide-react';

// export interface Client {
//   _id: string;
//   businessName: string;
//   jurisdiction: string;
//   activePermits: number;
//   status: 'draft' | 'submitted' | 'approved' | 'action-required';
//   lastActivity: string;
//   completionRate: number;
// }

// interface WorkspaceDashboardProps {
//   onSelectClient: (clientId: string) => void;
//   onStartPermit: () => void;
// }

// export default function WorkspaceDashboard({
//   onSelectClient,
//   onStartPermit,
// }: WorkspaceDashboardProps) {
//   const [clients, setClients] = useState<Client[]>([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [isFilterOpen, setIsFilterOpen] = useState(false);
//   const [filters, setFilters] = useState({
//     jurisdiction: '',
//     status: '',
//     minPermits: '',
//     lastActivity: '',
//   });
//   const [loading, setLoading] = useState(true);

//   const [openMenuId, setOpenMenuId] = useState<string | null>(null);
//   const dropdownRef = useRef<HTMLDivElement | null>(null);
//   const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

//   const fetchClients = async () => {
//     try {
//       setLoading(true);
//       const res = await fetch('/api/clients');
//       if (!res.ok) throw new Error('Failed to fetch clients');
//       const data: Client[] = await res.json();
//       setClients(data);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchClients();
//   }, []);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setOpenMenuId(null);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const getStatusIcon = (status: Client['status']) => {
//     switch (status) {
//       case 'approved': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
//       case 'submitted': return <Clock className="w-4 h-4 text-blue-600" />;
//       case 'action-required': return <AlertCircle className="w-4 h-4 text-amber-600" />;
//       case 'draft': return <FileText className="w-4 h-4 text-neutral-400" />;
//     }
//   };

//   const getStatusColor = (status: Client['status']) => {
//     switch (status) {
//       case 'approved': return 'bg-green-50 text-green-700 border-green-200';
//       case 'submitted': return 'bg-blue-50 text-blue-700 border-blue-200';
//       case 'action-required': return 'bg-amber-50 text-amber-700 border-amber-200';
//       case 'draft': return 'bg-neutral-50 text-neutral-600 border-neutral-200';
//     }
//   };

//   const getStatusLabel = (status: Client['status']) => {
//     switch (status) {
//       case 'approved': return 'Approved';
//       case 'submitted': return 'Submitted';
//       case 'action-required': return 'Action Required';
//       case 'draft': return 'Draft';
//     }
//   };

//   const jurisdictions = useMemo(() => [...new Set(clients.map(c => c.jurisdiction))], [clients]);

//   const deleteClient = async (clientId: string, clientName: string) => {
//     const confirmed = window.confirm(`Are you sure you want to delete "${clientName}"?`);
//     if (!confirmed) return;

//     try {
//       const res = await fetch('/api/clients', {
//         method: 'DELETE',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ _id: clientId }),
//       });

//       if (!res.ok) {
//         const error = await res.json();
//         throw new Error(error.error || 'Failed to delete client');
//       }

//       setClients(prev => prev.filter(c => c._id !== clientId));
//     } catch (err) {
//       console.error(err);
//       alert('Error deleting client.');
//     }
//   };

//   const recommendedClients = useMemo(() => clients, [clients]);
//   const filteredClients = useMemo(() => {
//     let results = [...recommendedClients];

//     if (searchQuery.trim()) {
//       const q = searchQuery.toLowerCase();
//       results = results.filter(c =>
//         c.businessName.toLowerCase().includes(q) ||
//         c.jurisdiction.toLowerCase().includes(q)
//       );
//     }

//     if (filters.jurisdiction) results = results.filter(c => c.jurisdiction === filters.jurisdiction);
//     if (filters.status) results = results.filter(c => c.status === filters.status);
//     if (filters.minPermits) results = results.filter(c => c.activePermits >= Number(filters.minPermits));
//     if (filters.lastActivity === '24h') results = results.filter(c => c.lastActivity.includes('hour'));
//     if (filters.lastActivity === '7d') results = results.filter(c => c.lastActivity.includes('day'));

//     return results;
//   }, [searchQuery, filters, recommendedClients]);

//   // Summary stats
//   const summary = useMemo(() => {
//     const totalClients = filteredClients.length;
//     const activePermits = filteredClients.reduce((sum, c) => sum + c.activePermits, 0);
//     const pendingReview = filteredClients.filter(c => c.status === 'submitted').length;
//     const actionRequired = filteredClients.filter(c => c.status === 'action-required').length;
//     return { totalClients, activePermits, pendingReview, actionRequired };
//   }, [filteredClients]);

//   if (loading) return <div className="p-8 text-neutral-600">Loading clients...</div>;

//   return (
//     <div className="flex flex-col h-full bg-neutral-50">
//       {/* Header */}
//       <div className="bg-white border-b border-neutral-200 px-8 py-6 flex flex-col gap-4">
//         <div className="flex items-center justify-between">
//           <div>
//             <h1 className="text-2xl font-semibold">Workspace</h1>
//             <p className="text-sm text-neutral-600 mt-1">Manage clients and their regulatory compliance</p>
//           </div>
//           <button
//             onClick={onStartPermit}
//             className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
//           >
//             <Plus className="w-4 h-4" />
//             Start New Permit
//           </button>
//         </div>

//         {/* Search + Filter */}
//         <div className="flex gap-3 mt-4 relative">
//           <div className="flex-1 relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
//             <input
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               placeholder="Search clients, jurisdictions, or permit types..."
//               className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
//             />
//           </div>

//           <div className="relative">
//             <button
//               onClick={() => setIsFilterOpen(v => !v)}
//               className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm"
//             >
//               <Filter className="w-4 h-4" />
//               Filter
//             </button>

//             {isFilterOpen && (
//               <div className="absolute right-0 mt-2 w-72 bg-white border rounded-lg shadow-lg p-4 z-10">
//                 <select
//                   className="w-full mb-2 border rounded p-1 text-sm"
//                   value={filters.jurisdiction}
//                   onChange={(e) => setFilters({ ...filters, jurisdiction: e.target.value })}
//                 >
//                   <option value="">All Jurisdictions</option>
//                   {jurisdictions.map(j => (
//                     <option key={j} value={j}>{j}</option>
//                   ))}
//                 </select>

//                 <select
//                   className="w-full mb-2 border rounded p-1 text-sm"
//                   value={filters.status}
//                   onChange={(e) => setFilters({ ...filters, status: e.target.value })}
//                 >
//                   <option value="">All Statuses</option>
//                   <option value="draft">Draft</option>
//                   <option value="submitted">Submitted</option>
//                   <option value="approved">Approved</option>
//                   <option value="action-required">Action Required</option>
//                 </select>

//                 <input
//                   type="number"
//                   placeholder="Min Active Permits"
//                   className="w-full mb-2 border rounded p-1 text-sm"
//                   value={filters.minPermits}
//                   onChange={(e) => setFilters({ ...filters, minPermits: e.target.value })}
//                 />

//                 <select
//                   className="w-full mb-3 border rounded p-1 text-sm"
//                   value={filters.lastActivity}
//                   onChange={(e) => setFilters({ ...filters, lastActivity: e.target.value })}
//                 >
//                   <option value="">Any Activity</option>
//                   <option value="24h">Last 24 hours</option>
//                   <option value="7d">Last 7 days</option>
//                 </select>

//                 <button
//                   onClick={() => setFilters({ jurisdiction: '', status: '', minPermits: '', lastActivity: '' })}
//                   className="w-full text-sm border rounded py-1"
//                 >
//                   Clear Filters
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Clients Table */}
//       <div className="flex-1 overflow-auto p-8">
//         <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
//           <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-neutral-50 border-b border-neutral-200 text-sm font-medium text-neutral-600">
//             <div className="col-span-3">Client</div>
//             <div className="col-span-2">Jurisdiction</div>
//             <div className="col-span-2">Active Permits</div>
//             <div className="col-span-2">Status</div>
//             <div className="col-span-2">Last Activity</div>
//             <div className="col-span-1"></div>
//           </div>

//           {filteredClients.length === 0 ? (
//             <div className="px-6 py-10 text-sm text-neutral-500">No matching clients found</div>
//           ) : (
//             filteredClients.map(client => {
//               const id = client._id;
//               return (
//                 <div key={id}>
//                   {/* Client row */}
//                   <div
//                     onClick={() => onSelectClient(id)}
//                     className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer relative"
//                   >
//                     <div className="col-span-3 flex flex-col justify-center">
//                       <p className="font-medium text-neutral-900">{client.businessName}</p>
//                       <div className="mt-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
//                         <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${client.completionRate}%` }} />
//                       </div>
//                     </div>
//                     <div className="col-span-2 flex items-center text-neutral-600">{client.jurisdiction}</div>
//                     <div className="col-span-2 flex items-center">
//                       <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm font-medium">{client.activePermits} permits</span>
//                     </div>
//                     <div className="col-span-2 flex items-center">
//                       <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(client.status)}`}>
//                         {getStatusIcon(client.status)}
//                         {getStatusLabel(client.status)}
//                       </span>
//                     </div>
//                     <div className="col-span-2 flex items-center text-neutral-500 text-sm">{client.lastActivity}</div>

//                     {/* Dropdown */}
//                     <div className="col-span-1 flex items-center justify-end">
//                       <button
//                         onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === id ? null : id); }}
//                         className="p-1 hover:bg-neutral-100 rounded"
//                       >
//                         <MoreVertical className="w-4 h-4 text-neutral-400" />
//                       </button>

//                       {openMenuId === id && (
//                         <div ref={dropdownRef} className="absolute right-0 mt-2 w-36 bg-white border rounded shadow z-20">
//                           <button
//                             onClick={(e) => { e.stopPropagation(); console.log('Edit client', id); setOpenMenuId(null); }}
//                             className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-100"
//                           >
//                             Edit
//                           </button>
//                           <button
//                             onClick={(e) => { e.stopPropagation(); deleteClient(id, client.businessName); setOpenMenuId(null); }}
//                             className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600"
//                           >
//                             Delete
//                           </button>
//                           <button
//                             onClick={(e) => { 
//                               e.stopPropagation(); 
//                               setExpandedClientId(expandedClientId === id ? null : id);
//                               setOpenMenuId(null);
//                             }}
//                             className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-100"
//                           >
//                             View Details
//                           </button>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Details panel */}
//                   {expandedClientId === id && (
//                     <div className="col-span-12 bg-neutral-50 px-6 py-4 text-sm text-neutral-700 border-b border-neutral-100">
//                       <p><strong>Business Name:</strong> {client.businessName}</p>
//                       <p><strong>Jurisdiction:</strong> {client.jurisdiction}</p>
//                       <p><strong>Active Permits:</strong> {client.activePermits}</p>
//                       <p><strong>Status:</strong> {getStatusLabel(client.status)}</p>
//                       <p><strong>Completion Rate:</strong> {client.completionRate}%</p>
//                       <p><strong>Last Activity:</strong> {client.lastActivity}</p>
//                     </div>
//                   )}
//                 </div>
//               );
//             })
//           )}
//         </div>

//         {/* Summary at the bottom */}
//         <div className="mt-6 grid grid-cols-4 gap-4 text-sm">
//           <div className="bg-white border rounded p-4 text-center shadow">
//             <div className="text-neutral-500">Total Clients</div>
//             <div className="text-neutral-900 font-semibold text-lg">{summary.totalClients}</div>
//           </div>
//           <div className="bg-white border rounded p-4 text-center shadow">
//             <div className="text-neutral-500">Active Permits</div>
//             <div className="text-neutral-900 font-semibold text-lg">{summary.activePermits}</div>
//           </div>
//           <div className="bg-white border rounded p-4 text-center shadow">
//             <div className="text-neutral-500">Pending Review</div>
//             <div className="text-neutral-900 font-semibold text-lg">{summary.pendingReview}</div>
//           </div>
//           <div className="bg-white border rounded p-4 text-center shadow">
//             <div className="text-neutral-500">Action Required</div>
//             <div className="text-neutral-900 font-semibold text-lg">{summary.actionRequired}</div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

























'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';

export interface Client {
  _id: string;
  businessName: string;
  jurisdiction: string;
  activePermits: number;
  status: 'draft' | 'submitted' | 'approved' | 'action-required';
  lastActivity: string;
  completionRate: number;
}

interface WorkspaceDashboardProps {
  onSelectClient: (clientId: string) => void;
  onNewClient: () => void;
}

interface Filters {
  jurisdiction: string;
  status: Client['status'] | '';
  minPermits: string;
  lastActivity: '24h' | '7d' | '';
}

export default function WorkspaceDashboard({
  onSelectClient,
  onNewClient,
}: WorkspaceDashboardProps) {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    jurisdiction: '',
    status: '',
    minPermits: '',
    lastActivity: '',
  });
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Fetch clients
  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/clients');
      if (!res.ok) throw new Error('Failed to fetch clients');
      const data: Client[] = await res.json();
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNewClient = () => onNewClient();

  const handlePermitManagement = () => router.push('/permit-management'); // NEW

  const getStatusIcon = (status: Client['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'submitted':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'action-required':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'draft':
        return <FileText className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'action-required':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'draft':
        return 'bg-neutral-50 text-neutral-600 border-neutral-200';
    }
  };

  const getStatusLabel = (status: Client['status']) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'submitted':
        return 'Submitted';
      case 'action-required':
        return 'Action Required';
      case 'draft':
        return 'Draft';
    }
  };

  const jurisdictions = useMemo(
    () => [...new Set(clients.map((c) => c.jurisdiction))],
    [clients]
  );

  const deleteClient = async (clientId: string, clientName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${clientName}"?`)) return;

    try {
      const res = await fetch('/api/clients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: clientId }),
      });
      if (!res.ok) throw new Error('Failed to delete client');
      setClients((prev) => prev.filter((c) => c._id !== clientId));
    } catch (err) {
      console.error(err);
      alert('Error deleting client.');
    }
  };

  const filteredClients = useMemo(() => {
    return clients
      .filter((c) => {
        const query = searchQuery.toLowerCase();
        return (
          c.businessName.toLowerCase().includes(query) ||
          c.jurisdiction.toLowerCase().includes(query)
        );
      })
      .filter((c) => (filters.jurisdiction ? c.jurisdiction === filters.jurisdiction : true))
      .filter((c) => (filters.status ? c.status === filters.status : true))
      .filter((c) => (filters.minPermits ? c.activePermits >= Number(filters.minPermits) : true))
      .filter((c) => {
        if (filters.lastActivity === '24h') return c.lastActivity.includes('hour');
        if (filters.lastActivity === '7d') return c.lastActivity.includes('day');
        return true;
      });
  }, [clients, searchQuery, filters]);

  const summary = useMemo(() => {
    const totalClients = filteredClients.length;
    const activePermits = filteredClients.reduce((sum, c) => sum + c.activePermits, 0);
    const pendingReview = filteredClients.filter((c) => c.status === 'submitted').length;
    const actionRequired = filteredClients.filter((c) => c.status === 'action-required').length;
    return { totalClients, activePermits, pendingReview, actionRequired };
  }, [filteredClients]);

  if (loading) return <div className="p-8 text-neutral-600">Loading clients...</div>;

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Workspace</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Manage clients and their regulatory compliance
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleNewClient}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
            >
              <Plus className="w-4 h-4" />
              Start New Permit
            </button>

            {/* NEW Permit Management Button */}
            <button
              onClick={handlePermitManagement}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
            >
              <FileText className="w-4 h-4" />
              Permit Management
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-3 mt-4 relative">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients, jurisdictions, or permit types..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsFilterOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border rounded-lg shadow-lg p-4 z-10">
                <select
                  className="w-full mb-2 border rounded p-1 text-sm"
                  value={filters.jurisdiction}
                  onChange={(e) => setFilters({ ...filters, jurisdiction: e.target.value })}
                >
                  <option value="">All Jurisdictions</option>
                  {jurisdictions.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>

                <select
                  className="w-full mb-2 border rounded p-1 text-sm"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters({ ...filters, status: e.target.value as Filters['status'] })
                  }
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="approved">Approved</option>
                  <option value="action-required">Action Required</option>
                </select>

                <input
                  type="number"
                  placeholder="Min Active Permits"
                  className="w-full mb-2 border rounded p-1 text-sm"
                  value={filters.minPermits}
                  onChange={(e) => setFilters({ ...filters, minPermits: e.target.value })}
                />

                <select
                  className="w-full mb-3 border rounded p-1 text-sm"
                  value={filters.lastActivity}
                  onChange={(e) =>
                    setFilters({ ...filters, lastActivity: e.target.value as Filters['lastActivity'] })
                  }
                >
                  <option value="">Any Activity</option>
                  <option value="24h">Last 24 hours</option>
                  <option value="7d">Last 7 days</option>
                </select>

                <button
                  onClick={() =>
                    setFilters({ jurisdiction: '', status: '', minPermits: '', lastActivity: '' })
                  }
                  className="w-full text-sm border rounded py-1"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="flex-1 overflow-auto p-8">
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-neutral-50 border-b border-neutral-200 text-sm font-medium text-neutral-600">
            <div className="col-span-3">Client</div>
            <div className="col-span-2">Jurisdiction</div>
            <div className="col-span-2">Active Permits</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Last Activity</div>
            <div className="col-span-1"></div>
          </div>

          {filteredClients.length === 0 ? (
            <div className="px-6 py-10 text-sm text-neutral-500">No matching clients found</div>
          ) : (
            filteredClients.map((client) => {
              const id = client._id;
              return (
                <div key={id}>
                  <div
                    onClick={() => onSelectClient(id)}
                    className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer relative"
                  >
                    <div className="col-span-3 flex flex-col justify-center">
                      <p className="font-medium text-neutral-900">{client.businessName}</p>
                      <div className="mt-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-neutral-900 rounded-full"
                          style={{ width: `${client.completionRate}%` }}
                        />
                      </div>
                    </div>
                    <div className="col-span-2 flex items-center text-neutral-600">{client.jurisdiction}</div>
                    <div className="col-span-2 flex items-center">
                      <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm font-medium">
                        {client.activePermits} permits
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center">
                      <span
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                          client.status
                        )}`}
                      >
                        {getStatusIcon(client.status)}
                        {getStatusLabel(client.status)}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center text-neutral-500 text-sm">
                      {client.lastActivity}
                    </div>

                    <div className="col-span-1 flex items-center justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === id ? null : id);
                        }}
                        className="p-1 hover:bg-neutral-100 rounded"
                      >
                        <MoreVertical className="w-4 h-4 text-neutral-400" />
                      </button>

                      {openMenuId === id && (
                        <div
                          ref={dropdownRef}
                          className="absolute right-0 mt-2 w-36 bg-white border rounded shadow z-20"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Edit client', id);
                              setOpenMenuId(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteClient(id, client.businessName);
                              setOpenMenuId(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600"
                          >
                            Delete
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedClientId(expandedClientId === id ? null : id);
                              setOpenMenuId(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-neutral-100"
                          >
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {expandedClientId === id && (
                    <div className="col-span-12 bg-neutral-50 px-6 py-4 text-sm text-neutral-700 border-b border-neutral-100">
                      <p>
                        <strong>Business Name:</strong> {client.businessName}
                      </p>
                      <p>
                        <strong>Jurisdiction:</strong> {client.jurisdiction}
                      </p>
                      <p>
                        <strong>Active Permits:</strong> {client.activePermits}
                      </p>
                      <p>
                        <strong>Status:</strong> {getStatusLabel(client.status)}
                      </p>
                      <p>
                        <strong>Completion Rate:</strong> {client.completionRate}%
                      </p>
                      <p>
                        <strong>Last Activity:</strong> {client.lastActivity}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-4 gap-4 text-sm">
          <div className="bg-white border rounded p-4 text-center shadow">
            <div className="text-neutral-500">Total Clients</div>
            <div className="text-neutral-900 font-semibold text-lg">{summary.totalClients}</div>
          </div>
          <div className="bg-white border rounded p-4 text-center shadow">
            <div className="text-neutral-500">Active Permits</div>
            <div className="text-neutral-900 font-semibold text-lg">{summary.activePermits}</div>
          </div>
          <div className="bg-white border rounded p-4 text-center shadow">
            <div className="text-neutral-500">Pending Review</div>
            <div className="text-neutral-900 font-semibold text-lg">{summary.pendingReview}</div>
          </div>
          <div className="bg-white border rounded p-4 text-center shadow">
            <div className="text-neutral-500">Action Required</div>
            <div className="text-neutral-900 font-semibold text-lg">{summary.actionRequired}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
