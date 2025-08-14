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
  const [roomPin, setRoomPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleJoinRoom = async (e) => {
    e.preventDefault();

    if (!roomPin.trim()) {
      setError('Por favor, introduce el PIN de la sala');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // TODO: Implementar lógica para unirse a la sala
      // Por ahora simulamos la navegación
      router.push(`/room/${roomPin}`);
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Error al unirse a la sala. Verifica el PIN e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br flex from-spotify-dark via-spotify-gray to-black">
      <div className="w-10/12 md:w-full max-w-lg mx-auto my-auto flex flex-col items-center justify-center">
        <h1 className="text-6xl font-bold text-spotify-green">Guessify</h1>
        {/* Join Form */}
        <div className="w-full md:w-96 bg-spotify-gray rounded-2xl p-6 sm:p-8 shadow-2xl mt-8">
          <form onSubmit={handleJoinRoom} className="space-y-6">
            {/* Room PIN Input */}
            <div>
              {/*<label 
                  htmlFor="roomPin" 
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  PIN de la Sala
                </label>*/}
              <input
                id="roomPin"
                type="text"
                value={roomPin}
                onChange={(e) => setRoomPin(e.target.value.toUpperCase())}
                placeholder="Introduce el PIN"
                className="w-full px-4 py-3 bg-spotify-light-gray rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent text-center text-lg font-mono tracking-wider"
                maxLength={6}
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Join Button */}
            <button
              type="submit"
              className="w-full bg-spotify-green hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5"></div>
                  <span>Entrando...</span>
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>
            {/* Join Button */}

            <h1 className="mt-16 text-gray-300">O bien crea una nueva partida</h1>
            <button
              type="submit"
              className="mt-4 w-80 bg-white text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5"></div>
                  <span>Entrando...</span>
                </div>
              ) : (
                'Crear Partida'
              )}
            </button>
      </div>
    </div>
  );
}

/*
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black">
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
*/
