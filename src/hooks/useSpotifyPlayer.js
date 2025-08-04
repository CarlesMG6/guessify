'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSpotifyPlayerContext } from '../contexts/SpotifyPlayerContext'

export function useSpotifyPlayer() {
  const { data: session } = useSession()
  const { playlist, setIsReady: setContextReady, setSdkAvailable } = useSpotifyPlayerContext()
  const [player, setPlayer] = useState(null)
  const [deviceId, setDeviceId] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1)
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [sdkFailed, setSdkFailed] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)

  // Inicializar el SDK
  useEffect(() => {
    console.log('useSpotifyPlayer effect triggered:', { 
      hasSession: !!session, 
      hasAccessToken: !!session?.accessToken, 
      isInitializing,
      hasPlayer: !!player 
    })
    
    if (!session?.accessToken || isInitializing || player) {
      console.log('Skipping SDK initialization:', { 
        noSession: !session?.accessToken, 
        isInitializing, 
        hasPlayer: !!player 
      })
      return
    }

    console.log('Starting Spotify Web Playback SDK initialization...')
    setIsInitializing(true)

    // Cargar el SDK si no está cargado
    if (!window.Spotify) {
      const script = document.createElement('script')
      script.src = 'https://sdk.scdn.co/spotify-player.js'
      script.async = true
      document.body.appendChild(script)

      window.onSpotifyWebPlaybackSDKReady = () => {
        initializePlayer()
      }
    } else {
      initializePlayer()
    }

    function initializePlayer() {
      console.log('🎵 Creating Spotify Player instance...')
      
      const spotifyPlayer = new window.Spotify.Player({
        name: 'Guessify Web Player',
        getOAuthToken: (cb) => {
          console.log('🔑 Spotify requesting OAuth token...')
          cb(session.accessToken)
        },
        volume: 0.5,
      })

      // Eventos del player
      spotifyPlayer.addListener('ready', ({ device_id }) => {
        console.log('🎵 Spotify Player Ready! Device ID:', device_id)
        setDeviceId(device_id)
        setIsReady(true)
        setContextReady(true) // Actualizar contexto global
        setSdkAvailable(true)
        setIsInitializing(false) // Marcar como completado
        clearTimeout(sdkTimeout) // Cancelar timeout si se conecta exitosamente
      })

      spotifyPlayer.addListener('not_ready', ({ device_id }) => {
        console.log('🔴 Device ID has gone offline', device_id)
        setIsReady(false)
        setContextReady(false) // Actualizar contexto global
      })

      spotifyPlayer.addListener('initialization_error', ({ message }) => {
        console.error('🔴 Spotify initialization error:', message)
        setSdkFailed(true)
        setIsInitializing(false)
      })

      spotifyPlayer.addListener('authentication_error', ({ message }) => {
        console.error('🔴 Spotify authentication error:', message)
        setSdkFailed(true)
        setIsInitializing(false)
      })

      spotifyPlayer.addListener('account_error', ({ message }) => {
        console.error('🔴 Spotify account error (Premium required?):', message)
        setSdkFailed(true)
        setContextReady(false)
        setSdkAvailable(false)
        setIsInitializing(false)
      })

      spotifyPlayer.addListener('playback_error', ({ message }) => {
        console.error('🔴 Spotify playback error:', message)
      })

      spotifyPlayer.addListener('player_state_changed', (state) => {
        if (!state) return

        const track = state.track_window.current_track
        setCurrentTrack(track)
        setIsPlaying(!state.paused)
        setPosition(state.position)
        setDuration(state.duration)

        // Actualizar índice de la canción actual en la playlist
        if (track && playlist.length > 0) {
          const index = playlist.findIndex(t => t.id === track.id)
          setCurrentTrackIndex(index)
        }
      })

      // Conectar al player
      console.log('🔗 Connecting to Spotify Player...')
      spotifyPlayer.connect().then(success => {
        if (success) {
          console.log('✅ Successfully connected to Spotify!')
        } else {
          console.error('❌ Failed to connect to Spotify')
        }
      }).catch(error => {
        console.error('❌ Error connecting to Spotify:', error)
      })
      
      setPlayer(spotifyPlayer)
    }

    // Timeout para el SDK - si no se conecta en 10 segundos, considerarlo fallido
    const sdkTimeout = setTimeout(() => {
      if (!deviceId) {
        console.warn('⏰ Spotify SDK timeout - Premium account required')
        setSdkFailed(true)
        setContextReady(false)
        setSdkAvailable(false)
        setIsInitializing(false)
      }
    }, 10000)

    return () => {
      clearTimeout(sdkTimeout)
      if (player) {
        player.disconnect()
      }
    }
  }, [session?.accessToken])

  // Funciones de control
  const play = useCallback(async (uri = null) => {
    if (!deviceId || !session?.accessToken) {
      console.log('Cannot play: missing deviceId or accessToken', { deviceId, hasAccessToken: !!session?.accessToken })
      return
    }

    try {
      console.log('Playing track:', uri)
      const body = uri ? { uris: [uri] } : {}
      
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
      })
      
      if (!response.ok) {
        console.error('Play request failed:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('Error response:', errorText)
      } else {
        console.log('Play request successful')
      }
    } catch (error) {
      console.error('Error playing track:', error)
    }
  }, [deviceId, session?.accessToken])

  const pause = useCallback(async () => {
    if (!player) return
    await player.pause()
  }, [player])

  const resume = useCallback(async () => {
    if (!player) return
    await player.resume()
  }, [player])

  const togglePlayback = useCallback(async (uri = null) => {
    console.log('togglePlayback called:', { uri, isPlaying, hasPlayer: !!player })
    
    if (isPlaying && !uri) {
      console.log('Pausing current playback')
      await pause()
    } else if (uri) {
      console.log('Playing specific track:', uri)
      await play(uri)
    } else {
      console.log('Resuming playback')
      await resume()
    }
  }, [isPlaying, play, pause, resume])

  const seek = useCallback(async (positionMs) => {
    if (!player) return
    await player.seek(positionMs)
  }, [player])

  const setVolume = useCallback(async (volume) => {
    if (!player) return
    await player.setVolume(volume)
  }, [player])

  const playNext = useCallback(async () => {
    if (playlist.length === 0) return
    
    const nextIndex = currentTrackIndex < playlist.length - 1 ? currentTrackIndex + 1 : 0
    const nextTrack = playlist[nextIndex]
    
    if (nextTrack?.uri) {
      await play(nextTrack.uri)
    }
  }, [playlist, currentTrackIndex, play])

  const playPrevious = useCallback(async () => {
    if (playlist.length === 0) return
    
    const prevIndex = currentTrackIndex > 0 ? currentTrackIndex - 1 : playlist.length - 1
    const prevTrack = playlist[prevIndex]
    
    if (prevTrack?.uri) {
      await play(prevTrack.uri)
    }
  }, [playlist, currentTrackIndex, play])

  return {
    player,
    deviceId,
    isReady,
    isPlaying,
    currentTrack,
    currentTrackIndex,
    position,
    duration,
    play,
    pause,
    resume,
    togglePlayback,
    seek,
    setVolume,
    playNext,
    playPrevious,
  }
}
