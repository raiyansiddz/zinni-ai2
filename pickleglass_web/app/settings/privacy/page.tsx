'use client';

import { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Lock, Database, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

interface PrivacySettings {
  dataCollection: boolean;
  analytics: boolean;
  thirdPartySharing: boolean;
  marketingEmails: boolean;
  sessionRecording: boolean;
  aiTraining: boolean;
}

export default function PrivacyPage() {
  const [settings, setSettings] = useState<PrivacySettings>({
    dataCollection: true,
    analytics: true,
    thirdPartySharing: false,
    marketingEmails: false,
    sessionRecording: true,
    aiTraining: false
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleToggle = (setting: keyof PrivacySettings) => {
    setSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to save privacy settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Privacy settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      setMessage('Failed to update privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.'
    );
    
    if (confirmed) {
      try {
        // TODO: Implement account deletion
        console.log('Account deletion requested');
        alert('Account deletion request submitted. You will receive a confirmation email.');
      } catch (error) {
        console.error('Error deleting account:', error);
        alert('Failed to delete account. Please try again.');
      }
    }
  };

  const ToggleSwitch = ({ enabled, onToggle }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const privacySettings = [
    {
      id: 'dataCollection',
      title: 'Data Collection',
      description: 'Allow us to collect usage data to improve our services',
      icon: Database,
      enabled: settings.dataCollection
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Help us understand how you use the app with anonymous analytics',
      icon: Eye,
      enabled: settings.analytics
    },
    {
      id: 'thirdPartySharing',
      title: 'Third-party Sharing',
      description: 'Share anonymous usage data with trusted third-party services',
      icon: Shield,
      enabled: settings.thirdPartySharing
    },
    {
      id: 'marketingEmails',
      title: 'Marketing Emails',
      description: 'Receive emails about new features and product updates',
      icon: Eye,
      enabled: settings.marketingEmails
    },
    {
      id: 'sessionRecording',
      title: 'Session Recording',
      description: 'Record your AI conversations for quality improvement',
      icon: Eye,
      enabled: settings.sessionRecording
    },
    {
      id: 'aiTraining',
      title: 'AI Training',
      description: 'Use your conversations to improve our AI models',
      icon: Database,
      enabled: settings.aiTraining
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data & Privacy</h1>
          <p className="text-gray-600">Manage your data and privacy preferences</p>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Privacy Settings</h2>
          
          <div className="space-y-6">
            {privacySettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <setting.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{setting.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                  </div>
                </div>
                <ToggleSwitch
                  enabled={setting.enabled}
                  onToggle={() => handleToggle(setting.id)}
                />
              </div>
            ))}
          </div>

          {message && (
            <div className={`mt-6 p-3 rounded-lg ${
              message.includes('successfully') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {/* Data Export */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Export</h2>
          <p className="text-gray-600 mb-4">
            Download a copy of your data including conversations, settings, and preferences.
          </p>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            Request Data Export
          </button>
        </div>

        {/* Account Deletion */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Trash2 className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Delete Account</h3>
                <p className="text-sm text-red-700 mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}