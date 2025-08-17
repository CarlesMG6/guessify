'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  getRoom,
  subscribeToRoomUpdates,
  subscribeToPlayersUpdates,
  updateRoom
} from '../../../lib/firestore';
import { getSpotifyAuthUrl } from '../../../lib/spotify';
import RoomLobby from '../../../components/RoomLobby';
import GameHost from '../../../components/GameHost';
import GamePlayer from '../../../components/GamePlayer';

export default function RoomPage({ params }) {
  const { roomId } = params;
  const { user, spotifyUser } = useAuth();
  const router = useRouter();
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState('player'); // 'host' or 'player'
  const [showSpotifyModal, setShowSpotifyModal] = useState(false);

  useEffect(() => {
    // Get role from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const userRole = urlParams.get('role');
    if (userRole) {
      setRole(userRole);
    }
  }, []);

  // Check if user needs Spotify login
  useEffect(() => {
    if (user && !spotifyUser && !loading) {
      setShowSpotifyModal(true);
    } else {
      setShowSpotifyModal(false);
    }
  }, [user, spotifyUser, loading]);

  useEffect(() => {
    if (!user || !roomId) return;

    const loadRoom = async () => {
      try {
        const roomData = await getRoom(roomId);

        if (!roomData) {
          setError('La room no existe');
          return;
        }

        setRoom(roomData);

        // Set role based on host
        if (roomData.hostUserId === user.uid) {
          setRole('host');
        }

      } catch (error) {
        console.error('Error loading room:', error);
        setError('Error al cargar la room');
      } finally {
        setLoading(false);
      }
    };

    loadRoom();
  }, [user, roomId]);

  useEffect(() => {
    if (!roomId) return;

    let unsubscribeRoom, unsubscribePlayers;

    const setupSubscriptions = async () => {
      try {
        // Subscribe to room updates
        unsubscribeRoom = await subscribeToRoomUpdates(roomId, (doc) => {
          if (doc.exists()) {
            setRoom({ id: doc.id, ...doc.data() });
          } else {
            setError('La room no existe');
          }
        });

        // Subscribe to players updates
        unsubscribePlayers = await subscribeToPlayersUpdates(roomId, (snapshot) => {
          const playersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setPlayers(playersData);
        });
      } catch (error) {
        console.error('Error setting up subscriptions:', error);
        setError('Error al conectar con la room');
      }
    };

    setupSubscriptions();

    return () => {
      if (unsubscribeRoom) unsubscribeRoom();
      if (unsubscribePlayers) unsubscribePlayers();
    };
  }, [roomId]);

  const handleSpotifyLogin = () => {
    // Store current URL in localStorage for redirect after auth
    const currentUrl = window.location.href;
    localStorage.setItem('spotify_redirect_after_auth', currentUrl);

    const authUrl = getSpotifyAuthUrl();
    window.location.href = authUrl;
  };

  const startGame = async () => {
    if (role !== 'host' || !room) return;

    try {
      await updateRoom(roomId, {
        'state.started': true,
        'state.currentRound': 0
      });
    } catch (error) {
      console.error('Error starting game:', error);
      setError('Error al iniciar el juego');
    }
  };

  // Spotify Login Modal
  const SpotifyLoginModal = () => {
    if (!showSpotifyModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-spotify-dark rounded-xl p-6 max-w-md w-full mx-4 border border-spotify-gray">
          <div className="text-center">
            <div className="w-16 h-16 bg-spotify-green rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 17.568c-.226.358-.706.472-1.064.246-2.912-1.778-6.571-2.18-10.888-1.193-.404.093-.818-.135-.911-.539s.135-.818.539-.911c4.751-1.084 8.858-.621 12.078 1.373.358.226.472.706.246 1.064zm1.514-3.37c-.286.453-.895.596-1.348.31-3.335-2.051-8.414-2.645-12.36-1.447-.514.156-1.057-.132-1.213-.646s.132-1.057.646-1.213c4.528-1.375 10.104-.787 13.965 1.646.453.286.596.895.31 1.35zm.131-3.508C15.684 8.445 9.139 8.242 5.315 9.375c-.608.181-1.25-.165-1.431-.773s.165-1.25.773-1.431c4.415-1.304 11.731-1.057 16.511 1.82.548.33.729 1.043.398 1.591-.33.548-1.043.729-1.591.398z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Conecta con Spotify</h2>
            <p className="text-gray-300 mb-6">
              Para participar en el juego necesitas conectar tu cuenta de Spotify.
              Esto nos permite acceder a tus gustos musicales y crear un juego personalizado.
            </p>
            <button
              onClick={handleSpotifyLogin}
              className="w-full bg-spotify-green hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 mb-3"
            >
              Conectar con Spotify
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black flex items-center justify-center">
        <div className="text-white text-xl">Cargando room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={() => router.push('/')}
            className="bg-spotify-green hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black flex items-center justify-center">
        <div className="text-white text-xl">Room no encontrada</div>
      </div>
    );
  }

  // If game hasn't started, show lobby
  if (!room.state.started) {
    return (
      <>
        <RoomLobby
          room={room}
          players={players}
          role={role}
          onStartGame={startGame}
          user={user}
          spotifyUser={spotifyUser}
        />
        <SpotifyLoginModal />
      </>
    );
  }

  // If game has started, show game interface
  const handleBackToLobby = () => {
    // This would require implementing a function to reset game state
    router.push('/');
  };
  return (
    <>
      <GamePlayer
        room={room}
        players={players}
        onBackToLobby={handleBackToLobby}
      />
      <SpotifyLoginModal />
    </>
  );
}

