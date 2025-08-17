'use client';

import { useEffect, useState } from 'react';
import { addPlayerToRoom, updatePlayerProfile } from '../lib/firestore';
import { RiResetRightFill } from "react-icons/ri";


export default function RoomLobby({ room, players, role, onStartGame, user, spotifyUser }) {
  const [playerName, setPlayerName] = useState(spotifyUser?.nombre || '');
  const [joining, setJoining] = useState(true);
  const [error, setError] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('gato');
  const [updating, setUpdating] = useState(false);

  const isPlayerInRoom = players.some(player => player.userId === user?.uid);
  const currentPlayer = players.find(player => player.userId === user?.uid);
  const isPlayerComplete = currentPlayer?.complete || false;

  useEffect(() => {
    if (!isPlayerInRoom) {
      handleJoinAsPlayer();
    } else {
      setJoining(false);
      // Si el jugador está en la room pero no está completo, mostrar modal
      if (!isPlayerComplete) {
        setPlayerName(currentPlayer?.nombre || spotifyUser?.nombre || '');
        setSelectedAvatar(currentPlayer?.avatar || 'gato');
        setShowProfileModal(true);
      }
    }
  }, [isPlayerInRoom, isPlayerComplete]);

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

  const handleConfirmProfile = async () => {
    if (!playerName.trim()) {
      setError('El nombre es requerido');
      return;
    }

    setUpdating(true);
    setError('');

    try {
      await updatePlayerProfile(room.id, user.uid, playerName.trim(), selectedAvatar);
      setShowProfileModal(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Error al actualizar el perfil');
    } finally {
      setUpdating(false);
    }
  };

  const randomizeAvatar = () => {
    // Lista de avatares disponibles basada en las imágenes en playerImages
    const availableAvatars = [
      'activista', 'ambulancia', 'aventura', 'avion', 'campana', 'cangrejo',
      'ciclista', 'ciclocross', 'dia-antiterrorista', 'duende', 'excursionista',
      'fusion-de-un-reactor', 'gato', 'helicoptero', 'hockey-sobre-hielo',
      'hombre', 'hombre-joven', 'jugador-de-hockey-sobre-hielo', 'jugador',
      'la-carretera', 'lectura', 'nino', 'obrero', 'perro', 'polo-acuatico',
      'presidente', 'reportero', 'sari', 'senderismo', 'serpentina',
      'sobrecarga-sensorial', 'somnoliento', 'sueno-de-gato', 'sueno-del-bebe',
      'sueno-del-perro'
    ];

    const randomIndex = Math.floor(Math.random() * availableAvatars.length);
    setSelectedAvatar(availableAvatars[randomIndex]);
  };

  if (joining) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black flex items-center justify-center">
        <div className="text-white text-xl">Uniéndote a la room...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black flex flex-col items-center justify-center">

      {/* Profile Setup Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-50 p-4">

          {/* Avatar Selection */}
          <div className="text-center -mb-6 p-8 rounded-full bg-spotify-gray">
            <div className="relative inline-block">
              <img
                src={`/img/playerImages/${selectedAvatar}.png`}
                alt="Avatar"
                className="w-32 h-32 mx-auto p-2"
                onError={(e) => {
                  e.target.src = '/img/playerImages/ciclista.png'; // Fallback
                }}
              />
              <button
                onClick={randomizeAvatar}
                className="absolute -bottom-6 -right-10 bg-spotify-green text-black rounded-full w-12 h-12 flex items-center justify-center hover:bg-green-400 transition-colors"
                title="Cambiar avatar"
              >
                <RiResetRightFill size={22} />
              </button>
            </div>
          </div>

          <div className="bg-spotify-gray rounded-lg p-6 w-full max-w-md mx-auto">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 py-2 bg-spotify-dark text-white rounded-lg border border-gray-600 focus:border-spotify-green focus:outline-none"
                placeholder="Tu nombre"
                maxLength={20}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 rounded text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Confirm Button */}
            <button
              onClick={handleConfirmProfile}
              disabled={updating || !playerName.trim()}
              className="w-full bg-spotify-green text-black font-bold py-2 px-4 rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updating ? 'Confirmando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}
      {/* Room Content */}
      {isPlayerInRoom && isPlayerComplete && (
        <div className="w-10/12 md:w-full max-w-md mx-auto rounded-lg p-6 text-center items-center justify-center">
          
          <img
            src={`/img/playerImages/${currentPlayer?.avatar || 'gato'}.png`}
            alt="Tu avatar"
            className="w-40 h-40 p-1 mx-auto"
            onError={(e) => {
              e.target.src = '/img/playerImages/gato.png';
            }}
          />
          <h3 className="text-xl font-bold text-white mb-4">{currentPlayer?.nombre}</h3>
          <p className="text-white text-md mt-8">
            Te has unido! Espera a que empiece la partida...
          </p>

        </div>
      )}
    </div>
  );
}
