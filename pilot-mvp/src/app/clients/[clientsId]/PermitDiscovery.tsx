// import { Search, MapPin, Building2, Briefcase, AlertTriangle, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
// import { useState } from 'react';

// interface Permit {
//   id: string;
//   name: string;
//   authority: string;
//   complexity: 'low' | 'medium' | 'high';
//   status: 'not-started' | 'in-progress' | 'completed';
//   estimatedTime: string;
//   description: string;
//   category: string;
// }

// const mockPermits: Permit[] = [
//   {
//     id: 'p1',
//     name: 'Food Service Establishment Permit',
//     authority: 'San Francisco Dept. of Public Health',
//     complexity: 'high',
//     status: 'in-progress',
//     estimatedTime: '4-6 weeks',
//     description: 'Required for all food service operations',
//     category: 'Health & Safety',
//   },
//   {
//     id: 'p2',
//     name: 'Business Operating Permit',
//     authority: 'City of San Francisco',
//     complexity: 'medium',
//     status: 'not-started',
//     estimatedTime: '2-3 weeks',
//     description: 'General business operation authorization',
//     category: 'Business',
//   },
//   {
//     id: 'p3',
//     name: 'Seller\'s Permit',
//     authority: 'California Department of Tax and Fee Admin',
//     complexity: 'low',
//     status: 'completed',
//     estimatedTime: '1-2 weeks',
//     description: 'Required for selling tangible goods',
//     category: 'Tax',
//   },
//   {
//     id: 'p4',
//     name: 'Building Modification Permit',
//     authority: 'San Francisco Dept. of Building Inspection',
//     complexity: 'high',
//     status: 'not-started',
//     estimatedTime: '6-8 weeks',
//     description: 'Required for structural changes to commercial space',
//     category: 'Construction',
//   },
//   {
//     id: 'p5',
//     name: 'Health Department Plan Review',
//     authority: 'San Francisco Dept. of Public Health',
//     complexity: 'medium',
//     status: 'not-started',
//     estimatedTime: '3-4 weeks',
//     description: 'Review of food service layout and equipment',
//     category: 'Health & Safety',
//   },
//   {
//     id: 'p6',
//     name: 'Fire Department Inspection',
//     authority: 'San Francisco Fire Department',
//     complexity: 'medium',
//     status: 'not-started',
//     estimatedTime: '2-3 weeks',
//     description: 'Fire safety compliance inspection',
//     category: 'Safety',
//   },
// ];

// interface PermitDiscoveryProps {
//   onSelectPermit: (permitId: string) => void;
// }

// export function PermitDiscovery({ onSelectPermit }: PermitDiscoveryProps) {
//   const [businessType, setBusinessType] = useState('Restaurant');
//   const [location, setLocation] = useState('San Francisco, CA');
//   const [activities, setActivities] = useState('Food preparation and service, indoor dining');

//   const getComplexityColor = (complexity: Permit['complexity']) => {
//     switch (complexity) {
//       case 'low':
//         return 'bg-green-50 text-green-700 border-green-200';
//       case 'medium':
//         return 'bg-amber-50 text-amber-700 border-amber-200';
//       case 'high':
//         return 'bg-red-50 text-red-700 border-red-200';
//     }
//   };

//   const getStatusIcon = (status: Permit['status']) => {
//     switch (status) {
//       case 'completed':
//         return <CheckCircle2 className="w-4 h-4 text-green-600" />;
//       case 'in-progress':
//         return <Clock className="w-4 h-4 text-blue-600" />;
//       case 'not-started':
//         return <AlertTriangle className="w-4 h-4 text-neutral-400" />;
//     }
//   };

//   const getStatusLabel = (status: Permit['status']) => {
//     switch (status) {
//       case 'completed':
//         return 'Completed';
//       case 'in-progress':
//         return 'In Progress';
//       case 'not-started':
//         return 'Not Started';
//     }
//   };

