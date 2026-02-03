'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  Folder,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  Palette,
  Circle,
  Moon,
  Droplets,
  X,
} from 'lucide-react';
import { useTheme, type Theme } from '../components/ThemeProvider';
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

const themeOptions: { id: Theme; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'default', label: 'Default', icon: Circle, desc: 'Light, neutral palette' },
  { id: 'black', label: 'Black', icon: Moon, desc: 'Dark background, high contrast' },
  { id: 'blue', label: 'Blue', icon: Droplets, desc: 'Light with blue accents' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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
    setSaveMessage(null);
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings));
      
      // Here you could also save to an API endpoint
      // await fetch('/api/settings', { method: 'POST', body: JSON.stringify(settings) });
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setHasChanges(false);
      setSaveMessage({ type: 'success', text: 'Changes Saved' });
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
      setTimeout(() => setSaveMessage(null), 5000);
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
    <div className="bg-surface border border-surface-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-foreground" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-foreground mb-1">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
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
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="flex-1">
        <Label className="text-sm font-medium text-foreground mb-0.5">{label}</Label>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-page-bg">
      {/* Header */}
      <div className="bg-surface border-b border-surface-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent rounded-lg transition-colors border border-surface-border"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure your workspace preferences and notifications.
                </p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Save message - pops up at bottom of screen, matches site theme */}
      {saveMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md">
          <div
            className={`flex items-center gap-3 px-5 py-3 rounded-full shadow-lg border ${
              saveMessage.type === 'success'
                ? 'bg-surface border-border text-foreground'
                : 'bg-surface border-destructive/50 text-destructive'
            }`}
          >
            {saveMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0" />
            )}
            <p className="flex-1 text-sm font-semibold">
              {saveMessage.text}
            </p>
            <button
              onClick={() => setSaveMessage(null)}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="space-y-6">
          {/* Theme / Appearance Section */}
          <SettingCard
            icon={Palette}
            title="Theme"
            description="Choose a color theme for the app. Changes apply immediately."
          >
            <div className="flex flex-wrap gap-3">
              {themeOptions.map((opt) => {
                const Icon = opt.icon;
                const active = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setTheme(opt.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border hover:border-surface-border bg-muted/50 text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <div className="text-left">
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-xs opacity-70">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </SettingCard>

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
          <div className="bg-secondary border border-border rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                <Database className="w-4 h-4 text-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-1">Pipeline Management</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Manage your CRM pipeline stages and lead workflows from the Leads page.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/?view=leads')}
                  className="text-xs border-border text-foreground hover:bg-accent"
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
