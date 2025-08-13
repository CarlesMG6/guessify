'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JoinPage() {
  const [roomPin, setRoomPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black flex flex-col">
      {/* Main Content - Mobile First */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo/Title */}
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-spotify-green mb-2">
              Guessify
            </h1>
            {/*<p className="text-gray-400 text-sm sm:text-base">
              Únete a una sala para jugar
            </p>*/}
          </div>

          {/* Join Form */}
          <div className="bg-spotify-gray rounded-2xl p-6 sm:p-8 shadow-2xl">
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
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent text-center text-lg font-mono tracking-wider"
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
                disabled={isLoading || !roomPin.trim()}
                className="w-full bg-spotify-green hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                    <span>Entrando...</span>
                  </div>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>
          </div>

          {/* 
            TODO: Más abajo se añadirá un botón para descargar/acceder a la app móvil 
            cuando se haya creado la aplicación móvil nativa.
            Esto permitirá a los usuarios acceder directamente desde sus dispositivos.
          */}

        <div className="text-center space-y-3">
            <p className="text-sm mt-24">
                Crea tu propia partida en{' '}
                <button
                    type="button"
                    onClick={() => router.push('/create')}
                    className="font-bold text-spotify-green hover:underline focus:underline"
                    style={{ cursor: 'pointer' }}
                >
                    guessify.app/create
                </button>
            </p>
            {/* Future: App Download Section */}
            {/*
            <div className="pt-4 border-t border-gray-700">
              <p className="text-gray-500 text-xs">
                Próximamente: App móvil disponible
              </p>
            </div>*/}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-gray-500 text-xs">
          Guessify - Adivina la música con tus amigos
        </p>
      </footer>
    </div>
  );
}