//   const getStatusColor = (status: Permit['status']) => {
//     switch (status) {
//       case 'completed':
//         return 'bg-green-50 text-green-700 border-green-200';
//       case 'in-progress':
//         return 'bg-blue-50 text-blue-700 border-blue-200';
//       case 'not-started':
//         return 'bg-neutral-50 text-neutral-600 border-neutral-200';
//     }
//   };

//   return (
//     <div className="h-full flex">
//       {/* Input Panel */}
//       <div className="w-96 bg-white border-r border-neutral-200 flex flex-col">
//         <div className="p-6 border-b border-neutral-200">
//           <h2 className="text-neutral-900 mb-1">Permit Discovery</h2>
//           <p className="text-neutral-600 text-sm">AI-powered permit requirement analysis</p>
//         </div>

//         <div className="flex-1 overflow-auto p-6 space-y-6">
//           <div>
//             <label className="block text-sm font-medium text-neutral-700 mb-2">
//               <Building2 className="w-4 h-4 inline mr-2" />
//               Business Type
//             </label>
//             <input
//               type="text"
//               value={businessType}
//               onChange={(e) => setBusinessType(e.target.value)}
//               className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
//               placeholder="e.g., Restaurant, Retail, Manufacturing"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-neutral-700 mb-2">
//               <MapPin className="w-4 h-4 inline mr-2" />
//               Location
//             </label>
//             <input
//               type="text"
//               value={location}
//               onChange={(e) => setLocation(e.target.value)}
//               className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
//               placeholder="City, State or full address"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-neutral-700 mb-2">
//               <Briefcase className="w-4 h-4 inline mr-2" />
//               Business Activities
//             </label>
//             <textarea
//               value={activities}
//               onChange={(e) => setActivities(e.target.value)}
//               rows={4}
//               className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
//               placeholder="Describe your business activities..."
//             />
//           </div>

//           <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors">
//             <Search className="w-4 h-4" />
//             Analyze Requirements
//           </button>

//           <div className="pt-4 border-t border-neutral-200">
//             <p className="text-xs text-neutral-500">
//               AI analyzes your business profile against federal, state, and local regulatory databases to
//               identify required permits and licenses.
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Results Panel */}
//       <div className="flex-1 flex flex-col">
//         <div className="bg-white border-b border-neutral-200 px-8 py-6">
//           <div className="flex items-center justify-between mb-2">
//             <h2 className="text-neutral-900">Required Permits & Licenses</h2>
//             <span className="text-sm text-neutral-600">{mockPermits.length} permits identified</span>
//           </div>
//           <p className="text-neutral-600">Based on: {businessType} • {location}</p>
//         </div>

//         <div className="flex-1 overflow-auto p-8">
//           <div className="space-y-3">
//             {mockPermits.map((permit) => (
//               <div
//                 key={permit.id}
//                 onClick={() => onSelectPermit(permit.id)}
//                 className="bg-white rounded-lg border border-neutral-200 p-5 hover:shadow-md hover:border-neutral-300 cursor-pointer transition-all"
//               >
//                 <div className="flex items-start justify-between mb-3">
//                   <div className="flex-1">
//                     <div className="flex items-center gap-2 mb-1">
//                       <h3 className="font-medium text-neutral-900">{permit.name}</h3>
//                       <span
//                         className={`px-2 py-0.5 rounded text-xs font-medium border ${getComplexityColor(
//                           permit.complexity
//                         )}`}
//                       >
//                         {permit.complexity} complexity
//                       </span>
//                     </div>
//                     <p className="text-sm text-neutral-600">{permit.description}</p>
//                   </div>
//                   <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0 ml-4" />
//                 </div>

//                 <div className="grid grid-cols-3 gap-4 pt-3 border-t border-neutral-100">
//                   <div>
//                     <p className="text-xs text-neutral-500 mb-1">Issuing Authority</p>
//                     <p className="text-sm text-neutral-900">{permit.authority}</p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-neutral-500 mb-1">Estimated Timeline</p>
//                     <p className="text-sm text-neutral-900">{permit.estimatedTime}</p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-neutral-500 mb-1">Status</p>
//                     <span
//                       className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(
//                         permit.status
//                       )}`}
//                     >
//                       {getStatusIcon(permit.status)}
//                       {getStatusLabel(permit.status)}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }





