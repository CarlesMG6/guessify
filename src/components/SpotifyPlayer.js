'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { getBestImage, formatDuration } from '../utils/music'
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer'
import { useSpotifyPlayerContext } from '../contexts/SpotifyPlayerContext'

export default function SpotifyPlayer({ className = '' }) {
  const {
    isReady,
    isPlaying,
    currentTrack,
    position,
    duration,
    togglePlayback,
    seek,
    setVolume,
    playNext,
    playPrevious,
  } = useSpotifyPlayer()

  const { sdkAvailable } = useSpotifyPlayerContext()

  const [localPosition, setLocalPosition] = useState(0)
  const [volume, setVolumeState] = useState(50)
  const [isMuted, setIsMuted] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Actualizar posición local
  useEffect(() => {
    if (!isDragging) {
      setLocalPosition(position)
    }
  }, [position, isDragging])

  // Actualizar posición cada segundo cuando está reproduciendo
  useEffect(() => {
    if (!isPlaying || isDragging) return

    const interval = setInterval(() => {
      setLocalPosition(prev => Math.min(prev + 1000, duration))
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, duration, isDragging])

  const handleSeek = (e) => {
    if (!duration) return
    
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newPosition = Math.floor(percent * duration)
    
    setLocalPosition(newPosition)
    seek(newPosition)
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value)
    setVolumeState(newVolume)
    setVolume(newVolume / 100)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (isMuted) {
      setVolume(volume / 100)
      setIsMuted(false)
    } else {
      setVolume(0)
      setIsMuted(true)
    }
  }

  if (!isReady || !currentTrack) {
    return (
      <div className={`bg-gray-900 border-t border-gray-700 p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <span className="text-gray-400 text-sm">
            {!isReady ? 
              (sdkAvailable === false ? 
                'Spotify Premium requerido para reproducción completa.' : 
                'Conectando al reproductor de Spotify... (Se requiere Spotify Premium)'
              ) : 
              'Selecciona una canción para reproducir'
            }
          </span>
        </div>
      </div>
    )
  }

  const imageUrl = getBestImage(currentTrack.album?.images)
  const progressPercent = duration > 0 ? (localPosition / duration) * 100 : 0

  return (
    <div className={`bg-gray-900 border-t border-gray-700 p-4 ${className}`}>
      <div className="max-w-screen-xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          {/* Información de la canción */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {imageUrl && (
              <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={imageUrl}
                  alt={`Portada de ${currentTrack.name}`}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-medium text-sm truncate">
                {currentTrack.name}
              </h4>
              <p className="text-gray-400 text-xs truncate">
                {currentTrack.artists?.map(artist => artist.name).join(', ')}
              </p>
            </div>
          </div>

          {/* Controles de reproducción */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-md">
            <div className="flex items-center gap-2">
              <button
                onClick={playPrevious}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => togglePlayback()}
                className="bg-white text-black rounded-full p-2 hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
              
              <button
                onClick={playNext}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Barra de progreso */}
            <div className="flex items-center gap-2 w-full text-xs text-gray-400">
              <span className="text-xs min-w-0">
                {formatDuration(localPosition)}
              </span>
              <div className="flex-1 relative">
                <div
                  className="h-1 bg-gray-600 rounded-full cursor-pointer"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-white rounded-full relative"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute right-0 top-1/2 w-3 h-3 bg-white rounded-full transform -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>
              </div>
              <span className="text-xs min-w-0">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* Control de volumen */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <button
              onClick={toggleMute}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
