'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Eye,
  Pencil,
  Trash2,
  FileCheck,
} from 'lucide-react';
import { ReviewPermitModal } from '@/app/components/ReviewPermitModal';

interface Permit {
  _id: string;
  name: string;
  description?: string;
  category?: string;
  authority?: string;
  complexity?: 'High' | 'Medium' | 'Low';
  estimatedTime?: string;
  fees?: string;
  prerequisites?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    fax?: string;
    address?: {
      fullAddress?: string;
      city?: string;
      province?: string;
      postalCode?: string;
      lines?: string[];
    };
    municipality?: string;
    municipalityUrl?: string;
    department?: string;
  };
  moreInfoUrl?: string;
  applyUrl?: string;
  lastVerified?: string;
  fullText?: string;
  fullHtml?: string;
  permitTitle?: string;
  expandedDetails?: {
    buttonLinks?: Array<{ text: string; url: string; target?: string }>;
    images?: Array<{ src: string; alt?: string; title?: string }>;
  };
}

export default function PermitManagementPage() {
  const router = useRouter();
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedPermits, setExpandedPermits] = useState<Set<string>>(new Set());
  const [permitDetails, setPermitDetails] = useState<Record<string, Permit>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedComplexities, setSelectedComplexities] = useState<string[]>([]);
  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [reviewingPermitId, setReviewingPermitId] = useState<string | null>(null);
  const [reviewingPermitName, setReviewingPermitName] = useState<string>('');

  // Get user info from localStorage (set after Google OAuth)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('userName');
      const storedEmail = localStorage.getItem('userEmail');
      if (storedName) setUserName(storedName);
      if (storedEmail) setUserEmail(storedEmail);
    }
  }, []);

  useEffect(() => {
    const fetchPermits = async () => {
      try {
        // Fetch ALL permits from the permits collection (global permit library)
        // NO clientId or client filtering - this shows all available permits in the system
        const res = await fetch('/api/permits');
        const data = await res.json();
        console.log(`✅ Permit Management: Fetched ${data.length} permits from /api/permits (permits collection - NO client filtering)`);
        setPermits(data);
      } catch (err) {
        console.error('❌ Error fetching permits:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPermits();
  }, []);

  // Extract unique values for filters
  const categories = Array.from(new Set(permits.map((p) => p.category).filter((c): c is string => Boolean(c))));
  const complexities = ['High', 'Medium', 'Low'] as const;
  const authorities = Array.from(new Set(permits.map((p) => p.authority).filter((a): a is string => Boolean(a))));

  // Filter permits based on search and filters
  const filteredPermits = permits.filter((p) => {
    const matchesSearch =
      search === '' ||
      `${p.name} ${p.description || ''} ${p.authority || ''} ${p.category || ''}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategories.length === 0 || (p.category && selectedCategories.includes(p.category));

    const matchesComplexity =
      selectedComplexities.length === 0 || (p.complexity && selectedComplexities.includes(p.complexity));

    const matchesAuthority =
      selectedAuthorities.length === 0 || (p.authority && selectedAuthorities.includes(p.authority));

    return matchesSearch && matchesCategory && matchesComplexity && matchesAuthority;
  });

  const toggleFilter = (filterArray: string[], setFilter: (arr: string[]) => void, value: string) => {
    if (filterArray.includes(value)) {
      setFilter(filterArray.filter((item) => item !== value));
    } else {
      setFilter([...filterArray, value]);
    }
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedComplexities([]);
    setSelectedAuthorities([]);
    setSearch('');
  };

  const activeFilterCount = selectedCategories.length + selectedComplexities.length + selectedAuthorities.length;

  const togglePermitDetails = async (permitId: string) => {
    if (expandedPermits.has(permitId)) {
      // Collapse
      setExpandedPermits(prev => {
        const newSet = new Set(prev);
        newSet.delete(permitId);
        return newSet;
      });
    } else {
      // Expand - fetch full details if not already loaded
      setExpandedPermits(prev => new Set(prev).add(permitId));
      
      if (!permitDetails[permitId]) {
        try {
          const res = await fetch(`/api/permits/${permitId}`);
          if (res.ok) {
            const details = await res.json();
            setPermitDetails(prev => ({ ...prev, [permitId]: details }));
          } else {
            // If fetch failed, set error state or use basic permit data
            console.error(`Failed to fetch permit details: ${res.status} ${res.statusText}`);
            // Use the basic permit data from the list as fallback
            const basicPermit = permits.find(p => p._id === permitId);
            if (basicPermit) {
              setPermitDetails(prev => ({ ...prev, [permitId]: basicPermit }));
            }
          }
        } catch (err) {
          console.error('Error fetching permit details:', err);
          // Use the basic permit data from the list as fallback
          const basicPermit = permits.find(p => p._id === permitId);
          if (basicPermit) {
            setPermitDetails(prev => ({ ...prev, [permitId]: basicPermit }));
          }
        }
      }
    }
  };

  return (
    <div className="flex h-screen bg-page-bg">
      {/* ================= Sidebar ================= */}
      <aside className="w-64 bg-surface border-r border-surface-border flex flex-col">
        <div className="px-6 py-5 border-b border-surface-border">
          <h1 className="text-lg font-semibold text-foreground">Pilot</h1>
          <p className="text-xs text-muted-foreground">Compliance Platform</p>
        </div>

        <div className="p-4 border-b border-surface-border">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:bg-accent px-3 py-2 rounded-lg w-full transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        <div className="flex-1" />

        <div className="p-4 border-t border-surface-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-foreground">
            {userName ? userName.charAt(0).toUpperCase() : userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{userName || userEmail || 'User'}</p>
            <p className="text-xs text-muted-foreground">Consultant</p>
          </div>
        </div>
      </aside>

      {/* ================= Main Content ================= */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-surface border-b border-surface-border px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                Permit Management
              </h2>
              <p className="text-sm text-muted-foreground">
                Manage all available permits in the system
              </p>
            </div>

            <button 
              onClick={() => router.push('/new-permit')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Permit
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search permits by name, description, authority, or category…"
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-surface text-foreground border-border hover:bg-accent'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-primary-foreground/20 text-primary-foreground text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {activeFilterCount}
                </span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
              <div className="grid grid-cols-3 gap-6">
                {/* Category Filter */}
                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-2">Category</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categories.map((category) => (
                      <label key={category} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleFilter(selectedCategories, setSelectedCategories, category)}
                        className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
                      />
                      <span className="text-sm text-foreground">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Complexity Filter */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Complexity</p>
                  <div className="space-y-2">
                    {complexities.map((complexity) => (
                      <label key={complexity} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedComplexities.includes(complexity)}
                          onChange={() => toggleFilter(selectedComplexities, setSelectedComplexities, complexity)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
                        />
                        <span className="text-sm text-foreground">{complexity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Authority Filter */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Issuing Authority</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {authorities.map((authority) => (
                      <label key={authority} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAuthorities.includes(authority)}
                          onChange={() => toggleFilter(selectedAuthorities, setSelectedAuthorities, authority)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
                        />
                        <span className="text-sm text-foreground">{authority}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-muted-foreground mt-3">
            Showing {filteredPermits.length} of {permits.length} permits
          </p>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-8">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading permits...</p>
          ) : (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-12 px-6 py-3 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground">
                <div className="col-span-3">Permit Name</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-3">Authority</div>
                <div className="col-span-1">Complexity</div>
                <div className="col-span-1">Est. Time</div>
                <div className="col-span-1">Fees</div>
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {filteredPermits.map((p, index) => {
                const isExpanded = expandedPermits.has(p._id);
                const details = permitDetails[p._id] || p;
                
                // Use combination of _id and index to ensure unique keys
                const uniqueKey = `${p._id}-${index}`;
                
                return (
                  <div key={uniqueKey}>
                    <div className="grid grid-cols-12 px-6 py-4 border-t hover:bg-neutral-50">
                  <div className="col-span-3">
                    <p className="font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.description || 'No description available'}</p>
                  </div>

                  <div className="col-span-2">
                    <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full">
                          {p.category || 'N/A'}
                    </span>
                  </div>

                  <div className="col-span-3 text-sm text-muted-foreground">
                        {p.authority || 'N/A'}
                  </div>

                  <div className="col-span-1">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        p.complexity === 'High'
                          ? 'bg-red-100 text-red-700'
                              : p.complexity === 'Low'
                              ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                          {p.complexity || 'Medium'}
                    </span>
                  </div>

                      <div className="col-span-1 text-sm">{p.estimatedTime || 'N/A'}</div>
                      <div className="col-span-1 text-sm">{p.fees || 'N/A'}</div>

                  <div className="col-span-1 flex justify-end gap-2">
                        <FileCheck
                          className="w-4 h-4 text-green-600 cursor-pointer hover:text-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewingPermitId(p._id);
                            setReviewingPermitName(p.name);
                          }}
                          title="Review permit"
                        />
                        <Eye className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground" />
                        <Pencil 
                          className={`w-4 h-4 cursor-pointer transition-colors ${
                            isExpanded ? 'text-blue-600' : 'text-muted-foreground hover:text-foreground'
                          }`}
                          onClick={() => togglePermitDetails(p._id)}
                        />
                        <Trash2 className="w-4 h-4 text-red-500 cursor-pointer hover:text-red-700" />
                      </div>
                    </div>
                    
                    {/* Expanded Details Section */}
                    {isExpanded && (
                      <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
                        {/* Check if permit has any details at all */}
                        {(!details.permitTitle && !details.prerequisites && !details.contactInfo && !details.expandedDetails?.buttonLinks?.length && !details.fullText && !details.lastVerified && !details.applyUrl && !details.moreInfoUrl) ? (
                          <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">No detailed information available for this permit.</p>
                            <p className="text-xs text-muted-foreground mt-2">This permit may not have been fully extracted or may not have additional details on the source website.</p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-6">
                              {/* Left Column */}
                              <div className="space-y-4">
                                {details.permitTitle && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-neutral-900 mb-2">Permit Title</h4>
                                    <p className="text-sm text-neutral-600 font-medium">{details.permitTitle}</p>
                                  </div>
                                )}
                                
                                <div>
                                  <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
                                  <p className="text-sm text-muted-foreground">{details.description || 'No description available'}</p>
                                </div>
                              
                                {details.prerequisites && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-neutral-900 mb-2">Prerequisites</h4>
                                    <p className="text-sm text-neutral-600 whitespace-pre-wrap">{details.prerequisites}</p>
                                  </div>
                                )}
                                
                                {details.contactInfo && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-2">Contact Information</h4>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                      {details.contactInfo.municipality && (
                                        <p>
                                          Municipality: {details.contactInfo.municipalityUrl ? (
                                            <a href={details.contactInfo.municipalityUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                              {details.contactInfo.municipality}
                                            </a>
                                          ) : (
                                            details.contactInfo.municipality
                                          )}
                                        </p>
                                      )}
                                      {details.contactInfo.department && (
                                        <p>Department: {details.contactInfo.department}</p>
                                      )}
                                      {details.contactInfo.email && (
                                        <p>Email: <a href={`mailto:${details.contactInfo.email}`} className="text-blue-600 hover:underline">{details.contactInfo.email}</a></p>
                                      )}
                                      {details.contactInfo.phone && (
                                        <p>Phone: {details.contactInfo.phone}</p>
                                      )}
                                      {details.contactInfo.fax && (
                                        <p>Fax: {details.contactInfo.fax}</p>
                                      )}
                                      {details.contactInfo.address?.fullAddress && (
                                        <p>Address: {details.contactInfo.address.fullAddress}</p>
                                      )}
                                      {details.contactInfo.address?.lines && details.contactInfo.address.lines.length > 0 && (
                                        <div>
                                          <p className="font-medium">Address:</p>
                                          {details.contactInfo.address.lines.map((line, idx) => (
                                            <p key={idx} className="pl-2">{line}</p>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* Right Column */}
                              <div className="space-y-4">
                                {details.lastVerified && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-neutral-900 mb-2">Last Verified</h4>
                                    <p className="text-sm text-neutral-600">{details.lastVerified}</p>
                                  </div>
                                )}
                                
                                {/* All Links from expandedDetails */}
                                {details.expandedDetails?.buttonLinks && details.expandedDetails.buttonLinks.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-2">All Links</h4>
                                    <div className="space-y-2">
                                      {details.expandedDetails.buttonLinks.map((link, idx) => (
                                        <a 
                                          key={idx}
                                          href={link.url} 
                                          target={link.target || '_blank'} 
                                          rel="noopener noreferrer"
                                          className="block text-sm text-blue-600 hover:underline"
                                        >
                                          {link.text || link.url}
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Fallback to individual URLs if expandedDetails not available */}
                                {(!details.expandedDetails?.buttonLinks || details.expandedDetails.buttonLinks.length === 0) && (details.applyUrl || details.moreInfoUrl) && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-neutral-900 mb-2">Links</h4>
                                    <div className="space-y-2">
                                      {details.applyUrl && details.applyUrl !== 'https://beta.bizpal-perle.ca/en' && (
                                        <a 
                                          href={details.applyUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="block text-sm text-blue-600 hover:underline"
                                        >
                                          Online Application Form
                                        </a>
                                      )}
                                      {details.moreInfoUrl && (
                                        <a 
                                          href={details.moreInfoUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="block text-sm text-blue-600 hover:underline"
                                        >
                                          More Information
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Images */}
                                {details.expandedDetails?.images && details.expandedDetails.images.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-2">Images</h4>
                                    <div className="space-y-2">
                                      {details.expandedDetails.images.map((img, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                          <img src={img.src} alt={img.alt || ''} className="max-w-xs max-h-32 object-contain" />
                                          {img.alt && <span className="text-xs text-neutral-500">{img.alt}</span>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Full Text Content (if available) */}
                            {details.fullText && (
                              <div className="mt-4 pt-4 border-t border-border">
                                <h4 className="text-sm font-semibold text-foreground mb-2">Full Text Content</h4>
                                <div className="text-xs text-muted-foreground bg-surface p-3 rounded border border-border max-h-40 overflow-y-auto">
                                  <pre className="whitespace-pre-wrap font-sans">{details.fullText}</pre>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Review Permit Modal */}
      {reviewingPermitId && (
        <ReviewPermitModal
          permitId={reviewingPermitId}
          permitName={reviewingPermitName}
          isOpen={!!reviewingPermitId}
          onClose={() => {
            setReviewingPermitId(null);
            setReviewingPermitName('');
          }}
        />
      )}
    </div>
  );
}
