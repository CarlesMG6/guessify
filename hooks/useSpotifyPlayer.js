'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpotifyPlayer = (spotifyToken) => {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!spotifyToken || typeof window === 'undefined') return;

    // Load Spotify Web Playback SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Guessify Game Player',
        getOAuthToken: cb => { cb(spotifyToken); },
        volume: 0.5
      });

      // Error handling
      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('Spotify Player initialization error:', message);
        setError('Error inicializando reproductor de Spotify');
      });

      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('Spotify Player authentication error:', message);
        setError('Error de autenticación. Necesitas una cuenta Premium de Spotify');
      });

      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('Spotify Player account error:', message);
        setError('Error de cuenta. Asegúrate de tener Spotify Premium');
      });

      spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('Spotify Player playback error:', message);
        setError('Error de reproducción');
      });

      // Ready state
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('Spotify Player ready with Device ID', device_id);
        setDeviceId(device_id);
        setIsReady(true);
        setError(null);
      });

      // Player state changed
      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (!state) return;

        setIsPaused(state.paused);
        setPosition(state.position);
        setDuration(state.duration);
      });

      // Connect to the player
      spotifyPlayer.connect().then(success => {
        if (success) {
          console.log('Successfully connected to Spotify Player');
        } else {
          console.error('Failed to connect to Spotify Player');
          setError('No se pudo conectar al reproductor de Spotify');
        }
      });

      setPlayer(spotifyPlayer);
    };

    return () => {
      // Cleanup
      if (player) {
        player.disconnect();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [spotifyToken]);

  // Play a track by Spotify URI
  const playTrack = useCallback(async (trackUri) => {
    console.log('🎵 playTrack called with:', {
      trackUri,
      deviceId,
      hasToken: !!spotifyToken,
      isReady
    });

    if (!deviceId || !spotifyToken) {
      console.error('❌ Missing requirements:', { deviceId, hasToken: !!spotifyToken });
      setError('Reproductor no disponible');
      return false;
    }

    try {
      console.log('🌐 Making Spotify API call...');
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${spotifyToken}`
        },
        body: JSON.stringify({
          uris: [trackUri],
          position_ms: 0
        })
      });

      console.log('📡 Spotify API response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (response.ok) {
        console.log('✅ Track playing successfully');
        setError(null);
        return true;
      } else {
        const errorData = await response.json();
        console.error('❌ Spotify API error:', errorData);
        
        // Better error messages based on status
        if (response.status === 403) {
          setError('Necesitas Spotify Premium para reproducir canciones completas');
        } else if (response.status === 404) {
          setError('Dispositivo de reproducción no encontrado. Abre Spotify en tu dispositivo');
        } else {
          setError('Error reproduciendo canción. Verifica que tengas Spotify Premium');
        }
        return false;
      }
    } catch (error) {
      console.error('❌ Network error playing track:', error);
      setError('Error de conexión con Spotify');
      return false;
    }
  }, [deviceId, spotifyToken]);

  // Pause playback
  const pause = useCallback(async () => {
    if (!deviceId || !spotifyToken) return;

    try {
      await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      });
    } catch (error) {
      console.error('Error pausing track:', error);
    }
  }, [deviceId, spotifyToken]);

  // Resume playback
  const resume = useCallback(async () => {
    if (!deviceId || !spotifyToken) return;

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      });
    } catch (error) {
      console.error('Error resuming track:', error);
    }
  }, [deviceId, spotifyToken]);

  // Set volume
  const setVolume = useCallback(async (volume) => {
    if (!deviceId || !spotifyToken) return;

    try {
      await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}&device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      });
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }, [deviceId, spotifyToken]);

  return {
    player,
    deviceId,
    isReady,
    isPaused,
    position,
    duration,
    error,
    playTrack,
    pause,
    resume,
    setVolume
  };
};
