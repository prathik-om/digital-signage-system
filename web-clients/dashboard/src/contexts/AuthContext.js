import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { ZOHO_OAUTH, MULTI_USER, API_BASE_URL, API_ENDPOINTS } from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(MULTI_USER.defaultUserId);

  useEffect(() => {
    // Check if user is already logged in
    const savedUser = Cookies.get('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        Cookies.remove('user');
      }
    }

    // Initialize user ID from localStorage
    const savedUserId = localStorage.getItem('current_user_id');
    if (savedUserId) {
      setCurrentUserId(savedUserId);
    }

    setLoading(false);
  }, []);

  // Automatic token refresh
  useEffect(() => {
    if (!user?.refreshToken) return;

    const checkTokenExpiry = () => {
      const expiryTime = localStorage.getItem('token_expiry');
      if (expiryTime) {
        const timeUntilExpiry = parseInt(expiryTime) - Date.now();
        
        // If token expires in less than 5 minutes, refresh it
        if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
          console.log('🔄 Token expires soon, refreshing...');
          refreshToken();
        } else if (timeUntilExpiry <= 0) {
          console.log('⏰ Token expired, logging out...');
          logout();
        }
      }
    };

    // Check immediately
    checkTokenExpiry();
    
    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user?.refreshToken]);

  const login = (userData) => {
    setUser(userData);
    // Save user data in cookies for persistence
    Cookies.set('user', JSON.stringify(userData), { expires: 7 }); // 7 days
    
    // CRITICAL FIX: Set the correct user ID from the database
    // Accept both real user IDs and fallback default user ID
    if (userData.id) {
      setCurrentUserId(userData.id.toString());
      localStorage.setItem('current_user_id', userData.id.toString());
      console.log('🔑 [Auth] Set user ID to:', userData.id);
      
      if (userData.id === 'default_user_001') {
        console.log('🔧 [Auth] Using fallback user ID for temporary session');
      }
    } else {
      console.warn('⚠️ [Auth] No user ID provided, using default fallback');
      setCurrentUserId('default_user_001');
      localStorage.setItem('current_user_id', 'default_user_001');
    }
    
    // Store token expiry time for automatic refresh
    if (userData.accessToken) {
      const expiryTime = Date.now() + (3600 * 1000); // 1 hour from now
      localStorage.setItem('token_expiry', expiryTime.toString());
    }
  };

  const logout = () => {
    setUser(null);
    Cookies.remove('user');
    // Clear any Zoho tokens if they exist
    Cookies.remove('zoho_access_token');
    Cookies.remove('zoho_refresh_token');
    localStorage.removeItem('token_expiry');
  };

  const refreshToken = async () => {
    if (!user?.refreshToken) {
      console.log('No refresh token available');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: JSON.stringify({
          action: 'refreshToken',
          refreshToken: user.refreshToken
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update user with new tokens
        const updatedUser = {
          ...user,
          accessToken: result.access_token,
          refreshToken: result.refresh_token
        };
        
        login(updatedUser);
        console.log('Token refreshed successfully');
        return true;
      } else {
        console.error('Token refresh failed:', result.message);
        logout(); // Force re-login
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout(); // Force re-login
      return false;
    }
  };

  const initiateZohoLogin = () => {
    const state = Math.random().toString(36).substring(7);
    console.log('🔑 [OAuth] Generated state:', state);
    localStorage.setItem('oauth_state', state);
    console.log('🔑 [OAuth] Stored state in localStorage:', localStorage.getItem('oauth_state'));
    
    // Use configuration values
    const clientId = ZOHO_OAUTH.clientId;
    const scope = ZOHO_OAUTH.scope;
    const redirectUri = ZOHO_OAUTH.redirectUri;
    const authUrl = ZOHO_OAUTH.authUrl;
    
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
      state: state,
      access_type: 'offline'
    });

    window.location.href = `${authUrl}?${params.toString()}`;
  };

  // Multi-user functions
  const setUserId = (userId) => {
    setCurrentUserId(userId);
    // Store in localStorage for persistence
    localStorage.setItem('current_user_id', userId);
  };

  const getUserId = () => {
    return currentUserId;
  };

  const switchUser = (userId) => {
    setUserId(userId);
    // Optionally refresh data for the new user
    console.log(`Switched to user: ${userId}`);
  };

  const value = {
    user,
    login,
    logout,
    refreshToken,
    initiateZohoLogin,
    loading,
    // Multi-user functions
    currentUserId,
    setUserId,
    getUserId,
    switchUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
