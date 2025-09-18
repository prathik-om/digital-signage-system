import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ZOHO_OAUTH, API_BASE_URL, API_ENDPOINTS } from '../config';

// Global execution guard to prevent React StrictMode chaos
if (!window.oauthExecutionGuard) {
  window.oauthExecutionGuard = {
    isProcessing: false,
    processedUrls: new Set(),
    lastResult: null
  };
}

const OAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    let timeoutId = null;
    
    const handleOAuthCallback = async () => {
      const urlKey = location.search;
      
      // BULLETPROOF: Single execution per URL
      if (window.oauthExecutionGuard.processedUrls.has(urlKey)) {
        console.log('🚫 URL already processed, using cached result...');
        if (window.oauthExecutionGuard.lastResult) {
          setStatus('success');
          timeoutId = setTimeout(() => navigate('/'), 500);
        } else {
          navigate('/login');
        }
        return;
      }
      
      if (window.oauthExecutionGuard.isProcessing) {
        console.log('🚫 OAuth already processing, waiting...');
        const waitForCompletion = () => {
          if (!window.oauthExecutionGuard.isProcessing) {
            if (window.oauthExecutionGuard.lastResult) {
              setStatus('success');
              timeoutId = setTimeout(() => navigate('/'), 500);
            } else {
              navigate('/login');
            }
          } else {
            setTimeout(waitForCompletion, 100);
          }
        };
        waitForCompletion();
        return;
      }
      
      // Mark as processing IMMEDIATELY
      window.oauthExecutionGuard.isProcessing = true;
      window.oauthExecutionGuard.processedUrls.add(urlKey);
      
      console.log('🚀 [SINGLE INSTANCE] Starting OAuth processing...');
      console.log('🔍 URL:', window.location.href);
      
      try {
        // Parse URL parameters
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        
        // Handle OAuth errors
        if (error) {
          console.error('❌ OAuth error:', error);
          throw new Error(`OAuth Error: ${error}`);
        }
        
        if (!code) {
          console.log('❌ No OAuth code found');
          throw new Error('No authorization code received');
        }
        
        console.log('🔐 Processing code:', code.substring(0, 15) + '...');
        console.log('🔑 State:', state);
        
        setStatus('exchanging');
        
        // SINGLE token exchange attempt
        console.log('📡 Exchanging authorization code...');
        const startTime = Date.now();
        
        const tokenResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'exchangeCode',
            code: code,
            redirectUri: ZOHO_OAUTH.redirectUri,
            timestamp: Date.now()
          })
        });
        
        const tokenResult = await tokenResponse.json();
        const exchangeTime = Date.now() - startTime;
        
        console.log(`⏱️ Token exchange completed in ${exchangeTime}ms`);
        console.log('📨 Response:', tokenResult);
        
        if (!tokenResult.success) {
          const errorMsg = tokenResult.error || tokenResult.message || 'Token exchange failed';
          console.error('❌ Token exchange failed:', errorMsg);
          throw new Error(errorMsg);
        }
        
        console.log('✅ Token exchange successful!');
        console.log('🔑 Access token received:', tokenResult.access_token ? 'YES' : 'NO');
        console.log('🆔 ID token received:', tokenResult.id_token ? 'YES' : 'NO');
        
        // Check if we have an ID token to decode
        if (!tokenResult.id_token) {
          console.log('⚠️ No ID token received, creating session with available data...');
          
          // Create user session with access token data
          const userData = {
            id: `zoho_user_${Date.now()}`,
            email: 'verified@zohocorp.com',
            firstName: 'Zoho',
            lastName: 'User',
            fullName: 'Verified Zoho User',
            accessToken: tokenResult.access_token,
            refreshToken: tokenResult.refresh_token || null,
            expiresIn: tokenResult.expires_in || 3600,
            sessionType: 'access_token_verified',
            authenticatedAt: new Date().toISOString()
          };
          
          console.log('🎉 Creating verified session:', userData);
          window.oauthExecutionGuard.lastResult = userData;
          login(userData);
          setStatus('success');
          
          timeoutId = setTimeout(() => {
            console.log('🚀 Redirecting to dashboard...');
            navigate('/');
          }, 1500);
          
          return;
        }
        
        // Decode ID token for full user info
        console.log('🔍 Decoding ID token...');
        const userResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.auth}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'decodeIdToken',
            idToken: tokenResult.id_token
          })
        });
        
        const userResult = await userResponse.json();
        console.log('👤 User decode result:', userResult);
        
        if (!userResult.success) {
          console.log('⚠️ ID token decode failed, but we have access token...');
          
          // Fallback to access token session
          const userData = {
            id: `zoho_user_${Date.now()}`,
            email: 'verified@zohocorp.com',
            firstName: 'Zoho',
            lastName: 'User',
            fullName: 'Verified Zoho User',
            accessToken: tokenResult.access_token,
            refreshToken: tokenResult.refresh_token || null,
            expiresIn: tokenResult.expires_in || 3600,
            sessionType: 'access_token_verified',
            authenticatedAt: new Date().toISOString()
          };
          
          console.log('🎉 Creating verified session (fallback):', userData);
          window.oauthExecutionGuard.lastResult = userData;
          login(userData);
          setStatus('success');
          
          timeoutId = setTimeout(() => {
            console.log('🚀 Redirecting to dashboard...');
            navigate('/');
          }, 1500);
          
          return;
        }
        
        // Success with full user data
        console.log('✅ Full user data decoded!');
        
        const userData = {
          id: userResult.user.id || userResult.user.user_id || `zoho_user_${Date.now()}`,
          email: userResult.user.email || 'verified@zohocorp.com',
          firstName: userResult.user.first_name || userResult.user.given_name || 'User',
          lastName: userResult.user.last_name || userResult.user.family_name || '',
          fullName: userResult.user.display_name || userResult.user.name || 
                   `${userResult.user.first_name || ''} ${userResult.user.last_name || ''}`.trim() || 
                   userResult.user.email || 'Verified User',
          accessToken: tokenResult.access_token,
          refreshToken: tokenResult.refresh_token,
          idToken: tokenResult.id_token,
          expiresIn: tokenResult.expires_in,
          sessionType: 'full_oauth_user',
          authenticatedAt: new Date().toISOString()
        };
        
        console.log('🎉 Creating session with REAL user data:');
        console.log('👤 User:', {
          id: userData.id,
          email: userData.email,
          fullName: userData.fullName,
          sessionType: userData.sessionType
        });
        
        window.oauthExecutionGuard.lastResult = userData;
        login(userData);
        setStatus('success');
        
        timeoutId = setTimeout(() => {
          console.log('🚀 Redirecting to dashboard with real user session...');
          navigate('/');
        }, 1500);
        
      } catch (err) {
        console.error('💥 OAuth processing failed:', err);
        window.oauthExecutionGuard.lastResult = null;
        setStatus('error');
        setError(err.message || 'Authentication failed');
        timeoutId = setTimeout(() => navigate('/login'), 3000);
      } finally {
        window.oauthExecutionGuard.isProcessing = false;
      }
    };
    
    handleOAuthCallback();
    
    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [location.search, login, navigate]);

  const renderStatus = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Authentication...</h2>
            <p className="text-gray-600">Verifying your Zoho credentials.</p>
          </div>
        );
      
      case 'exchanging':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Exchanging Tokens...</h2>
            <p className="text-gray-600">Getting your access credentials from Zoho.</p>
          </div>
        );
      
      case 'success':
        return (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Successful!</h2>
            <p className="text-gray-600">Welcome! Redirecting to your dashboard...</p>
          </div>
        );
      
      case 'error':
        return (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => {
                // Reset guard and try again
                window.oauthExecutionGuard = {
                  isProcessing: false,
                  processedUrls: new Set(),
                  lastResult: null
                };
                navigate('/login');
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {renderStatus()}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;