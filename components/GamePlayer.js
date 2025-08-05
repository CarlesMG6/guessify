'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function GamePlayer({ sala, players, onBackToLobby }) {
  const { user } = useAuth();
  const [gameState, setGameState] = useState('waiting'); // waiting, playing, voting, results, finished
  const [currentSong, setCurrentSong] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [roundPhase, setRoundPhase] = useState('intro');
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [votes, setVotes] = useState([]);
  const [scores, setScores] = useState({});
  const [error, setError] = useState('');

  // Subscribe to game updates
  useEffect(() => {
    if (!sala?.id) return;

    const setupSubscriptions = async () => {
      try {
        const { subscribeToSalaUpdates, subscribeToVotesUpdates } = await import('../lib/firestore');
        
        // Subscribe to sala updates for game state
        const unsubscribeSala = await subscribeToSalaUpdates(sala.id, (doc) => {
          if (doc.exists()) {
            const salaData = doc.data();
            setGameState(salaData.state?.started ? 'playing' : 'waiting');
            setCurrentRound(salaData.state?.currentRound || 0);
            setRoundPhase(salaData.state?.phase || 'intro');
            setTimeLeft(salaData.state?.timeLeft || 0);
          }
        });

        // Subscribe to votes
        const unsubscribeVotes = await subscribeToVotesUpdates(sala.id, (snapshot) => {
          const votesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setVotes(votesData);
          
          // Check if current user has voted in current round
          const userVoteInRound = votesData.find(
            vote => vote.voterUserId === user.uid && vote.roundNumber === currentRound
          );
          setHasVoted(!!userVoteInRound);
        });

        return () => {
          unsubscribeSala();
          unsubscribeVotes();
        };
      } catch (error) {
        console.error('Error setting up subscriptions:', error);
        setError('Error al conectar con el juego');
      }
    };

    setupSubscriptions();
  }, [sala?.id, user?.uid, currentRound]);

  // Get current song from game
  useEffect(() => {
    if (gameState === 'playing' && currentRound > 0) {
      getCurrentSong();
    }
  }, [currentRound, gameState]);

  const getCurrentSong = async () => {
    try {
      const { getSongsInSala } = await import('../lib/firestore');
      const songs = await getSongsInSala(sala.id);
      const song = songs.find(s => s.order === currentRound - 1);
      setCurrentSong(song);
    } catch (error) {
      console.error('Error getting current song:', error);
    }
  };

  const submitVote = async () => {
    if (!selectedPlayer || hasVoted) return;

    try {
      const { addVote } = await import('../lib/firestore');
      await addVote(
        sala.id,
        user.uid,
        selectedPlayer,
        currentSong?.trackId,
        currentRound
      );
      
      setHasVoted(true);
      setSelectedPlayer(null);
    } catch (error) {
      console.error('Error submitting vote:', error);
      setError('Error al enviar el voto');
    }
  };

  const getPlayerScore = (playerId) => {
    const player = players.find(p => p.userId === playerId);
    return scores[playerId] || player?.score || 0;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-600 text-white p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p>{error}</p>
          </div>
          <button
            onClick={onBackToLobby}
            className="bg-spotify-green hover:bg-green-600 text-black font-semibold py-3 px-6 rounded-lg"
          >
            Volver al Lobby
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-spotify-gray rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-6">
              Esperando a que empiece el juego...
            </h2>
            
            <div className="animate-pulse mb-8">
              <div className="text-6xl mb-4">🎵</div>
              <p className="text-gray-400">
                El host está preparando la playlist
              </p>
            </div>

            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Jugadores en la sala
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {players.map(player => (
                  <div key={player.userId} className="bg-gray-600 rounded-lg p-3">
                    <div className="text-white font-medium">{player.nombre}</div>
                    <div className="text-gray-400 text-sm">
                      {player.userId === user.uid ? 'Tú' : 'Jugador'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-spotify-green">🎵 Guessify</h1>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Sala: {sala.codigo}</p>
            <p className="text-white text-lg">Ronda {currentRound}</p>
          </div>
        </div>

        {/* Game Content */}
        {gameState === 'playing' && (
          <div className="space-y-6">
            {/* Current Song */}
            {currentSong && (
              <div className="bg-spotify-gray rounded-lg p-6 text-center">
                <h2 className="text-xl font-bold text-white mb-2">
                  Ahora suena...
                </h2>
                <div className="text-3xl font-bold text-spotify-green mb-2">
                  "{currentSong.trackName}"
                </div>
                <div className="text-lg text-gray-300 mb-4">
                  por {currentSong.artistName}
                </div>
                
                {/* Timer */}
                <div className="text-4xl font-bold text-white mb-4">
                  {formatTime(timeLeft)}
                </div>
                
                {/* Phase indicator */}
                <div className="text-sm text-gray-400 mb-4">
                  Fase: {roundPhase === 'intro' ? 'Escuchando' : 
                         roundPhase === 'voting' ? 'Votando' : 'Resultados'}
                </div>
              </div>
            )}

            {/* Voting Section */}
            {roundPhase === 'voting' && (
              <div className="bg-spotify-gray rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4 text-center">
                  ¿De quién es esta canción?
                </h3>
                
                {hasVoted ? (
                  <div className="text-center text-spotify-green text-lg">
                    ✅ Ya has votado. Esperando a los demás...
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-3">
                      {players
                        .filter(p => p.userId !== user.uid) // Don't show yourself
                        .map(player => (
                          <button
                            key={player.userId}
                            onClick={() => setSelectedPlayer(player.userId)}
                            className={`p-4 rounded-lg font-medium transition-all ${
                              selectedPlayer === player.userId
                                ? 'bg-spotify-green text-black'
                                : 'bg-gray-600 hover:bg-gray-500 text-white'
                            }`}
                          >
                            {player.nombre}
                          </button>
                        ))}
                    </div>
                    
                    <button
                      onClick={submitVote}
                      disabled={!selectedPlayer}
                      className={`w-full py-3 px-6 rounded-lg font-semibold ${
                        selectedPlayer
                          ? 'bg-spotify-green hover:bg-green-600 text-black'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {selectedPlayer ? 'Confirmar Voto' : 'Selecciona un jugador'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Round Results */}
            {roundPhase === 'results' && (
              <div className="bg-spotify-gray rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4 text-center">
                  Resultados de la Ronda
                </h3>
                
                {currentSong && (
                  <div className="text-center mb-6">
                    <p className="text-lg text-gray-300 mb-2">
                      La canción era de:
                    </p>
                    <p className="text-2xl font-bold text-spotify-green">
                      {players.find(p => p.userId === currentSong.userId)?.nombre || 'Desconocido'}
                    </p>
                  </div>
                )}

                {/* Vote results */}
                <div className="space-y-2">
                  {votes
                    .filter(vote => vote.roundNumber === currentRound)
                    .map(vote => {
                      const voter = players.find(p => p.userId === vote.voterUserId);
                      const voted = players.find(p => p.userId === vote.votedUserId);
                      const isCorrect = vote.votedUserId === currentSong?.userId;
                      
                      return (
                        <div key={vote.id} className={`p-3 rounded-lg ${
                          isCorrect ? 'bg-green-600' : 'bg-red-600'
                        }`}>
                          <span className="text-white">
                            {voter?.nombre} votó por {voted?.nombre}
                            {isCorrect && ' ✅'}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Final Results */}
        {gameState === 'finished' && (
          <div className="bg-spotify-gray rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              🏆 ¡Juego Terminado!
            </h2>
            
            <div className="space-y-4 mb-8">
              {players
                .sort((a, b) => getPlayerScore(b.userId) - getPlayerScore(a.userId))
                .map((player, index) => (
                  <div key={player.userId} className={`p-4 rounded-lg ${
                    index === 0 ? 'bg-yellow-600' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-orange-600' : 'bg-gray-600'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">
                        {index + 1}. {player.nombre}
                        {player.userId === user.uid && ' (Tú)'}
                      </span>
                      <span className="text-white text-xl font-bold">
                        {getPlayerScore(player.userId)} pts
                      </span>
                    </div>
                  </div>
                ))}
            </div>
            
            <button
              onClick={onBackToLobby}
              className="bg-spotify-green hover:bg-green-600 text-black font-semibold py-3 px-8 rounded-lg"
            >
              Volver al Lobby
            </button>
          </div>
        )}

        {/* Scoreboard */}
        {gameState === 'playing' && (
          <div className="bg-gray-700 rounded-lg p-4 mt-6">
            <h4 className="text-white font-semibold mb-3">Puntuaciones</h4>
            <div className="grid md:grid-cols-2 gap-2">
              {players.map(player => (
                <div key={player.userId} className="flex justify-between text-sm">
                  <span className={`${player.userId === user.uid ? 'text-spotify-green' : 'text-gray-300'}`}>
                    {player.nombre}{player.userId === user.uid && ' (Tú)'}
                  </span>
                  <span className="text-white">
                    {getPlayerScore(player.userId)} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
