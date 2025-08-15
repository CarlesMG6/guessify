'use client';

import { useEffect, useState } from 'react';
import { addPlayerToRoom } from '../lib/firestore';

export default function RoomLobby({ room, players, role, onStartGame, user, spotifyUser }) {
  const [playerName, setPlayerName] = useState(spotifyUser?.nombre || '');
  const [joining, setJoining] = useState(true);
  const [error, setError] = useState('');

  const isPlayerInRoom = players.some(player => player.userId === user?.uid);

  useEffect(() => {
    if (!isPlayerInRoom) {
      handleJoinAsPlayer();
    } else {
      setJoining(false);
    }
  }, []);

  const handleJoinAsPlayer = async () => {
    if (!user || !spotifyUser || !playerName.trim()) {
      setError('Debes conectar Spotify y ingresar un nombre');
      console.error('Debes conectar Spotify y ingresar un nombre');
      return;
    }

    setJoining(true);
    setError('');

    try {
      await addPlayerToRoom(room.id, user.uid, playerName.trim());
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Error al unirse a la room');
    } finally {
      setJoining(false);
    }
  };

  if (joining) {  
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black flex items-center justify-center">
        <div className="text-white text-xl">Uniéndote a la room...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black">

      {isPlayerInRoom && (
        <div className="bg-spotify-gray rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">Listo para Jugar</h3>
          <p className="text-gray-300 text-sm">
            Estás en la room. Esperando a que el anfitrión inicie el juego...
          </p>
        </div>
      )}
    </div>
  );
}
