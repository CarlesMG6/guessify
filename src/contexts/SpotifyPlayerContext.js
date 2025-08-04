'use client'

import { createContext, useContext, useState } from 'react'

const SpotifyPlayerContext = createContext()

export function SpotifyPlayerProvider({ children }) {
  const [playlist, setPlaylist] = useState([])
  const [isReady, setIsReady] = useState(false)
  const [sdkAvailable, setSdkAvailable] = useState(true) // Nuevo estado

  return (
    <SpotifyPlayerContext.Provider value={{
      playlist,
      setPlaylist,
      isReady,
      setIsReady,
      sdkAvailable,
      setSdkAvailable
    }}>
      {children}
    </SpotifyPlayerContext.Provider>
  )
}

export function useSpotifyPlayerContext() {
  const context = useContext(SpotifyPlayerContext)
  if (!context) {
    throw new Error('useSpotifyPlayerContext must be used within a SpotifyPlayerProvider')
  }
  return context
}
