'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPlayerScore } from '../lib/gameHelpers';
import InitialPhasePlayer from './Phase/InitialPhasePlayer';
import GuessingPhasePlayer from './Phase/GuessingPhasePlayer';
import ResultsPhasePlayer from './Phase/ResultsPhasePlayer';
import PointsPhasePlayer from './Phase/PointsPhasePlayer';
import StandingsPhasePlayer from './Phase/StandingsPhasePlayer';
import EndPhasePlayer from './Phase/EndPhasePlayer';

export default function GamePlayer({ room, players, onBackToLobby }) {
  const { user } = useAuth();
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [roundPhase, setRoundPhase] = useState('intro');
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [votes, setVotes] = useState([]);
  const [error, setError] = useState('');
  const QUESTION = "¿Quién ha escuchado más esta canción?";

  // Subscribe to game updates
  useEffect(() => {
    if (!room?.id) return;

    const setupSubscriptions = async () => {
      try {
        const { subscribeToRoomUpdates, subscribeToVotesUpdates } = await import('../lib/firestore');

        // Subscribe to room updates for game state
        const unsubscribeRoom = await subscribeToRoomUpdates(room.id, (doc) => {
          if (doc.exists()) {
            const roomData = doc.data();
            setIsStarted(roomData.state?.started);
            setIsFinished(roomData.state?.finished);
            setCurrentRound(roomData.state?.currentRound || 0);
            setRoundPhase(roomData.state?.currentPhase || 'preparing');
            setTimeLeft(roomData.state?.timeLeft || 0);
          }
        });

        // Subscribe to votes
        const unsubscribeVotes = await subscribeToVotesUpdates(room.id, (snapshot) => {
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
          unsubscribeRoom();
          unsubscribeVotes();
        };
      } catch (error) {
        console.error('Error setting up subscriptions:', error);
        setError('Error al conectar con el juego');
      }
    };

    setupSubscriptions();
  }, [room?.id, user?.uid, currentRound]);

  // Get current song from game
  useEffect(() => {
    if (isStarted && currentRound >= 0) {
      getCurrentSong();
    }
  }, [currentRound, isStarted]);

  const getCurrentSong = async () => {
    try {
      const { getSongsInRoom } = await import('../lib/firestore');
      const songs = await getSongsInRoom(room.id);
      const song = songs.find(s => s.order === currentRound);
      setCurrentSong(song);
    } catch (error) {
      console.error('Error getting current song:', error);
    }
  };

  const handleVote = async (votedUserId) => {
    if (hasVoted) {
      setError('Ya has votado en esta ronda');
      return;
    }

    console.log('Voto enviado:', votedUserId);
    console.log('Datos enviado', {
      roomId: room.id,
      userId: user.uid,
      votedUserId,
      trackId: currentSong?.trackId,
      roundNumber: currentRound,
      phaseStartTime: room.state?.phaseStartTime,
      phaseEndTime: room.state?.phaseEndTime
    });
    try {
      const { addVote } = await import('../lib/firestore');
      await addVote(
        room.id,
        user.uid,
        votedUserId,
        currentSong?.trackId,
        currentRound,
        room.state?.phaseStartTime,
        room.state?.phaseEndTime
      );

      setHasVoted(true);
    } catch (error) {
      console.error('Error submitting vote:', error);
      setError('Error al enviar el voto');
    }
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

  if (!isStarted) {
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
                Jugadores en la room
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
    <div className='flex flex-col min-h-screen'>
      <div className="flex flex-col flex-grow bg-gradient-to-br from-spotify-dark via-spotify-gray to-black p-6">
        {/* Header */}
        <div className="flex-row justify-between items-start w-full">
          <div className='rounded-full bg-spotify-light-gray w-fit items-center flex-row px-3 py-1 my-auto'>
            <p className="text-white text-lg flex text-center my-auto">{currentRound+1}</p>
          </div>
          <div className='p-6 w-full left-0 top-0 absolute'>
            <h1 className=" text-2xl font-bold text-spotify-green text-center">Guessify</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto flex-col my-auto">


          {/* Game Content */}
          {isStarted && !isFinished && (

            <>
              {roundPhase === 'preparing' && (
                <InitialPhasePlayer
                  question={QUESTION}
                  currentRound={currentRound+1}
                />
              )}

              {roundPhase === 'voting' && (
                <GuessingPhasePlayer
                  question={QUESTION}
                  players={players}
                  handleVote={handleVote}
                  hasVoted={hasVoted}
                />
              )}

              {(roundPhase === 'results' || roundPhase === 'points' || roundPhase === 'standings' ) && (
                <ResultsPhasePlayer
                  question={QUESTION}
                  room={room}
                  players={players}
                  currentSong={currentSong}
                  votes={votes}
                />
              )}

              {roundPhase === 'finished' && (
                <EndPhasePlayer
                  room={room}
                  players={players}
                  votes={votes}
                />
              )}
            </>
          )}

          {/* Final Results */}
          {isFinished && (
            <div className="bg-spotify-gray rounded-lg p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-6">
                🏆 ¡Juego Terminado!
              </h2>

              <div className="space-y-4 mb-8">
                {players
                  .sort((a, b) => getPlayerScore(b.userId) - getPlayerScore(a.userId))
                  .map((player, index) => (
                    <div key={player.userId} className={`p-4 rounded-lg ${index === 0 ? 'bg-yellow-600' :
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


        </div>
      </div>
      {/* Scoreboard */}
      {isStarted && !isFinished && (
        <div className="bg-spotify-light-gray p-4">
          <div className="grid md:grid-cols-2 gap-2">

            {/*
                Initialize the variable player with the player in the list players
                that has the same uid as user.uid
              */}
            {(() => {
              const player = players.find(p => p.userId === user.uid);
              console.log("Actual player: ",player);
              console.log("User id: ",user.uid);
              console.log("Players: ",players);
              return (
                <div className=''>
                  
                  <div key={player.userId} className="flex justify-between text-sm h-6 ml-24 items-center">
                    <span className={'text-gray-300'}>
                      {player.nombre}
                    </span>
                    <span className="text-white">
                      {player.score} pts
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
