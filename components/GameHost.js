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
      stopSong();

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
    console.log('GameHost useEffect: room or players changed', { roomId: room?.id, playersLength: players.length });
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
    console.log('Preparing game for room:', room.id);
    setLoading(true);
    setError('');
    
    try {
      const { getSongsInRoom, subscribeToVotesUpdates } = await import('../lib/firestore');
      
      // Get the playlist from the room (already generated when game started)
      const roomPlaylist = await getSongsInRoom(room.id);
      
      if (!roomPlaylist || roomPlaylist.length === 0) {
        setError('No se encontró la playlist del juego');
        return;
      }
      
      setPlaylist(roomPlaylist);
      console.log('Playlist cargada:', roomPlaylist);
      
      // Subscribe to votes
      const unsubscribeVotes = await subscribeToVotesUpdates(room.id, (snapshot) => {
        const votesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVotes(votesData);
      });
      
      return () => {
        if (unsubscribeVotes) unsubscribeVotes();
      };
      
    } catch (error) {
      console.error('Error preparing game:', error);
      setError('Error al preparar el juego: ' + error.message);
    } finally {
      setLoading(false);
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

  if (gameStarted) {
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
                          room={room}
                          onRestartGame={prepareGame}
                        />
                      )}
                      </>
                    )}
                    </div>
            </div>
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
                    className="bg-gradient-to-r from-spotify-green to-green-400 h-2 rounded-full transition-all duration-300 ease-in-out"
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

  
  return null; // This shouldn't be reached
}
