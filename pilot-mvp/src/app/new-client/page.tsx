'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewClientPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    businessName: '',
    operatingName: '',
    jurisdiction: '',
    businessType: '',
    // Address fields
    streetNumber: '',
    streetName: '',
    suite: '',
    city: '',
    province: '',
    postalCode: '',
    // Contact fields
    email: '',
    phone: '',
    // Owner fields
    ownerFirstName: '',
    ownerLastName: '',
    ownerPosition: '',
    // Business license fields
    businessLicenceNumber: '',
    licenceExpiry: '',
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Parse location to extract city/province for address
      const locationParts = formData.jurisdiction.split(',').map(s => s.trim());
      const city = formData.city || locationParts[0] || '';
      const province = formData.province || locationParts[1] || '';
      
      // Build full address if we have components
      let fullAddress = '';
      if (formData.streetNumber && formData.streetName) {
        const addressParts = [
          `${formData.streetNumber} ${formData.streetName}`,
          formData.suite,
          city,
          province,
          formData.postalCode
        ].filter(Boolean);
        fullAddress = addressParts.join(', ');
      }

      const clientData = {
        businessName: formData.businessName.trim(),
        operatingName: formData.operatingName || formData.businessName.trim(),
        jurisdiction: formData.jurisdiction.trim(),
        businessType: formData.businessType || '',
        // Address fields for form filling
        address: {
          streetNumber: formData.streetNumber || '',
          streetName: formData.streetName || '',
          suite: formData.suite || '',
          city: city,
          province: province,
          postalCode: formData.postalCode || '',
          fullAddress: fullAddress,
        },
        // Contact info
        contactInfo: {
          email: formData.email || '',
          phone: formData.phone || '',
          name: formData.ownerFirstName && formData.ownerLastName 
            ? `${formData.ownerFirstName} ${formData.ownerLastName}`
            : formData.ownerFirstName || formData.ownerLastName || '',
        },
        // Owner info
        ownerInfo: {
          firstName: formData.ownerFirstName || '',
          lastName: formData.ownerLastName || '',
          fullName: formData.ownerFirstName && formData.ownerLastName
            ? `${formData.ownerFirstName} ${formData.ownerLastName}`
            : formData.ownerFirstName || formData.ownerLastName || '',
          position: formData.ownerPosition || '',
          email: formData.email || '',
          phone: formData.phone || '',
        },
        // Business license fields
        businessLicenceNumber: formData.businessLicenceNumber || '',
        licenceExpiry: formData.licenceExpiry || '',
      };

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create client');
      }

      const data = await res.json();
      router.push(`/clients/${data._id}`); // go to the new client's page
    } catch (err: any) {
      console.error(err);
      alert(`Error creating client: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Client</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              className="w-full border rounded p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Operating Name (DBA)</label>
            <input
              type="text"
              value={formData.operatingName}
              onChange={(e) => handleInputChange('operatingName', e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Leave blank if same as business name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Jurisdiction <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.jurisdiction}
              onChange={(e) => handleInputChange('jurisdiction', e.target.value)}
              className="w-full border rounded p-2"
              placeholder="City, Province/State"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Business Type</label>
            <input
              type="text"
              value={formData.businessType}
              onChange={(e) => handleInputChange('businessType', e.target.value)}
              className="w-full border rounded p-2"
              placeholder="e.g., Restaurant, Retail, Service"
            />
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4 border-t pt-4">
          <h2 className="text-lg font-semibold">Address (for form filling)</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Street Number</label>
              <input
                type="text"
                value={formData.streetNumber}
                onChange={(e) => handleInputChange('streetNumber', e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Street Name</label>
              <input
                type="text"
                value={formData.streetName}
                onChange={(e) => handleInputChange('streetName', e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Suite/Unit</label>
              <input
                type="text"
                value={formData.suite}
                onChange={(e) => handleInputChange('suite', e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Auto-filled from jurisdiction"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Province/State</label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => handleInputChange('province', e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Auto-filled from jurisdiction"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Postal/ZIP Code</label>
            <input
              type="text"
              value={formData.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-4 border-t pt-4">
          <h2 className="text-lg font-semibold">Contact Information</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
          </div>
        </div>

        {/* Owner */}
        <div className="space-y-4 border-t pt-4">
          <h2 className="text-lg font-semibold">Owner/Representative</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">First Name</label>
              <input
                type="text"
                value={formData.ownerFirstName}
                onChange={(e) => handleInputChange('ownerFirstName', e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Last Name</label>
              <input
                type="text"
                value={formData.ownerLastName}
                onChange={(e) => handleInputChange('ownerLastName', e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Position</label>
              <input
                type="text"
                value={formData.ownerPosition}
                onChange={(e) => handleInputChange('ownerPosition', e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Owner, Manager, etc."
              />
            </div>
          </div>
        </div>

        {/* Business License */}
        <div className="space-y-4 border-t pt-4">
          <h2 className="text-lg font-semibold">Business License</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">License Number</label>
              <input
                type="text"
                value={formData.businessLicenceNumber}
                onChange={(e) => handleInputChange('businessLicenceNumber', e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.licenceExpiry}
                onChange={(e) => handleInputChange('licenceExpiry', e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Client'}
        </button>
      </form>
    </div>
  );
}
