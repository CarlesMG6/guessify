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
  }, []);

  // Initialize Firebase Auth only on client
  useEffect(() => {
    if (!isClient) return;

    let auth = null;

    const initFirebase = async () => {
      try {
        // Dynamic imports to avoid SSR issues
        const { initializeApp } = await import('firebase/app');
        const { getAuth, onAuthStateChanged, connectAuthEmulator } = await import('firebase/auth');
        
        const firebaseConfig = {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
        };

        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);

        // Set up auth state listener
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            setUser(firebaseUser);
          } else {
            setUser(null);
            setSpotifyUser(null);
          }
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error initializing Firebase:', error);
        setLoading(false);
      }
    };

    initFirebase();
  }, [isClient]);

  // Check for Spotify auth data on page load
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;
    
    // Check localStorage for Spotify auth success
    const spotifyAuthSuccess = localStorage.getItem('spotify_auth_success');
    const spotifyUserData = localStorage.getItem('spotify_user_data');

    if (spotifyAuthSuccess === 'true' && spotifyUserData && user) {
      try {
        const parsedUserData = JSON.parse(spotifyUserData);
        setSpotifyUser(parsedUserData);
        
        // Save user data to Firestore
        saveUserToFirestore(parsedUserData);
        
        // Clear the success flag (but keep user data for session)
        localStorage.removeItem('spotify_auth_success');
      } catch (error) {
        console.error('Error parsing Spotify user data from localStorage:', error);
        localStorage.removeItem('spotify_auth_success');
        localStorage.removeItem('spotify_user_data');
      }
    }

    // Also check URL params for backwards compatibility or error handling
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
      console.error('Spotify auth error:', error);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isClient, user]);

  const saveUserToFirestore = async (spotifyUserData) => {
    if (!user) return;
    
    try {
      const { updateUserSpotifyData } = await import('../lib/firestore');
      await updateUserSpotifyData(user.uid, spotifyUserData);
      console.log('User Spotify data saved to Firestore');
    } catch (error) {
      console.error('Error saving user data to Firestore:', error);
    }
  };

  const loginAnonymously = async () => {
    if (!isClient) return;
    
    try {
      const { getAuth, signInAnonymously } = await import('firebase/auth');
      const { initializeApp } = await import('firebase/app');
      
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      };

      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!isClient) return;
    
    try {
      const { getAuth, signOut } = await import('firebase/auth');
      const { initializeApp } = await import('firebase/app');
      
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      };

      const app = initializeApp(firebaseConfig);
      const auth = getAuth(app);
      
      await signOut(auth);
      setSpotifyUser(null);
      
      // Clear Spotify data from localStorage
      localStorage.removeItem('spotify_user_data');
      localStorage.removeItem('spotify_auth_success');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    spotifyUser,
    loading,
    loginAnonymously,
    logout,
    isClient
  };

  if (!isClient) {
    return (
      <AuthContext.Provider value={{ user: null, spotifyUser: null, loading: true, isClient: false }}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
