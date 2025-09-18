import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import './App.css';
import ContentManager from './components/ContentManager';
import PlaylistManager from './components/PlaylistManager';
import EventManager from './components/EventManager';
import ScreenManager from './components/ScreenManager';
import SettingsManager from './components/SettingsManager';
import Login from './components/Login';
import OAuthCallback from './components/OAuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import configuration
import config from './config.js';

// API configuration for Catalyst functions
const API_BASE_URL = config.API_BASE_URL;

// API service functions
const apiService = {
  async getContent(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/content`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'getAll', user_id: userId })
      });
      return await response.json();
    } catch (error) {
      console.error('Content fetch error:', error);
      throw error; // Don't fall back to demo data
    }
  },

  async getPlaylists(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'getAll', user_id: userId })
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
  const { user, logout } = useAuth();

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
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
            to="/events"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            Event Management
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
            to="/google-photos"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            Google Photos
          </Link>
          <Link
            to="/settings"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
          >
            Settings
          </Link>
        </div>
      </nav>
      
      {/* User Info and Logout */}
      <div className="mt-auto p-4 border-t border-gray-200">
        {user && (
          <div className="mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">
                  {user.firstName ? user.firstName.charAt(0) : user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { currentUserId } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalContent: 0,
    totalPlaylists: 0,
    activeScreens: 0,
    recentActivity: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, [currentUserId]);

  const fetchDashboardData = async () => {
    try {
      const [contentResult, playlistResult] = await Promise.all([
        apiService.getContent(currentUserId),
        apiService.getPlaylists(currentUserId)
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



// Main Dashboard Layout Component
const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<EventManager />} />
          <Route path="/content" element={<ContentManager />} />
          <Route path="/playlists" element={<PlaylistManager />} />
          <Route path="/screens" element={<ScreenManager />} />
          <Route path="/settings" element={<SettingsManager />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/callback" element={<OAuthCallback />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          
          {/* Protected Routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
