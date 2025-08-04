'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { RefreshCw, LogOut } from 'lucide-react'
import Navbar from '../../components/Navbar'
import SongCard from '../../components/SongCard'
import SpotifyPlayer from '../../components/SpotifyPlayer'
import Loader from '../../components/Loader'
import ErrorMessage from '../../components/ErrorMessage'
import { getRandomTracks } from '../../utils/music'
import { useSpotifyPlayerContext } from '../../contexts/SpotifyPlayerContext'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { setPlaylist } = useSpotifyPlayerContext()
  const [topTracks, setTopTracks] = useState([])
  const [randomTracks, setRandomTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [playlistGenerated, setPlaylistGenerated] = useState(false)

  // Redirigir si no hay sesión
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Cargar top tracks al montar el componente
  useEffect(() => {
    if (session && !playlistGenerated) {
      fetchTopTracks()
    }
  }, [session, playlistGenerated])

  const fetchTopTracks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Session data:', session)
      console.log('Session access token:', session?.accessToken ? 'Present' : 'Missing')
      
      // Debug: Check server-side session
      const debugResponse = await fetch('/api/debug/session')
      const debugData = await debugResponse.json()
      console.log('Server-side session debug:', debugData)
      
      const response = await fetch('/api/spotify/top-tracks')
      console.log('Response from /api/spotify/top-tracks:', response)
      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.log('Error data:', errorData)
        throw new Error(`Error al cargar las canciones: ${errorData.error || response.statusText}`)
      }
      
      const data = await response.json()
      console.log('API Response data:', data)
      
      if (!data.tracks || data.tracks.length === 0) {
        setError(`No se encontraron canciones. Total en Spotify: ${data.totalOriginal || 0}. Mensaje: ${data.message || 'Sin mensaje'}`)
        return
      }
      
      setTopTracks(data.tracks)
      // Solo generar la playlist inicial si no se ha generado antes
      if (!playlistGenerated) {
        generateRandomPlaylist(data.tracks)
        setPlaylistGenerated(true)
      }
      
    } catch (err) {
      console.error('Error fetching top tracks:', err)
      setError(err.message || 'Error al cargar las canciones')
    } finally {
      setLoading(false)
    }
  }

  const generateRandomPlaylist = (tracks = topTracks) => {
    const randomSelection = getRandomTracks(tracks, 10)
    setRandomTracks(randomSelection)
    // Actualizar la playlist en el contexto para el reproductor de Spotify
    setPlaylist(randomSelection)
    console.log('📋 Nueva playlist generada:', randomSelection.length, 'canciones')
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
          <p className="text-gray-400 mb-2">
            Basada en tus {topTracks.length} canciones más escuchadas de los últimos 6 meses
          </p>
          
          <button
            onClick={() => generateRandomPlaylist()}
            className="btn-primary mr-4"
            disabled={topTracks.length === 0}
          >
            <RefreshCw className="w-5 h-5" />
            Generar Nueva Lista
          </button>
          
          <button
            onClick={() => signOut()}
            className="btn-secondary"
          >
            <LogOut className="w-4 h-4" />
            Re-login
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

      {/* Spotify Web Playback SDK Player */}
      <SpotifyPlayer className="fixed bottom-0 left-0 right-0 z-50" />
    </div>
  )
}
