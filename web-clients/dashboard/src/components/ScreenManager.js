import React, { useState, useEffect } from 'react';
import { Plus, Monitor, Wifi, WifiOff, Edit, Trash2, RefreshCw, Settings, MapPin } from 'lucide-react';
import config from '../config';

const ScreenManager = () => {
  // State management
  const [screens, setScreens] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingScreen, setEditingScreen] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    ip_address: '',
    resolution: '1920x1080',
    is_active: true
  });

  // Load mock data on component mount
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    const mockScreens = [
      {
        ROWID: 1,
        name: 'Main Lobby Display',
        location: 'Main Lobby',
        ip_address: '192.168.1.100',
        resolution: '1920x1080',
        status: 'online',
        current_playlist: 'Corporate Updates',
        last_seen: new Date().toISOString(),
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        ROWID: 2,
        name: 'Conference Room A Screen',
        location: 'Conference Room A',
        ip_address: '192.168.1.101',
        resolution: '1920x1080',
        status: 'offline',
        current_playlist: null,
        last_seen: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        ROWID: 3,
        name: 'Reception Area 4K Display',
        location: 'Reception Area',
        ip_address: '192.168.1.102',
        resolution: '3840x2160',
        status: 'online',
        current_playlist: 'Welcome Messages',
        last_seen: new Date().toISOString(),
        is_active: true,
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        ROWID: 4,
        name: 'Cafeteria Menu Board',
        location: 'Cafeteria',
        ip_address: '192.168.1.103',
        resolution: '1920x1080',
        status: 'maintenance',
        current_playlist: null,
        last_seen: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        is_active: false,
        created_at: '2024-01-01T00:00:00Z'
      }
    ];

    const mockPlaylists = [
      { ROWID: 1, name: 'Corporate Updates' },
      { ROWID: 2, name: 'Welcome Messages' },
      { ROWID: 3, name: 'Emergency Announcements' },
      { ROWID: 4, name: 'Product Showcase' }
    ];

    setScreens(mockScreens);
    setPlaylists(mockPlaylists);
  };

  // API calls (using mock data for now)
  const fetchScreens = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Try to call the real API, but fall back to mock data if it fails
      const response = await fetch(`${config.API_BASE_URL}/screens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'getAll' })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setScreens(result.screens || []);
        } else {
          throw new Error(result.message || 'Failed to fetch screens');
        }
      } else {
        throw new Error('API call failed');
      }
    } catch (error) {
      console.warn('Screens API not available, using mock data:', error.message);
      loadMockData(); // Fall back to mock data
    } finally {
      setLoading(false);
    }
  };

  const handleCreateScreen = async () => {
    if (!formData.name.trim() || !formData.location.trim()) {
      setError('Name and location are required');
      return;
    }

    try {
      setError('');
      
      // Create new screen with mock data
      const newScreen = {
        ROWID: Date.now(),
        name: formData.name.trim(),
        location: formData.location.trim(),
        ip_address: formData.ip_address.trim() || null,
        resolution: formData.resolution,
        status: 'offline',
        current_playlist: null,
        last_seen: null,
        is_active: formData.is_active,
        created_at: new Date().toISOString()
      };

      // Add to screens list
      setScreens(prev => [newScreen, ...prev]);
      
      // Reset form and close modal
      resetForm();
      setShowCreateModal(false);
      
    } catch (error) {
      console.error('Error creating screen:', error);
      setError('Failed to create screen: ' + error.message);
    }
  };

  const handleUpdateScreen = async () => {
    if (!editingScreen?.ROWID) {
      setError('No screen selected for editing');
      return;
    }

    if (!formData.name.trim() || !formData.location.trim()) {
      setError('Name and location are required');
      return;
    }

    try {
      setError('');
      
      // Update screen in the list
      setScreens(prev => prev.map(screen => 
        screen.ROWID === editingScreen.ROWID 
          ? {
              ...screen,
              name: formData.name.trim(),
              location: formData.location.trim(),
              ip_address: formData.ip_address.trim() || null,
              resolution: formData.resolution,
              is_active: formData.is_active,
              updated_at: new Date().toISOString()
            }
          : screen
      ));
      
      // Reset form and close modal
      resetForm();
      setShowCreateModal(false);
      setEditingScreen(null);
      
    } catch (error) {
      console.error('Error updating screen:', error);
      setError('Failed to update screen: ' + error.message);
    }
  };

  const handleDeleteScreen = async (screenId) => {
    if (!window.confirm('Are you sure you want to delete this screen?')) {
      return;
    }

    try {
      // Remove from screens list
      setScreens(prev => prev.filter(screen => screen.ROWID !== screenId));
    } catch (error) {
      console.error('Error deleting screen:', error);
      setError('Failed to delete screen: ' + error.message);
    }
  };

  const toggleScreenStatus = async (screen) => {
    try {
      // Toggle status in the list
      setScreens(prev => prev.map(s => 
        s.ROWID === screen.ROWID 
          ? { ...s, is_active: !s.is_active }
          : s
      ));
    } catch (error) {
      console.error('Error toggling screen status:', error);
      setError('Failed to update screen status: ' + error.message);
    }
  };

  // Form management
  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      ip_address: '',
      resolution: '1920x1080',
      is_active: true
    });
    setError('');
  };

  const openEditModal = (screen) => {
    setEditingScreen(screen);
    setFormData({
      name: screen.name || '',
      location: screen.location || '',
      ip_address: screen.ip_address || '',
      resolution: screen.resolution || '1920x1080',
      is_active: screen.is_active !== undefined ? screen.is_active : true
    });
    setShowCreateModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online': return <Wifi className="w-4 h-4" />;
      case 'offline': return <WifiOff className="w-4 h-4" />;
      case 'maintenance': return <Settings className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const formatLastSeen = (lastSeenString) => {
    if (!lastSeenString) return 'Never';
    try {
      const lastSeen = new Date(lastSeenString);
      const now = new Date();
      const diffMs = now - lastSeen;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
      return `${Math.floor(diffMins / 1440)} days ago`;
    } catch {
      return 'Unknown';
    }
  };

  const getScreensStats = () => {
    const total = screens.length;
    const online = screens.filter(s => s.status === 'online').length;
    const offline = screens.filter(s => s.status === 'offline').length;
    const maintenance = screens.filter(s => s.status === 'maintenance').length;
    
    return { total, online, offline, maintenance };
  };

  const stats = getScreensStats();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Screen Management</h1>
        <p className="text-gray-600">
          Monitor and manage your digital signage displays across all locations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Monitor className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Screens</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Wifi className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Online</p>
              <p className="text-2xl font-bold text-green-600">{stats.online}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <WifiOff className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Offline</p>
              <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Settings className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Header Actions */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={fetchScreens}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingScreen(null);
            setShowCreateModal(true);
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Screen</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Screens Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Screens ({screens.length})</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading screens...</p>
          </div>
        ) : screens.length === 0 ? (
          <div className="p-8 text-center">
            <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No screens found</p>
            <button
              onClick={() => {
                resetForm();
                setEditingScreen(null);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add your first screen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {screens.map((screen) => (
              <div key={screen.ROWID} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{screen.name}</h3>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>{screen.location}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(screen)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit screen"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteScreen(screen.ROWID)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete screen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(screen.status)}`}>
                      {getStatusIcon(screen.status)}
                      <span className="capitalize">{screen.status}</span>
                    </span>
                  </div>
                  
                  {screen.ip_address && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">IP Address</span>
                      <span className="text-sm font-mono text-gray-900">{screen.ip_address}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Resolution</span>
                    <span className="text-sm text-gray-900">{screen.resolution}</span>
                  </div>
                  
                  {screen.current_playlist && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Current Playlist</span>
                      <span className="text-sm text-blue-600 font-medium">{screen.current_playlist}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Seen</span>
                    <span className="text-sm text-gray-900">{formatLastSeen(screen.last_seen)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={screen.is_active}
                        onChange={() => toggleScreenStatus(screen)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Screen Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingScreen ? 'Edit Screen' : 'Add New Screen'}
              </h3>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Screen Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Screen Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter screen name"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter screen location"
                />
              </div>

              {/* IP Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IP Address
                </label>
                <input
                  type="text"
                  value={formData.ip_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, ip_address: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="192.168.1.100"
                />
              </div>

              {/* Resolution */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution
                </label>
                <select
                  value={formData.resolution}
                  onChange={(e) => setFormData(prev => ({ ...prev, resolution: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="1920x1080">1920x1080 (Full HD)</option>
                  <option value="3840x2160">3840x2160 (4K UHD)</option>
                  <option value="1366x768">1366x768 (HD)</option>
                  <option value="2560x1440">2560x1440 (QHD)</option>
                  <option value="1280x720">1280x720 (HD)</option>
                </select>
              </div>

              {/* Active Status */}
              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    Screen is active
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Active screens are available for content display
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingScreen(null);
                  resetForm();
                }}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingScreen ? handleUpdateScreen : handleCreateScreen}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingScreen ? 'Update Screen' : 'Add Screen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenManager;