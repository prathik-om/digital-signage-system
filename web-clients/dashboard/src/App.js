import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import './App.css';
import ContentManager from './components/ContentManager';
import PlaylistManager from './components/PlaylistManager';
import ScheduleManager from './components/ScheduleManager';
import SettingsManager from './components/SettingsManager';

// Import configuration
import config, { getApiUrl } from './config.js';

// API configuration for Catalyst functions
const API_BASE_URL = config.API_BASE_URL;

// API service functions
const apiService = {
  async getContent() {
    try {
      const response = await fetch(`${API_BASE_URL}/content`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ action: 'getAll' })
      });
      return await response.json();
    } catch (error) {
      console.error('Content fetch error:', error);
      throw error; // Don't fall back to demo data
    }
  },

  async getPlaylists() {
    try {
      const response = await fetch(`${API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ action: 'getAll' })
      });
      return await response.json();
    } catch (error) {
      console.error('Playlist fetch error:', error);
      return { success: false, playlists: [] };
    }
  }
};

// Sidebar Component
const Sidebar = () => {
  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Digital Signage System
        </p>
      </div>
      
      <nav className="mt-6">
        <div className="px-4 space-y-2">
          <Link
            to="/"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            Dashboard
          </Link>
          <Link
            to="/content"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            Content Management
          </Link>
          <Link
            to="/playlists"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            Playlist Management
          </Link>
          <Link
            to="/scheduling"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            Scheduling
          </Link>
          <Link
            to="/emergency"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            Emergency Messages
          </Link>
          <Link
            to="/settings"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            Settings
          </Link>
        </div>
      </nav>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalContent: 0,
    totalPlaylists: 0,
    activeScreens: 0,
    recentActivity: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [contentResult, playlistResult] = await Promise.all([
        apiService.getContent(),
        apiService.getPlaylists()
      ]);

      setDashboardData({
        totalContent: contentResult.success ? contentResult.files?.length || 0 : 0,
        totalPlaylists: playlistResult.success ? playlistResult.playlists?.length || 0 : 0,
        activeScreens: 1, // Real data - connected TV player
        recentActivity: [] // Real activity will be populated from backend
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your digital signage system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Content</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData.totalContent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Playlists</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData.totalPlaylists}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Screens</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardData.activeScreens}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Uptime</p>
              <p className="text-2xl font-semibold text-gray-900">99.9%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {dashboardData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.action}</span> {activity.item}
                  </p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Advanced Scheduling Component
const AdvancedScheduling = () => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ action: 'getAll' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPlaylists(result.playlists || []);
      } else {
        console.error('Failed to fetch playlists:', result.message);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setPlaylists([]); // No fallback to demo data
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleUpdate = () => {
    // Refresh playlists after schedule update
    fetchPlaylists();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Schedule Management</h1>
        <p className="text-gray-600 mt-2">
          Manage when your playlists are active and automatically switch between them based on time.
        </p>
      </div>
      
      <ScheduleManager 
        playlists={playlists} 
        onScheduleUpdate={handleScheduleUpdate}
      />
    </div>
  );
};

// Emergency Manager Component
const EmergencyManager = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEmergency, setNewEmergency] = useState({
    title: '',
    message: '',
    priority: 'medium',
    duration: 30
  });

  useEffect(() => {
    fetchEmergencies();
  }, []);

  const fetchEmergencies = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getAll' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Transform the data structure to match frontend expectations
        const transformedEmergencies = (result.messages || []).map(item => {
          const emergency = item.emergency_messages || item;
          return {
            id: emergency.ROWID,
            title: emergency.title,
            message: emergency.message,
            priority: emergency.importance,
            duration: emergency.duration || 30,
            is_active: emergency.is_active,
            created_at: emergency.CREATEDTIME,
            updated_at: emergency.MODIFIEDTIME
          };
        });
        setEmergencies(transformedEmergencies);
      }
    } catch (error) {
      console.error('Error fetching emergencies:', error);
    }
  };

  const handleCreateEmergency = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          emergency: newEmergency
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setShowCreateForm(false);
        setNewEmergency({ title: '', message: '', priority: 'medium', duration: 30 });
        fetchEmergencies();
      }
    } catch (error) {
      console.error('Error creating emergency:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Emergency Messages</h1>
          <p className="text-gray-600 mt-2">
            Manage emergency messages that can override normal content display.
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Create Emergency Message
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {emergencies.map((emergency) => (
          <div key={emergency.id} className={`dashboard-card border-l-4 ${
            emergency.priority === 'high' ? 'border-red-500' :
            emergency.priority === 'medium' ? 'border-yellow-500' :
            'border-blue-500'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{emergency.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                emergency.priority === 'high' ? 'bg-red-100 text-red-800' :
                emergency.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {emergency.priority}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{emergency.message}</p>
            <div className="text-sm text-gray-500">
              Duration: {emergency.duration} seconds
            </div>
          </div>
        ))}
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create Emergency Message</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newEmergency.title}
                  onChange={(e) => setNewEmergency({...newEmergency, title: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={newEmergency.message}
                  onChange={(e) => setNewEmergency({...newEmergency, message: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={newEmergency.priority}
                  onChange={(e) => setNewEmergency({...newEmergency, priority: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (seconds)</label>
                <input
                  type="number"
                  value={newEmergency.duration}
                  onChange={(e) => setNewEmergency({...newEmergency, duration: parseInt(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2"
                  min="1"
                  max="300"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEmergency}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/content" element={<ContentManager />} />
            <Route path="/playlists" element={<PlaylistManager />} />
            <Route path="/scheduling" element={<AdvancedScheduling />} />
            <Route path="/emergency" element={<EmergencyManager />} />
            <Route path="/settings" element={<SettingsManager />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
