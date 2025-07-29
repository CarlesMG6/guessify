'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play, Pause } from 'lucide-react'
import { getBestImage } from '../utils/music'

export default function SongCard({ track, onPlay, isPlaying, currentTrackId }) {
  const [imageError, setImageError] = useState(false)
  
  const isCurrentlyPlaying = isPlaying && currentTrackId === track.id
  const imageUrl = getBestImage(track.album.images)
  
  const handlePlayClick = () => {
    if (isCurrentlyPlaying) {
      onPlay(null) // Pausar
    } else {
      onPlay(track) // Reproducir
    }
  }

  return (
    <div className="card-song group cursor-pointer" onClick={handlePlayClick}>
      {/* Imagen del album */}
      <div className="relative aspect-square mb-3 overflow-hidden rounded-lg">
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={`Portada de ${track.name}`}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <span className="text-gray-500 text-xs">Sin imagen</span>
          </div>
        )}
        
        {/* Overlay con botón de play */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
          <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-green-500 rounded-full p-3 hover:bg-green-600 hover:scale-110 transform">
            {isCurrentlyPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" />
            )}
          </button>
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
      {isCurrentlyPlaying && (
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
