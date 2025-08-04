'use client';

import { useState } from 'react';
import { addPlayerToSala } from '../lib/firestore';

export default function RoomLobby({ sala, players, role, onStartGame, user, spotifyUser }) {
  const [playerName, setPlayerName] = useState(spotifyUser?.nombre || '');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  const isPlayerInRoom = players.some(player => player.userId === user?.uid);
  const canStart = players.length >= 1 && role === 'host';

  const handleJoinAsPlayer = async () => {
    if (!user || !spotifyUser || !playerName.trim()) {
      setError('Debes conectar Spotify y ingresar un nombre');
      return;
    }

    setJoining(true);
    setError('');

    try {
      await addPlayerToSala(sala.id, user.uid, playerName.trim());
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Error al unirse a la sala');
    } finally {
      setJoining(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(sala.id);
    // You could add a toast notification here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black">
      {/* Header */}
      <header className="p-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-spotify-green">🎵 Guessify</h1>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Sala</p>
            <p className="text-white text-xl font-bold">{sala.id}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Room Info */}
          <div className="lg:col-span-2">
            <div className="bg-spotify-gray rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Información de la Sala</h2>
                <button
                  onClick={copyRoomCode}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200"
                >
                  Copiar Código
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Canciones</p>
                  <p className="text-white font-medium">{sala.config.numSongs}</p>
                </div>
                <div>
                  <p className="text-gray-400">Tiempo por ronda</p>
                  <p className="text-white font-medium">{sala.config.timePerRound}s</p>
                </div>
                <div>
                  <p className="text-gray-400">Mostrar portadas</p>
                  <p className="text-white font-medium">{sala.config.revealCover ? 'Sí' : 'No'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Mostrar artistas</p>
                  <p className="text-white font-medium">{sala.config.revealArtists ? 'Sí' : 'No'}</p>
                </div>
              </div>
            </div>

            {/* Players List */}
            <div className="bg-spotify-gray rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Jugadores ({players.length}/12)
              </h3>
              
              {players.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  Esperando jugadores...
                </p>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center space-x-3 bg-gray-700 rounded-lg p-3"
                    >
                      <div className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-white font-medium">{player.nombre}</p>
                        {player.userId === sala.hostUserId && (
                          <p className="text-spotify-green text-xs">Anfitrión</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions Panel */}
          <div className="space-y-6">
            {!isPlayerInRoom && role !== 'host' && (
              <div className="bg-spotify-gray rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Unirse al Juego</h3>
                
                {error && (
                  <div className="bg-red-600 text-white p-3 rounded-lg mb-4 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Tu nombre de jugador
                    </label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Como quieres que te vean"
                      maxLength={20}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spotify-green"
                    />
                  </div>

                  <button
                    onClick={handleJoinAsPlayer}
                    disabled={joining || !playerName.trim()}
                    className="w-full bg-spotify-green hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    {joining ? 'Uniéndose...' : 'Unirse al Juego'}
                  </button>
                </div>
              </div>
            )}

            {role === 'host' && (
              <div className="bg-spotify-gray rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Controles del Anfitrión</h3>
                
                <div className="space-y-4">
                  <p className="text-gray-300 text-sm">
                    {canStart ? 
                      '¡Todo listo! Puedes iniciar el juego.' : 
                      'Esperando más jugadores para comenzar.'
                    }
                  </p>
                  
                  <button
                    onClick={onStartGame}
                    disabled={!canStart}
                    className="w-full bg-spotify-green hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                  >
                    {canStart ? 'Iniciar Juego' : `Necesitas al menos 1 jugador`}
                  </button>
                </div>
              </div>
            )}

            {isPlayerInRoom && role !== 'host' && (
              <div className="bg-spotify-gray rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Listo para Jugar</h3>
                <p className="text-gray-300 text-sm">
                  Estás en la sala. Esperando a que el anfitrión inicie el juego...
                </p>
              </div>
            )}

            {/* QR Code placeholder */}
            <div className="bg-spotify-gray rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Invitar Amigos</h3>
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-gray-500 text-xs">QR Code</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Comparte el código: <span className="font-bold text-white">{sala.id}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
