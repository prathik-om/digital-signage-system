import React, { useState, useEffect } from 'react';
import { API_BASE_URL, getCatalystAuthHeaders } from '../config';

const AdminControlPanel = ({ user }) => {
  const [currentProjection, setCurrentProjection] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCurrentProjection();
    fetchPlaylists();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchCurrentProjection();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchCurrentProjection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({
          data: { action: 'getCurrentProjection' }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCurrentProjection(result.current_projection);
        }
      }
    } catch (error) {
      console.error('Error fetching current projection:', error);
    }
  };

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({
          data: { action: 'getAll' }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPlaylists(result.playlists || []);
        }
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setError('Failed to fetch playlists');
    } finally {
      setLoading(false);
    }
  };

  const setActivePlaylist = async (playlistId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({
          data: {
            action: 'setActive',
            playlist_id: playlistId
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('Playlist activated successfully!');
          fetchCurrentProjection();
          fetchPlaylists();
        } else {
          alert('Error: ' + result.message);
        }
      }
    } catch (error) {
      console.error('Error setting active playlist:', error);
      alert('Error setting active playlist');
    }
  };

  const clearActivePlaylist = async () => {
    try {
      // Set all playlists to inactive
      const response = await fetch(`${API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({
          data: {
            action: 'setActive',
            playlist_id: 0 // This will deactivate all playlists
          }
        })
      });

      if (response.ok) {
        alert('Returned to default Cliq messages!');
        fetchCurrentProjection();
        fetchPlaylists();
      }
    } catch (error) {
      console.error('Error clearing active playlist:', error);
      alert('Error clearing active playlist');
    }
  };

  const getProjectionSourceText = (source) => {
    switch (source) {
      case 'admin_active':
        return 'Admin-Controlled Playlist';
      case 'scheduled':
        return 'Scheduled Playlist';
      case 'default_cliq':
        return 'Default Cliq Messages';
      default:
        return 'Unknown Source';
    }
  };

  const getProjectionSourceColor = (source) => {
    switch (source) {
      case 'admin_active':
        return 'text-blue-600 bg-blue-100';
      case 'scheduled':
        return 'text-green-600 bg-green-100';
      case 'default_cliq':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Control Panel</h1>
        <p className="text-gray-600">Complete control over what's being projected on TV displays</p>
      </div>

      {/* Current Projection Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Projection Status</h2>
        
        {currentProjection ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-500">Source:</span>
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getProjectionSourceColor(currentProjection.source)}`}>
                  {getProjectionSourceText(currentProjection.source)}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {new Date(currentProjection.timestamp).toLocaleTimeString()}
              </div>
            </div>
            
            {currentProjection.playlist && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Active Playlist Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 font-medium">{currentProjection.playlist.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="ml-2 font-medium">{currentProjection.playlist.playlist_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2">{new Date(currentProjection.playlist.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Items:</span>
                    <span className="ml-2">{currentProjection.playlist.item_count || 0}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">
                  {currentProjection.default_cliq_available ? '✅' : '❌'}
                </div>
                <div className="text-gray-500">Default Cliq</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">
                  {currentProjection.scheduled_available ? '✅' : '❌'}
                </div>
                <div className="text-gray-500">Scheduled</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">
                  {currentProjection.source === 'admin_active' ? '✅' : '❌'}
                </div>
                <div className="text-gray-500">Admin Control</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No projection information available
          </div>
        )}
      </div>

      {/* Playlist Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Playlist Management</h2>
          <button
            onClick={clearActivePlaylist}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Return to Default Cliq
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className={`border rounded-lg p-4 transition-all ${
                playlist.is_active
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-gray-900 truncate">{playlist.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  playlist.status === 'active' ? 'bg-green-100 text-green-800' :
                  playlist.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  playlist.status === 'default' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {playlist.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {playlist.description || 'No description'}
              </p>
              
              <div className="text-xs text-gray-500 mb-4">
                <div>Type: {playlist.playlist_type}</div>
                <div>Items: {playlist.item_count || 0}</div>
                <div>Created: {new Date(playlist.created_at).toLocaleDateString()}</div>
              </div>
              
              <div className="flex space-x-2">
                {!playlist.is_active && playlist.status !== 'default' && (
                  <button
                    onClick={() => setActivePlaylist(playlist.id)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                  >
                    Activate
                  </button>
                )}
                
                {playlist.is_active && (
                  <button
                    disabled
                    className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded cursor-not-allowed"
                  >
                    Active
                  </button>
                )}
                
                {playlist.status === 'default' && (
                  <button
                    disabled
                    className="flex-1 px-3 py-2 bg-purple-500 text-white text-sm rounded cursor-not-allowed"
                  >
                    Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {playlists.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No playlists found. Create a playlist to get started.
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/playlists'}
            className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
          >
            <div className="font-medium text-gray-900">Manage Playlists</div>
            <div className="text-sm text-gray-500">Create, edit, and organize playlists</div>
          </button>
          
          <button
            onClick={() => window.location.href = '/schedule'}
            className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
          >
            <div className="font-medium text-gray-900">Event Schedule</div>
            <div className="text-sm text-gray-500">Set up scheduled playlists for events</div>
          </button>
          
          <button
            onClick={() => window.location.href = '/content'}
            className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
          >
            <div className="font-medium text-gray-900">Content Library</div>
            <div className="text-sm text-gray-500">Upload and manage media content</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminControlPanel;
