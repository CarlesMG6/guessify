'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GameHost from './GameHost';
import GamePlayer from './GamePlayer';

export default function CreateRoom() {
  const { user, spotifyUser } = useAuth();
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [config, setConfig] = useState({
    numSongs: 10,
    autoStart: false,
    delayStartTime: 5,
    timePerRound: 15,
    revealSongName: true,
    revealArtists: true,
    revealCover: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('config'); // 'config', 'lobby', 'game'
  const [gameStarted, setGameStarted] = useState(false);

  // Memoize the subscription setup to avoid recreating it
  const setupSubscription = useCallback(async (roomId) => {
    try {
      const { subscribeToPlayersUpdates } = await import('../lib/firestore');
      return await subscribeToPlayersUpdates(roomId, (snapshot) => {
        const playersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPlayers(playersData);
      });
    } catch (error) {
      console.error('Error setting up subscription:', error);
      setError('Error al conectar con la base de datos');
      return () => {}; // Return empty cleanup function
    }
  }, []);

  // Subscribe to player updates when room is created
  useEffect(() => {
    if (!room?.id) return;

    let unsubscribe = () => {};

    setupSubscription(room.id).then((unsub) => {
      unsubscribe = unsub || (() => {});
    });

    return () => unsubscribe();
  }, [room?.id, setupSubscription]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    if (!user || !spotifyUser) {
      setError('Debes estar conectado con Spotify para crear una room');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Dynamic import to avoid SSR issues
      const { createRoom, addPlayerToRoom } = await import('../lib/firestore');
      
      // Create room
      const newRoom = await createRoom(user.uid, config);
      console.log('Room creada:', newRoom);
      
      // Add host as first player
      await addPlayerToRoom(newRoom.id, user.uid, spotifyUser.nombre);
      
      setRoom(newRoom);
      setView('lobby');
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Error al crear la room. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    setLoading(true);
    setError('');

    try {
      const { startGame } = await import('../lib/firestore');
      await startGame(room.id, config);
      setGameStarted(true);
      setView('game');
    } catch (error) {
      console.error('Error starting game:', error);
      setError('Error al iniciar el juego. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBackToLobby = () => {
    setGameStarted(false);
    setView('lobby');
  };

  const getJoinUrl = () => {
    if (typeof window !== 'undefined' && room) {
      return `${window.location.origin}/?join=${room.id}`;
    }
    return '';
  };

  // Game view - check if user is host or player
  if (view === 'game' && room && gameStarted) {
    const isHost = room.hostUserId === user?.uid;
    
    if (isHost) {
      return (
        <GameHost
          room={room}
          players={players}
          config={config}
          onBackToLobby={handleBackToLobby}
        />
      );
    } else {
      return (
        <GamePlayer
          room={room}
          players={players}
          onBackToLobby={handleBackToLobby}
        />
      );
    }
  }

  if (view === 'lobby' && room) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-spotify-gray rounded-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Room: {room.codigo}</h2>
            <button
              onClick={() => setView('config')}
              className="text-spotify-green hover:text-green-400 transition-colors duration-200"
            >
              ← Volver a configuración
            </button>
          </div>

          {error && (
            <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Player List */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold text-white mb-4">
                Jugadores ({players.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className="bg-gray-700 rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center text-black font-semibold text-sm">
                        {index + 1}
                      </div>
                      <span className="text-white font-medium">{player.nombre}</span>
                    </div>
                    {player.userId === user?.uid && (
                      <span className="text-xs bg-spotify-green text-black px-2 py-1 rounded-full font-medium">
                        Host
                      </span>
                    )}
                  </div>
                ))}
                {players.length === 0 && (
                  <div className="text-gray-400 text-center py-8">
                    Esperando jugadores...
                  </div>
                )}
              </div>

              {players.length >= 2 && (
                <button
                  onClick={handleStartGame}
                  disabled={loading}
                  className="w-full mt-6 bg-spotify-green hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                >
                  {loading ? 'Iniciando juego...' : 'Empezar Partida'}
                </button>
              )}
              {players.length < 2 && (
                <div className="mt-6 text-center text-gray-400 text-sm">
                  Se necesitan al menos 2 jugadores para empezar
                </div>
              )}
            </div>

            {/* Room Info and QR */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-3">Código de Room</h3>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-3xl font-bold text-spotify-green mb-2">
                      {room.codigo}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(room.id)}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      Copiar código
                    </button>
                  </div>
                </div>

                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-3">Código QR</h3>
                  <div className="bg-white rounded-lg p-4 inline-block">
                    <div className="text-center text-gray-600 text-sm">
                      <p>Escanea este código:</p>
                      <div className="mt-2 p-4 bg-gray-100 rounded border-2 border-dashed border-gray-300">
                        <div className="text-xs font-mono break-all">
                          {getJoinUrl()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Game Configuration Display */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Configuración de la Partida</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-gray-300 text-sm">Número de canciones</div>
                    <div className="text-white font-semibold">{config.numSongs}</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-gray-300 text-sm">Tiempo por ronda</div>
                    <div className="text-white font-semibold">{config.timePerRound}s</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-gray-300 text-sm">Tiempo antes de opciones</div>
                    <div className="text-white font-semibold">{config.delayStartTime}s</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-gray-300 text-sm">Auto avanzar</div>
                    <div className="text-white font-semibold">{config.autoStart ? 'Sí' : 'No'}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-gray-300 text-sm mb-2">Se mostrará durante la reproducción:</div>
                  <div className="flex flex-wrap gap-2">
                    {config.revealSongName && (
                      <span className="bg-spotify-green text-black px-3 py-1 rounded-full text-sm font-medium">
                        Nombre de canción
                      </span>
                    )}
                    {config.revealArtists && (
                      <span className="bg-spotify-green text-black px-3 py-1 rounded-full text-sm font-medium">
                        Artistas
                      </span>
                    )}
                    {config.revealCover && (
                      <span className="bg-spotify-green text-black px-3 py-1 rounded-full text-sm font-medium">
                        Portada
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-spotify-gray rounded-lg p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Configurar Partida</h2>
        
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateRoom} className="space-y-6">
          {/* Número de canciones */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Número de canciones ({config.numSongs})
            </label>
            <input
              type="range"
              min="5"
              max="30"
              value={config.numSongs}
              onChange={(e) => handleInputChange('numSongs', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-400 mt-1">
              <span>5</span>
              <span>30</span>
            </div>
          </div>

          {/* Tiempo por ronda */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Tiempo por ronda ({config.timePerRound}s)
            </label>
            <input
              type="range"
              min="10"
              max="30"
              value={config.timePerRound}
              onChange={(e) => handleInputChange('timePerRound', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-400 mt-1">
              <span>10s</span>
              <span>30s</span>
            </div>
          </div>

          {/* Tiempo antes de mostrar opciones */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Tiempo antes de mostrar opciones ({config.delayStartTime}s)
            </label>
            <input
              type="range"
              min="0"
              max="15"
              value={config.delayStartTime}
              onChange={(e) => handleInputChange('delayStartTime', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-gray-400 mt-1">
              <span>0s</span>
              <span>15s</span>
            </div>
          </div>

          {/* Opciones de revelación */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white">¿Qué mostrar durante la reproducción?</h3>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="revealSongName"
                checked={config.revealSongName}
                onChange={(e) => handleInputChange('revealSongName', e.target.checked)}
                className="mr-3 w-4 h-4 text-spotify-green bg-gray-600 border-gray-500 rounded focus:ring-spotify-green focus:ring-2"
              />
              <label htmlFor="revealSongName" className="text-white">
                Nombre de la canción
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="revealArtists"
                checked={config.revealArtists}
                onChange={(e) => handleInputChange('revealArtists', e.target.checked)}
                className="mr-3 w-4 h-4 text-spotify-green bg-gray-600 border-gray-500 rounded focus:ring-spotify-green focus:ring-2"
              />
              <label htmlFor="revealArtists" className="text-white">
                Artistas
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="revealCover"
                checked={config.revealCover}
                onChange={(e) => handleInputChange('revealCover', e.target.checked)}
                className="mr-3 w-4 h-4 text-spotify-green bg-gray-600 border-gray-500 rounded focus:ring-spotify-green focus:ring-2"
              />
              <label htmlFor="revealCover" className="text-white">
                Portada del álbum
              </label>
            </div>
          </div>

          {/* Auto avanzar */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoStart"
              checked={config.autoStart}
              onChange={(e) => handleInputChange('autoStart', e.target.checked)}
              className="mr-3 w-4 h-4 text-spotify-green bg-gray-600 border-gray-500 rounded focus:ring-spotify-green focus:ring-2"
            />
            <label htmlFor="autoStart" className="text-white">
              Avanzar automáticamente entre rondas
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-spotify-green hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {loading ? 'Creando room...' : 'Crear Room'}
          </button>
        </form>
      </div>
    </div>
  );
}
