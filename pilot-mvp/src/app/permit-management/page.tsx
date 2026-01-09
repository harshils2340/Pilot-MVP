'use client';

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';

interface Permit {
  _id: string;
  name: string;
  description: string;
  category: string;
  authority: string;
  complexity: 'High' | 'Medium' | 'Low';
  estimatedTime: string;
  fees: string;
}

export default function PermitManagementPage() {
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPermits = async () => {
      try {
        const res = await fetch('/api/permits');
        const data = await res.json();
        setPermits(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPermits();
  }, []);

  const filteredPermits = permits.filter((p) =>
    `${p.name} ${p.description} ${p.authority} ${p.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* ================= Sidebar ================= */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        <div className="px-6 py-5 border-b border-neutral-200">
          <h1 className="text-lg font-semibold text-neutral-900">Pilot</h1>
          <p className="text-xs text-neutral-500">Compliance Platform</p>
        </div>

        <div className="p-4 border-b border-neutral-200">
          <button className="flex items-center gap-2 text-sm text-neutral-600 hover:bg-neutral-100 px-3 py-2 rounded-lg w-full">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        <div className="flex-1" />

        <div className="p-4 border-t border-neutral-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-medium">
            JD
          </div>
          <div>
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-neutral-500">Consultant</p>
          </div>
        </div>
      </aside>

      {/* ================= Main Content ================= */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200 px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">
                Permit Management
              </h2>
              <p className="text-sm text-neutral-500">
                Manage all available permits in the system
              </p>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800">
              <Plus className="w-4 h-4" />
              Add New Permit
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search permits by name, description, authority, or category…"
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
              />
            </div>

            <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          <p className="text-sm text-neutral-500 mt-3">
            Showing {filteredPermits.length} of {permits.length} permits
          </p>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-8">
          {loading ? (
            <p className="text-sm text-neutral-500">Loading permits...</p>
          ) : (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 px-6 py-3 bg-neutral-50 text-xs font-medium text-neutral-500">
                <div className="col-span-3">Permit Name</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-3">Authority</div>
                <div className="col-span-1">Complexity</div>
                <div className="col-span-1">Est. Time</div>
                <div className="col-span-1">Fees</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {filteredPermits.map((p) => (
                <div
                  key={p._id}
                  className="grid grid-cols-12 px-6 py-4 border-t hover:bg-neutral-50"
                >
                  <div className="col-span-3">
                    <p className="font-medium text-neutral-900">{p.name}</p>
                    <p className="text-xs text-neutral-500">{p.description}</p>
                  </div>

                  <div className="col-span-2">
                    <span className="px-2 py-1 text-xs bg-neutral-100 rounded-full">
                      {p.category}
                    </span>
                  </div>

                  <div className="col-span-3 text-sm text-neutral-600">
                    {p.authority}
                  </div>

                  <div className="col-span-1">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        p.complexity === 'High'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {p.complexity}
                    </span>
                  </div>

                  <div className="col-span-1 text-sm">{p.estimatedTime}</div>
                  <div className="col-span-1 text-sm">{p.fees}</div>

                  <div className="col-span-1 flex justify-end gap-2">
                    <Eye className="w-4 h-4 text-neutral-500 cursor-pointer" />
                    <Pencil className="w-4 h-4 text-neutral-500 cursor-pointer" />
                    <Trash2 className="w-4 h-4 text-red-500 cursor-pointer" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
