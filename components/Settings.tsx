
import React, { useState, useEffect } from 'react';
import { UserSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Save, Bell, Mail, Clock, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { changePassword } = useAuth();
  const [settings, setSettings] = useState<UserSettings>({
    email: '',
    notificationFrequency: 'weekly',
    reminderEnabled: true
  });
  const [saved, setSaved] = useState(false);
  
  // Password State
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [passMsg, setPassMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const savedSettings = localStorage.getItem('milemaster_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('milemaster_settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
      e.preventDefault();
      setPassMsg(null);
      if (passwords.new.length < 6) {
          setPassMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
          return;
      }
      if (passwords.new !== passwords.confirm) {
          setPassMsg({ type: 'error', text: 'Passwords do not match.' });
          return;
      }

      try {
          await changePassword(passwords.new);
          setPassMsg({ type: 'success', text: 'Password updated successfully.' });
          setPasswords({ new: '', confirm: '' });
      } catch (err) {
          setPassMsg({ type: 'error', text: 'Failed to update password.' });
      }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-10">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">App Settings</h1>
        <p className="text-gray-500">Configure your notifications and preferences.</p>
      </header>

      <div className="space-y-8">
          {/* General Preferences */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <form onSubmit={handleSave} className="p-6 space-y-8">
            
            {/* Email Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-900 font-semibold pb-2 border-b border-gray-100">
                <Mail className="w-5 h-5 text-indigo-600" />
                <h3>Contact Information</h3>
                </div>
                <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input 
                    type="email"
                    required
                    placeholder="jerome@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={settings.email}
                    onChange={(e) => setSettings({...settings, email: e.target.value})}
                />
                <p className="text-xs text-gray-500">We'll use this to address the payment reminder drafts.</p>
                </div>
            </div>

            {/* Notification Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-900 font-semibold pb-2 border-b border-gray-100">
                <Bell className="w-5 h-5 text-indigo-600" />
                <h3>Notifications & Alerts</h3>
                </div>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Enable Reminders</label>
                            <p className="text-xs text-gray-500">Get alerted about upcoming due dates.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={settings.reminderEnabled}
                                onChange={(e) => setSettings({...settings, reminderEnabled: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>

                    <div className={`space-y-2 transition-opacity ${settings.reminderEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            Reminder Frequency
                        </label>
                        <select 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            value={settings.notificationFrequency}
                            onChange={(e) => setSettings({...settings, notificationFrequency: e.target.value as any})}
                        >
                            <option value="6hours">Every 6 Hours (High Urgency)</option>
                            <option value="daily">Daily (Standard)</option>
                            <option value="weekly">Weekly (Summary)</option>
                        </select>
                        <p className="text-xs text-gray-500 bg-blue-50 text-blue-700 p-3 rounded-lg mt-2">
                            Note: Since this is a web app, actual push notifications require the browser tab to be open or a backend server. 
                            This setting controls the frequency of "Risk Alerts" on your dashboard.
                        </p>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 flex justify-end">
                <button 
                    type="submit"
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium transition-all ${
                        saved ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                >
                    {saved ? (
                        <>Saved Successfully</>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Preferences
                        </>
                    )}
                </button>
            </div>

            </form>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-2 text-gray-900 font-semibold pb-2 border-b border-gray-100">
                    <Lock className="w-5 h-5 text-indigo-600" />
                    <h3>Security</h3>
                </div>
                
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input 
                                type="password"
                                required
                                minLength={6}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={passwords.new}
                                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input 
                                type="password"
                                required
                                minLength={6}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={passwords.confirm}
                                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                            />
                        </div>
                    </div>
                    
                    {passMsg && (
                        <div className={`text-sm flex items-center gap-2 ${passMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {passMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {passMsg.text}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button 
                            type="submit"
                            className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 text-sm font-medium transition-colors"
                        >
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
          </div>
      </div>
    </div>
  );
};
