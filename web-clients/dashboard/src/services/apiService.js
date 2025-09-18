import { API_BASE_URL, API_ENDPOINTS, getCatalystAuthHeaders } from '../config';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.endpoints = API_ENDPOINTS;
  }

  // Generic API call method with multi-user support
  async makeRequest(endpoint, data = {}, userId = null) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = getCatalystAuthHeaders(userId);
    
    // Add user_id to request body if provided
    const requestData = { ...data };
    if (userId) {
      requestData.user_id = userId;
    }
    
    console.log('🔍 [ApiService] Making request:');
    console.log('  - Base URL:', this.baseURL);
    console.log('  - Endpoint:', endpoint);
    console.log('  - Full URL:', url);
    console.log('  - User ID:', userId);
    console.log('  - Request Data:', requestData);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Content Management APIs
  async getContent(userId) {
    return this.makeRequest(this.endpoints.content, { action: 'getAll' }, userId);
  }

  async addContent(contentData, userId) {
    return this.makeRequest(this.endpoints.content, { 
      action: 'add', 
      data: contentData 
    }, userId);
  }

  async updateContent(contentId, contentData, userId) {
    return this.makeRequest(this.endpoints.content, { 
      action: 'update', 
      data: { content_id: contentId, ...contentData }
    }, userId);
  }

  async deleteContent(contentId, userId) {
    return this.makeRequest(this.endpoints.content, { 
      action: 'delete', 
      data: { content_id: contentId }
    }, userId);
  }

  // Playlist Management APIs
  async getPlaylists(userId) {
    return this.makeRequest(this.endpoints.playlist, { action: 'getAll' }, userId);
  }

  async createPlaylist(playlistData, userId) {
    return this.makeRequest(this.endpoints.playlist, { 
      action: 'create', 
      data: playlistData 
    }, userId);
  }

  async updatePlaylist(playlistId, playlistData, userId) {
    return this.makeRequest(this.endpoints.playlist, { 
      action: 'update', 
      data: { playlist_id: playlistId, ...playlistData }
    }, userId);
  }

  async deletePlaylist(playlistId, userId) {
    return this.makeRequest(this.endpoints.playlist, { 
      action: 'delete', 
      data: { playlist_id: playlistId }
    }, userId);
  }

  // Emergency Messages APIs
  async getEmergencyMessages(userId) {
    return this.makeRequest(this.endpoints.emergency, { action: 'getAll' }, userId);
  }

  async createEmergencyMessage(messageData, userId) {
    return this.makeRequest(this.endpoints.emergency, { 
      action: 'create', 
      data: messageData 
    }, userId);
  }

  async updateEmergencyMessage(messageId, messageData, userId) {
    return this.makeRequest(this.endpoints.emergency, { 
      action: 'update', 
      data: { message_id: messageId, ...messageData }
    }, userId);
  }

  async deleteEmergencyMessage(messageId, userId) {
    return this.makeRequest(this.endpoints.emergency, { 
      action: 'delete', 
      data: { message_id: messageId }
    }, userId);
  }

  // Settings APIs
  async getSettings(userId) {
    return this.makeRequest(this.endpoints.settings, { action: 'getAll' }, userId);
  }

  async updateSettings(settingsData, userId) {
    return this.makeRequest(this.endpoints.settings, { 
      action: 'update', 
      settings: settingsData 
    }, userId);
  }

  // Database Setup APIs
  async validateDatabaseSchema() {
    return this.makeRequest(this.endpoints.setupDatabase, { action: 'validateSchema' });
  }

  async createDefaultUser(userData) {
    return this.makeRequest(this.endpoints.setupDatabase, { 
      action: 'createDefaultUser', 
      ...userData 
    });
  }

  // Events APIs
  async getEvents(userId) {
    return this.makeRequest(this.endpoints.events, { action: 'getAll' }, userId);
  }

  async createEvent(eventData, userId) {
    return this.makeRequest(this.endpoints.events, { 
      action: 'create', 
      data: eventData 
    }, userId);
  }

  async updateEvent(eventId, eventData, userId) {
    return this.makeRequest(this.endpoints.events, { 
      action: 'update', 
      data: { eventId, ...eventData } 
    }, userId);
  }

  async deleteEvent(eventId, userId) {
    return this.makeRequest(this.endpoints.events, { 
      action: 'delete', 
      data: { eventId } 
    }, userId);
  }

  // Screens APIs
  async getScreens(userId) {
    return this.makeRequest(this.endpoints.screens, { action: 'getAll' }, userId);
  }

  async createScreen(screenData, userId) {
    return this.makeRequest(this.endpoints.screens, { 
      action: 'create', 
      data: screenData 
    }, userId);
  }

  async updateScreen(screenId, screenData, userId) {
    return this.makeRequest(this.endpoints.screens, { 
      action: 'update', 
      data: { screenId, ...screenData } 
    }, userId);
  }

  async deleteScreen(screenId, userId) {
    return this.makeRequest(this.endpoints.screens, { 
      action: 'delete', 
      data: { screenId } 
    }, userId);
  }

  async updateScreenStatus(screenId, status, currentPlaylist, userId) {
    return this.makeRequest(this.endpoints.screens, { 
      action: 'updateStatus', 
      data: { screenId, status, currentPlaylist } 
    }, userId);
  }

  // Zoho Integration APIs
  async getZohoChannels(userId) {
    return this.makeRequest(this.endpoints.zohoIntegration, { action: 'getChannels' }, userId);
  }

  async sendZohoMessage(messageData, userId) {
    return this.makeRequest(this.endpoints.zohoIntegration, { 
      action: 'sendMessage', 
      data: messageData 
    }, userId);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