// 'use client';

// import { Search, MapPin, Building2, Briefcase, AlertTriangle, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
// import { useState, useEffect } from 'react';

// interface Permit {
//   id: string;
//   name: string;
//   authority: string;
//   complexity: 'low' | 'medium' | 'high';
//   status: 'not-started' | 'in-progress' | 'completed';
//   estimatedTime: string;
//   description: string;
//   category: string;
// }

// const mockPermits: Permit[] = [
//   {
//     id: 'p1',
//     name: 'Food Service Establishment Permit',
//     authority: 'San Francisco Dept. of Public Health',
//     complexity: 'high',
//     status: 'in-progress',
//     estimatedTime: '4-6 weeks',
//     description: 'Required for all food service operations',
//     category: 'Health & Safety',
//   },
//   {
//     id: 'p2',
//     name: 'Business Operating Permit',
//     authority: 'City of San Francisco',
//     complexity: 'medium',
//     status: 'not-started',
//     estimatedTime: '2-3 weeks',
//     description: 'General business operation authorization',
//     category: 'Business',
//   },
//   {
//     id: 'p3',
//     name: "Seller's Permit",
//     authority: 'California Department of Tax and Fee Admin',
//     complexity: 'low',
//     status: 'completed',
//     estimatedTime: '1-2 weeks',
//     description: 'Required for selling tangible goods',
//     category: 'Tax',
//   },
//   {
//     id: 'p4',
//     name: 'Building Modification Permit',
//     authority: 'San Francisco Dept. of Building Inspection',
//     complexity: 'high',
//     status: 'not-started',
//     estimatedTime: '6-8 weeks',
//     description: 'Required for structural changes to commercial space',
//     category: 'Construction',
//   },
//   {
//     id: 'p5',
//     name: 'Health Department Plan Review',
//     authority: 'San Francisco Dept. of Public Health',
//     complexity: 'medium',
//     status: 'not-started',
//     estimatedTime: '3-4 weeks',
//     description: 'Review of food service layout and equipment',
//     category: 'Health & Safety',
//   },
//   {
//     id: 'p6',
//     name: 'Fire Department Inspection',
//     authority: 'San Francisco Fire Department',
//     complexity: 'medium',
//     status: 'not-started',
//     estimatedTime: '2-3 weeks',
//     description: 'Fire safety compliance inspection',
//     category: 'Safety',
//   },
// ];

// interface Client {
//   _id: string;
//   businessName: string;
//   jurisdiction: string;
//   activePermits: number;
//   status: string;
//   lastActivity: string;
//   completionRate: number;
// }

// interface PermitDiscoveryProps {
//   clientId?: string;
//   client?: Client | null;
//   isNewPermit?: boolean;
// }

// export function PermitDiscovery({ clientId, client }: PermitDiscoveryProps) {
//   const [businessType, setBusinessType] = useState('Restaurant');
//   const [location, setLocation] = useState(client?.jurisdiction || 'San Francisco, CA');
//   const [activities, setActivities] = useState('Food preparation and service, indoor dining');

//   // Update location when client data is available
//   useEffect(() => {
//     if (client?.jurisdiction) {
//       setLocation(client.jurisdiction);
//     }
//   }, [client]);

//   const getComplexityColor = (complexity: Permit['complexity']) => {
//     switch (complexity) {
//       case 'low':
//         return 'bg-green-50 text-green-700 border-green-200';
//       case 'medium':
//         return 'bg-amber-50 text-amber-700 border-amber-200';
//       case 'high':
//         return 'bg-red-50 text-red-700 border-red-200';
//     }
//   };

//   const getStatusIcon = (status: Permit['status']) => {
//     switch (status) {
//       case 'completed':
//         return <CheckCircle2 className="w-4 h-4 text-green-600" />;
//       case 'in-progress':
//         return <Clock className="w-4 h-4 text-blue-600" />;
//       case 'not-started':
//         return <AlertTriangle className="w-4 h-4 text-neutral-400" />;
//     }
//   };

//   const getStatusLabel = (status: Permit['status']) => {
//     switch (status) {
//       case 'completed':
//         return 'Completed';
//       case 'in-progress':
//         return 'In Progress';
//       case 'not-started':
//         return 'Not Started';
//     }
//   };

//   const getStatusColor = (status: Permit['status']) => {
//     switch (status) {
//       case 'completed':
//         return 'bg-green-50 text-green-700 border-green-200';
//       case 'in-progress':
//         return 'bg-blue-50 text-blue-700 border-blue-200';
//       case 'not-started':
//         return 'bg-neutral-50 text-neutral-600 border-neutral-200';
//     }
//   };

//   return (
//     <div className="h-full flex">
//       {/* Input Panel */}
//       <div className="w-96 bg-white border-r border-neutral-200 flex flex-col">
//         <div className="p-6 border-b border-neutral-200">
//           <h2 className="text-neutral-900 mb-1">Permit Discovery</h2>
//           <p className="text-neutral-600 text-sm">
//             AI-powered permit requirement analysis for client: {client?.businessName || clientId}
//           </p>
//         </div>

//         <div className="flex-1 overflow-auto p-6 space-y-6">
//           <div>
//             <label className="block text-sm font-medium text-neutral-700 mb-2">
//               <Building2 className="w-4 h-4 inline mr-2" />
//               Business Type
//             </label>
//             <input
//               type="text"
//               value={businessType}
//               onChange={(e) => setBusinessType(e.target.value)}
//               className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
//               placeholder="e.g., Restaurant, Retail, Manufacturing"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-neutral-700 mb-2">
//               <MapPin className="w-4 h-4 inline mr-2" />
//               Location
//             </label>
//             <input
//               type="text"
//               value={location}
//               onChange={(e) => setLocation(e.target.value)}
//               className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
//               placeholder="City, State or full address"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-neutral-700 mb-2">
//               <Briefcase className="w-4 h-4 inline mr-2" />
//               Business Activities
//             </label>
//             <textarea
//               value={activities}
//               onChange={(e) => setActivities(e.target.value)}
//               rows={4}
//               className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
//               placeholder="Describe your business activities..."
//             />
//           </div>

//           <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors">
//             <Search className="w-4 h-4" />
//             Analyze Requirements
//           </button>

//           <div className="pt-4 border-t border-neutral-200">
//             <p className="text-xs text-neutral-500">
//               AI analyzes your business profile against federal, state, and local regulatory databases to
//               identify required permits and licenses.
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Results Panel */}
//       <div className="flex-1 flex flex-col">
//         <div className="bg-white border-b border-neutral-200 px-8 py-6">
//           <div className="flex items-center justify-between mb-2">
//             <h2 className="text-neutral-900">Required Permits & Licenses</h2>
//             <span className="text-sm text-neutral-600">{mockPermits.length} permits identified</span>
//           </div>
//           <p className="text-neutral-600">Based on: {businessType} • {location}</p>
//         </div>

//         <div className="flex-1 overflow-auto p-8">
//           <div className="space-y-3">
//             {mockPermits.map((permit) => (
//               <div
//                 key={permit.id}
//                 className="bg-white rounded-lg border border-neutral-200 p-5 hover:shadow-md hover:border-neutral-300 cursor-pointer transition-all"
//               >
//                 <div className="flex items-start justify-between mb-3">
//                   <div className="flex-1">
//                     <div className="flex items-center gap-2 mb-1">
//                       <h3 className="font-medium text-neutral-900">{permit.name}</h3>
//                       <span
//                         className={`px-2 py-0.5 rounded text-xs font-medium border ${getComplexityColor(
//                           permit.complexity
//                         )}`}
//                       >
//                         {permit.complexity} complexity
//                       </span>
//                     </div>
//                     <p className="text-sm text-neutral-600">{permit.description}</p>
//                   </div>
//                   <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0 ml-4" />
//                 </div>

