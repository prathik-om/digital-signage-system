import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Image, Eye } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SettingsManager = () => {
  const { currentUserId } = useAuth();
  const [defaultFallbackImage, setDefaultFallbackImage] = useState({
    url: 'https://www.zohowebstatic.com/sites/zweb/images/commonroot/zoho-logo-web.svg',
    title: 'Zoho Logo - Default Fallback',
    duration: 10
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchDefaultFallbackImage();
  }, [currentUserId]);


  const fetchDefaultFallbackImage = async () => {
    try {
      setLoading(true);
      console.log('Fetching default fallback image configuration');
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'}/content`, {
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
        setImagePreview(result.fallbackImage.url);
      }
    } catch (error) {
      console.error('Error fetching default fallback image:', error);
      setError('Error fetching fallback image settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleImageUrlChange = (url) => {
    setDefaultFallbackImage(prev => ({ ...prev, url }));
    setImagePreview(url);
    setHasChanges(true);
  };

  const handleImageTitleChange = (title) => {
    setDefaultFallbackImage(prev => ({ ...prev, title }));
    setHasChanges(true);
  };

  const handleImageDurationChange = (duration) => {
    setDefaultFallbackImage(prev => ({ ...prev, duration: parseInt(duration) || 10 }));
    setHasChanges(true);
  };


  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      // Save fallback image setting
      console.log('Saving fallback image setting');
      const imageResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateDefaultFallbackImage',
          fallbackImage: defaultFallbackImage
        })
      });
      
      const imageResult = await imageResponse.json();

      if (imageResult.success) {
        setSuccessMessage('Fallback image settings saved successfully!');
        setHasChanges(false);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Failed to save fallback image settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Error saving settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    setDefaultFallbackImage({
      url: 'https://www.zohowebstatic.com/sites/zweb/images/commonroot/zoho-logo-web.svg',
      title: 'Zoho Logo - Default Fallback',
      duration: 10
    });
    setImagePreview('https://www.zohowebstatic.com/sites/zweb/images/commonroot/zoho-logo-web.svg');
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
          <Image className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Fallback Image Settings</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Configure the default image shown when no content is available
        </p>
      </div>


      {/* Default Fallback Image Setting */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Default Fallback Image
          </h2>
          <p className="text-gray-600">
            This image is shown when no active playlists or content are available
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Form */}
          <div className="space-y-6">
            <div>
              <label htmlFor="fallbackImageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                id="fallbackImageUrl"
                type="url"
                value={defaultFallbackImage.url}
                onChange={(e) => handleImageUrlChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/your-image.jpg"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter a direct URL to your image (JPG, PNG, GIF supported)
              </p>
            </div>

            <div>
              <label htmlFor="fallbackImageTitle" className="block text-sm font-medium text-gray-700 mb-2">
                Image Title
              </label>
              <input
                id="fallbackImageTitle"
                type="text"
                value={defaultFallbackImage.title}
                onChange={(e) => handleImageTitleChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Default Fallback Image"
              />
            </div>

            <div>
              <label htmlFor="fallbackImageDuration" className="block text-sm font-medium text-gray-700 mb-2">
                Display Duration (seconds)
              </label>
              <input
                id="fallbackImageDuration"
                type="number"
                value={defaultFallbackImage.duration}
                onChange={(e) => handleImageDurationChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
                max="300"
                step="1"
              />
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleImageUrlChange('https://www.zohowebstatic.com/sites/zweb/images/commonroot/zoho-logo-web.svg')}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Zoho Logo
                </button>
                <button
                  onClick={() => handleImageUrlChange('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSIjMjU2M2ViIi8+Cjx0ZXh0IHg9Ijk2MCIgeT0iNTQwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5XZWxjb21lPC90ZXh0Pgo8L3N2Zz4K')}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Welcome Message
                </button>
                <button
                  onClick={() => handleImageUrlChange('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSIjMDU5NjY5Ii8+Cjx0ZXh0IHg9Ijk2MCIgeT0iNTQwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5QbGVhc2UgV2FpdDwvdGV4dD4KPC9zdmc+Cg==')}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Please Wait
                </button>
                <button
                  onClick={() => handleImageUrlChange('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSIjN2MzYWVkIi8+Cjx0ZXh0IHg9Ijk2MCIgeT0iNTQwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TeXN0ZW0gT2ZmbGluZTwvdGV4dD4KPC9zdmc+Cg==')}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  System Offline
                </button>
              </div>
            </div>
          </div>

          {/* Image Preview */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Preview</h3>
            </div>
            
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Fallback image preview"
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB2aWV3Qm94PSIwIDAgMTkyMCAxMDgwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiBmaWxsPSIjRkY0NDQ0Ii8+Cjx0ZXh0IHg9Ijk2MCIgeT0iNTQwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+Cjwvc3ZnPgo=';
                  }}
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Image className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No image preview available</p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p><strong>Tip:</strong> Use high-resolution images (1920x1080 or higher) for best display quality on your TV screens.</p>
            </div>
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
          <div className="flex items-center space-x-3">
            <button
              onClick={resetToDefault}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Reset to Default
            </button>
            <button
              onClick={saveSettings}
              disabled={saving || !hasChanges}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Fallback Image'}</span>
            </button>
          </div>
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
              <strong>Your fallback image is Priority Level 3!</strong> This image will be shown on your TV displays 
              when no active or scheduled playlists are available. Make sure to use high-resolution images 
              (1920x1080 or higher) for the best display quality.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;
