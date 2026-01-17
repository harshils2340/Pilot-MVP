'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';

export default function NewPermitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Required fields
    name: '',
    level: 'provincial' as 'municipal' | 'provincial' | 'federal',
    authority: 'BizPaL',
    jurisdiction: {
      country: 'Canada',
      province: '',
      city: '',
    },
    businessTypes: [] as string[],
    activities: [] as string[],
    applyUrl: '',
    sourceUrl: '',
    // Optional fields
    prerequisites: '',
    contactInfo: {
      municipality: '',
      department: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        province: '',
        postalCode: '',
        fullAddress: '',
      },
    },
    lastVerified: '',
    moreInfoUrl: '',
    fullText: '',
    fullHtml: '',
    permitTitle: '',
  });

  const [newBusinessType, setNewBusinessType] = useState('');
  const [newActivity, setNewActivity] = useState('');

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child, grandchild] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: grandchild
            ? {
                ...(prev[parent as keyof typeof prev] as any)?.[child],
                [grandchild]: value,
              }
            : value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleAddBusinessType = () => {
    if (newBusinessType.trim() && !formData.businessTypes.includes(newBusinessType.trim())) {
      setFormData(prev => ({
        ...prev,
        businessTypes: [...prev.businessTypes, newBusinessType.trim()],
      }));
      setNewBusinessType('');
    }
  };

  const handleRemoveBusinessType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      businessTypes: prev.businessTypes.filter(t => t !== type),
    }));
  };

  const handleAddActivity = () => {
    if (newActivity.trim() && !formData.activities.includes(newActivity.trim())) {
      setFormData(prev => ({
        ...prev,
        activities: [...prev.activities, newActivity.trim()],
      }));
      setNewActivity('');
    }
  };

  const handleRemoveActivity = (activity: string) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.filter(a => a !== activity),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      alert('Permit name is required');
      return;
    }
    if (!formData.jurisdiction.province.trim()) {
      alert('Province is required');
      return;
    }
    if (formData.businessTypes.length === 0) {
      alert('At least one business type is required');
      return;
    }
    if (formData.activities.length === 0) {
      alert('At least one activity is required');
      return;
    }
    if (!formData.applyUrl.trim()) {
      alert('Apply URL is required');
      return;
    }
    if (!formData.sourceUrl.trim()) {
      alert('Source URL is required');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare permit data
      const permitData = {
        ...formData,
        lastUpdated: new Date(),
        // Clean up empty optional fields
        prerequisites: formData.prerequisites.trim() || undefined,
        lastVerified: formData.lastVerified.trim() || undefined,
        moreInfoUrl: formData.moreInfoUrl.trim() || undefined,
        fullText: formData.fullText.trim() || undefined,
        fullHtml: formData.fullHtml.trim() || undefined,
        permitTitle: formData.permitTitle.trim() || undefined,
        jurisdiction: {
          country: formData.jurisdiction.country,
          province: formData.jurisdiction.province.trim(),
          ...(formData.jurisdiction.city.trim() && { city: formData.jurisdiction.city.trim() }),
        },
        contactInfo: Object.keys(formData.contactInfo).length > 0 ? formData.contactInfo : undefined,
      };

      // Create permit via API
      const res = await fetch('/api/permits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permitData),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Failed to create permit' }));
        throw new Error(error.error || 'Failed to create permit');
      }

      const result = await res.json();
      alert('Permit created successfully!');
      router.push('/permit-management');
    } catch (error: any) {
      console.error('Error creating permit:', error);
      alert(error.message || 'Failed to create permit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
        <div className="px-6 py-5 border-b border-neutral-200">
          <h1 className="text-lg font-semibold text-neutral-900">Pilot</h1>
          <p className="text-xs text-neutral-500">Compliance Platform</p>
        </div>

        <div className="p-4 border-b border-neutral-200">
          <button 
            onClick={() => router.push('/permit-management')}
            className="flex items-center gap-2 text-sm text-neutral-600 hover:bg-neutral-100 px-3 py-2 rounded-lg w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Permits
          </button>
        </div>

        <div className="flex-1" />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="bg-white border-b border-neutral-200 px-8 py-6">
          <h2 className="text-2xl font-semibold text-neutral-900">Add New Permit</h2>
          <p className="text-sm text-neutral-500 mt-1">Fill in the details to add a new permit to the system</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 max-w-4xl">
          {/* Required Fields Section */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Required Information</h3>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Permit Name */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Permit Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => handleInputChange('level', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                >
                  <option value="municipal">Municipal</option>
                  <option value="provincial">Provincial</option>
                  <option value="federal">Federal</option>
                </select>
              </div>

              {/* Authority */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Authority <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.authority}
                  onChange={(e) => handleInputChange('authority', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>

              {/* Province */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Province <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.jurisdiction.province}
                  onChange={(e) => handleInputChange('jurisdiction.province', e.target.value)}
                  placeholder="e.g., ON, BC, QC"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>

              {/* City (Optional) */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.jurisdiction.city}
                  onChange={(e) => handleInputChange('jurisdiction.city', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* Apply URL */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Apply URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.applyUrl}
                  onChange={(e) => handleInputChange('applyUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>

              {/* Source URL */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Source URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.sourceUrl}
                  onChange={(e) => handleInputChange('sourceUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* Business Types */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Business Types <span className="text-red-500">*</span>
            </h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newBusinessType}
                onChange={(e) => setNewBusinessType(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBusinessType())}
                placeholder="Add business type"
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <button
                type="button"
                onClick={handleAddBusinessType}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.businessTypes.map((type) => (
                <span
                  key={type}
                  className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm flex items-center gap-2"
                >
                  {type}
                  <button
                    type="button"
                    onClick={() => handleRemoveBusinessType(type)}
                    className="text-neutral-500 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Activities <span className="text-red-500">*</span>
            </h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddActivity())}
                placeholder="Add activity"
                className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <button
                type="button"
                onClick={handleAddActivity}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.activities.map((activity) => (
                <span
                  key={activity}
                  className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm flex items-center gap-2"
                >
                  {activity}
                  <button
                    type="button"
                    onClick={() => handleRemoveActivity(activity)}
                    className="text-neutral-500 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Optional Fields */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Additional Information (Optional)</h3>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Prerequisites */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">Prerequisites</label>
                <textarea
                  value={formData.prerequisites}
                  onChange={(e) => handleInputChange('prerequisites', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  value={formData.contactInfo.phone}
                  onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* Last Verified */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Last Verified</label>
                <input
                  type="date"
                  value={formData.lastVerified}
                  onChange={(e) => handleInputChange('lastVerified', e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>

              {/* More Info URL */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">More Info URL</label>
                <input
                  type="url"
                  value={formData.moreInfoUrl}
                  onChange={(e) => handleInputChange('moreInfoUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/permit-management')}
              className="px-6 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Permit
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
