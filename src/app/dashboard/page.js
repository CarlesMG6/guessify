'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import Navbar from '../../components/Navbar'
import SongCard from '../../components/SongCard'
import AudioPlayer from '../../components/AudioPlayer'
import Loader from '../../components/Loader'
import ErrorMessage from '../../components/ErrorMessage'
import { getRandomTracks } from '../../utils/music'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [topTracks, setTopTracks] = useState([])
  const [randomTracks, setRandomTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Redirigir si no hay sesión
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Cargar top tracks al montar el componente
  useEffect(() => {
    if (session) {
      fetchTopTracks()
    }
  }, [session])

  const fetchTopTracks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/spotify/top-tracks')
      console.log('Response from /api/spotify/top-tracks:', response)
      console.log('Response status:', response.status)
      if (!response.ok) {
        throw new Error('Error al cargar las canciones')
      }
      
      const data = await response.json()
      
      if (data.tracks.length === 0) {
        setError('No se encontraron canciones con preview disponible. Escucha más música en Spotify y vuelve a intentarlo.')
        return
      }
      
      setTopTracks(data.tracks)
      generateRandomPlaylist(data.tracks)
      
    } catch (err) {
      console.error('Error fetching top tracks:', err)
      setError(err.message || 'Error al cargar las canciones')
    } finally {
      setLoading(false)
    }
  }

  const generateRandomPlaylist = (tracks = topTracks) => {
    const randomSelection = getRandomTracks(tracks, 12)
    setRandomTracks(randomSelection)
  }

  const handlePlay = (track) => {
    if (currentTrack?.id === track?.id) {
      // Pausar/reanudar la misma canción
      setIsPlaying(!isPlaying)
    } else {
      // Reproducir nueva canción
      setCurrentTrack(track)
      setIsPlaying(!!track)
    }
  }

  const handleClosePlayer = () => {
    setCurrentTrack(null)
    setIsPlaying(false)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Cargando tu música favorita..." />
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Tu Lista Aleatoria
          </h1>
          <p className="text-gray-400 mb-6">
            Basada en tus {topTracks.length} canciones más escuchadas de los últimos 6 meses
          </p>
          
          <button
            onClick={() => generateRandomPlaylist()}
            className="btn-primary"
            disabled={topTracks.length === 0}
          >
            <RefreshCw className="w-5 h-5" />
            Generar Nueva Lista
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8">
            <ErrorMessage 
              message={error}
              onRetry={fetchTopTracks}
              retryText="Recargar canciones"
            />
          </div>
        )}

        {/* Songs Grid */}
        {randomTracks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {randomTracks.map((track) => (
              <SongCard
                key={track.id}
                track={track}
                onPlay={handlePlay}
                isPlaying={isPlaying}
                currentTrackId={currentTrack?.id}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && randomTracks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              No hay canciones disponibles. Intenta escuchar más música en Spotify.
            </p>
            <button
              onClick={fetchTopTracks}
              className="btn-secondary"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar
            </button>
          </div>
        )}
      </main>

      {/* Audio Player */}
      <AudioPlayer
        track={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onClose={handleClosePlayer}
      />
    </div>
  )
}
