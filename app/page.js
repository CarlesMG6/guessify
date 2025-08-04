'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSpotifyAuthUrl } from '../lib/spotify';
import CreateRoom from '../components/CreateRoom';
import JoinRoom from '../components/JoinRoom';
import UserProfile from '../components/UserProfile';
import ClientOnly from '../components/ClientOnly';

export default function Home() {
  const { user, spotifyUser, loading, loginAnonymously, isClient } = useAuth();
  const [view, setView] = useState('home'); // 'home', 'create', 'join'

  useEffect(() => {
    // Auto-login anonymously if no user and client is ready
    if (isClient && !loading && !user) {
      loginAnonymously().catch(console.error);
    }

    // Check for auto-join from URL
    if (isClient && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const joinCode = urlParams.get('join');
      
      if (joinCode && spotifyUser) {
        setView('join');
        // You could pre-fill the room code here if you modify JoinRoom to accept it
      }
    }
  }, [loading, user, loginAnonymously, isClient, spotifyUser]);

  const handleSpotifyLogin = () => {
    const authUrl = getSpotifyAuthUrl();
    window.location.href = authUrl;
  };

  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black">
        {/* Header */}
        <header className="p-6 border-b border-gray-700">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-3xl font-bold text-spotify-green">🎵 Guessify</h1>
            
            {spotifyUser && (
              <UserProfile user={spotifyUser} />
            )}
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-6">
          {view === 'home' && (
            <div className="text-center">
              <div className="mb-12">
                <h2 className="text-4xl font-bold text-white mb-4">
                  ¡Adivina las canciones favoritas de tus amigos!
                </h2>
                <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                  Conecta tu Spotify, crea una sala o únete a una existente, 
                  y demuestra qué tan bien conoces los gustos musicales de tu grupo.
                </p>
              </div>

              {!spotifyUser ? (
                <div className="bg-spotify-gray rounded-lg p-8 max-w-md mx-auto">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Conecta tu cuenta de Spotify
                  </h3>
                  <p className="text-gray-300 mb-6">
                    Para jugar necesitas conectar tu cuenta de Spotify y obtener tus canciones favoritas.
                  </p>
                  <button
                    onClick={handleSpotifyLogin}
                    className="w-full bg-spotify-green hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                  >
                    Conectar con Spotify
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                  <div className="bg-spotify-gray rounded-lg p-6 hover:bg-gray-700 transition-colors duration-200">
                    <h3 className="text-xl font-semibold text-white mb-4">
                      🎮 Configurar Partida
                    </h3>
                    <p className="text-gray-300 mb-6">
                      Configura una nueva partida y espera a que se unan tus amigos.
                    </p>
                    <button
                      onClick={() => setView('create')}
                      className="w-full bg-spotify-green hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                      Configurar Partida
                    </button>
                  </div>

                  <div className="bg-spotify-gray rounded-lg p-6 hover:bg-gray-700 transition-colors duration-200">
                    <h3 className="text-xl font-semibold text-white mb-4">
                      🚪 Unirse a Sala
                    </h3>
                    <p className="text-gray-300 mb-6">
                      Ingresa el código de una sala existente.
                    </p>
                    <button
                      onClick={() => setView('join')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                      Unirse a Sala
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'create' && (
            <div>
              <button
                onClick={() => setView('home')}
                className="mb-6 text-spotify-green hover:text-green-400 transition-colors duration-200"
              >
                ← Volver al inicio
              </button>
              <CreateRoom />
            </div>
          )}

          {view === 'join' && (
            <div>
              <button
                onClick={() => setView('home')}
                className="mb-6 text-spotify-green hover:text-green-400 transition-colors duration-200"
              >
                ← Volver al inicio
              </button>
              <JoinRoom />
            </div>
          )}
        </main>
      </div>
    </ClientOnly>
  );
}
