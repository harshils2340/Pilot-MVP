import { Plus, Search, Filter, MoreVertical, CheckCircle2, Clock, AlertCircle, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Client {
  _id: string;
  businessName: string;
  jurisdiction: string;
  activePermits: number;
  status: 'draft' | 'submitted' | 'approved' | 'action-required';
  lastActivity: string;
  completionRate: number;
}

interface WorkspaceDashboardProps {
  onSelectClient?: (clientId: string) => void;
  onStartPermit: () => void;
}

export function WorkspaceDashboard({ onSelectClient, onStartPermit }: WorkspaceDashboardProps) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/clients');
        if (res.ok) {
          const data = await res.json();
          setClients(data);
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleClientClick = (client: Client) => {
    if (onSelectClient) {
      onSelectClient(client._id);
    } else {
      // Navigate to client page using proper routing
      router.push(`/clients/${client._id}`);
    }
  };
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-neutral-900 mb-1">Workspace</h1>
            <p className="text-neutral-600">Manage clients and their regulatory compliance</p>
          </div>
          <button
            onClick={onStartPermit}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search clients, jurisdictions, or permit types..."
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Client List */}
      <div className="flex-1 overflow-auto p-8">
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-neutral-50 border-b border-neutral-200 text-sm font-medium text-neutral-600">
            <div className="col-span-3">Client</div>
            <div className="col-span-2">Jurisdiction</div>
            <div className="col-span-2">Active Permits</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Last Activity</div>
            <div className="col-span-1"></div>
          </div>

          {/* Table Rows */}
          {loading ? (
            <div className="p-8 text-center text-neutral-600">Loading clients...</div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center text-neutral-600">No clients found</div>
          ) : (
            clients.map((client) => (
              <div
                key={client._id}
                onClick={() => handleClientClick(client)}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors"
              >
              <div className="col-span-3">
                <p className="font-medium text-neutral-900">{client.businessName}</p>
                <div className="mt-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neutral-900 rounded-full"
                    style={{ width: `${client.completionRate}%` }}
                  />
                </div>
              </div>
              <div className="col-span-2 flex items-center text-neutral-600">
                {client.jurisdiction}
              </div>
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
                <button className="p-1 hover:bg-neutral-100 rounded transition-colors">
                  <MoreVertical className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
            </div>
            ))
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <p className="text-neutral-600 text-sm mb-1">Total Clients</p>
            <p className="text-neutral-900 font-semibold">{clients.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <p className="text-neutral-600 text-sm mb-1">Active Permits</p>
            <p className="text-neutral-900 font-semibold">34</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <p className="text-neutral-600 text-sm mb-1">Pending Review</p>
            <p className="text-neutral-900 font-semibold">12</p>
          </div>
          <div className="bg-white rounded-lg border border-neutral-200 p-5">
            <p className="text-neutral-600 text-sm mb-1">Action Required</p>
            <p className="text-amber-600 font-semibold">4</p>
          </div>
        </div>
      </div>
    </div>
  );
}
