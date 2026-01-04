import { Search, MapPin, Building2, Briefcase, AlertTriangle, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Permit {
  id: string;
  name: string;
  authority: string;
  complexity: 'low' | 'medium' | 'high';
  status: 'not-started' | 'in-progress' | 'completed';
  estimatedTime: string;
  description: string;
  category: string;
}

const mockPermits: Permit[] = [
  {
    id: 'p1',
    name: 'Food Service Establishment Permit',
    authority: 'San Francisco Dept. of Public Health',
    complexity: 'high',
    status: 'in-progress',
    estimatedTime: '4-6 weeks',
    description: 'Required for all food service operations',
    category: 'Health & Safety',
  },
  {
    id: 'p2',
    name: 'Business Operating Permit',
    authority: 'City of San Francisco',
    complexity: 'medium',
    status: 'not-started',
    estimatedTime: '2-3 weeks',
    description: 'General business operation authorization',
    category: 'Business',
  },
  {
    id: 'p3',
    name: 'Seller\'s Permit',
    authority: 'California Department of Tax and Fee Admin',
    complexity: 'low',
    status: 'completed',
    estimatedTime: '1-2 weeks',
    description: 'Required for selling tangible goods',
    category: 'Tax',
  },
  {
    id: 'p4',
    name: 'Building Modification Permit',
    authority: 'San Francisco Dept. of Building Inspection',
    complexity: 'high',
    status: 'not-started',
    estimatedTime: '6-8 weeks',
    description: 'Required for structural changes to commercial space',
    category: 'Construction',
  },
  {
    id: 'p5',
    name: 'Health Department Plan Review',
    authority: 'San Francisco Dept. of Public Health',
    complexity: 'medium',
    status: 'not-started',
    estimatedTime: '3-4 weeks',
    description: 'Review of food service layout and equipment',
    category: 'Health & Safety',
  },
  {
    id: 'p6',
    name: 'Fire Department Inspection',
    authority: 'San Francisco Fire Department',
    complexity: 'medium',
    status: 'not-started',
    estimatedTime: '2-3 weeks',
    description: 'Fire safety compliance inspection',
    category: 'Safety',
  },
];

interface PermitDiscoveryProps {
  onSelectPermit: (permitId: string) => void;
}

export function PermitDiscovery({ onSelectPermit }: PermitDiscoveryProps) {
  const [businessType, setBusinessType] = useState('Restaurant');
  const [location, setLocation] = useState('San Francisco, CA');
  const [activities, setActivities] = useState('Food preparation and service, indoor dining');

  const getComplexityColor = (complexity: Permit['complexity']) => {
    switch (complexity) {
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const getStatusIcon = (status: Permit['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'not-started':
        return <AlertTriangle className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getStatusLabel = (status: Permit['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'not-started':
        return 'Not Started';
    }
  };

  const getStatusColor = (status: Permit['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in-progress':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'not-started':
        return 'bg-neutral-50 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <div className="h-full flex">
      {/* Input Panel */}
      <div className="w-96 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-neutral-900 mb-1">Permit Discovery</h2>
          <p className="text-neutral-600 text-sm">AI-powered permit requirement analysis</p>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Building2 className="w-4 h-4 inline mr-2" />
              Business Type
            </label>
            <input
              type="text"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="e.g., Restaurant, Retail, Manufacturing"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="City, State or full address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Briefcase className="w-4 h-4 inline mr-2" />
              Business Activities
            </label>
            <textarea
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
              placeholder="Describe your business activities..."
            />
          </div>

          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors">
            <Search className="w-4 h-4" />
            Analyze Requirements
          </button>

          <div className="pt-4 border-t border-neutral-200">
            <p className="text-xs text-neutral-500">
              AI analyzes your business profile against federal, state, and local regulatory databases to
              identify required permits and licenses.
            </p>
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-neutral-200 px-8 py-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-neutral-900">Required Permits & Licenses</h2>
            <span className="text-sm text-neutral-600">{mockPermits.length} permits identified</span>
          </div>
          <p className="text-neutral-600">Based on: {businessType} • {location}</p>
        </div>

        <div className="flex-1 overflow-auto p-8">
          <div className="space-y-3">
            {mockPermits.map((permit) => (
              <div
                key={permit.id}
                onClick={() => onSelectPermit(permit.id)}
                className="bg-white rounded-lg border border-neutral-200 p-5 hover:shadow-md hover:border-neutral-300 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-neutral-900">{permit.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium border ${getComplexityColor(
                          permit.complexity
                        )}`}
                      >
                        {permit.complexity} complexity
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600">{permit.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0 ml-4" />
                </div>

                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-neutral-100">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Issuing Authority</p>
                    <p className="text-sm text-neutral-900">{permit.authority}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Estimated Timeline</p>
                    <p className="text-sm text-neutral-900">{permit.estimatedTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Status</p>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(
                        permit.status
                      )}`}
                    >
                      {getStatusIcon(permit.status)}
                      {getStatusLabel(permit.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
