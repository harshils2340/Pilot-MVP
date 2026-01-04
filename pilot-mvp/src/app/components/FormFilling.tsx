import { Save, Send, Sparkles, AlertCircle, CheckCircle2, Edit2, Clock } from 'lucide-react';
import { useState } from 'react';

interface FormField {
  id: string;
  label: string;
  value: string;
  required: boolean;
  aiSuggested: boolean;
  changed: boolean;
  previousValue?: string;
  helpText?: string;
}

const mockFormFields: FormField[] = [
  {
    id: 'business_name',
    label: 'Legal Business Name',
    value: 'Urban Eats Restaurant Group LLC',
    required: true,
    aiSuggested: true,
    changed: false,
    previousValue: 'Urban Eats Restaurant Group LLC',
  },
  {
    id: 'dba',
    label: 'Doing Business As (DBA)',
    value: 'Urban Eats Downtown',
    required: false,
    aiSuggested: true,
    changed: false,
  },
  {
    id: 'ein',
    label: 'Employer Identification Number (EIN)',
    value: '12-3456789',
    required: true,
    aiSuggested: true,
    changed: false,
    previousValue: '12-3456789',
  },
  {
    id: 'business_address',
    label: 'Business Physical Address',
    value: '425 Market Street, San Francisco, CA 94105',
    required: true,
    aiSuggested: true,
    changed: true,
    previousValue: '423 Market Street, San Francisco, CA 94105',
  },
  {
    id: 'mailing_address',
    label: 'Mailing Address',
    value: '',
    required: true,
    aiSuggested: false,
    changed: false,
    helpText: 'Required field - please complete',
  },
  {
    id: 'phone',
    label: 'Business Phone Number',
    value: '(415) 555-0123',
    required: true,
    aiSuggested: true,
    changed: false,
  },
  {
    id: 'owner_name',
    label: 'Owner/Authorized Representative Name',
    value: 'Sarah Chen',
    required: true,
    aiSuggested: true,
    changed: false,
    previousValue: 'Sarah Chen',
  },
  {
    id: 'owner_title',
    label: 'Title',
    value: 'Managing Partner',
    required: true,
    aiSuggested: true,
    changed: false,
  },
  {
    id: 'seating_capacity',
    label: 'Indoor Seating Capacity',
    value: '85',
    required: true,
    aiSuggested: true,
    changed: false,
  },
  {
    id: 'outdoor_seating',
    label: 'Outdoor Seating Capacity',
    value: '',
    required: false,
    aiSuggested: false,
    changed: false,
  },
];

interface ContextItem {
  type: 'previous' | 'correction' | 'note';
  date: string;
  content: string;
  source?: string;
}

const mockContext: ContextItem[] = [
  {
    type: 'previous',
    date: '2024-11-15',
    content: 'Used address: 423 Market Street, San Francisco, CA 94105',
    source: 'Business Operating Permit (Approved)',
  },
  {
    type: 'correction',
    date: '2024-12-01',
    content: 'Address updated to 425 Market Street per lease amendment',
    source: 'Client Update',
  },
  {
    type: 'note',
    date: '2024-10-22',
    content: 'EIN verified with IRS records',
    source: 'System Verification',
  },
  {
    type: 'previous',
    date: '2024-09-30',
    content: 'Sarah Chen confirmed as Managing Partner and authorized signatory',
    source: 'Operating Agreement',
  },
];

interface FormFillingProps {
  permitId: string | null;
}

export function FormFilling({ permitId }: FormFillingProps) {
  const [fields, setFields] = useState(mockFormFields);
  const [activeField, setActiveField] = useState<string | null>(null);

  const completedFields = fields.filter((f) => f.value).length;
  const totalFields = fields.length;
  const completionPercentage = Math.round((completedFields / totalFields) * 100);

  const handleFieldChange = (id: string, value: string) => {
    setFields(
      fields.map((field) => (field.id === id ? { ...field, value, changed: true } : field))
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Progress */}
      <div className="bg-white border-b border-neutral-200 px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-neutral-900 mb-1">Food Service Establishment Permit</h1>
            <p className="text-neutral-600">San Francisco Department of Public Health</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors">
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors">
              <Send className="w-4 h-4" />
              Submit for Review
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-neutral-600">Form Completion</span>
              <span className="text-sm font-medium text-neutral-900">{completionPercentage}%</span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-900 rounded-full transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          <div className="text-sm text-neutral-600">
            {completedFields} of {totalFields} fields completed
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Form Fields - Left Side */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-3xl">
            <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-200">
              <div className="p-6">
                <h2 className="font-medium text-neutral-900 mb-1">Business Information</h2>
                <p className="text-sm text-neutral-600">
                  Required information about the business entity
                </p>
              </div>

              <div className="p-6 space-y-5">
                {fields.slice(0, 4).map((field) => (
                  <div key={field.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-neutral-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.aiSuggested && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs">
                          <Sparkles className="w-3 h-3" />
                          AI
                        </span>
                      )}
                      {field.changed && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs">
                          <Edit2 className="w-3 h-3" />
                          Modified
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      onFocus={() => setActiveField(field.id)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent ${
                        !field.value && field.required
                          ? 'border-red-300 bg-red-50'
                          : 'border-neutral-300'
                      }`}
                      placeholder={field.required ? 'Required' : 'Optional'}
                    />
                    {!field.value && field.helpText && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                        <AlertCircle className="w-3 h-3" />
                        {field.helpText}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-200 mt-6">
              <div className="p-6">
                <h2 className="font-medium text-neutral-900 mb-1">Contact Information</h2>
                <p className="text-sm text-neutral-600">Primary contact details</p>
              </div>

              <div className="p-6 space-y-5">
                {fields.slice(4, 8).map((field) => (
                  <div key={field.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-neutral-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.aiSuggested && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs">
                          <Sparkles className="w-3 h-3" />
                          AI
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      onFocus={() => setActiveField(field.id)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent ${
                        !field.value && field.required
                          ? 'border-red-300 bg-red-50'
                          : 'border-neutral-300'
                      }`}
                      placeholder={field.required ? 'Required' : 'Optional'}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-200 mt-6">
              <div className="p-6">
                <h2 className="font-medium text-neutral-900 mb-1">Facility Details</h2>
                <p className="text-sm text-neutral-600">Seating and capacity information</p>
              </div>

              <div className="p-6 space-y-5">
                {fields.slice(8).map((field) => (
                  <div key={field.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm font-medium text-neutral-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {field.aiSuggested && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs">
                          <Sparkles className="w-3 h-3" />
                          AI
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      onFocus={() => setActiveField(field.id)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                      placeholder={field.required ? 'Required' : 'Optional'}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Context Panel - Right Side */}
        <div className="w-96 bg-neutral-50 border-l border-neutral-200 flex flex-col">
          <div className="p-6 bg-white border-b border-neutral-200">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h2 className="font-medium text-neutral-900">AI Context</h2>
            </div>
            <p className="text-sm text-neutral-600">Historical data and suggestions</p>
          </div>

          <div className="flex-1 overflow-auto p-6 space-y-4">
            {mockContext.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg border border-neutral-200 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  {item.type === 'previous' && (
                    <Clock className="w-4 h-4 text-blue-600" />
                  )}
                  {item.type === 'correction' && (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                  {item.type === 'note' && (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                  <span className="text-xs font-medium text-neutral-600 uppercase">
                    {item.type === 'previous' && 'Previous Submission'}
                    {item.type === 'correction' && 'Correction'}
                    {item.type === 'note' && 'Verification'}
                  </span>
                </div>
                <p className="text-sm text-neutral-900 mb-2">{item.content}</p>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>{item.source}</span>
                  <span>{item.date}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-white border-t border-neutral-200">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Sparkles className="w-4 h-4" />
              Auto-fill from Context
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
