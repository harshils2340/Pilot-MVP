import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit2, Trash2, X, Eye, Phone, Mail, Globe, MapPin, Info, FileText, AlertCircle, Loader2, FileCheck } from 'lucide-react';
import { ReviewPermitModal } from './ReviewPermitModal';

export interface PermitData {
  id: string;
  name: string;
  authority: string;
  complexity: 'low' | 'medium' | 'high';
  estimatedTime: string;
  description: string;
  category: string;
  requirements?: string[];
  fees?: string;
  purpose?: string;
  howToApply?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    officeHours?: string;
  };
  additionalNotes?: string;
}

// Mock data for all available permits in the system
const initialPermits: PermitData[] = [
  {
    id: 'p1',
    name: 'Food Service Establishment Permit',
    authority: 'San Francisco Dept. of Public Health',
    complexity: 'high',
    estimatedTime: '4-6 weeks',
    description: 'Required for all food service operations',
    category: 'Health & Safety',
    requirements: ['Floor plan', 'Equipment list', 'Food safety certification'],
    fees: '$500-$1,200',
    purpose: 'Ensure food safety and compliance with health regulations.',
    howToApply: 'Submit an application with the required documents to the San Francisco Dept. of Public Health.',
    contactInfo: {
      phone: '415-554-6300',
      email: 'foodservice@sf.gov',
      website: 'https://www.sf.gov/health',
      address: '1010 Market St, San Francisco, CA 94102',
      officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM',
    },
    additionalNotes: 'Renewal required annually.',
  },
  {
    id: 'p2',
    name: 'Business Operating Permit',
    authority: 'City of San Francisco',
    complexity: 'medium',
    estimatedTime: '2-3 weeks',
    description: 'General business operation authorization',
    category: 'Business',
    requirements: ['Business license', 'Zoning approval'],
    fees: '$200-$500',
    purpose: 'Authorize the operation of a business within the city limits.',
    howToApply: 'Submit an application with the required documents to the City of San Francisco.',
    contactInfo: {
      phone: '415-554-6300',
      email: 'business@sf.gov',
      website: 'https://www.sf.gov/business',
      address: '1010 Market St, San Francisco, CA 94102',
      officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM',
    },
    additionalNotes: 'Renewal required annually.',
  },
  {
    id: 'p3',
    name: 'Seller\'s Permit',
    authority: 'California Department of Tax and Fee Admin',
    complexity: 'low',
    estimatedTime: '1-2 weeks',
    description: 'Required for selling tangible goods',
    category: 'Tax',
    requirements: ['Business information', 'Tax ID'],
    fees: '$0 (no fee)',
    purpose: 'Authorize the sale of tangible goods and collect sales tax.',
    howToApply: 'Submit an application with the required documents to the California Department of Tax and Fee Admin.',
    contactInfo: {
      phone: '800-400-7115',
      email: 'taxes@tax.ca.gov',
      website: 'https://www.tax.ca.gov',
      address: '1500 I Street, Sacramento, CA 95814',
      officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM',
    },
    additionalNotes: 'Renewal required annually.',
  },
  {
    id: 'p4',
    name: 'Building Modification Permit',
    authority: 'San Francisco Dept. of Building Inspection',
    complexity: 'high',
    estimatedTime: '6-8 weeks',
    description: 'Required for structural changes to commercial space',
    category: 'Construction',
    requirements: ['Architectural plans', 'Engineer certification', 'Contractor license'],
    fees: '$1,000-$5,000',
    purpose: 'Ensure structural integrity and compliance with building codes.',
    howToApply: 'Submit an application with the required documents to the San Francisco Dept. of Building Inspection.',
    contactInfo: {
      phone: '415-554-6300',
      email: 'buildinginspection@sf.gov',
      website: 'https://www.sf.gov/buildinginspection',
      address: '1010 Market St, San Francisco, CA 94102',
      officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM',
    },
    additionalNotes: 'Renewal required annually.',
  },
  {
    id: 'p5',
    name: 'Health Department Plan Review',
    authority: 'San Francisco Dept. of Public Health',
    complexity: 'medium',
    estimatedTime: '3-4 weeks',
    description: 'Review of food service layout and equipment',
    category: 'Health & Safety',
    requirements: ['Floor plan', 'Equipment specifications'],
    fees: '$300-$800',
    purpose: 'Ensure food service layout and equipment meet health standards.',
    howToApply: 'Submit an application with the required documents to the San Francisco Dept. of Public Health.',
    contactInfo: {
      phone: '415-554-6300',
      email: 'foodservice@sf.gov',
      website: 'https://www.sf.gov/health',
      address: '1010 Market St, San Francisco, CA 94102',
      officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM',
    },
    additionalNotes: 'Renewal required annually.',
  },
  {
    id: 'p6',
    name: 'Fire Department Inspection',
    authority: 'San Francisco Fire Department',
    complexity: 'medium',
    estimatedTime: '2-3 weeks',
    description: 'Fire safety compliance inspection',
    category: 'Safety',
    requirements: ['Fire safety plan', 'Emergency exit plan'],
    fees: '$150-$400',
    purpose: 'Ensure compliance with fire safety regulations.',
    howToApply: 'Submit an application with the required documents to the San Francisco Fire Department.',
    contactInfo: {
      phone: '415-554-6300',
      email: 'firedepartment@sf.gov',
      website: 'https://www.sf.gov/firedepartment',
      address: '1010 Market St, San Francisco, CA 94102',
      officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM',
    },
    additionalNotes: 'Renewal required annually.',
  },
  {
    id: 'p7',
    name: 'Alcohol Beverage Control License',
    authority: 'California Department of ABC',
    complexity: 'high',
    estimatedTime: '8-12 weeks',
    description: 'License to sell alcoholic beverages',
    category: 'Licensing',
    requirements: ['Background check', 'Premises approval', 'Public notice'],
    fees: '$1,000-$15,000',
    purpose: 'Authorize the sale of alcoholic beverages.',
    howToApply: 'Submit an application with the required documents to the California Department of ABC.',
    contactInfo: {
      phone: '800-400-7115',
      email: 'abc@tax.ca.gov',
      website: 'https://www.tax.ca.gov',
      address: '1500 I Street, Sacramento, CA 95814',
      officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM',
    },
    additionalNotes: 'Renewal required annually.',
  },
  {
    id: 'p8',
    name: 'Sign Permit',
    authority: 'City Planning Department',
    complexity: 'low',
    estimatedTime: '1-2 weeks',
    description: 'Permit for exterior business signage',
    category: 'Business',
    requirements: ['Sign design', 'Location specifications'],
    fees: '$100-$300',
    purpose: 'Authorize the installation of exterior business signage.',
    howToApply: 'Submit an application with the required documents to the City Planning Department.',
    contactInfo: {
      phone: '415-554-6300',
      email: 'planning@sf.gov',
      website: 'https://www.sf.gov/planning',
      address: '1010 Market St, San Francisco, CA 94102',
      officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM',
    },
    additionalNotes: 'Renewal required annually.',
  },
  {
    id: 'p9',
    name: 'Environmental Health Permit',
    authority: 'County Environmental Health',
    complexity: 'medium',
    estimatedTime: '3-5 weeks',
    description: 'Environmental compliance for business operations',
    category: 'Environmental',
    requirements: ['Environmental assessment', 'Waste disposal plan'],
    fees: '$250-$600',
    purpose: 'Ensure environmental compliance for business operations.',
    howToApply: 'Submit an application with the required documents to the County Environmental Health.',
    contactInfo: {
      phone: '415-554-6300',
      email: 'environmentalhealth@sf.gov',
      website: 'https://www.sf.gov/environmentalhealth',
      address: '1010 Market St, San Francisco, CA 94102',
      officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM',
    },
    additionalNotes: 'Renewal required annually.',
  },
  {
    id: 'p10',
    name: 'Entertainment Permit',
    authority: 'City Entertainment Commission',
    complexity: 'medium',
    estimatedTime: '4-6 weeks',
    description: 'Permit for live entertainment and events',
    category: 'Entertainment',
    requirements: ['Sound control plan', 'Security plan'],
    fees: '$500-$1,500',
    purpose: 'Authorize live entertainment and events.',
    howToApply: 'Submit an application with the required documents to the City Entertainment Commission.',
    contactInfo: {
      phone: '415-554-6300',
      email: 'entertainment@sf.gov',
      website: 'https://www.sf.gov/entertainment',
      address: '1010 Market St, San Francisco, CA 94102',
      officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM',
    },
    additionalNotes: 'Renewal required annually.',
  },
];

