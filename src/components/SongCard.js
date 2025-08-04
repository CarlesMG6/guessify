'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play, Pause, Ban } from 'lucide-react'
import { getBestImage } from '../utils/music'
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer'
import { useSpotifyPlayerContext } from '../contexts/SpotifyPlayerContext'

export default function SongCard({ track }) {
  const [imageError, setImageError] = useState(false)
  const { isReady: contextReady, sdkAvailable } = useSpotifyPlayerContext()
  const { togglePlayback, currentTrack, isPlaying } = useSpotifyPlayer()
  
  const isSpotifyPlaying = isPlaying && currentTrack?.id === track.id
  const imageUrl = getBestImage(track.album.images)
  const canPlay = contextReady && sdkAvailable // Solo puede reproducir si SDK está disponible
  
  console.log('SongCard render:', {
    trackName: track.name,
    trackUri: track.uri,
    contextReady,
    sdkAvailable,
    canPlay
  })

  const handlePlayClick = () => {
    console.log('SongCard play clicked:', {
      trackName: track.name,
      trackUri: track.uri,
      canPlay,
      contextReady,
      sdkAvailable
    })
    
    if (!canPlay) {
      console.log('Cannot play - SDK not available')
      return
    }
    
    // Solo usar SDK de Spotify - no fallback
    if (contextReady && sdkAvailable && track.uri) {
      console.log('Using Spotify SDK for full track playback')
      togglePlayback(track.uri)
    } else {
      console.log('No playback option available - Premium required')
    }
  }

  return (
    <div className={`card-song group ${canPlay ? 'cursor-pointer' : 'cursor-default opacity-75'}`} onClick={handlePlayClick}>
      {/* Imagen del album */}
      <div className="relative aspect-square mb-3 overflow-hidden rounded-lg">
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={`Portada de ${track.name}`}
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <span className="text-gray-500 text-xs">Sin imagen</span>
          </div>
        )}
        
        {/* Overlay con botón de play */}
        <div className={`absolute inset-0 bg-opacity-0 ${canPlay ? 'group-hover:bg-opacity-50' : 'bg-opacity-20'} transition-all duration-200 flex items-center justify-center`}>
          {canPlay ? (
            <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-green-500 rounded-full p-3 hover:bg-green-600 hover:scale-110 transform">
              {isSpotifyPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-0.5" />
              )}
            </button>
          ) : (
            <div className="opacity-50 bg-gray-600 rounded-full p-3">
              <Ban className="w-6 h-6 text-gray-300" />
            </div>
          )}
        </div>
      </div>

      {/* Información de la canción */}
      <div className="space-y-1">
        <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2">
          {track.name}
        </h3>
        <p className="text-gray-400 text-xs leading-tight line-clamp-1">
          {track.artists.map(artist => artist.name).join(', ')}
        </p>
        <p className="text-gray-500 text-xs">
          {track.album.name}
        </p>
        
      </div>

      {/* Indicador de reproducción */}
      {isSpotifyPlaying && (
        <div className="flex items-center gap-1 mt-2">
          <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce"></div>
          <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce delay-100"></div>
          <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce delay-200"></div>
          <span className="text-green-500 text-xs ml-2">Reproduciendo</span>
        </div>
      )}
    </div>
  )
}
