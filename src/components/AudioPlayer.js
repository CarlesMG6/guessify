'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Play, Pause, X } from 'lucide-react'
import { getBestImage } from '../utils/music'

export default function AudioPlayer({ track, isPlaying, onPlayPause, onClose }) {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(30) 
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration || 30)
    const handleEnded = () => onClose()

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [track, onClose])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !track) return

    if (isPlaying) {
      audio.play().catch(console.error)
    } else {
      audio.pause()
    }
  }, [isPlaying, track])

  if (!track) return null

  const imageUrl = getBestImage(track.album.images)
  const progress = (currentTime / duration) * 100

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 z-50">
      <audio
        ref={audioRef}
        preload="metadata"
      />
      
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        {/* Imagen del album */}
        <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`Portada de ${track.name}`}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-700"></div>
          )}
        </div>

        {/* Información de la canción */}
        <div className="flex-grow min-w-0">
          <h4 className="text-white font-medium text-sm truncate">
            {track.name}
          </h4>
          <p className="text-gray-400 text-xs truncate">
            {track.artists.map(artist => artist.name).join(', ')}
          </p>
        </div>

        {/* Controles de reproducción */}
        <div className="flex items-center gap-4">
          <button
            onClick={onPlayPause}
            className="bg-green-500 hover:bg-green-600 rounded-full p-2 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white ml-0.5" />
            )}
          </button>

          {/* Barra de progreso */}
          <div className="flex items-center gap-2 min-w-32">
            <span className="text-xs text-gray-400">
              {Math.floor(currentTime)}s
            </span>
            <div className="flex-grow bg-gray-600 rounded-full h-1 relative">
              <div
                className="bg-green-500 h-1 rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">
              {Math.floor(duration)}s
            </span>
          </div>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
