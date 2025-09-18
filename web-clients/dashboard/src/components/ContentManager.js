import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Image as ImageIcon, 
  Video, 
  Trash2, 
  Eye, 
  Plus,
  Search,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import config, { MEDIA } from '../config';

// Use FOLDER_ID from config
const FOLDER_ID = MEDIA.FOLDER_ID;

// Catalyst authentication helper
const getCatalystAuthHeaders = () => {
  // Proper JSON content-type with secure CORS handling at gateway level
  return {
    'Content-Type': 'application/json'
  };
};

// Add this function before the ContentManager component
const optimizeImageOnFrontend = (file) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    
    img.onload = () => {
      try {
        // Calculate optimal dimensions for digital signage (max 1920x1080)
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;
        
        // Always resize large images for better compression
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        // For very large images, force resize for better compression
        if (file.size > 5000000) { // 5MB - less aggressive resizing for 25MB limit
          const scaleFactor = Math.sqrt(5000000 / file.size);
          width = Math.round(width * scaleFactor);
          height = Math.round(height * scaleFactor);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image with high quality settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Determine optimal quality based on file size
        let quality = 0.85; // Default quality
        if (file.size > 10000000) { // 10MB+
          quality = 0.75; // Moderate compression for very large files
        } else if (file.size > 5000000) { // 5MB+
          quality = 0.80; // Light compression for large files
        } else if (file.size > 2000000) { // 2MB+
          quality = 0.85; // Standard compression
        } else if (file.size < 500000) { // 500KB-
          quality = 0.90; // High quality for small files
        }
        
        // Convert to blob with compression
        canvas.toBlob((blob) => {
          // Create a new file with optimized data
          const optimizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          
          const reduction = ((file.size - optimizedFile.size) / file.size * 100).toFixed(1);
          console.log(`🔍 [Frontend] Image optimized: ${file.size.toLocaleString()} → ${optimizedFile.size.toLocaleString()} bytes (${reduction}% reduction)`);
          console.log(`🔍 [Frontend] New dimensions: ${width}x${height}, Quality: ${quality * 100}%`);
          
          // Only use optimized file if it's actually smaller AND under 25MB
          if (optimizedFile.size < file.size && optimizedFile.size <= 25 * 1024 * 1024) {
            resolve(optimizedFile);
          } else {
            if (optimizedFile.size > 25 * 1024 * 1024) {
              console.log(`🔍 [Frontend] Optimized file too large (${(optimizedFile.size / 1024 / 1024).toFixed(1)}MB), using original`);
            } else {
              console.log(`🔍 [Frontend] Optimization failed - file got larger, using original`);
            }
            resolve(file);
          }
        }, file.type, quality);
      } catch (error) {
        console.error('🔍 [Frontend] Error during image optimization:', error);
        resolve(file); // Use original file if optimization fails
      }
    };
    
    img.onerror = () => {
      console.error('🔍 [Frontend] Failed to load image for optimization');
      reject(new Error('Failed to load image for optimization'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};

const ContentManager = () => {
  const { currentUserId } = useAuth();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDescription, setFileDescription] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [playlists, setPlaylists] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // Fetch playlists from backend using apiService
  const fetchPlaylists = useCallback(async () => {
    try {
      console.log('Fetching playlists for user:', currentUserId);
      const result = await apiService.getPlaylists(currentUserId);
      console.log('Playlists response:', result);

      if (result.success && result.playlists) {
        setPlaylists(result.playlists);
      } else {
        console.error('Failed to fetch playlists:', result);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  }, [currentUserId]);

  // Fetch content from backend using apiService
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching content for user:', currentUserId);
      
      if (!currentUserId) {
        throw new Error('User ID is required to fetch content');
      }
      
      const result = await apiService.getContent(currentUserId);
      console.log('Content response:', result);

      if (result.success && result.content) {
        console.log('Raw API response content:', result.content);
        
        // Transform the API response to match our UI format
        const transformedContent = result.content.map(item => {
          console.log('Processing item:', item);
          
          // Check if item is valid before processing
          if (!item) {
            console.warn('Skipping undefined/null item');
            return null;
          }
          
          // Parse metadata if it exists
          let metadata = {};
          if (item.metadata) {
            try {
              metadata = JSON.parse(item.metadata);
            } catch (e) {
              console.log('Could not parse metadata for item:', item.file_name || item.fileName || item.title || 'Unknown');
            }
          }
          
          // Handle different date sources
          let uploadedAt = item.CREATEDTIME || item.createdtime || metadata.uploaded_at || new Date().toISOString();
          
          // Handle different object URL sources
          let objectUrl = item.object_url;
          
          // Check for Stratus file storage (real Stratus URLs)
          if (item.stratus_bucket && item.stratus_object_key && !item.stratus_object_key.startsWith('data:')) {
            // Generate real Stratus file URL using your bucket URL
            objectUrl = `https://atrium-media-development.zohostratus.in/${item.stratus_object_key}`;
          }
          // Check for data URL stored in stratus_object_key (legacy/fallback)
          else if (item.stratus_object_key && item.stratus_object_key.startsWith('data:')) {
            objectUrl = item.stratus_object_key; // Use data URL directly for immediate preview
          }
          // Check for regular object_url
          else if (item.object_url && item.object_url.startsWith('data:')) {
            objectUrl = item.object_url; // Use data URL directly for immediate preview
          }
          // Check for other Stratus URL sources
          else if (metadata.storage === 'stratus' && metadata.stratus_url) {
            objectUrl = metadata.stratus_url;
          }
          
          // Get file name with fallbacks
          const fileName = item.file_name || item.fileName || item.title || 'Untitled';
          
          return {
            id: item.ROWID || item.rowid || item.id,
            file_name: fileName,
            file_type: getFileType(item.mime_type || item.mimeType || item.content_type),
            description: item.file_description || item.description || item.content || 'No description',
            uploaded_at: uploadedAt,
            file_size: (() => {
              const rawSize = item.size_bytes || item.sizeBytes || item.file_size;
              console.log('🔍 File size debug:', { title: item.title, rawSize, type: typeof rawSize });
              return formatFileSize(rawSize);
            })(),
            mime_type: item.mime_type || item.mimeType || item.content_type,
            object_url: objectUrl,
            bucket: item.stratus_bucket, // Add bucket info for display logic
            stratus_bucket: item.stratus_bucket, // Keep original field
            stratus_object_key: item.stratus_object_key, // Keep original field
            metadata: metadata
          };
        }).filter(Boolean); // Remove any null items
        
        console.log('Valid content items:', transformedContent);
        setContent(transformedContent);
        console.log('Transformed content:', transformedContent);
        console.log('Content state after setContent:', transformedContent);
        // Debug: Check image items specifically
        const imageItems = transformedContent.filter(item => item.file_type === 'image');
        console.log('Image items:', imageItems);
        imageItems.forEach(item => {
          console.log(`Image item "${item.file_name}":`, {
            file_type: item.file_type,
            object_url: item.object_url,
            mime_type: item.mime_type
          });
        });
      } else {
        console.error('Failed to fetch content:', result);
      }
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchContent();
    fetchPlaylists();
  }, [fetchContent, fetchPlaylists, currentUserId]);

  // Debug logging for content state changes
  useEffect(() => {
    console.log('Content state changed:', content);
    console.log('Content type:', typeof content);
    console.log('Content length:', content?.length);
  }, [content]);

  // Get playlists for a specific content item
  const getPlaylistsForContent = (contentId) => {
    const contentPlaylists = [];
    playlists.forEach(playlist => {
      // Handle nested playlist structure
      const playlistData = playlist.playlists || playlist;
      
      if (playlistData && playlistData.items) {
        let items = [];
        
        // Handle both JSON strings and already-parsed arrays
        if (typeof playlistData.items === 'string') {
          // Parse JSON string
          if (playlistData.items.trim() !== '') {
            try {
              items = JSON.parse(playlistData.items);
            } catch (e) {
              console.warn('Error parsing playlist items JSON:', e, 'Items string:', playlistData.items);
              return; // Skip this playlist if parsing fails
            }
          } else {
            console.warn('Playlist items is empty string:', playlistData.items);
            return; // Skip empty playlists
          }
        } else if (Array.isArray(playlistData.items)) {
          // Items is already an array
          items = playlistData.items;
        } else {
          console.warn('Playlist items is neither string nor array:', typeof playlistData.items, playlistData.items);
          return; // Skip invalid data types
        }
        
        // Ensure items is an array and process it
        if (Array.isArray(items)) {
          const hasContent = items.some(item => 
            (item && item.id === contentId) || 
            (item && item.ROWID === contentId) ||
            (item && item.id === contentId.toString()) ||
            (item && item.ROWID === contentId.toString())
          );
          if (hasContent) {
            contentPlaylists.push(playlistData.name || playlistData.description || 'Unnamed Playlist');
          }
        } else {
          console.warn('Playlist items is not an array after processing:', items);
        }
      }
    });
    return contentPlaylists;
  };

  const getFileType = (mimeType) => {
    if (!mimeType) return 'file';
    // Handle both "image/png" and "image" formats
    if (mimeType.startsWith('image/') || mimeType === 'image') return 'image';
    if (mimeType.startsWith('video/') || mimeType === 'video') return 'video';
    if (mimeType.startsWith('text/') || mimeType === 'text') return 'text';
    if (mimeType.includes('pdf') || mimeType === 'document') return 'document';
    return 'file';
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 'null' || bytes === null) return 'Unknown size';
    
    // Convert string to number if needed
    const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    
    if (isNaN(numBytes) || numBytes <= 0) return 'Unknown size';
    
    try {
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(numBytes) / Math.log(1024));
      return Math.round(numBytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    } catch (error) {
      console.warn('Error formatting file size:', error);
      return 'Unknown size';
    }
  };

  const onDrop = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setFileDescription('');
      setError('');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.webm'],
      'text/*': ['.txt', '.md', '.json'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 25 * 1024 * 1024 // 25MB max to match upload limit
  });

  // Handle file upload
  const handleUpload = async (selectedFile) => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    if (!currentUserId) {
      setError('User ID is required to upload content.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      console.log('Uploading file:', selectedFile.name);
      
      // Check file size before upload (max 25MB - Catalyst Stratus supports this)
      const maxSize = 25 * 1024 * 1024; // 25MB (becomes ~33.3MB when base64 encoded)
      if (selectedFile.size > maxSize) {
        setError(`File is too large (${(selectedFile.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 25MB.`);
        setUploading(false);
        return;
      }
      
      // Optimize image on frontend if it's an image file
      let fileToUpload = selectedFile;
      if (selectedFile.type.startsWith('image/')) {
        // Skip optimization for very small files (< 1MB) - they're already efficient
        if (selectedFile.size < 1024 * 1024) {
          console.log(`🔍 [Frontend] Skipping optimization for small file: ${(selectedFile.size / 1024).toFixed(1)}KB`);
          fileToUpload = selectedFile;
        } else {
          console.log('🔍 [Frontend] Optimizing image before upload...');
          try {
            fileToUpload = await optimizeImageOnFrontend(selectedFile);
            console.log('🔍 [Frontend] Image optimization completed');
            
            // Double-check file size after optimization
            if (fileToUpload.size > maxSize) {
              setError(`File is too large after optimization (${(fileToUpload.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 25MB.`);
              setUploading(false);
              return;
            }
          } catch (optimizationError) {
            console.warn('🔍 [Frontend] Image optimization failed, using original file:', optimizationError);
            fileToUpload = selectedFile;
          }
        }
      }
      
      // Final size check and base64 estimate
      const base64EstimateSize = fileToUpload.size * 1.37; // Base64 adds ~37% overhead
      
      // Display sizes in appropriate units
      const formatSize = (bytes) => {
        if (bytes < 1024 * 1024) {
          return `${(bytes / 1024).toFixed(1)}KB`;
        } else {
          return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
        }
      };
      
      console.log(`🔍 [Frontend] Final file size: ${formatSize(fileToUpload.size)}`);
      console.log(`🔍 [Frontend] Estimated base64 size: ${formatSize(base64EstimateSize)}`);
      
      if (base64EstimateSize > 100 * 1024 * 1024) { // 100MB proxy limit
        setError(`File too large for upload. Final size would be ~${(base64EstimateSize / 1024 / 1024).toFixed(1)}MB (limit: 100MB)`);
        setUploading(false);
        return;
      }
      
      // Convert file to base64
      const base64 = await fileToBase64(fileToUpload);
      
      const requestBody = {
        action: 'uploadBase64',
        data_base64: base64,
        file_name: selectedFile.name,
        folder_id: FOLDER_ID,
        user_id: currentUserId
      };

      const requestBodyString = JSON.stringify(requestBody);
      const actualPayloadSize = requestBodyString.length;
      const actualPayloadMB = actualPayloadSize / 1024 / 1024;
      
      console.log(`🔍 [Frontend] Actual request payload size: ${actualPayloadMB.toFixed(1)}MB (${actualPayloadSize.toLocaleString()} characters)`);
      console.log('🔍 [Frontend] Upload request body preview:', requestBodyString.substring(0, 200) + '...');
      
      if (actualPayloadSize > 100 * 1024 * 1024) {
        setError(`Request payload too large: ${actualPayloadMB.toFixed(1)}MB. This shouldn't happen - please report this bug.`);
        setUploading(false);
        return;
      }

              // Use the correct media-upload endpoint from config
              const response = await fetch(`${config.API_BASE_URL}/media-upload`, {
        method: 'POST',
        headers: getCatalystAuthHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.error('🔍 [Frontend] Upload failed with status:', response.status);
        const errorText = await response.text();
        console.error('🔍 [Frontend] Upload error response:', errorText);
        
        // Handle specific error types
        if (response.status === 413 || errorText.includes('PayloadTooLargeError') || errorText.includes('request entity too large')) {
          throw new Error(`File too large for server (${response.status}). Try a smaller file or better compression.`);
        } else {
          throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('Upload response:', result);

      if (result.success) {
        // Add to selected playlist if one is selected
        console.log('🔍 [Frontend] About to check selectedPlaylist:', selectedPlaylist);
        if (selectedPlaylist && result.row && result.row.ROWID) {
          try {
            console.log('🔍 [Frontend] selectedPlaylist:', selectedPlaylist);
            console.log('🔍 [Frontend] result.row:', result.row);
            
            const playlistRequestBody = {
              action: 'addContent',
              playlist_id: selectedPlaylist,
              content_id: result.row.ROWID,
              user_id: currentUserId
            };
            
            console.log('🔍 [Frontend] playlistRequestBody:', JSON.stringify(playlistRequestBody, null, 2));

            // Use the correct playlist endpoint from config
            const playlistResponse = await fetch(`${config.API_BASE_URL}/playlist`, {
              method: 'POST',
              headers: getCatalystAuthHeaders(),
              body: JSON.stringify(playlistRequestBody)
            });

            if (playlistResponse.ok) {
              const playlistResult = await playlistResponse.json();
              console.log('Added to playlist:', playlistResult);
            } else {
              console.warn('Failed to add to playlist:', playlistResponse.status);
            }
          } catch (playlistError) {
            console.error('Error adding to playlist:', playlistError);
          }
        } else {
          console.log('🔍 [Frontend] Skipping playlist addition:', { 
            selectedPlaylist, 
            hasRow: !!result.row, 
            hasRowId: !!(result.row && result.row.ROWID) 
          });
        }

        // Refresh content list
        fetchContent();
        setSuccessMessage(`File "${selectedFile.name}" uploaded successfully!`);
        setSelectedFile(null);
        setFileDescription('');
        setSelectedPlaylist('');
        setShowUploadModal(false);
      } else {
        setError(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('🔍 [Frontend] Upload error:', error);
      
      // Provide specific error messages based on error type
      if (error.message.includes('File too large for server')) {
        setError(error.message + ' Current limits: 25MB file size, ~33MB after encoding.');
      } else if (error.message.includes('Failed to load image')) {
        setError('Failed to process image file. Please try a different image format.');
      } else if (error.message.includes('Upload failed')) {
        setError(error.message);
      } else {
        setError(`Upload failed: ${error.message}. Please try again with a smaller file.`);
      }
    } finally {
      setUploading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleDelete = async (contentId) => {
    if (window.confirm('Are you sure you want to delete this content? This will also remove it from all playlists.')) {
      if (!currentUserId) {
        setError('User ID is required to delete content.');
        return;
      }

      try {
        console.log('Deleting content with ID:', contentId);
        
        // Step 1: Delete the media file
        // Use the correct media-upload endpoint from config
        const response = await fetch(`${config.API_BASE_URL}/media-upload`, {
          method: 'POST',
          headers: getCatalystAuthHeaders(),
          body: JSON.stringify({
            action: 'deleteMedia',
            media_id: contentId,
            user_id: currentUserId
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Delete response:', result);

        if (result.success) {
          // Note: Playlist cleanup is skipped for simplicity
          // Playlists will handle non-existent content gracefully
          console.log('Content deleted successfully. Playlist references will be cleaned up automatically.');

          // Refresh content list
          fetchContent();
          setSuccessMessage('Content deleted successfully!');
        } else {
          setError(result.message || 'Delete failed');
        }
      } catch (error) {
        console.error('Delete error:', error);
        setError('Delete failed. Please try again.');
      }
    }
  };

  const filteredContent = (content || []).filter(item => {
    // Debug logging
    console.log('Filtering item:', item);
    
    // Safely handle undefined or null items
    if (!item) {
      console.log('Skipping null/undefined item');
      return false;
    }
    
    // If no search term, show all items
    if (!searchTerm) {
      return true;
    }
    
    // Safely handle missing properties
    const fileName = item.file_name || item.fileName || '';
    const description = item.description || item.file_description || '';
    
    console.log('Item properties:', { fileName, description, searchTerm });
    
    const searchLower = searchTerm.toLowerCase();
    return fileName.toLowerCase().includes(searchLower) ||
           description.toLowerCase().includes(searchLower);
  });

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image': return <ImageIcon className="w-6 h-6" />;
      case 'video': return <Video className="w-6 h-6" />;
      case 'document': return <FileText className="w-6 h-6" />;
      default: return <FileText className="w-6 h-6" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <ImageIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Content Manager</h2>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Content</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {successMessage}
          <button
            onClick={() => setSuccessMessage('')}
            className="float-right font-bold text-green-700 hover:text-green-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
          <button
            onClick={() => setError('')}
            className="float-right font-bold text-red-700 hover:text-red-900"
          >
            ×
          </button>
        </div>
      )}

      {/* Content Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : !filteredContent || filteredContent.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No content found</p>
          <p className="text-gray-400">Upload some content to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(filteredContent || []).filter(item => item && item.id && item.file_name).map((item, index) => (
            <div key={item.id || item.ROWID || `item-${index}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              {/* Image Thumbnail for Image Files */}
              {item.file_type === 'image' && item.object_url && (
                <div className="mb-3">
                  {/* For Stratus files, show actual image since they're publicly accessible */}
                  {(item.bucket || '') === 'atrium-media' ? (
                    <>
                      <img 
                        src={item.object_url} 
                        alt={item.file_name || 'Content item'}
                        className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => item.object_url ? window.open(item.object_url, '_blank') : null}
                        onError={(e) => {
                          console.error('Failed to load Stratus image:', item.object_url);
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'block';
                          }
                        }}
                      />
                      {/* Fallback placeholder for failed Stratus images */}
                      <div 
                        className="w-full h-32 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border flex items-center justify-center cursor-pointer hover:from-blue-100 hover:to-indigo-200 transition-all"
                        style={{ display: 'none' }}
                        onClick={() => item.object_url ? window.open(item.object_url, '_blank') : null}
                      >
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 mx-auto text-blue-400 mb-1" />
                          <p className="text-xs text-blue-600 font-medium">Stratus Image</p>
                          <p className="text-xs text-blue-500">Click to view</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* For database-fallback files, try to show actual image */
                    <img 
                      src={item.object_url} 
                      alt={item.file_name || 'Content item'}
                      className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => item.object_url ? window.open(item.object_url, '_blank') : null}
                      onError={(e) => {
                        console.error('Failed to load image:', item.object_url);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  )}
                  
                  {/* Fallback placeholder for database images that fail to load */}
                  {(item.bucket || '') !== 'atrium-media' && (
                    <div 
                      className="w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                      style={{ display: 'none' }}
                      onClick={() => item.object_url ? window.open(item.object_url, '_blank') : null}
                    >
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500">Image Preview</p>
                        <p className="text-xs text-gray-400">Click to view</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mb-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start space-x-2 flex-1 min-w-0">
                    {getFileIcon(item.file_type)}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 break-words leading-tight">{item.file_name}</h3>
                      <p className="text-sm text-gray-500">{item.file_type || 'Unknown type'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                    <button
                      onClick={() => item.object_url ? window.open(item.object_url, '_blank') : null}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p className="break-words">{item.description || 'No description'}</p>
                <p>Size: {item.file_size || 'Unknown size'}</p>
                <p>Uploaded: {item.uploaded_at ? new Date(item.uploaded_at).toLocaleDateString() : 'Unknown date'}</p>
                
                {/* Show playlists this content is in */}
                {(() => {
                  const contentPlaylists = getPlaylistsForContent(item.id);
                  return contentPlaylists.length > 0 ? (
                    <div>
                      <p className="text-xs text-gray-500">In playlists:</p>
                      <p className="text-xs text-blue-600">{contentPlaylists.join(', ')}</p>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Upload Content</h3>
            
            <div className="space-y-4">
              {/* File Upload Area */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                {selectedFile ? (
                  <p className="text-sm text-gray-600">{selectedFile.name}</p>
                ) : (
                  <p className="text-sm text-gray-600">
                    {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
                  </p>
                )}
              </div>

              {/* File Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  placeholder="Enter file description..."
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              {/* Playlist Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add to Playlist (Optional)</label>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedPlaylist}
                    onChange={(e) => setSelectedPlaylist(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2"
                  >
                    <option value="">Select a playlist...</option>
                    {playlists.map((playlist, index) => {
                      const playlistData = playlist.playlists || playlist;
                      const uniqueKey = playlistData.ROWID || playlistData.id || `playlist-${index}`;
                      return (
                        <option key={uniqueKey} value={playlistData.ROWID || playlistData.id}>
                          {playlistData.name || playlistData.description || 'Unnamed Playlist'}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    onClick={() => setShowCreatePlaylist(true)}
                    className="px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                  >
                    New
                  </button>
                </div>

                {/* Create New Playlist */}
                {showCreatePlaylist && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="Enter playlist name..."
                      className="input-field mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!newPlaylistName.trim()) return;
                          
                          try {
                            // Clear any previous errors
                            setError('');
                            
                                                        const requestBody = {
                              action: 'create',
                              name: newPlaylistName,
                              description: '',
                              items: [],
                              user_id: currentUserId
                            };
                            console.log('🔍 [Frontend] Creating playlist with request body:', JSON.stringify(requestBody, null, 2));
                            console.log('🔍 [Frontend] Using headers:', getCatalystAuthHeaders());
                            
                            // Use the correct playlist endpoint from config
                            const response = await fetch(`${config.API_BASE_URL}/playlist`, {
                              method: 'POST',
                              headers: getCatalystAuthHeaders(),
                              body: JSON.stringify(requestBody)
                            });

                            console.log('🔍 [Frontend] Create playlist response status:', response.status);
                            console.log('🔍 [Frontend] Create playlist response ok:', response.ok);
                            
                            if (!response.ok) {
                              throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            
                            const result = await response.json();
                            console.log('🔍 [Frontend] Create playlist response data:', result);
                            
                            if (result.success) {
                              console.log('✅ Playlist created successfully:', result);
                              setSuccessMessage(`Playlist "${newPlaylistName}" created successfully!`);
                              alert(`✅ Playlist "${newPlaylistName}" created successfully!`);
                              setSelectedPlaylist(result.playlist_id);
                              // Create a playlist object for local state
                              const newPlaylist = {
                                ROWID: result.playlist_id,
                                name: newPlaylistName,
                                description: '',
                                items: []
                              };
                              setPlaylists(prev => [newPlaylist, ...prev]);
                              setShowCreatePlaylist(false);
                              setNewPlaylistName('');
                              
                              // Refresh playlists
                              fetchPlaylists();
                            } else {
                              console.warn('❌ Failed to create playlist:', result.message);
                              setError(result.message || 'Failed to create playlist');
                              alert(`❌ Failed to create playlist: ${result.message || 'Unknown error'}`);
                            }
                          } catch (error) {
                            console.error('❌ Error creating playlist:', error);
                            setError(`Failed to create playlist: ${error.message}`);
                            alert(`❌ Error creating playlist: ${error.message}`);
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreatePlaylist(false);
                          setNewPlaylistName('');
                        }}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="btn-secondary"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpload(selectedFile)}
                  disabled={!selectedFile || uploading}
                  className="btn-primary"
                >
                  {uploading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </div>
                  ) : (
                    'Upload'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentManager;
