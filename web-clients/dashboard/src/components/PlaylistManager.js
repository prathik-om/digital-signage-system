import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Play, Pause, Clock, MoreHorizontal, Upload, Image, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import config from '../config';

// Helper function to safely parse playlist items
const getPlaylistItems = (items) => {
  if (Array.isArray(items)) return items;
  try {
    return JSON.parse(items || '[]');
  } catch (error) {
    console.warn('Failed to parse playlist items:', error);
    return [];
  }
};

const PlaylistManager = () => {
  const { currentUserId } = useAuth();
  // State management
  const [playlists, setPlaylists] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [defaultFallbackImage, setDefaultFallbackImage] = useState({
    url: 'https://www.zohowebstatic.com/sites/zweb/images/commonroot/zoho-logo-web.svg',
    title: 'Zoho Logo - Default Fallback',
    duration: 10
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 10,
    selectedContent: [],
    isActive: false
  });
  
  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedOverItem, setDraggedOverItem] = useState(null);
  
  // Modal tab state
  const [activeTab, setActiveTab] = useState('basic'); // 'basic', 'content', 'order'
  
  // Compute valid selected content (filter out items that don't exist in content array)
  const validSelectedContent = formData.selectedContent.filter(contentId => 
    content.find(item => item.id === contentId)
  );
  
  // Clean up invalid content IDs when content changes
  useEffect(() => {
    if (content.length > 0 && formData.selectedContent.length > 0) {
      const validIds = formData.selectedContent.filter(contentId => 
        content.find(item => item.id === contentId)
      );
      
      if (validIds.length !== formData.selectedContent.length) {
        console.log('🔍 [PlaylistManager] Cleaning up invalid content IDs:', {
          original: formData.selectedContent,
          valid: validIds,
          removed: formData.selectedContent.filter(id => !validIds.includes(id))
        });
        
        setFormData(prev => ({
          ...prev,
          selectedContent: validIds
        }));
      }
    }
  }, [content, formData.selectedContent]);

  // Catalyst Auth Headers
  const getCatalystAuthHeaders = () => ({
    'Content-Type': 'application/json'
  });

  // Fetch playlists from backend using apiService
  const fetchPlaylists = useCallback(async () => {
    try {
      console.log('🔍 [Frontend] Fetching playlists for user:', currentUserId);
      
      if (!currentUserId) {
        throw new Error('User ID is required to fetch playlists');
      }
      
      const result = await apiService.getPlaylists(currentUserId);
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
  }, [currentUserId]);

  // Fetch available content
  const fetchContent = useCallback(async () => {
    try {
      if (!currentUserId) {
        throw new Error('User ID is required to fetch content');
      }
      
      // Use config for API endpoint
      const response = await fetch(`${config.API_BASE_URL}/media-upload`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({ 
          action: 'listMedia',
          user_id: currentUserId
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
        
        console.log('🔍 [PlaylistManager] Available content:', transformedContent);
        setContent(transformedContent);
      } else {
        setContent([]);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setError('Failed to load content: ' + error.message);
    }
  }, [currentUserId]);

  // Check database schema (for debugging)
  const checkDatabaseSchema = useCallback(async () => {
    try {
      // Use config for API endpoint
      const response = await fetch(`${config.API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({ 
          action: 'checkSchema',
          user_id: currentUserId
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
  }, []);

  // Load data on component mount
  // Fetch default fallback image
  const fetchDefaultFallbackImage = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getDefaultFallbackImage'
        })
      });
      
      const result = await response.json();
      if (result.success && result.fallbackImage) {
        setDefaultFallbackImage({
          url: result.fallbackImage.url,
          title: result.fallbackImage.title,
          duration: result.fallbackImage.duration || 10
        });
      }
    } catch (error) {
      console.error('Error fetching default fallback image:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await checkDatabaseSchema(); // Check schema first
      await Promise.all([fetchPlaylists(), fetchContent(), fetchDefaultFallbackImage()]);
      setLoading(false);
    };
    
    loadData();
  }, [currentUserId, checkDatabaseSchema, fetchPlaylists, fetchContent]);

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
      
      // Use config for API endpoint
      const response = await fetch(`${config.API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({ 
          action: 'create',
          name: formData.name.trim(),
          description: formData.description.trim(),
          duration: formData.duration,
          items: formData.selectedContent.map(contentId => ({ id: contentId })),
          isActive: formData.isActive
        })
      });

      console.log('🔍 [Frontend] Create response status:', response.status);
      const result = await response.json();
      console.log('🔍 [Frontend] Create response result:', result);
      
      if (result.success) {
        // Create new playlist object for state
        const newPlaylist = {
          id: result.playlistId,
          ROWID: result.playlistId,
          name: formData.name.trim(),
          description: formData.description.trim(),
          duration: formData.duration,
          is_active: formData.isActive,
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
    if (!editingPlaylist?.ROWID) {
      setError('No playlist selected for editing');
      return;
    }

    if (!formData.name.trim()) {
      setError('Playlist name is required');
      return;
    }

    try {
      setError('');
      
      // Use config for API endpoint
      const response = await fetch(`${config.API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({ 
          action: 'update',
          playlist_id: editingPlaylist.ROWID,
          name: formData.name.trim(),
          description: formData.description.trim(),
          duration: formData.duration,
          selectedContent: formData.selectedContent.map(contentId => ({ id: contentId })),
          isActive: formData.isActive
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update playlist in state
        setPlaylists(prev => prev.map(playlist => 
          playlist.ROWID === editingPlaylist.ROWID 
            ? {
                ...playlist,
                name: formData.name.trim(),
                description: formData.description.trim(),
                duration: formData.duration,
                items: formData.selectedContent.map(contentId => ({ id: contentId })),
                is_active: formData.isActive,
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
      
      // Use config for API endpoint
      const response = await fetch(`${config.API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({ 
          action: 'delete',
          playlist_id: playlistId,
          user_id: currentUserId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setPlaylists(prev => prev.filter(playlist => playlist.ROWID !== playlistId));
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
      selectedContent: [],
      isActive: false
    });
    setError('');
    setActiveTab('basic');
  };

  // Open edit modal
  const openEditModal = (playlist) => {
    setEditingPlaylist(playlist);
    setFormData({
      name: playlist.name || '',
      description: playlist.description || '',
      duration: playlist.duration || 10,
      selectedContent: (() => {
        const items = getPlaylistItems(playlist.items);
        const contentIds = items.map(item => item.id).filter(Boolean);
        console.log('🔍 [PlaylistManager] Editing playlist - items:', items);
        console.log('🔍 [PlaylistManager] Editing playlist - contentIds:', contentIds);
        return contentIds;
      })(),
      isActive: playlist.is_active || false
    });
    setActiveTab('basic');
    setShowCreateModal(true);
  };

  // Cancel edit/create
  const handleCancel = () => {
    resetForm();
    setShowCreateModal(false);
    setEditingPlaylist(null);
  };

  // Toggle playlist active status
  const togglePlaylistStatus = async (playlist) => {
    try {
      setError('');
      const newStatus = !playlist.is_active;
      
      const response = await fetch(`${config.API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({
          action: 'update',
          playlist_id: playlist.ROWID,
          name: playlist.name,
          description: playlist.description,
          duration: playlist.duration,
          selectedContent: getPlaylistItems(playlist.items),
          isActive: newStatus
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update playlist in state
        setPlaylists(prev => prev.map(p => 
          p.ROWID === playlist.ROWID 
            ? { ...p, is_active: newStatus }
            : { ...p, is_active: false } // Deactivate all other playlists
        ));
        
        // Show success message
        console.log(`Playlist ${newStatus ? 'activated' : 'deactivated'} successfully`);
      } else {
        throw new Error(result.message || 'Failed to update playlist status');
      }
    } catch (error) {
      console.error('Error toggling playlist status:', error);
      setError('Failed to update playlist status: ' + error.message);
    }
  };

  // Get content name by ID
  const getContentName = (contentId) => {
    const contentItem = content.find(item => item.id === contentId);
    return contentItem ? contentItem.name : `Content ${contentId}`;
  };

  // Drag and drop handlers
  const handleDragStart = (e, itemId) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, itemId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverItem(itemId);
  };

  const handleDragLeave = () => {
    setDraggedOverItem(null);
  };

  const handleDrop = async (e, targetItemId) => {
    e.preventDefault();
    
    if (!draggedItem || !targetItemId || draggedItem === targetItemId) {
      setDraggedItem(null);
      setDraggedOverItem(null);
      return;
    }

    // Find the playlist being edited
    const playlist = playlists.find(p => p.ROWID === editingPlaylist?.ROWID);
    if (!playlist) return;

    const items = getPlaylistItems(playlist.items);
    const draggedIndex = items.findIndex(item => item.id === draggedItem);
    const targetIndex = items.findIndex(item => item.id === targetItemId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder items
    const newItems = [...items];
    const [draggedItemData] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItemData);

    // Update the playlist in state
    setPlaylists(prev => prev.map(p => 
      p.ROWID === playlist.ROWID 
        ? { ...p, items: JSON.stringify(newItems) }
        : p
    ));

    // Save to database
    try {
      const response = await fetch(`${config.API_BASE_URL}/playlist`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify({
          action: 'update',
          playlist_id: playlist.ROWID,
          name: playlist.name,
          description: playlist.description,
          duration: playlist.duration,
          selectedContent: newItems,
          user_id: currentUserId
        })
      });

      const result = await response.json();
      if (!result.success) {
        console.error('Failed to update playlist order:', result.message);
        // Revert the change
        setPlaylists(prev => prev.map(p => 
          p.ROWID === playlist.ROWID 
            ? { ...p, items: playlist.items }
            : p
        ));
      }
    } catch (error) {
      console.error('Error updating playlist order:', error);
      // Revert the change
      setPlaylists(prev => prev.map(p => 
        p.ROWID === playlist.ROWID 
          ? { ...p, items: playlist.items }
          : p
      ));
    }

    setDraggedItem(null);
    setDraggedOverItem(null);
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
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Playlist Manager</h1>
              <p className="text-gray-600 mt-2">Create and manage your content playlists with drag-and-drop reordering</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingPlaylist(null);
                setShowCreateModal(true);
              }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span>Create New Playlist</span>
            </button>
          </div>
          
          {/* Default Fallback Image Section */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Image className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Default Fallback Image</h2>
                  <p className="text-sm text-gray-600">Image shown when no playlists are active</p>
                </div>
              </div>
              <a
                href="/settings"
                className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Configure</span>
              </a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={defaultFallbackImage.url}
                      alt="Fallback image preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzZaIiBmaWxsPSIjRkY0NDQ0Ii8+CjxwYXRoIGQ9Ik0yNCAyOEMyNS4xMDQ2IDI4IDI2IDI3LjEwNDYgMjYgMjZDMjYgMjQuODk1NCAyNS4xMDQ2IDI0IDI0IDI0QzIyLjg5NTQgMjQgMjIgMjQuODk1NCAyMiAyNkMyMiAyNy4xMDQ2IDIyLjg5NTQgMjggMjQgMjhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {defaultFallbackImage.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {defaultFallbackImage.url}
                    </p>
                    <p className="text-xs text-gray-500">
                      Duration: {defaultFallbackImage.duration}s
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Priority Level</p>
                  <p className="text-sm font-medium text-orange-600">3 (Fallback)</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    playlists.filter(p => p.is_active).length > 0 
                      ? 'bg-green-500 animate-pulse' 
                      : 'bg-gray-400'
                  }`}></div>
                  <span className="text-sm text-gray-700 font-medium">
                    {playlists.filter(p => p.is_active).length === 1 
                      ? `Active: ${playlists.find(p => p.is_active)?.name || 'Unknown'}`
                      : playlists.filter(p => p.is_active).length === 0
                      ? 'No Active Playlist'
                      : `${playlists.filter(p => p.is_active).length} Active (Error: Only 1 should be active)`
                    }
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    {playlists.filter(p => getPlaylistItems(p.items).length > 0).length} Ready
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    {playlists.filter(p => getPlaylistItems(p.items).length === 0).length} Empty
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Total: {playlists.length} playlists
              </div>
            </div>
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
                  {playlists.reduce((sum, playlist) => sum + getPlaylistItems(playlist.items).length, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Playlists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist, index) => {
            const isActive = playlist.is_active;
            return (
              <div 
                key={playlist.ROWID || playlist.id || `playlist-${index}`} 
                className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border overflow-hidden ${
                  isActive 
                    ? 'border-green-300 ring-2 ring-green-100 shadow-lg' 
                    : 'border-gray-100'
                }`}
              >
                {/* Active Status Banner */}
                {isActive && (
                  <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-center">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>🔴 LIVE - Currently Playing</span>
                    </div>
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg truncate">{playlist.name}</h3>
                        {isActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {playlist.description || 'No description provided'}
                      </p>
                    </div>
                    <div className="flex space-x-1 ml-4">
                      <button
                        onClick={() => togglePlaylistStatus(playlist)}
                        className={`p-2 rounded-lg transition-colors ${
                          isActive 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={isActive ? 'Deactivate Playlist' : 'Activate Playlist'}
                      >
                        {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => openEditModal(playlist)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Playlist"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlaylist(playlist.ROWID)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Playlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Status and Info */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getPlaylistItems(playlist.items).length > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {getPlaylistItems(playlist.items).length > 0 ? 'Ready' : 'Empty'}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {playlist.duration}s/item
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {getPlaylistItems(playlist.items).length} items
                  </div>
                </div>

                {/* Playlist Items Preview */}
                {getPlaylistItems(playlist.items).length > 0 ? (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-blue-900">Content Items</p>
                      {editingPlaylist?.ROWID === playlist.ROWID && (
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Drag to reorder</span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      {getPlaylistItems(playlist.items).slice(0, 3).map((item, index) => (
                        <div 
                          key={`${playlist.ROWID}-${item.id || index}`} 
                          className={`flex items-center p-2 rounded-lg transition-all duration-200 ${
                            draggedItem === item.id 
                              ? 'opacity-50 bg-blue-200 scale-95' 
                              : 'bg-white hover:bg-blue-100'
                          } ${
                            draggedOverItem === item.id 
                              ? 'ring-2 ring-blue-300 bg-blue-100' 
                              : ''
                          }`}
                          draggable={editingPlaylist?.ROWID === playlist.ROWID}
                          onDragStart={(e) => handleDragStart(e, item.id)}
                          onDragOver={(e) => handleDragOver(e, item.id)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, item.id)}
                        >
                          <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium mr-3 flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-sm text-gray-700 truncate flex-1">{getContentName(item.id)}</span>
                          {editingPlaylist?.ROWID === playlist.ROWID && (
                            <span className="text-gray-400 text-sm ml-2">⋮⋮</span>
                          )}
                        </div>
                      ))}
                      
                      {getPlaylistItems(playlist.items).length > 3 && (
                        <div className="text-center pt-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            +{getPlaylistItems(playlist.items).length - 3} more items
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-6 text-center border-2 border-dashed border-gray-200">
                    <Play className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-2">No content items</p>
                    <p className="text-xs text-gray-400">Add content to get started</p>
                  </div>
                )}
              </div>
            );
          })}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {editingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {editingPlaylist ? 'Update your playlist details and content' : 'Set up a new playlist for your content'}
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-white hover:text-blue-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Modal Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('basic')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'basic'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Basic Info
                </button>
                <button
                  onClick={() => setActiveTab('content')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'content'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Select Content
                  {validSelectedContent.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                      {validSelectedContent.length}
                    </span>
                  )}
                </button>
                {formData.selectedContent.length > 0 && (
                  <button
                    onClick={() => setActiveTab('order')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'order'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Order & Review
                  </button>
                )}
              </nav>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name Input */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Playlist Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Enter a descriptive name for your playlist"
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
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>

                      {/* Active Toggle */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <div className="flex items-center space-x-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.isActive}
                              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-900">
                              {formData.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Only one playlist can be active at a time. Activating this playlist will deactivate all others.
                        </p>
                      </div>

                      {/* Description Input */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                          placeholder="Optional description for your playlist"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-medium text-gray-900">Select Content</h3>
                      <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                        {validSelectedContent.length} of {content.length} selected
                      </span>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto bg-white">
                      {content.length > 0 ? (
                        <div className="p-4 space-y-3">
                          {content.map((item) => (
                            <label key={item.id} className="flex items-center cursor-pointer hover:bg-blue-50 p-4 rounded-lg transition-colors border border-transparent hover:border-blue-200">
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
                                className="mr-4 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.type}</p>
                              </div>
                              {formData.selectedContent.includes(item.id) && (
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              )}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="p-12 text-center text-gray-500">
                          <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-lg font-medium mb-2">No content available</p>
                          <p className="text-sm text-gray-400">Upload some content first to create playlists</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'order' && validSelectedContent.length > 0 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-medium text-gray-900">Playlist Order</h3>
                      <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                        Drag to reorder
                      </span>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto bg-white">
                      <div className="p-4 space-y-3">
                        {formData.selectedContent
                          .filter(contentId => {
                            const contentItem = content.find(item => item.id === contentId);
                            if (!contentItem) {
                              console.warn('🔍 [PlaylistManager] Filtering out invalid content ID:', contentId);
                              return false;
                            }
                            return true;
                          })
                          .map((contentId, index) => {
                            const contentItem = content.find(item => item.id === contentId);
                            console.log('🔍 [PlaylistManager] Rendering item:', { contentId, index, contentItem, totalContent: content.length });
                          
                          return (
                            <div
                              key={contentId}
                              className={`flex items-center p-4 rounded-lg border cursor-move transition-all duration-200 ${
                                draggedItem === contentId 
                                  ? 'opacity-50 bg-blue-100 scale-95 shadow-lg' 
                                  : 'bg-white hover:bg-blue-50'
                              } ${
                                draggedOverItem === contentId 
                                  ? 'border-blue-400 bg-blue-100 ring-2 ring-blue-200' 
                                  : 'border-gray-200 hover:border-blue-300'
                              }`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, contentId)}
                              onDragOver={(e) => handleDragOver(e, contentId)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => {
                                e.preventDefault();
                                
                                if (!draggedItem || !contentId || draggedItem === contentId) {
                                  setDraggedItem(null);
                                  setDraggedOverItem(null);
                                  return;
                                }

                                const draggedIndex = validSelectedContent.indexOf(draggedItem);
                                const targetIndex = validSelectedContent.indexOf(contentId);

                                if (draggedIndex === -1 || targetIndex === -1) return;

                                // Reorder the selectedContent array
                                const newSelectedContent = [...formData.selectedContent];
                                const [draggedItemData] = newSelectedContent.splice(draggedIndex, 1);
                                newSelectedContent.splice(targetIndex, 0, draggedItemData);

                                setFormData(prev => ({
                                  ...prev,
                                  selectedContent: newSelectedContent
                                }));

                                setDraggedItem(null);
                                setDraggedOverItem(null);
                              }}
                            >
                              <span className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-4 flex-shrink-0">
                                {index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{contentItem.name}</p>
                                <p className="text-xs text-gray-500">{contentItem.type}</p>
                              </div>
                              <span className="text-gray-400 text-lg ml-4">⋮⋮</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          <strong>{validSelectedContent.length}</strong> items selected
                        </span>
                        <span className="text-gray-700">
                          Total duration: <strong>{validSelectedContent.length * formData.duration}s</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {validSelectedContent.length > 0 && (
                    <span>
                      {validSelectedContent.length} items • {validSelectedContent.length * formData.duration}s total
                    </span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  
                  {/* Navigation buttons */}
                  {activeTab === 'basic' && (
                    <button
                      onClick={() => setActiveTab('content')}
                      disabled={!formData.name.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      Next: Select Content
                    </button>
                  )}
                  
                  {activeTab === 'content' && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setActiveTab('basic')}
                        className="px-6 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setActiveTab('order')}
                        disabled={validSelectedContent.length === 0}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        Next: Review Order
                      </button>
                    </div>
                  )}
                  
                  {activeTab === 'order' && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setActiveTab('content')}
                        className="px-6 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors font-medium"
                      >
                        Back
                      </button>
                      <button
                        onClick={editingPlaylist ? handleUpdatePlaylist : handleCreatePlaylist}
                        disabled={!formData.name.trim() || validSelectedContent.length === 0}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                      >
                        {editingPlaylist ? (
                          <>
                            <Edit className="w-4 h-4" />
                            <span>Update Playlist</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>Create Playlist</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistManager;