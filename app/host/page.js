'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  createRoom
} from '../../lib/firestore';
import { getSpotifyAuthUrl } from '../../lib/spotify';

export default function RoomPage() {
  const { user, spotifyUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hostType, setHostType] = useState('host'); // 'host' or 'player'
  const [showSpotifyModal, setShowSpotifyModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // Configuration state
  const [config, setConfig] = useState({
    numSongs: 3,
    timePerRound: 30,
    autoStart: false,
    revealSongName: true,
    revealArtists: true,
    revealCover: true
  });

  // Check if user needs Spotify login
  // Check if user needs Spotify login
  useEffect(() => {
    if (user && !spotifyUser && !loading) {
      setShowSpotifyModal(true);
    } else {
      setShowSpotifyModal(false);
    }
  }, [user, spotifyUser, loading]);

  const handleSpotifyLogin = () => {
    // Store current URL in localStorage for redirect after auth
    const currentUrl = window.location.href;
    localStorage.setItem('spotify_redirect_after_auth', currentUrl);
    
    const authUrl = getSpotifyAuthUrl();
    window.location.href = authUrl;
  };

  const handleCreateRoom = async (useConfig = false) => {
    console.log('Creating room...');
    if (!user) {
      setError('Debes estar autenticado para crear una sala');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Configuration for the room
      const roomConfig = useConfig ? {
        numSongs: config.numSongs,
        autoStart: config.autoStart,
        delayStartTime: 5,
        timePerRound: config.timePerRound,
        revealSongName: config.revealSongName,
        revealArtists: config.revealArtists,
        revealCover: config.revealCover,
        hostPlaying: hostType === 'player'
      } : {
        numSongs: 10,
        autoStart: false,
        delayStartTime: 5,
        timePerRound: 30,
        revealSongName: true,
        revealArtists: true,
        revealCover: true,
        hostPlaying: hostType === 'player'
      };

      // Create the room
      const newRoom = await createRoom(user.uid, roomConfig);

      console.log('Room created:', newRoom);

      // Close config modal if it was open
      setShowConfigModal(false);

      // Redirect to the host page with the room ID
      router.push(`/host/${newRoom.id}`);
      
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Error al crear la sala. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };


  // Configuration Modal
  const ConfigurationModal = () => {
    if (!showConfigModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-spotify-dark rounded-xl p-6 max-w-md w-full mx-4 border border-spotify-gray max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Configuración de la Sala</h2>
            <p className="text-gray-300">Personaliza tu experiencia de juego</p>
          </div>

          <div className="space-y-6">
            {/* Number of Songs */}
            <div>
              <label className="block text-white font-semibold mb-3">
                Canciones por usuario: {config.numSongs}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={config.numSongs}
                onChange={(e) => setConfig(prev => ({...prev, numSongs: parseInt(e.target.value)}))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            {/* Time per Round */}
            <div>
              <label className="block text-white font-semibold mb-3">
                Tiempo por ronda: {config.timePerRound}s
              </label>
              <input
                type="range"
                min="1"
                max="90"
                value={config.timePerRound}
                onChange={(e) => setConfig(prev => ({...prev, timePerRound: parseInt(e.target.value)}))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1s</span>
                <span>90s</span>
              </div>
            </div>

            {/* Auto Start */}
            <div className="flex items-center justify-between">
              <label className="text-white font-semibold">Avance automático</label>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.autoStart}
                  onChange={(e) => setConfig(prev => ({...prev, autoStart: e.target.checked}))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-spotify-green"></div>
              </label>
            </div>

            {/* Reveal Options */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold">Mostrar durante el juego:</h3>
              
              <div className="flex items-center justify-between">
                <label className="text-gray-300">Nombre de la canción</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.revealSongName}
                    onChange={(e) => setConfig(prev => ({...prev, revealSongName: e.target.checked}))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-spotify-green"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-gray-300">Nombre del artista</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.revealArtists}
                    onChange={(e) => setConfig(prev => ({...prev, revealArtists: e.target.checked}))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-spotify-green"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-gray-300">Portada del álbum</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.revealCover}
                    onChange={(e) => setConfig(prev => ({...prev, revealCover: e.target.checked}))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-spotify-green"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col space-y-3 mt-8">
            <button
              onClick={() => handleCreateRoom(true)}
              disabled={loading}
              className="w-full bg-spotify-green hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                  <span>Creando...</span>
                </div>
              ) : (
                'Crear Sala'
              )}
            </button>
            <button
              onClick={() => setShowConfigModal(false)}
              className="w-full bg-transparent border border-gray-500 hover:border-gray-400 text-gray-300 hover:text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };
  const SpotifyLoginModal = () => {
    if (!showSpotifyModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-spotify-dark rounded-xl p-6 max-w-md w-full mx-4 border border-spotify-gray">
          <div className="text-center">
            <div className="w-16 h-16 bg-spotify-green rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 17.568c-.226.358-.706.472-1.064.246-2.912-1.778-6.571-2.18-10.888-1.193-.404.093-.818-.135-.911-.539s.135-.818.539-.911c4.751-1.084 8.858-.621 12.078 1.373.358.226.472.706.246 1.064zm1.514-3.37c-.286.453-.895.596-1.348.31-3.335-2.051-8.414-2.645-12.36-1.447-.514.156-1.057-.132-1.213-.646s.132-1.057.646-1.213c4.528-1.375 10.104-.787 13.965 1.646.453.286.596.895.31 1.35zm.131-3.508C15.684 8.445 9.139 8.242 5.315 9.375c-.608.181-1.25-.165-1.431-.773s.165-1.25.773-1.431c4.415-1.304 11.731-1.057 16.511 1.82.548.33.729 1.043.398 1.591-.33.548-1.043.729-1.591.398z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Conecta con Spotify Premium</h2>
            <p className="text-gray-300 mb-6">
              Como host, necesitas una cuenta de <strong>Spotify Premium</strong> para poder reproducir canciones durante el juego. 
              Esto nos permite controlar la reproducción y crear la mejor experiencia para todos los jugadores.
            </p>
            <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-3 mb-6">
              <p className="text-yellow-200 text-sm">
                ⚠️ <strong>Importante:</strong> Se requiere Spotify Premium para hostear juegos
              </p>
            </div>
            <button
              onClick={handleSpotifyLogin}
              className="w-full bg-spotify-green hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 mb-3"
            >
              Conectar con Spotify Premium
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-transparent border border-gray-500 hover:border-gray-400 text-gray-300 hover:text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  };


  /*

  Choose Host mode
          <p className="text-center text-gray-300 mb-6">
          What do you want to do with this device?
        </p>
        <div className="flex justify-between mb-8 gap-4">
          <button
            className={`w-1/2 h-24 rounded-xl flex flex-col items-center justify-center font-semibold text-lg transition-colors duration-200 bg-spotify-gray text-white  ${
              hostType === 'host'
                ? 'border-4 border-spotify-green'
                : 'border-2 border-gray-500'
            }`}
            onClick={() => setHostType('host')}
          >
            <span>Only</span>
            <span>Host</span>
          </button>
          <button
            className={`w-1/2 h-24 rounded-xl flex flex-col items-center justify-center font-semibold text-lg transition-colors duration-200 bg-spotify-gray text-white ${
              hostType === 'player'
                ? ' border-4 border-spotify-green'
                : ' border-2 border-gray-500'
            }`}
            onClick={() => setHostType('player') }
          >
            <span>Also</span>
            <span>Play</span>
          </button>
        </div>

  */
  return (
    <>
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #1db954;
          cursor: pointer;
          border: 2px solid #1db954;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #1db954;
          cursor: pointer;
          border: 2px solid #1db954;
        }
      `}</style>
      <div className="min-h-screen w-full bg-gradient-to-br flex from-spotify-dark via-spotify-gray to-black">
      <div className="w-10/12 md:w-full max-w-lg mx-auto my-auto flex flex-col items-center justify-center">
        <h1 className="text-6xl font-bold text-spotify-green">Guessify</h1>
        <div className="w-full md:w-96 bg-spotify-gray rounded-2xl p-6 sm:p-8 shadow-2xl mt-8">
          


            <button
              onClick={() => handleCreateRoom(false)}
              disabled={loading}
              className="w-full bg-spotify-green hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5"></div>
                  <span>Creando...</span>
                </div>
              ) : (
                'Crear Sala Rápida'
              )}
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="mt-4 w-full bg-white text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-lg hover:bg-gray-200"
            >
              Configurar Sala
            </button>
        </div>
      </div>
      <SpotifyLoginModal />
      <ConfigurationModal />
      </div>
    </>
  );
}
