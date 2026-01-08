'use client';

import { useState } from 'react';
import { ArrowRight, ArrowLeft, Building2, MapPin, Briefcase, FileText, CheckCircle2 } from 'lucide-react';

interface ClientOnboardingProps {
  onComplete: (clientData: any) => void;
  onCancel: () => void;
}

interface BusinessFormData {
  businessName: string;
  businessType: string;
  location: string;
  state: string;
  city: string;
  zipCode: string;
  industry: string;
  description: string;
  squareFootage: string;
  employeeCount: string;
}

const businessTypes = [
  'Restaurant / Food Service',
  'Retail Store',
  'Manufacturing',
  'Office / Professional Services',
  'Healthcare Facility',
  'Construction',
  'Brewery / Distillery',
  'Other',
];

const industries = [
  'Food & Beverage',
  'Retail',
  'Manufacturing',
  'Technology',
  'Healthcare',
  'Construction',
  'Professional Services',
  'Entertainment',
  'Other',
];

export function ClientOnboarding({ onComplete, onCancel }: ClientOnboardingProps) {
  const [step, setStep] = useState(1);
  const [showPermits, setShowPermits] = useState(false);
  const [formData, setFormData] = useState<BusinessFormData>({
    businessName: '',
    businessType: '',
    location: '',
    state: '',
    city: '',
    zipCode: '',
    industry: '',
    description: '',
    squareFootage: '',
    employeeCount: '',
  });

  const mockPermits = [
    {
      id: '1',
      name: 'Business License',
      category: 'General',
      jurisdiction: formData.city || 'City',
      estimatedTime: '2-4 weeks',
      priority: 'High',
    },
    {
      id: '2',
      name: 'Food Service Permit',
      category: 'Health & Safety',
      jurisdiction: 'County Health Department',
      estimatedTime: '3-6 weeks',
      priority: 'High',
    },
    {
      id: '3',
      name: 'Building Permit',
      category: 'Construction',
      jurisdiction: formData.city || 'City',
      estimatedTime: '4-8 weeks',
      priority: 'Medium',
    },
    {
      id: '4',
      name: 'Sign Permit',
      category: 'Zoning',
      jurisdiction: formData.city || 'City',
      estimatedTime: '1-2 weeks',
      priority: 'Low',
    },
    {
      id: '5',
      name: 'Health Inspection',
      category: 'Health & Safety',
      jurisdiction: 'County Health Department',
      estimatedTime: '2-3 weeks',
      priority: 'High',
    },
  ];

  const handleInputChange = (field: keyof BusinessFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFindPermits = () => {
    setShowPermits(true);
  };

  const handleComplete = async () => {
    // Create client in MongoDB
    try {
      const clientData = {
        businessName: formData.businessName,
        businessType: formData.businessType,
        jurisdiction: `${formData.city}, ${formData.state}`,
        activePermits: mockPermits.length,
        status: 'draft' as const,
        lastActivity: 'Just now',
        completionRate: 0,
        description: formData.description,
        location: formData.location,
        zipCode: formData.zipCode,
        industry: formData.industry,
        squareFootage: formData.squareFootage,
        employeeCount: formData.employeeCount,
      };

      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });

      if (res.ok) {
        const newClient = await res.json();
        onComplete(newClient);
      } else {
        console.error('Failed to create client');
        onComplete({ ...formData, permits: mockPermits });
      }
    } catch (err) {
      console.error('Error creating client:', err);
      onComplete({ ...formData, permits: mockPermits });
    }
  };

  const isStep1Valid = formData.businessName && formData.businessType;
  const isStep2Valid = formData.city && formData.state && formData.zipCode;
  const isStep3Valid = formData.industry;

  if (showPermits) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="border-b border-neutral-200 px-8 py-6">
          <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
            <Building2 className="w-4 h-4" />
            <span>New Client Setup</span>
          </div>
          <h1 className="text-neutral-900 mb-1">Required Permits</h1>
          <p className="text-neutral-600">Review and confirm the permits needed for {formData.businessName}</p>
        </div>

        {/* Permits List */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 mb-1">
                    {mockPermits.length} permits identified
                  </p>
                  <p className="text-sm text-blue-700">
                    Based on the business information provided, we've identified the following permits and licenses required for your client.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {mockPermits.map((permit, index) => (
                <div
                  key={permit.id}
                  className="bg-white border border-neutral-200 rounded-lg p-5 hover:border-neutral-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-medium">
                          {index + 1}
                        </span>
                        <h3 className="font-medium text-neutral-900">{permit.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            permit.priority === 'High'
                              ? 'bg-red-50 text-red-700'
                              : permit.priority === 'Medium'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {permit.priority} Priority
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-neutral-600">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4" />
                          {permit.category}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          {permit.jurisdiction}
                        </span>
                        <span>Est. {permit.estimatedTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-200">
              <button
                onClick={() => setShowPermits(false)}
                className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Details
              </button>
              <button
                onClick={handleComplete}
                className="flex items-center gap-2 px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Add Client to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
          <Building2 className="w-4 h-4" />
          <span>New Client Setup</span>
        </div>
        <h1 className="text-neutral-900 mb-1">Add New Client</h1>
        <p className="text-neutral-600">Tell us about the business to discover required permits</p>
      </div>

      {/* Progress Steps */}
      <div className="border-b border-neutral-200 px-8 py-4">
        <div className="flex items-center gap-2 max-w-2xl">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-neutral-900' : 'text-neutral-400'}`}>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? 'bg-neutral-900 text-white' : 'bg-neutral-200'
              }`}
            >
              1
            </div>
            <span className="text-sm font-medium">Basic Info</span>
          </div>
          <div className="flex-1 h-px bg-neutral-200" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-neutral-900' : 'text-neutral-400'}`}>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? 'bg-neutral-900 text-white' : 'bg-neutral-200'
              }`}
            >
              2
            </div>
            <span className="text-sm font-medium">Location</span>
          </div>
          <div className="flex-1 h-px bg-neutral-200" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-neutral-900' : 'text-neutral-400'}`}>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 3 ? 'bg-neutral-900 text-white' : 'bg-neutral-200'
              }`}
            >
              3
            </div>
            <span className="text-sm font-medium">Details</span>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-2xl mx-auto">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  placeholder="e.g., Riverside Coffee Co."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Business Type *
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => handleInputChange('businessType', e.target.value)}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                >
                  <option value="">Select a business type</option>
                  {businessTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Brief Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent resize-none"
                  placeholder="What does this business do?"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                    placeholder="Portland"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                    placeholder="OR"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                  placeholder="97201"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Industry *
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                >
                  <option value="">Select an industry</option>
                  {industries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Square Footage
                  </label>
                  <input
                    type="text"
                    value={formData.squareFootage}
                    onChange={(e) => handleInputChange('squareFootage', e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                    placeholder="2,500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Number of Employees
                  </label>
                  <input
                    type="text"
                    value={formData.employeeCount}
                    onChange={(e) => handleInputChange('employeeCount', e.target.value)}
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                <p className="text-sm text-neutral-600">
                  <span className="font-medium text-neutral-900">Ready to find permits?</span> We'll analyze your business details and identify all required permits and licenses for your jurisdiction.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t border-neutral-200 px-8 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={step === 1 ? onCancel : () => setStep(step - 1)}
            className="flex items-center gap-2 px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !isStep1Valid) ||
                (step === 2 && !isStep2Valid)
              }
              className="flex items-center gap-2 px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFindPermits}
              disabled={!isStep3Valid}
              className="flex items-center gap-2 px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
              Find My Permits
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

