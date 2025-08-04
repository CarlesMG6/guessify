'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LogIn, Music } from 'lucide-react'
import Loader from '../components/Loader'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/dashboard')
    }
  }, [session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" text="Cargando..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Music className="w-10 h-10 text-green-500" />
          <h1 className="text-4xl font-bold text-white">Guessify</h1>
        </div>

        {/* Description */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-300">
            Adivina tu música favorita de Spotify
          </h2>
          <p className="text-gray-400">
            Conecta tu cuenta de Spotify y juega con tus canciones más escuchadas.
            Escucha unos segundos y adivina de qué canción se trata.
          </p>
        </div>

        {/* Login Button */}
        <button
          onClick={() => signIn('spotify')}
          className="btn-primary w-full text-lg"
        >
          <LogIn className="w-5 h-5" />
          Iniciar sesión con Spotify
        </button>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>© 2025 Guessify. Hecho con ❤️ para los amantes de la música.</p>
        </div>
      </div>
    </div>
  )
}
