// src/app/(app)/musician/settings/customization/page.js - IMPROVED UI
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { Paintbrush, Eye, EyeOff, Sun, Moon, Monitor, CheckCircle, AlertCircle } from "lucide-react";

export default function CustomizationSettingsPage() {
  const { user } = useAuth();
  const [theme, setTheme] = useState("dark");
  const [profileVisible, setProfileVisible] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Load saved preferences
    if (user) {
      // You can fetch from database or localStorage
      const savedTheme = localStorage.getItem('theme') || 'dark';
      setTheme(savedTheme);
      
      // Fetch profile visibility from database
      fetchProfileSettings();
    }
  }, [user]);

  const fetchProfileSettings = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('profile_visible')
      .eq('id', user.id)
      .single();
    
    if (data) {
      setProfileVisible(data.profile_visible ?? true);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Apply theme
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Auto - follow system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    setSuccess('Theme updated successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleVisibilityChange = async (visible) => {
    setSaving(true);
    setError('');
    
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ profile_visible: visible })
      .eq('id', user.id);
    
    setSaving(false);
    
    if (updateError) {
      setError('Failed to update visibility settings');
    } else {
      setProfileVisible(visible);
      setSuccess('Profile visibility updated!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const themes = [
    {
      value: 'light',
      label: 'Light',
      icon: Sun,
      description: 'Always use light theme',
      preview: 'bg-white border-gray-300',
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: Moon,
      description: 'Always use dark theme',
      preview: 'bg-gray-900 border-gray-700',
    },
    {
      value: 'auto',
      label: 'Auto',
      icon: Monitor,
      description: 'Follow system preference',
      preview: 'bg-gradient-to-r from-white to-gray-900',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Customization
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Customize your profile appearance and visibility
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Theme Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
            <Paintbrush className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Theme Preference
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose how your profile looks
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            const isSelected = theme === themeOption.value;
            
            return (
              <button
                key={themeOption.value}
                onClick={() => handleThemeChange(themeOption.value)}
                className={`relative p-4 rounded-xl border-2 transition ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600'
                }`}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Theme Icon */}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-purple-600' : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  
                  <div>
                    <p className={`font-semibold ${
                      isSelected ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white'
                    }`}>
                      {themeOption.label}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {themeOption.description}
                    </p>
                  </div>

                  {/* Preview */}
                  <div className={`w-full h-8 rounded border-2 ${themeOption.preview}`}></div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Visibility */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            {profileVisible ? (
              <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <EyeOff className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Profile Visibility
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Control who can see your profile
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Public Option */}
          <button
            onClick={() => handleVisibilityChange(true)}
            disabled={saving}
            className={`w-full p-4 rounded-xl border-2 transition text-left ${
              profileVisible
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-400'
            } disabled:opacity-50`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Eye className={`w-5 h-5 mt-0.5 ${
                  profileVisible ? 'text-purple-600' : 'text-gray-400'
                }`} />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Public Profile
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Your profile appears in search results and can be viewed by anyone
                  </p>
                </div>
              </div>
              {profileVisible && (
                <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>

          {/* Private Option */}
          <button
            onClick={() => handleVisibilityChange(false)}
            disabled={saving}
            className={`w-full p-4 rounded-xl border-2 transition text-left ${
              !profileVisible
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-purple-400'
            } disabled:opacity-50`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <EyeOff className={`w-5 h-5 mt-0.5 ${
                  !profileVisible ? 'text-purple-600' : 'text-gray-400'
                }`} />
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Private Profile
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Your profile is hidden from search results and public viewing
                  </p>
                </div>
              </div>
              {!profileVisible && (
                <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Privacy Tip
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Even with a private profile, clients who have your direct profile link can still view and book you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}