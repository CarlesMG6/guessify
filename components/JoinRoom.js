'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSala, addPlayerToSala } from '../lib/firestore';
import { useRouter } from 'next/navigation';

export default function JoinRoom() {
  const { user, spotifyUser } = useAuth();
  const router = useRouter();
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState(spotifyUser?.nombre || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !spotifyUser) {
      setError('Debes estar conectado con Spotify para unirte a una sala');
      return;
    }

    if (!roomCode.trim()) {
      setError('Ingresa un código de sala');
      return;
    }

    if (!playerName.trim()) {
      setError('Ingresa tu nombre de jugador');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if room exists
      const sala = await getSala(roomCode.toUpperCase());
      
      if (!sala) {
        setError('La sala no existe. Verifica el código.');
        return;
      }

      if (sala.state.started) {
        setError('La partida ya ha comenzado. No puedes unirte.');
        return;
      }

      // Add player to room
      await addPlayerToSala(roomCode.toUpperCase(), user.uid, playerName.trim());
      
      // Redirect to room page
      router.push(`/room/${roomCode.toUpperCase()}?role=player`);
      
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Error al unirse a la sala. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-spotify-gray rounded-lg p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Unirse a Sala</h2>
        
        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="roomCode" className="block text-white text-sm font-medium mb-2">
              Código de Sala
            </label>
            <input
              type="text"
              id="roomCode"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Ej: ABC123XY"
              maxLength={8}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="playerName" className="block text-white text-sm font-medium mb-2">
              Tu Nombre de Jugador
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Como quieres que te vean otros jugadores"
              maxLength={20}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {loading ? 'Uniéndose...' : 'Unirse a Sala'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-600">
          <p className="text-gray-400 text-sm text-center">
            ¿No tienes un código? Pídele al anfitrión que te comparta el código de la sala.
          </p>
        </div>
      </div>
    </div>
  );
}
