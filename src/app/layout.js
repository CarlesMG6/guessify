import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '../components/AuthProvider'
import { SpotifyPlayerProvider } from '../contexts/SpotifyPlayerContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Guessify - Adivina tu música de Spotify',
  description: 'Juego de adivinanzas basado en tu música favorita de Spotify',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-900 text-white`}>
        <AuthProvider>
          <SpotifyPlayerProvider>
            {children}
          </SpotifyPlayerProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
