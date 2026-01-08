'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
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
import { useRouter } from 'next/navigation';

// Reuse the Client interface from WorkspaceDashboard
interface Client {
  _id: string;
  businessName: string;
  jurisdiction: string;
  activePermits: number;
  status: 'draft' | 'submitted' | 'approved' | 'action-required';
  lastActivity: string;
  completionRate: number;
}

export default function NewPermitPage() {
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    jurisdiction: '',
    status: '',
    minPermits: '',
    lastActivity: '',
  });
  const [loading, setLoading] = useState(true);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);

  // Fetch all clients just like Permit Discovery
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

  const getStatusIcon = (status: Client['status']) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'submitted': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'action-required': return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'draft': return <FileText className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-700 border-green-200';
      case 'submitted': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'action-required': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'draft': return 'bg-neutral-50 text-neutral-600 border-neutral-200';
    }
  };

  const getStatusLabel = (status: Client['status']) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'submitted': return 'Submitted';
      case 'action-required': return 'Action Required';
      case 'draft': return 'Draft';
    }
  };

  const jurisdictions = useMemo(() => [...new Set(clients.map(c => c.jurisdiction))], [clients]);

  const filteredClients = useMemo(() => {
    let results = [...clients];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(c =>
        c.businessName.toLowerCase().includes(q) ||
        c.jurisdiction.toLowerCase().includes(q)
      );
    }

    if (filters.jurisdiction) results = results.filter(c => c.jurisdiction === filters.jurisdiction);
    if (filters.status) results = results.filter(c => c.status === filters.status);
    if (filters.minPermits) results = results.filter(c => c.activePermits >= Number(filters.minPermits));
    if (filters.lastActivity === '24h') results = results.filter(c => c.lastActivity.includes('hour'));
    if (filters.lastActivity === '7d') results = results.filter(c => c.lastActivity.includes('day'));

    return results;
  }, [searchQuery, filters, clients]);

  const handleSelectClient = (clientId: string) => {
    // Navigate to permit creation page for this client
    router.push(`/clients/${clientId}`);
  };

  if (loading) return <div className="p-8 text-neutral-600">Loading clients...</div>;

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      <div className="bg-white border-b border-neutral-200 px-8 py-6 flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">New Permit</h1>
        <p className="text-sm text-neutral-600 mt-1">Select a client to start a new permit</p>

        <div className="flex gap-3 mt-4 relative">
          <div className="flex-1 relative">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients, jurisdictions..."
              className="w-full pl-3 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setFilters({ ...filters })}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>
      </div>

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
            filteredClients.map(client => {
              const id = client._id;
              return (
                <div
                  key={id}
                  onClick={() => handleSelectClient(id)}
                  className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                >
                  <div className="col-span-3 flex flex-col justify-center">
                    <p className="font-medium text-neutral-900">{client.businessName}</p>
                  </div>
                  <div className="col-span-2 flex items-center text-neutral-600">{client.jurisdiction}</div>
                  <div className="col-span-2 flex items-center">
                    <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm font-medium">{client.activePermits} permits</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(client.status)}`}>
                      {getStatusIcon(client.status)}
                      {getStatusLabel(client.status)}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center text-neutral-500 text-sm">{client.lastActivity}</div>
                  <div className="col-span-1 flex items-center justify-end">
                    <MoreVertical className="w-4 h-4 text-neutral-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