//                 <div className="grid grid-cols-3 gap-4 pt-3 border-t border-neutral-100">
//                   <div>
//                     <p className="text-xs text-neutral-500 mb-1">Issuing Authority</p>
//                     <p className="text-sm text-neutral-900">{permit.authority}</p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-neutral-500 mb-1">Estimated Timeline</p>
//                     <p className="text-sm text-neutral-900">{permit.estimatedTime}</p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-neutral-500 mb-1">Status</p>
//                     <span
//                       className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(
//                         permit.status
//                       )}`}
//                     >
//                       {getStatusIcon(permit.status)}
//                       {getStatusLabel(permit.status)}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }







'use client';

import { Search, MapPin, Building2, Briefcase, Plus, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { BUSINESS_TYPES } from '@/constants/businessTypes';
import { ACTIVITIES } from '@/constants/activities';

type PermitConfidence = 'required' | 'conditional' | 'informational';

interface APIPermit {
  _id?: string;
  id?: string;
  name: string;
  authority: string;
  applyUrl?: string;
  sourceUrl?: string;
  lastUpdated?: string;
  reasons?: string[];
  confidence?: PermitConfidence;
  level?: string;
  jurisdiction?: {
    city?: string;
  };
  contactInfo?: {
    municipality?: string;
    phone?: string;
    email?: string;
    address?: {
      fullAddress?: string;
    };
  };
  activities?: string[];
  prerequisites?: string;
}

interface Client {
  _id: string;
  businessName: string;
  jurisdiction: string;
  activePermits: number;
  status: string;
  lastActivity: string;
  completionRate: number;
}

interface PermitDiscoveryProps {
  clientId?: string;
  client?: Client | null;
  isNewPermit?: boolean;
}

export function PermitDiscovery({ clientId, client }: PermitDiscoveryProps) {
  const [businessType, setBusinessType] = useState('Restaurant');
  const [location, setLocation] = useState(client?.jurisdiction || 'San Francisco, CA');
  const [activities, setActivities] = useState('Food preparation and service, indoor dining');

  const [permits, setPermits] = useState<APIPermit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addingPermitId, setAddingPermitId] = useState<string | null>(null);
  const [addedPermits, setAddedPermits] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (client?.jurisdiction) setLocation(client.jurisdiction);
  }, [client]);

  // Map user input to businessType slug
  const mapBusinessTypeToSlug = (input: string) => {
    const match = BUSINESS_TYPES.find(b =>
      b.slug.toLowerCase() === input.toLowerCase() ||
      (b.label && b.label.toLowerCase() === input.toLowerCase())
    );
    return match?.slug || null;
  };

  // Map user input to activity slugs (or just use input text if no match)
  const mapActivitiesToSlugs = (input: string) => {
    const inputLower = input.toLowerCase();
    const matchedSlugs = ACTIVITIES.filter(a =>
      (a.slug && inputLower.includes(a.slug.toLowerCase())) ||
      (a.label && inputLower.includes(a.label.toLowerCase()))
    ).map(a => a.slug);

    // If no matches, fallback to user input split by comma
    return matchedSlugs.length > 0
      ? matchedSlugs
      : input.split(',').map(a => a.trim()).filter(a => a.length > 0);
  };

  const analyzeRequirements = async () => {
  setError('');
  setLoading(true);

  try {
    if (!businessType || !location) {
      setError('Please enter business type and location.');
      setLoading(false);
      return;
    }

    const payload = {
      businessType,
      location,
      permitKeywords: activities // <-- IMPORTANT
    };

    console.log('🚀 Sending BizPaL payload:', payload);

    const res = await fetch('/api/bizpal/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('BizPaL search failed:', data);
      setError('BizPaL search failed. Please try again.');
      setPermits([]);
    } else {
      setPermits(data.permits || data || []);
    }
  } catch (err) {
    console.error('BizPaL search failed', err);
    setError('BizPaL search failed. Please try again.');
    setPermits([]);
  } finally {
    setLoading(false);
  }
};


  const getConfidenceColor = (confidence: PermitConfidence) => {
    switch (confidence) {
      case 'required': return 'bg-red-50 text-red-700 border-red-200';
      case 'conditional': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'informational': return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="h-full flex">
      {/* Input Panel */}
      <div className="w-96 bg-white border-r border-neutral-200 flex flex-col">
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-neutral-900 mb-1">Permit Discovery</h2>
          <p className="text-neutral-600 text-sm">
            AI-powered permit requirement analysis for client: {client?.businessName || clientId}
          </p>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Business Type */}
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

          {/* Location */}
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

          {/* Activities */}
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

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            onClick={analyzeRequirements}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Analyzing...' : 'Analyze Requirements'}
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
            <span className="text-sm text-neutral-600">{permits.length} permits identified</span>
          </div>
          <p className="text-neutral-600">Based on: {businessType} • {location}</p>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {permits.length === 0 && !loading ? (
            <p className="text-neutral-500">No permits found. Try updating your business type, location, or activities.</p>
          ) : (
            <div className="space-y-3">
              {permits.map((permit, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg border border-neutral-200 p-5 hover:shadow-md hover:border-neutral-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-neutral-900">{permit.name}</h3>
                        {permit.confidence && (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium border ${getConfidenceColor(
                              permit.confidence
                            )}`}
                          >
                            {permit.confidence.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {permit.reasons && permit.reasons.length > 0 && (
                        <p className="text-sm text-neutral-600">
                          Matched because: {permit.reasons.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 pb-4 border-b border-neutral-100">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Issuing Authority</p>
                      <p className="text-sm text-neutral-900">{permit.authority}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">Last Updated</p>
                      <p className="text-sm text-neutral-900">{permit.lastUpdated ? new Date(permit.lastUpdated).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={async () => {
                        if (!clientId) {
                          alert('Client ID is required to add permits');
                          return;
                        }
                        
                        setAddingPermitId(permit._id || permit.id || null);
                        try {
                          // Determine complexity from level
                          const complexity = permit.level === 'federal' ? 'high' : permit.level === 'municipal' ? 'low' : 'medium';
                          const category = permit.level === 'federal' ? 'Federal' 
                            : permit.level === 'municipal' ? 'Municipal' 
                            : 'Provincial';
                          
                          const response = await fetch(`/api/clients/${encodeURIComponent(clientId || '')}/permits`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              permitId: permit._id || permit.id || '',
                              name: permit.name,
                              authority: permit.authority,
                              municipality: permit.contactInfo?.municipality || permit.jurisdiction?.city || '',
                              complexity,
                              estimatedTime: 'N/A',
                              description: permit.activities?.[0] || permit.name || '',
                              category,
                              status: 'not-started',
                              order: 0,
                              requirements: permit.activities || [],
                              fees: 'N/A',
                              purpose: permit.prerequisites || '',
                              howToApply: permit.applyUrl ? `Apply at: ${permit.applyUrl}` : '',
                              contactInfo: {
                                phone: permit.contactInfo?.phone,
                                email: permit.contactInfo?.email,
                                website: permit.applyUrl || permit.sourceUrl,
                                address: permit.contactInfo?.address?.fullAddress || '',
                              },
                            }),
                          });
                          
                          if (response.ok) {
                            const permitId = permit._id || permit.id;
                            if (permitId) {
                              setAddedPermits(prev => new Set([...prev, permitId]));
                            }
                            alert(`Permit "${permit.name}" added successfully!`);
                          } else {
                            const errorData = await response.json();
                            alert(`Failed to add permit: ${errorData.error || 'Unknown error'}`);
                          }
                        } catch (err) {
                          console.error('Error adding permit:', err);
                          alert('Failed to add permit. Please try again.');
                        } finally {
                          setAddingPermitId(null);
                        }
                      }}
                      disabled={addingPermitId === (permit._id || permit.id) || (permit._id || permit.id ? addedPermits.has(permit._id || permit.id || '') : false)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingPermitId === (permit._id || permit.id) ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Adding...
                        </>
                      ) : (permit._id || permit.id) && addedPermits.has(permit._id || permit.id || '') ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Add Permit
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
