'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  Folder,
  Shield,
  Save,
  Mail,
  Calendar,
  Lock,
  Key,
  Clock,
  Users,
  Database,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

interface SettingsState {
  notifications: {
    emailAlerts: boolean;
    weeklyDigest: boolean;
    permitFeedback: boolean;
    deadlineReminders: boolean;
  };
  workspace: {
    defaultWorkspace: string;
    defaultFolder: string;
    autoArchive: boolean;
  };
  security: {
    inviteLinkExpiry: number;
    twoFactorAuth: boolean;
    sessionTimeout: number;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    notifications: {
      emailAlerts: true,
      weeklyDigest: true,
      permitFeedback: true,
      deadlineReminders: false,
    },
    workspace: {
      defaultWorkspace: 'General',
      defaultFolder: 'Onboarding',
      autoArchive: false,
    },
    security: {
      inviteLinkExpiry: 14,
      twoFactorAuth: false,
      sessionTimeout: 30,
    },
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }, []);

  const updateSettings = (section: keyof SettingsState, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      // Here you could also save to an API endpoint
      // await fetch('/api/settings', { method: 'POST', body: JSON.stringify(settings) });
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setHasChanges(false);
      // Show success message (you could use a toast here)
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const SettingCard = ({
    icon: Icon,
    title,
    description,
    children,
  }: {
    icon: any;
    title: string;
    description: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-neutral-700" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-neutral-900 mb-1">{title}</h2>
          <p className="text-xs text-neutral-500">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );

  const SettingRow = ({
    label,
    description,
    children,
  }: {
    label: string;
    description?: string;
    children: React.ReactNode;
  }) => (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-neutral-100 last:border-0">
      <div className="flex-1">
        <Label className="text-sm font-medium text-neutral-900 mb-0.5">{label}</Label>
        {description && <p className="text-xs text-neutral-500 mt-1">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors border border-neutral-200"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
                <p className="text-sm text-neutral-600 mt-1">
                  Configure your workspace preferences and notifications.
                </p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="space-y-6">
          {/* Notifications Section */}
          <SettingCard
            icon={Bell}
            title="Notifications"
            description="Control inbox alerts and reminders to stay updated on important activities."
          >
            <SettingRow
              label="Email alerts for permit feedback"
              description="Receive email notifications when clients provide feedback on permits"
            >
              <Switch
                checked={settings.notifications.emailAlerts}
                onCheckedChange={(checked) =>
                  updateSettings('notifications', 'emailAlerts', checked)
                }
              />
            </SettingRow>
            <SettingRow
              label="Weekly digest summary"
              description="Get a weekly summary of all activities and updates"
            >
              <Switch
                checked={settings.notifications.weeklyDigest}
                onCheckedChange={(checked) =>
                  updateSettings('notifications', 'weeklyDigest', checked)
                }
              />
            </SettingRow>
            <SettingRow
              label="Permit feedback notifications"
              description="Notify when permit applications receive feedback from authorities"
            >
              <Switch
                checked={settings.notifications.permitFeedback}
                onCheckedChange={(checked) =>
                  updateSettings('notifications', 'permitFeedback', checked)
                }
              />
            </SettingRow>
            <SettingRow
              label="Deadline reminders"
              description="Get reminders before permit deadlines and important dates"
            >
              <Switch
                checked={settings.notifications.deadlineReminders}
                onCheckedChange={(checked) =>
                  updateSettings('notifications', 'deadlineReminders', checked)
                }
              />
            </SettingRow>
          </SettingCard>

          {/* Workspace Section */}
          <SettingCard
            icon={Folder}
            title="Workspace"
            description="Configure default settings for document routing and organization."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-neutral-500 mb-2 block">Default workspace</Label>
                <Select
                  value={settings.workspace.defaultWorkspace}
                  onValueChange={(value) =>
                    updateSettings('workspace', 'defaultWorkspace', value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Permits">Permits</SelectItem>
                    <SelectItem value="Contracts">Contracts</SelectItem>
                    <SelectItem value="Bills">Bills</SelectItem>
                    <SelectItem value="Forms">Forms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-neutral-500 mb-2 block">Default folder</Label>
                <Select
                  value={settings.workspace.defaultFolder}
                  onValueChange={(value) =>
                    updateSettings('workspace', 'defaultFolder', value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Onboarding">Onboarding</SelectItem>
                    <SelectItem value="City Feedback">City Feedback</SelectItem>
                    <SelectItem value="Invoices">Invoices</SelectItem>
                    <SelectItem value="Permits">Permits</SelectItem>
                    <SelectItem value="Archive">Archive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SettingRow
              label="Auto-archive completed items"
              description="Automatically move completed permits and documents to archive after 30 days"
            >
              <Switch
                checked={settings.workspace.autoArchive}
                onCheckedChange={(checked) =>
                  updateSettings('workspace', 'autoArchive', checked)
                }
              />
            </SettingRow>
          </SettingCard>

          {/* Security Section */}
          <SettingCard
            icon={Shield}
            title="Security"
            description="Manage security settings and access controls for your workspace."
          >
            <SettingRow
              label="Invite link expiry"
              description="Number of days before invite links expire"
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.security.inviteLinkExpiry}
                  onChange={(e) =>
                    updateSettings(
                      'security',
                      'inviteLinkExpiry',
                      parseInt(e.target.value) || 14
                    )
                  }
                  className="w-20"
                />
                <span className="text-xs text-neutral-500">days</span>
              </div>
            </SettingRow>
            <SettingRow
              label="Two-factor authentication"
              description="Add an extra layer of security to your account"
            >
              <Switch
                checked={settings.security.twoFactorAuth}
                onCheckedChange={(checked) =>
                  updateSettings('security', 'twoFactorAuth', checked)
                }
              />
            </SettingRow>
            <SettingRow
              label="Session timeout"
              description="Automatically log out after inactivity (in minutes)"
            >
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="5"
                  max="480"
                  value={settings.security.sessionTimeout}
                  onChange={(e) =>
                    updateSettings(
                      'security',
                      'sessionTimeout',
                      parseInt(e.target.value) || 30
                    )
                  }
                  className="w-20"
                />
                <span className="text-xs text-neutral-500">minutes</span>
              </div>
            </SettingRow>
          </SettingCard>

          {/* Additional Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Database className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Pipeline Management</h3>
                <p className="text-xs text-blue-700 mb-3">
                  Manage your CRM pipeline stages and lead workflows from the Leads page.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/')}
                  className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Go to Leads
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
