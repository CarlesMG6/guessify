'use client';

import { createContext, useContext, useEffect, useState } from 'react';

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
  const [spotifyUser, setSpotifyUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
    setLoading(false);
  }, []);

  // Check for Spotify auth data on page load
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const spotifyAuth = urlParams.get('spotify_auth');
    const userData = urlParams.get('user_data');

    if (spotifyAuth === 'success' && userData) {
      try {
        const spotifyUserData = JSON.parse(decodeURIComponent(userData));
        setSpotifyUser(spotifyUserData);
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error parsing Spotify user data:', error);
      }
    }
  }, [isClient]);

  const loginAnonymously = async () => {
    if (!isClient) return;
    
    try {
      // Mock user for demo purposes
      const mockUser = {
        uid: 'demo-user-' + Date.now(),
        displayName: 'Usuario Demo',
        email: 'demo@example.com'
      };
      setUser(mockUser);
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  };

  const logout = async () => {
    setUser(null);
    setSpotifyUser(null);
  };

  const value = {
    user,
    spotifyUser,
    loading,
    loginAnonymously,
    logout,
    isClient
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