interface PermitManagementProps {
  onClose?: () => void;
}

export function PermitManagement({ onClose }: PermitManagementProps) {
  const [permits, setPermits] = useState<PermitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedComplexities, setSelectedComplexities] = useState<string[]>([]);
  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>([]);
  const [editingPermit, setEditingPermit] = useState<PermitData | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deletingPermitId, setDeletingPermitId] = useState<string | null>(null);
  const [viewingPermit, setViewingPermit] = useState<PermitData | null>(null);
  const [reviewingPermitId, setReviewingPermitId] = useState<string | null>(null);
  const [reviewingPermitName, setReviewingPermitName] = useState<string>('');

  // Fetch permits from API on mount
  useEffect(() => {
    const fetchPermits = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/permits/management');
        if (res.ok) {
          const data = await res.json();
          setPermits(data);
        } else {
          console.error('Failed to fetch permits');
          // Fallback to mock data if API fails
          setPermits(initialPermits);
        }
      } catch (error) {
        console.error('Error fetching permits:', error);
        // Fallback to mock data if API fails
        setPermits(initialPermits);
      } finally {
        setLoading(false);
      }
    };
    fetchPermits();
  }, []);

  // Form state
  const [formData, setFormData] = useState<Partial<PermitData>>({
    name: '',
    authority: '',
    complexity: 'medium',
    estimatedTime: '',
    description: '',
    category: '',
    requirements: [],
    fees: '',
    purpose: '',
    howToApply: '',
    contactInfo: {
      phone: '',
      email: '',
      website: '',
      address: '',
      officeHours: '',
    },
    additionalNotes: '',
  });
  const [requirementInput, setRequirementInput] = useState('');

  // Extract unique values for filters
  const categories = Array.from(new Set(permits.map((p) => p.category)));
  const complexities = ['low', 'medium', 'high'];
  const authorities = Array.from(new Set(permits.map((p) => p.authority)));

  // Filter permits based on search and filters
  const filteredPermits = permits.filter((permit) => {
    const matchesSearch =
      searchQuery === '' ||
      permit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.authority.toLowerCase().includes(searchQuery.toLowerCase()) ||
      permit.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(permit.category);

    const matchesComplexity =
      selectedComplexities.length === 0 || selectedComplexities.includes(permit.complexity);

    const matchesAuthority =
      selectedAuthorities.length === 0 || selectedAuthorities.includes(permit.authority);

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
    setSearchQuery('');
  };

  const getComplexityColor = (complexity: PermitData['complexity']) => {
    switch (complexity) {
      case 'low':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const handleDeletePermit = async (permitId: string) => {
    try {
      const res = await fetch(`/api/permits/management/${permitId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPermits(permits.filter((p) => p.id !== permitId));
        setDeletingPermitId(null);
      } else {
        alert('Failed to delete permit');
      }
    } catch (error) {
      console.error('Error deleting permit:', error);
      alert('Failed to delete permit');
    }
  };

  const handleOpenAddNew = () => {
    setFormData({
      name: '',
      authority: '',
      complexity: 'medium',
      estimatedTime: '',
      description: '',
      category: '',
      requirements: [],
      fees: '',
      purpose: '',
      howToApply: '',
      contactInfo: {
        phone: '',
        email: '',
        website: '',
        address: '',
        officeHours: '',
      },
      additionalNotes: '',
    });
    setRequirementInput('');
    setIsAddingNew(true);
    setEditingPermit(null);
  };

  const handleOpenEdit = (permit: PermitData) => {
    setFormData({ ...permit });
    setRequirementInput('');
    setEditingPermit(permit);
    setIsAddingNew(false);
  };

  const handleCloseModal = () => {
    setIsAddingNew(false);
    setEditingPermit(null);
    setFormData({
      name: '',
      authority: '',
      complexity: 'medium',
      estimatedTime: '',
      description: '',
      category: '',
      requirements: [],
      fees: '',
      purpose: '',
      howToApply: '',
      contactInfo: {
        phone: '',
        email: '',
        website: '',
        address: '',
        officeHours: '',
      },
      additionalNotes: '',
    });
    setRequirementInput('');
  };

  const handleAddRequirement = () => {
    if (requirementInput.trim()) {
      setFormData({
        ...formData,
        requirements: [...(formData.requirements || []), requirementInput.trim()],
      });
      setRequirementInput('');
    }
  };

  const handleRemoveRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements?.filter((_, i) => i !== index) || [],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.authority || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingPermit) {
        // Update existing permit via API
        const res = await fetch(`/api/permits/management/${editingPermit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const updated = await res.json();
          setPermits(permits.map((p) => (p.id === editingPermit.id ? updated : p)));
        } else {
          alert('Failed to update permit');
          return;
        }
      } else {
        // Add new permit via API
        const res = await fetch('/api/permits/management', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const newPermit = await res.json();
          setPermits([...permits, newPermit]);
        } else {
          alert('Failed to create permit');
          return;
        }
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving permit:', error);
      alert('Failed to save permit');
    }
  };

  const activeFilterCount =
    selectedCategories.length + selectedComplexities.length + selectedAuthorities.length;

  // Show full-page loading state until data is loaded
  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-page-bg">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">Loading permits...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-foreground text-2xl font-semibold">Permit Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage all available permits in the system
            </p>
          </div>
          <button
            onClick={handleOpenAddNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Permit
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface border-b border-border px-8 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search permits by name, description, authority, or category..."
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
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
                <p className="text-sm font-medium text-foreground mb-2">Category</p>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() =>
                          toggleFilter(selectedCategories, setSelectedCategories, category)
                        }
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
                        onChange={() =>
                          toggleFilter(selectedComplexities, setSelectedComplexities, complexity)
                        }
                        className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
                      />
                      <span className="text-sm text-foreground capitalize">{complexity}</span>
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
                        onChange={() =>
                          toggleFilter(selectedAuthorities, setSelectedAuthorities, authority)
                        }
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
      </div>

      {/* Results Count */}
      <div className="px-8 py-3 bg-neutral-100 border-b border-neutral-200">
        <p className="text-sm text-neutral-600">
          Showing <span className="font-medium text-neutral-900">{filteredPermits.length}</span> of{' '}
          <span className="font-medium text-neutral-900">{permits.length}</span> permits
        </p>
      </div>

      {/* Permits Table */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Permit Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Authority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Complexity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Est. Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Fees
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPermits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-muted-foreground">
                        {permits.length === 0 
                          ? 'No permits found. Click "Add New Permit" to create one.'
                          : 'No permits found matching your criteria'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPermits.map((permit) => (
                  <tr 
                    key={permit.id} 
                    className="hover:bg-neutral-50 transition-colors cursor-pointer"
                    onClick={() => setViewingPermit(permit)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{permit.name}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{permit.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-700 rounded">
                        {permit.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{permit.authority}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium border rounded capitalize ${getComplexityColor(
                          permit.complexity
                        )}`}
                      >
                        {permit.complexity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">{permit.estimatedTime}</td>
                    <td className="px-6 py-4 text-sm text-neutral-700">{permit.fees}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setReviewingPermitId(permit.id);
                            setReviewingPermitName(permit.name);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Review permit"
                        >
                          <FileCheck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewingPermit(permit)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(permit)}
                          className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                          title="Edit permit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingPermitId(permit.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete permit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog - Placeholder */}
      {deletingPermitId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Delete Permit</h3>
            <p className="text-neutral-600 mb-6">
              Are you sure you want to delete this permit? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeletingPermitId(null)}
                className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePermit(deletingPermitId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Permit Modal */}
      {(isAddingNew || editingPermit) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">
                {editingPermit ? 'Edit Permit' : 'Add New Permit'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                {/* Permit Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Permit Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Food Service Establishment Permit"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the permit..."
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                  />
                </div>

                {/* Two column layout for smaller fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Issuing Authority <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.authority || ''}
                      onChange={(e) => setFormData({ ...formData, authority: e.target.value })}
                      placeholder="e.g., San Francisco Dept. of Public Health"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.category || ''}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Health & Safety"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Complexity
                    </label>
                    <select
                      value={formData.complexity || 'medium'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          complexity: e.target.value as 'low' | 'medium' | 'high',
                        })
                      }
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Estimated Time
                    </label>
                    <input
                      type="text"
                      value={formData.estimatedTime || ''}
                      onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                      placeholder="e.g., 4-6 weeks"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Fees
                    </label>
                    <input
                      type="text"
                      value={formData.fees || ''}
                      onChange={(e) => setFormData({ ...formData, fees: e.target.value })}
                      placeholder="e.g., $500-$1,200 or $0 (no fee)"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Requirements
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={requirementInput}
                      onChange={(e) => setRequirementInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRequirement();
                        }
                      }}
                      placeholder="Add a requirement..."
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleAddRequirement}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {formData.requirements && formData.requirements.length > 0 && (
                    <div className="space-y-2">
                      {formData.requirements.map((requirement, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-2 px-3 py-2 bg-neutral-50 rounded-lg border border-neutral-200"
                        >
                          <span className="text-sm text-neutral-700">{requirement}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRequirement(index)}
                            className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="mt-8 pt-6 border-t border-neutral-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-colors"
                >
                  {editingPermit ? 'Update Permit' : 'Add Permit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Permit Details Modal */}
      {viewingPermit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-neutral-900">{viewingPermit.name}</h3>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium border rounded capitalize ${getComplexityColor(
                    viewingPermit.complexity
                  )}`}
                >
                  {viewingPermit.complexity} complexity
                </span>
              </div>
              <button
                onClick={() => setViewingPermit(null)}
                className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Overview Section */}
              <div className="mb-8">
                <h4 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Overview
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Category</p>
                    <p className="text-sm font-medium text-neutral-900">{viewingPermit.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Issuing Authority</p>
                    <p className="text-sm font-medium text-neutral-900">{viewingPermit.authority}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Estimated Processing Time</p>
                    <p className="text-sm font-medium text-neutral-900">{viewingPermit.estimatedTime}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">Fees</p>
                    <p className="text-sm font-medium text-neutral-900">{viewingPermit.fees}</p>
                  </div>
                </div>
                {viewingPermit.description && (
                  <div className="mt-4">
                    <p className="text-xs text-neutral-500 mb-1">Description</p>
                    <p className="text-sm text-neutral-700">{viewingPermit.description}</p>
                  </div>
                )}
              </div>

              {/* Purpose Section */}
              {viewingPermit.purpose && (
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Why You Need This Permit
                  </h4>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">{viewingPermit.purpose}</p>
                  </div>
                </div>
              )}

              {/* How to Apply Section */}
              {viewingPermit.howToApply && (
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    How to Apply
                  </h4>
                  <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                    <p className="text-sm text-neutral-700">{viewingPermit.howToApply}</p>
                  </div>
                </div>
              )}

              {/* Requirements Section */}
              {viewingPermit.requirements && viewingPermit.requirements.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-4">
                    Required Documents
                  </h4>
                  <div className="space-y-2">
                    {viewingPermit.requirements.map((requirement, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="text-sm text-neutral-700">{requirement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information Section */}
              {viewingPermit.contactInfo && (
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-4">
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {viewingPermit.contactInfo.phone && (
                      <div className="flex items-start gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                        <Phone className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">Phone</p>
                          <p className="text-sm font-medium text-neutral-900">
                            {viewingPermit.contactInfo.phone}
                          </p>
                        </div>
                      </div>
                    )}
                    {viewingPermit.contactInfo.email && (
                      <div className="flex items-start gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                        <Mail className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">Email</p>
                          <p className="text-sm font-medium text-neutral-900 break-all">
                            {viewingPermit.contactInfo.email}
                          </p>
                        </div>
                      </div>
                    )}
                    {viewingPermit.contactInfo.website && (
                      <div className="flex items-start gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                        <Globe className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">Website</p>
                          <a
                            href={viewingPermit.contactInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 break-all"
                          >
                            {viewingPermit.contactInfo.website}
                          </a>
                        </div>
                      </div>
                    )}
                    {viewingPermit.contactInfo.address && (
                      <div className="flex items-start gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                        <MapPin className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">Office Address</p>
                          <p className="text-sm font-medium text-neutral-900">
                            {viewingPermit.contactInfo.address}
                          </p>
                        </div>
                      </div>
                    )}
                    {viewingPermit.contactInfo.officeHours && (
                      <div className="col-span-2 flex items-start gap-3 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                        <Info className="w-5 h-5 text-neutral-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">Office Hours</p>
                          <p className="text-sm font-medium text-neutral-900">
                            {viewingPermit.contactInfo.officeHours}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Notes Section */}
              {viewingPermit.additionalNotes && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-4">
                    Additional Notes
                  </h4>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-900">{viewingPermit.additionalNotes}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t border-neutral-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setViewingPermit(null)}
                  className="px-5 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleOpenEdit(viewingPermit);
                    setViewingPermit(null);
                  }}
                  className="px-5 py-2.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Permit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
