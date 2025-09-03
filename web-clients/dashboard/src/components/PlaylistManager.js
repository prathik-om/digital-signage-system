import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Play, Clock, MoreHorizontal } from 'lucide-react';
import config, { getApiUrl } from '../config.js';

const API_BASE_URL = config.API_BASE_URL;

const PlaylistManager = () => {
  // State management
  const [playlists, setPlaylists] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 10,
    selectedContent: []
  });

  // Catalyst Auth Headers
  const getCatalystAuthHeaders = () => ({
    'Content-Type': 'application/json'
  });

  // Fetch playlists from backend
  const fetchPlaylists = async () => {
    try {
      console.log('🔍 [Frontend] Fetching playlists...');
      const response = await fetch(`${API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({ 
          action: 'getAll'
        })
      });

      console.log('🔍 [Frontend] Fetch response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🔍 [Frontend] Fetch response result:', result);
      console.log('🔍 [Frontend] Playlists received:', result.playlists);
      
      if (result.success) {
        console.log('🔍 [Frontend] Setting playlists state:', result.playlists || []);
        setPlaylists(result.playlists || []);
        console.log('🔍 [Frontend] Playlists state updated. Count:', (result.playlists || []).length);
      } else {
        throw new Error(result.message || 'Failed to fetch playlists');
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setError('Failed to load playlists: ' + error.message);
    }
  };

  // Fetch available content
  const fetchContent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/media-upload`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({ 
          action: 'listMedia'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.media) {
        // Transform media data to expected format
        const transformedContent = result.media
          .filter(item => item.file_name) // Only include items with valid file names
          .map(item => ({
            id: item.ROWID,
            name: item.file_name,
            url: item.object_url,
            type: item.mime_type,
            bucket: item.bucket || 'content'
          }));
        
        setContent(transformedContent);
      } else {
        setContent([]);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to load content: ' + error.message);
    }
  };

  // Check database schema (for debugging)
  const checkDatabaseSchema = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({ 
          action: 'checkSchema'
        })
      });

      const result = await response.json();
      console.log('🔍 Database Schema Check:', result);
      
      if (result.success) {
        console.log('✅ Available columns:', result.available_columns);
        console.log('📄 Sample row:', result.sample_row);
      }
    } catch (error) {
      console.error('❌ Schema check failed:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await checkDatabaseSchema(); // Check schema first
      await Promise.all([fetchPlaylists(), fetchContent()]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Handle create playlist
  const handleCreatePlaylist = async () => {
    if (!formData.name.trim()) {
      setError('Playlist name is required');
      return;
    }

    try {
      setError('');
      
      console.log('🔍 [Frontend] Creating playlist with data:', {
        name: formData.name.trim(),
        description: formData.description.trim(),
        duration: formData.duration,
        items: formData.selectedContent.map(contentId => ({ id: contentId }))
      });
      
      const response = await fetch(`${API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({ 
          action: 'create',
          name: formData.name.trim(),
          description: formData.description.trim(),
          duration: formData.duration,
          items: formData.selectedContent.map(contentId => ({ id: contentId }))
        })
      });

      console.log('🔍 [Frontend] Create response status:', response.status);
      const result = await response.json();
      console.log('🔍 [Frontend] Create response result:', result);
      
      if (result.success) {
        // Create new playlist object for state
        const newPlaylist = {
          id: result.playlist_id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          duration: formData.duration,
          is_active: false,
          items: formData.selectedContent.map(contentId => ({ id: contentId })),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        console.log('🔍 [Frontend] Adding new playlist to state:', newPlaylist);
        setPlaylists(prev => {
          const updated = [newPlaylist, ...prev];
          console.log('🔍 [Frontend] New playlists state:', updated);
          return updated;
        });
        
        resetForm();
        setShowCreateModal(false);
        
        // Refresh from backend to verify persistence
        console.log('🔍 [Frontend] Refreshing playlists from backend to verify persistence...');
        setTimeout(() => {
          fetchPlaylists();
        }, 1000);
        
      } else {
        throw new Error(result.message || 'Failed to create playlist');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      setError('Failed to create playlist: ' + error.message);
    }
  };

  // Handle update playlist
  const handleUpdatePlaylist = async () => {
    if (!editingPlaylist?.id) {
      setError('No playlist selected for editing');
      return;
    }

    if (!formData.name.trim()) {
      setError('Playlist name is required');
      return;
    }

    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({ 
          action: 'update',
          playlist_id: editingPlaylist.id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          duration: formData.duration,
          selectedContent: formData.selectedContent.map(contentId => ({ id: contentId }))
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update playlist in state
        setPlaylists(prev => prev.map(playlist => 
          playlist.id === editingPlaylist.id 
            ? {
                ...playlist,
                name: formData.name.trim(),
                description: formData.description.trim(),
                duration: formData.duration,
                items: formData.selectedContent.map(contentId => ({ id: contentId })),
                updated_at: new Date().toISOString()
              }
            : playlist
        ));
        
        resetForm();
        setShowCreateModal(false);
        setEditingPlaylist(null);
      } else {
        throw new Error(result.message || 'Failed to update playlist');
      }
    } catch (error) {
      console.error('Error updating playlist:', error);
      setError('Failed to update playlist: ' + error.message);
    }
  };

  // Handle delete playlist
  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Are you sure you want to delete this playlist?')) {
      return;
    }

    try {
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({ 
          action: 'delete',
          playlist_id: playlistId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setPlaylists(prev => prev.filter(playlist => playlist.id !== playlistId));
      } else {
        throw new Error(result.message || 'Failed to delete playlist');
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      setError('Failed to delete playlist: ' + error.message);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      duration: 10,
      selectedContent: []
    });
    setError('');
  };

  // Open edit modal
  const openEditModal = (playlist) => {
    setEditingPlaylist(playlist);
    setFormData({
      name: playlist.name || '',
      description: playlist.description || '',
      duration: playlist.duration || 10,
      selectedContent: (playlist.items || []).map(item => item.id).filter(Boolean)
    });
    setShowCreateModal(true);
  };

  // Cancel edit/create
  const handleCancel = () => {
    resetForm();
    setShowCreateModal(false);
    setEditingPlaylist(null);
  };

  // Get content name by ID
  const getContentName = (contentId) => {
    const contentItem = content.find(item => item.id === contentId);
    return contentItem ? contentItem.name : `Content ${contentId}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading playlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Playlist Manager</h1>
              <p className="text-gray-600 mt-1">Create and manage your content playlists</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingPlaylist(null);
                setShowCreateModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Playlist
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Play className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Playlists</p>
                <p className="text-2xl font-bold text-gray-900">{playlists.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Content</p>
                <p className="text-2xl font-bold text-gray-900">{content.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MoreHorizontal className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {playlists.reduce((sum, playlist) => sum + (playlist.items?.length || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Playlists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg">{playlist.name}</h3>
                    {playlist.description && (
                      <p className="text-gray-600 text-sm mt-1">{playlist.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => openEditModal(playlist)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit Playlist"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlaylist(playlist.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Playlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Clock className="h-4 w-4 mr-1" />
                  {playlist.duration}s per item • {playlist.items?.length || 0} items
                </div>

                {/* Playlist Items Preview */}
                {playlist.items && playlist.items.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Content Items:</p>
                    <div className="space-y-1">
                      {playlist.items.slice(0, 3).map((item, index) => (
                        <div key={`${playlist.id}-${item.id || index}`} className="text-xs text-gray-600 flex items-center">
                          <span className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                            {index + 1}
                          </span>
                          <span className="truncate">{getContentName(item.id)}</span>
                        </div>
                      ))}
                      {playlist.items.length > 3 && (
                        <div className="text-xs text-gray-500 pl-6">
                          +{playlist.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-sm text-gray-500">No content items</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {playlists.length === 0 && (
          <div className="text-center py-12">
            <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No playlists yet</h3>
            <p className="text-gray-600 mb-6">Create your first playlist to get started.</p>
            <button
              onClick={() => {
                resetForm();
                setEditingPlaylist(null);
                setShowCreateModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Playlist
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}
              </h2>
              
              <div className="space-y-6">
                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Playlist Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter playlist name"
                  />
                </div>

                {/* Description Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter playlist description"
                  />
                </div>

                {/* Duration Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration per Item (seconds)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 10 }))}
                    min="1"
                    max="300"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Content Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Content Items
                  </label>
                  <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                    {content.length > 0 ? (
                      <div className="p-4 space-y-2">
                        {content.map((item) => (
                          <label key={item.id} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={formData.selectedContent.includes(item.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedContent: [...prev.selectedContent, item.id]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    selectedContent: prev.selectedContent.filter(id => id !== item.id)
                                  }));
                                }
                              }}
                              className="mr-3"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.type}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No content available. Upload some content first.
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Selected: {formData.selectedContent.length} items
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingPlaylist ? handleUpdatePlaylist : handleCreatePlaylist}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPlaylist ? 'Update Playlist' : 'Create Playlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistManager;