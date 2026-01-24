export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
          <p className="text-sm text-neutral-600 mt-1">
            Configure your workspace preferences and notifications.
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Notifications</h2>
            <p className="text-xs text-neutral-500">Control inbox alerts and reminders.</p>
          </div>
          <label className="flex items-center justify-between text-sm text-neutral-700">
            Email alerts for permit feedback
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </label>
          <label className="flex items-center justify-between text-sm text-neutral-700">
            Weekly digest summary
            <input type="checkbox" defaultChecked className="h-4 w-4" />
          </label>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">Workspace</h2>
            <p className="text-xs text-neutral-500">Defaults for document routing.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Default workspace</label>
              <select className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm">
                <option>General</option>
                <option>Permits</option>
                <option>Contracts</option>
                <option>Bills</option>
                <option>Forms</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Default folder</label>
              <select className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm">
                <option>Onboarding</option>
                <option>City Feedback</option>
                <option>Invoices</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-neutral-900">Security</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Invite links expire after 14 days by default.
          </p>
        </div>
      </div>
    </div>
  );
}


