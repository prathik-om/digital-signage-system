import React, { useState, useEffect } from 'react';
import { API_BASE_URL, getCatalystAuthHeaders } from '../config';
import { Save, Timer, Monitor, CheckCircle } from 'lucide-react';

const SettingsManager = ({ user }) => {
  const [defaultTimer, setDefaultTimer] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchDefaultTimer();
  }, []);

  const fetchDefaultTimer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({
          data: { action: 'getDisplaySettings' }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.settings.default_slide_timer) {
          setDefaultTimer(result.settings.default_slide_timer);
        }
      } else {
        setError('Failed to fetch current timer setting');
      }
    } catch (error) {
      console.error('Error fetching timer setting:', error);
      setError('Error fetching timer setting: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTimerChange = (value) => {
    const newValue = parseInt(value) || 0;
    setDefaultTimer(newValue);
    setHasChanges(newValue !== defaultTimer);
  };

  const saveTimer = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({
          data: {
            action: 'updateSetting',
            setting_key: 'default_slide_timer',
            setting_value: defaultTimer
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSuccessMessage('Timer setting saved successfully!');
          setHasChanges(false);
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError(result.message || 'Failed to save timer setting');
        }
      } else {
        setError('Failed to save timer setting');
      }
    } catch (error) {
      console.error('Error saving timer setting:', error);
      setError('Error saving timer setting: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    setDefaultTimer(15);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Timer className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Timer Settings</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Configure the universal timer for all content types
        </p>
      </div>

      {/* Main Timer Setting */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Universal Default Timer
          </h2>
          <p className="text-gray-600">
            This setting controls how long each slide is displayed by default across all content types
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label htmlFor="defaultTimer" className="block text-sm font-medium text-gray-700 mb-2">
                Default Duration (seconds)
              </label>
              <input
                id="defaultTimer"
                type="number"
                value={defaultTimer}
                onChange={(e) => handleTimerChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-center"
                min="1"
                max="300"
                step="1"
              />
            </div>
            <div className="text-gray-500 text-sm">
              seconds
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center space-x-3">
            <button
              onClick={resetToDefault}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Reset to 15s
            </button>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {hasChanges ? (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Unsaved changes</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">All changes saved</span>
              </div>
            )}
          </div>
          <button
            onClick={saveTimer}
            disabled={saving || !hasChanges}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Timer Setting'}</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Content Type Examples */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          How the Universal Timer Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Monitor className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Playlist Items</h4>
            <p className="text-sm text-gray-600">
              Use default timer unless custom duration is set during playlist creation
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Timer className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Zoho Cliq Messages</h4>
            <p className="text-sm text-gray-600">
              Always use the universal default timer
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-orange-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Emergency Content</h4>
            <p className="text-sm text-gray-600">
              Always use the universal default timer
            </p>
          </div>
        </div>
      </div>

      {/* Pro Tip */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-yellow-800 text-sm font-bold">💡</span>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-yellow-800 mb-2">Pro Tip</h3>
            <p className="text-yellow-700">
              <strong>One setting controls everything!</strong> Change this timer and it will affect all content types 
              immediately. Playlist items can still have custom durations set during creation, but everything else 
              will use this universal default.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;
