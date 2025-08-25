'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import { useCountdown } from '../hooks/useCountdown';
import { getPlayerScore, getVotesForCurrentRound } from '../lib/gameHelpers';
import GuessingPhase from './Phase/GuessingPhase';
import StandingsPhase from './Phase/StandingsPhase';
import ResultsPhase from './Phase/ResultsPhase';
import InitialPhase from './Phase/InitialPhase';
import EndPhase from './Phase/EndPhase';

export default function GameHost({ room, players, onBackToLobby }) {
  const { user, spotifyUser } = useAuth();
  const [gameState, setGameState] = useState('preparing'); // preparing, playing, final_results
  const [currentSong, setCurrentSong] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timerUpdate, setTimerUpdate] = useState(0); // Force timer updates

  // Ref to prevent multiple auto-advances
  const autoAdvanceRef = useRef(false);

  
  // Get state from room data
  const currentRound = room?.state?.currentRound || 0;
  const roundPhase = room?.state?.currentPhase || 'preparing';
  const gameStarted = room?.state?.started || false;
  const gameFinished = room?.state?.finished || false;
  const phaseEndTime = room?.state?.phaseEndTime || null;
  
  const TIME_PREPARATION = 5; // seconds for preparation phase
  const TIME_VOTING = 15; // seconds for voting phase
  const TIME_RESULTS = 5; // seconds for results phase
  const TIME_POINTS = 5; // seconds for scoring phase

  // Get Spotify token
  const spotifyToken = spotifyUser?.spotifyTokens?.access_token;
  
  // Initialize Spotify Player
  const {
    isReady: playerReady,
    isPaused,
    error: playerError,
    playTrack,
    pause: pauseTrack,
    resume: resumeTrack
  } = useSpotifyPlayer(spotifyToken);
  
  const audioRef = useRef(null); // Keep for fallback

  const nextPhase = useCallback(async () => {
    console.log('NextPhase called. Current state:', {
      roundPhase,
      currentRound,
      currentSong: currentSong?.trackName,
      playlistLength: playlist.length
    });
    
    let newPhase = roundPhase;
    let newRound = currentRound;
    let newPhaseEndTime = null;
    
    if (roundPhase === 'preparing') {
      // Move to voting phase (with music playing)
      console.log('Moving to VOTING phase');
      const songToPlay = playlist[currentRound];
      if (songToPlay) {
        playSong(songToPlay);
      } else {
        console.error('No song found at index:', currentRound);
      }
      newPhase = 'voting';
      newPhaseEndTime = new Date(Date.now() + (!!room?.config?.timePerRound ? room?.config?.timePerRound * 1000 : TIME_VOTING * 1000));
    } else if (roundPhase === 'voting') {
      // Move to results phase (stop music)
      console.log('Moving to RESULTS phase');
      stopSong();
      calculateRoundResults(currentRound);
      newPhase = 'results';
      newPhaseEndTime = new Date(Date.now() + TIME_RESULTS * 1000);
    } else if (roundPhase === 'results') {
      // Move to scores phase
      console.log('Moving to STANDINGS phase');
      newPhase = 'standings';
      newPhaseEndTime = new Date(Date.now() + TIME_POINTS * 1000);
    } else if (roundPhase === 'standings') {
      // Next round or end game
      const nextRoundIndex = currentRound + 1;
      console.log('Moving to next song. Current round:', currentRound, 'Next round:', nextRoundIndex, 'Playlist length:', playlist.length);
      
      if (nextRoundIndex < playlist.length) {
        console.log('Starting next round with index:', nextRoundIndex);
        newRound = nextRoundIndex;
        newPhase = 'preparing';
        newPhaseEndTime = new Date(Date.now() + TIME_PREPARATION * 1000);
      } else {
        console.log('No more songs, ending game');
        try {
          const { updateGameState } = await import('../lib/firestore');
          await updateGameState(room.id, {
            finished: true,
            currentPhase: 'finished'
          });
        } catch (error) {
          console.error('Error ending game:', error);
        }
        return;
      }
    }
    
    const newPhaseStartTime = new Date();
    // Update game state in database
    try {
      const { updateGameState } = await import('../lib/firestore');
      await updateGameState(room.id, {
        currentRound: newRound,
        currentPhase: newPhase,
        phaseEndTime: newPhaseEndTime,
        phaseStartTime: newPhaseStartTime
      });
    } catch (error) {
      console.error('Error updating game state:', error);
    }
  }, [roundPhase, currentRound, currentSong, playlist.length, room.id]);

  const skipToNextPhase = () => {
    stopTimer();
    nextPhase();
  };

  // Initialize countdown timer
  const { secondsLeft: timeLeft, start: startTimer, stop: stopTimer, isRunning } = useCountdown(nextPhase);
  
  // Set current song based on current round
  useEffect(() => {
    if (playlist.length > 0 && currentRound < playlist.length) {
      const song = playlist[currentRound];
      setCurrentSong(song);
    }
  }, [playlist, currentRound]);

  // Handle phase timer based on phaseEndTime
  useEffect(() => {
    if (!phaseEndTime) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const endTime = new Date(phaseEndTime.seconds * 1000);

      // Update timer display
      setTimerUpdate(prev => prev + 1);

      if (now >= endTime && !gameFinished) {
        // Check if autoStart is enabled
        if (room?.config?.autoStart) {
          console.log('⏰ Auto-advancing phase due to timer (autoStart enabled)');
          skipToNextPhase();
        } else {
          console.log('⏰ Timer expired but autoStart disabled, calling nextPhase');
          nextPhase();
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [phaseEndTime, nextPhase, skipToNextPhase, room?.config?.autoStart]);

  // Calculate time left for display
  const getTimeLeft = () => {
    if (!phaseEndTime) return 0;
    const now = Date.now();
    
    // Handle Firestore timestamp format
    const endTime = phaseEndTime.seconds 
      ? new Date(phaseEndTime.seconds * 1000).getTime()
      : new Date(phaseEndTime).getTime();
    
    return Math.max(0, Math.floor((endTime - now) / 1000));
  };

  // Calculate progress for timer bar
  const getTimerProgress = () => {
    if (!phaseEndTime || !room?.state?.phaseStartTime) return 0;
    
    const now = Date.now();
    
    // Handle Firestore timestamp format
    const startTime = room.state.phaseStartTime.seconds 
      ? new Date(room.state.phaseStartTime.seconds * 1000).getTime()
      : new Date(room.state.phaseStartTime).getTime();
    
    const endTime = phaseEndTime.seconds 
      ? new Date(phaseEndTime.seconds * 1000).getTime()
      : new Date(phaseEndTime).getTime();
    
    const totalDuration = endTime - startTime;
    const elapsed = now - startTime;
    
    if (totalDuration <= 0) return 0;
    return 100 - Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load playlist and prepare game
  useEffect(() => {
    if (room && players.length > 0 && loading) {
      prepareGame();
    }
  }, [room, players]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [stopTimer]);

  const prepareGame = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { getUsersForPlaylist, generateGamePlaylist, validatePlaylistForGame } = await import('../lib/gameUtils');
      
      // Get users with Spotify data
      const usersForPlaylist = await getUsersForPlaylist(room.id);
      
      if (usersForPlaylist.length === 0) {
        setError('No hay jugadores con datos de Spotify para generar la playlist');
        return;
      }
      
      // Generate playlist
      const generatedPlaylist = generateGamePlaylist(usersForPlaylist, room.config.numSongs);
      const validation = validatePlaylistForGame(generatedPlaylist);
      
      if (!validation.hasEnoughTracks) {
        setError(`No hay suficientes canciones válidas. Se encontraron ${validation.validTracks.length} de ${room.config.numSongs} necesarias.`);
        return;
      }
      
      setPlaylist(validation.validTracks);
      console.log('Playlist generada:', validation.validTracks);
      
    } catch (error) {
      console.error('Error preparing game:', error);
      setError('Error al preparar el juego: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    if (playlist.length === 0) {
      setError('No hay playlist disponible');
      return;
    }
    
    console.log('Starting game with playlist:', playlist);
    console.log('Game configuration:', {
      autoStart: room?.config?.autoStart,
      timePerRound: room?.config?.timePerRound,
      numSongs: room?.config?.numSongs
    });
    console.log('Playlist validation:');
    playlist.forEach((song, index) => {
      console.log(`Song ${index}:`, {
        trackId: song.trackId,
        trackName: song.trackName,
        artistName: song.artistName,
        hasTrackId: !!song.trackId
      });
    });
    
    try {
      const { startGame: startGameInDB, subscribeToVotesUpdates, updateGameState } = await import('../lib/firestore');
      
      // Start game in database
      await startGameInDB(room.id, playlist);
      
      // Initialize game state
      await updateGameState(room.id, {
        started: true,
        finished: false,
        currentRound: 0,
        currentPhase: 'preparing',
        phaseEndTime: new Date(Date.now() + TIME_PREPARATION * 1000)
      });
      
      // Subscribe to votes
      const unsubscribeVotes = await subscribeToVotesUpdates(room.id, (snapshot) => {
        const votesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVotes(votesData);
      });
      
      // Set game state to playing
      setGameState('playing');
      
      return () => {
        unsubscribeVotes();
      };
    } catch (error) {
      console.error('Error starting game:', error);
      setError('Error al iniciar el juego: ' + error.message);
    }
  };

  const playSong = async (song) => {
    console.log('PlaySong called with:', song);
    
    if (!song) {
      console.error('No song provided to playSong');
      setError('Error: No hay canción para reproducir');
      return;
    }
    
    if (!song.trackId) {
      console.error('No track ID available for song:', song);
      setError('Error: Canción sin ID de Spotify');
      return;
    }

    console.log('Attempting to play song:', {
      trackId: song.trackId,
      trackName: song.trackName,
      playerReady,
      spotifyToken: !!spotifyToken,
      hasPreviewUrl: !!song.previewUrl
    });

    // Try Spotify SDK first
    if (playerReady && spotifyToken) {
      console.log('Trying Spotify SDK...');
      const spotifyUri = `spotify:track:${song.trackId}`;
      try {
        const success = await playTrack(spotifyUri);
        console.log('Spotify SDK playTrack result:', success);
        if (success) {
          console.log('✅ Playing via Spotify SDK:', song.trackName);
          return;
        } else {
          console.warn('❌ Spotify SDK failed to play track');
        }
      } catch (error) {
        console.error('❌ Spotify SDK error:', error);
      }
    } else {
      console.log('Spotify SDK not available:', {
        playerReady,
        hasToken: !!spotifyToken
      });
    }

    // Fallback to preview URL if SDK fails
    console.log('Trying preview URL fallback...');
    if (audioRef.current && song.previewUrl) {
      console.log('✅ Using preview URL:', song.previewUrl);
      audioRef.current.src = song.previewUrl;
      audioRef.current.play().catch(error => {
        console.error('❌ Error playing preview audio:', error);
        setError('Error reproduciendo vista previa de la canción');
      });
    } else {
      console.error('❌ No fallback available:', {
        hasAudioRef: !!audioRef.current,
        hasPreviewUrl: !!song.previewUrl,
        previewUrl: song.previewUrl
      });
      
      // Provide more specific error message
      if (!playerReady) {
        setError('Reproductor de Spotify no está listo. Verifica tu conexión Premium.');
      } else if (!spotifyToken) {
        setError('Token de Spotify no disponible. Intenta reconectarte.');
      } else if (!song.previewUrl) {
        setError('Esta canción no tiene preview disponible y Spotify SDK falló. Prueba con Spotify Premium.');
      } else {
        setError('No se puede reproducir la canción. Asegúrate de tener Spotify Premium y estar conectado.');
      }
    }
  };

  const stopSong = async () => {
    // Stop Spotify SDK playback
    if (playerReady && pauseTrack) {
      await pauseTrack();
    }
    
    // Stop preview audio fallback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const calculateRoundResults = async (roundNumber) => {
    try {
      const { calculateScores } = await import('../lib/firestore');
      const scoreUpdates = await calculateScores(room.id, roundNumber);
      
      // Update local scores
      setScores(prev => {
        const updated = { ...prev };
        Object.keys(scoreUpdates).forEach(userId => {
          updated[userId] = (updated[userId] || 0) + scoreUpdates[userId];
        });
        return updated;
      });
      
    } catch (error) {
      console.error('Error calculating round results:', error);
    }
  };

  const endGame = async () => {
    stopTimer();
    stopSong();
    setGameState('final_results');
    
    try {
      const { updateGameState } = await import('../lib/firestore');
      await updateGameState(room.id, {
        finished: true,
        currentPhase: 'finished'
      });
    } catch (error) {
      console.error('Error ending game:', error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      stopSong();
    };
  }, [stopTimer]);

  // Auto-advance when all players have voted
  useEffect(() => {
    if (roundPhase === 'voting' && votes.length > 0 && players.length > 0 && !autoAdvanceRef.current) {
      const currentRoundVotes = getVotesForCurrentRound(votes, currentRound);
      
      console.log('Vote check:', {
        roundPhase,
        currentRound,
        totalPlayers: players.length,
        votesThisRound: currentRoundVotes.length,
        allVotes: votes.length,
        autoAdvanceBlocked: autoAdvanceRef.current,
        votes: currentRoundVotes.map(v => ({ voter: v.voterUserId, round: v.roundNumber }))
      });
      
      // Check if all players have voted for this round
      if (currentRoundVotes.length >= players.length) {
        console.log('🎯 All players have voted! Auto-advancing to next phase in 1 second...');
        autoAdvanceRef.current = true; // Prevent multiple calls
        
        // Add a small delay to ensure the vote is visible before advancing
        setTimeout(() => {
          console.log('⏭️ Executing auto-advance to next phase');
          skipToNextPhase();
        }, 1000);
      }
    }
    
    // Reset the ref when round phase changes away from voting
    if (roundPhase !== 'voting') {
      autoAdvanceRef.current = false;
    }
  }, [votes, players.length, currentRound, roundPhase, skipToNextPhase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Preparando el juego...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-spotify-green mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || playerError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-600 text-white p-6 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p>{error || playerError}</p>
            {playerError && (
              <div className="mt-3 text-sm">
                <p>• Asegúrate de tener Spotify Premium</p>
                <p>• Verifica que estés conectado a Spotify</p>
                <p>• Intenta refrescar la página</p>
              </div>
            )}
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

  if (gameState === 'preparing' || !gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-spotify-gray rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">¿Listo para empezar?</h2>
            
            <div className="space-y-4 mb-8">
              <div className="text-white">
                <span className="text-gray-400">Jugadores:</span> {players.length}
              </div>
              <div className="text-white">
                <span className="text-gray-400">Canciones:</span> {playlist.length}
              </div>
              <div className="text-white">
                <span className="text-gray-400">Tiempo por ronda:</span> {room.config.timePerRound}s
              </div>
              <div className="text-white">
                <span className="text-gray-400">Auto-avance:</span> 
                <span className={`ml-2 ${room?.config?.autoStart ? 'text-green-400' : 'text-yellow-400'}`}>
                  {room?.config?.autoStart ? '✅ Habilitado' : '⏸️ Manual'}
                </span>
              </div>
              <div className="text-white">
                <span className="text-gray-400">Reproductor Spotify:</span> 
                <span className={`ml-2 ${playerReady ? 'text-green-400' : 'text-yellow-400'}`}>
                  {playerReady ? '✅ Conectado' : '⏳ Conectando...'}
                </span>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={startGame}
                disabled={playlist.length === 0}
                className="bg-spotify-green hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-3 px-6 rounded-lg"
              >
                ¡Empezar Juego!
              </button>
              <button
                onClick={onBackToLobby}
                className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-3 px-6 rounded-lg"
              >
                Volver al Lobby
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /*
  {playlist.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">Preview de Playlist</h3>
                <div className="grid gap-2 max-h-40 overflow-y-auto">
                  {playlist.slice(0, 5).map((song, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3 flex items-center space-x-3">
                      <img
                        src={song.coverUrl}
                        alt={song.trackName}
                        className="w-10 h-10 rounded"
                      />
                      <div>
                        <div className="text-white font-medium">{song.trackName}</div>
                        <div className="text-gray-400 text-sm">{song.artistName}</div>
                      </div>
                    </div>
                  ))}
                  {playlist.length > 5 && (
                    <div className="text-gray-400 text-center py-2">
                      y {playlist.length - 5} canciones más...
                    </div>
                  )}
                </div>
              </div>
            )}
  */

  if (gameState === 'playing' || gameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black p-6">
        <audio ref={audioRef} />
        
        <div className="max-w-7xl mx-auto">
          <div className="mt-12">
            {/* Main Display */}
                  <div className="lg:col-span-2">
                    <div className="h-screen rounded-lg p-8 text-center">
                    {currentSong && (
                      <>
                      {roundPhase === 'preparing' && (
                        <InitialPhase
                          question ={"Quien ha escuchado más esta canción?"}
                          skipToNextPhase={skipToNextPhase}
                          textSkip={"Siguiente"}
                        />
                      )}

                      {roundPhase === 'voting' && (
                        <GuessingPhase
                          question={"¿Quién ha escuchado más esta canción?"}
                          currentSong={currentSong}
                          room = {room}
                          skipToNextPhase={skipToNextPhase}
                          textSkip={"Omitir"}
                        />
                      )}

                      {roundPhase === 'results' && (
                        <ResultsPhase
                          question={"¿Quién ha escuchado más esta canción?"}
                          currentSong={currentSong}
                          room = {room}
                          players={players}
                          skipToNextPhase={skipToNextPhase}
                          textSkip={"Siguiente"}
                        />
                      )}

                      {roundPhase === 'standings' && (
                        <StandingsPhase
                          players={players}
                          useMockData={false}
                          skipToNextPhase={skipToNextPhase}
                          textSkip={"Siguiente"}
                        />
                      )}

                      {roundPhase === 'finished' && (
                        <EndPhase
                          players={players}
                        />
                      )}
                      </>
                    )}
                    </div>
            </div>

{/*
                      {roundPhase === 'points' && (
                        <PointsPhase
                          players={players}
                          room = {room}
                        />
                      )}
*/}

            {/* Players and Votes */}
            {/*
            <div>
              <div className="bg-spotify-gray rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Jugadores
                </h3>
                
                <div className="space-y-3">
                  {players.map(player => {
                    const playerVotes = getVotesForCurrentRound(votes, currentRound).filter(
                      vote => vote.voterUserId === player.userId
                    );
                    const hasVoted = playerVotes.length > 0;
                    const playerScore = getPlayerScore(players, scores, player.userId);
                    
                    return (
                      <div
                        key={player.userId}
                        className="bg-gray-700 rounded-lg p-3 flex justify-between items-center"
                      >
                        <div>
                          <div className="text-white font-medium">
                            {player.nombre}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {playerScore} pts
                          </div>
                        </div>
                        {roundPhase === 'votando' && (
                          <div className={`px-2 py-1 rounded text-xs ${
                            hasVoted 
                              ? 'bg-green-900 text-green-400' 
                              : 'bg-yellow-900 text-yellow-400'
                          }`}>
                            {hasVoted ? 'Votó' : 'Esperando...'}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
            */}
          </div>
        </div>
        
        {/* Timer Progress Bar */}
        {phaseEndTime && room?.state?.phaseStartTime && room?.config?.autoStart && roundPhase !== "finished" && (
          <div className="fixed bottom-4 left-0 right-0 z-40">
            <div className=" px-6 py-4">
              <div className="max-w-7xl flex-row flex mx-auto items-center justify-center">
                <div className="flex flex-col items-center justify-center mr-8">
                  <div className="text-spotify-green font-mono font-bold text-2xl">
                    {formatTime(getTimeLeft())}
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-spotify-green to-green-400 h-2 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${getTimerProgress()}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  /*
          <div className="bg-spotify-gray rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Ronda {currentRound + 1} de {playlist.length}
                </h2>
                <div className="text-gray-400">
                  Room: {room.codigo} | {players.length} jugadores
                </div>
                <div className="text-xs text-yellow-400 mt-1">
                  DEBUG: Fase: {roundPhase} | Ronda: {currentRound + 1} | Song Index: {currentRound} | Canción: {currentSong?.trackName || 'No hay canción'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-spotify-green">
                  {formatTime(getTimeLeft())}
                </div>
                <div className="text-gray-400 capitalize">
                  {roundPhase === 'preparing' && 'Preparando...'}
                  {roundPhase === 'voting' && 'Votando (Escucha y vota)'}
                  {roundPhase === 'results' && 'Resultados de la ronda'}
                  {roundPhase === 'points' && 'Puntuaciones'}
                  {roundPhase === 'standings' && 'Clasificación'}
                </div>
              </div>
            </div>
          </div>
   */
  if (gameState === 'final_results') {
    const sortedPlayers = [...players].sort((a, b) => {
      const scoreA = getPlayerScore(players, a.userId);
      const scoreB = getPlayerScore(players, b.userId);
      return scoreB - scoreA;
    });
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-spotify-gray rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-8">
              ¡Juego Terminado!
            </h2>

            <div className="space-y-4 mb-8">
              {sortedPlayers.map((player, index) => {
                const playerScore = getPlayerScore(players, player.userId);
                return (
                  <div
                    key={player.userId}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      index === 0 
                        ? 'bg-gradient-to-r from-yellow-900 to-yellow-800 border-2 border-yellow-500' 
                        : 'bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`text-2xl font-bold ${
                        index === 0 ? 'text-yellow-400' : 'text-gray-400'
                      }`}>
                        #{index + 1}
                      </div>
                      <div className="text-white font-semibold text-lg">
                        {player.nombre}
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${
                      index === 0 ? 'text-yellow-400' : 'text-spotify-green'
                    }`}>
                      {playerScore} pts
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex space-x-4 justify-center">
              <button
                onClick={onBackToLobby}
                className="bg-spotify-green hover:bg-green-600 text-black font-semibold py-3 px-6 rounded-lg"
              >
                Volver al Lobby
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div>Estado no reconocido: {gameState}</div>;
}
