'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { getSpotifyAuthUrl } from '../lib/spotify';
import CreateRoom from '../components/CreateRoom';
import JoinRoom from '../components/JoinRoom';
import UserProfile from '../components/UserProfile';
import ClientOnly from '../components/ClientOnly';

export default function Home() {
  const router = useRouter();
  const { user, spotifyUser, loading, loginAnonymously, loginWithGoogle, isClient } = useAuth();
  const [view, setView] = useState('home'); // 'home', 'create', 'join'
  const [roomPin, setRoomPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGoogleLoginModal, setShowGoogleLoginModal] = useState(false);

  useEffect(() => {
    // Show Google login modal if no user and client is ready
    if (isClient && !loading && !user) {
      setShowGoogleLoginModal(true);
    } else {
      setShowGoogleLoginModal(false);
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
  }, [loading, user, isClient, spotifyUser]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      await loginWithGoogle();
      setShowGoogleLoginModal(false);
    } catch (error) {
      console.error('Error with Google login:', error);
      setError('Error al iniciar sesión con Google. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      await loginAnonymously();
      setShowGoogleLoginModal(false);
    } catch (error) {
      console.error('Error with anonymous login:', error);
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpotifyLogin = () => {
    // Store current URL in localStorage for redirect after auth
    const currentUrl = window.location.href;
    localStorage.setItem('spotify_redirect_after_auth', currentUrl);
    
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

  const handleCreateRoom = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');

    try {
      // TODO: Implementar lógica para unirse a la sala
      // Por ahora simulamos la navegación
      router.push(`/host`);
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Error al crear la sala. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login Modal
  const GoogleLoginModal = () => {
    const isOverlay = showGoogleLoginModal && user; // Only show as overlay if user exists but modal is forced
    
    if (!showGoogleLoginModal && user) return null;

    const modalClasses = isOverlay 
      ? "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      : "flex items-center justify-center min-h-screen p-4";

    return (
      <div className={modalClasses}>
        <div className="bg-spotify-dark rounded-xl p-6 max-w-md w-full mx-4 border border-spotify-gray">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-500 mb-2">¡Bienvenido a Guessify!</h2>
            <p className="text-gray-300 mb-6">
              Inicia sesión para guardar tu progreso y disfrutar de la mejor experiencia musical.
            </p>

            {error && (
              <div className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-3 mb-4">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-100 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-transparent"></div>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continuar con Google</span>
                  </>
                )}
              </button>
              {/*
              <button
                onClick={handleAnonymousLogin}
                disabled={isLoading}
                className="w-full bg-transparent border border-gray-500 hover:border-gray-400 disabled:border-gray-600 disabled:cursor-not-allowed text-gray-300 hover:text-white disabled:text-gray-500 font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-transparent mx-auto"></div>
                ) : (
                  'Continuar como invitado'
                )}
              </button>
              */}
            </div>

            <p className="text-gray-400 text-xs mt-4">
              Al continuar, aceptas nuestros términos de servicio y política de privacidad.
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (!isClient || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  // Show only the login modal if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-spotify-dark via-spotify-gray to-black flex items-center justify-center">
        <GoogleLoginModal />
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
              <label
                htmlFor="roomPin"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                PIN de la Sala
              </label>
              <input
                id="roomPin"
                type="text"
                value={roomPin}
                onChange={(e) => {
                  // Only allow digits
                  const digitsOnly = e.target.value.replace(/\D/g, '');
                  setRoomPin(digitsOnly);
                }}
                placeholder="Introduce el PIN"
                className="w-full px-4 py-3 bg-spotify-light-gray rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent text-center text-lg font-mono tracking-wider"
                maxLength={6}
                disabled={isLoading}
              />
            </div>
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
          onClick={handleCreateRoom}
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
