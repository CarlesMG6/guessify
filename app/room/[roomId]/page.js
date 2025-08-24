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

  useEffect(() => {
    // Get role from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const userRole = urlParams.get('role');
    if (userRole) {
      setRole(userRole);
    }
  }, []);

  // Redirect to home if user doesn't have Spotify connected
  useEffect(() => {
    if (user && !spotifyUser && !loading) {
      router.push('/');
    }
  }, [user, spotifyUser, loading, router]);

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
    </>
  );
}

