'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import { useCountdown } from '../hooks/useCountdown';
import { getPlayerScore } from '../lib/gameHelpers';
import GuessingPhase from './Phase/GuessingPhase';
import StandingsPhase from './Phase/StandingsPhase';
import PointsPhase from './Phase/PointsPhase';
import ResultsPhase from './Phase/ResultsPhase';
import InitialPhase from './Phase/InitialPhase';

export default function GameHost({ sala, players, onBackToLobby }) {
  const { user, spotifyUser } = useAuth();
  const [gameState, setGameState] = useState('preparing'); // preparing, playing, final_results
  const [currentSong, setCurrentSong] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [roundPhase, setRoundPhase] = useState('preparing'); // preparing, voting, results, points, standings
  const [playlist, setPlaylist] = useState([]);
  const [votes, setVotes] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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

  const nextPhase = useCallback(() => {
    console.log('NextPhase called. Current state:', {
      roundPhase,
      currentSongIndex,
      currentSong: currentSong?.trackName,
      playlistLength: playlist.length
    });
    
    setRoundPhase(currentPhase => {
      console.log('Current phase:', currentPhase, 'Moving to next phase...');
      
      if (currentPhase === 'preparing') {
        // Move to voting phase (with music playing)
        console.log('Moving to VOTANDO phase');
        const songToPlay = playlist[currentSongIndex];
        if (songToPlay) {
          playSong(songToPlay);
        } else {
          console.error('No song found at index:', currentSongIndex);
        }
        // Use setTimeout to avoid race condition
        //setTimeout(() => startTimer(TIME_VOTING), 100);
        return 'voting';
      } else if (currentPhase === 'voting') {
        // Move to results phase (stop music)
        console.log('Moving to RESULTADOS phase');
        stopSong();
        calculateRoundResults(currentRound);
        //setTimeout(() => startTimer(TIME_RESULTS), 100);
        return 'results';
      } else if (currentPhase === 'results') {
        // Move to scores phase
        console.log('Moving to POINTS phase');
        //setTimeout(() => startTimer(TIME_POINTS), 100);
        return 'points';
      } else if (currentPhase === 'points') {
        // Move to standings phase
        console.log('Moving to STANDINGS phase');
        //setTimeout(() => startTimer(TIME_POINTS), 100);
        return 'standings';
      } else if (currentPhase === 'standings') {
        // Next round or end game
        const nextSongIndex = currentSongIndex + 1;
        console.log('Moving to next song. Current index:', currentSongIndex, 'Next index:', nextSongIndex, 'Playlist length:', playlist.length);
        
        if (nextSongIndex < playlist.length) {
          console.log('Starting next round with song index:', nextSongIndex);
          startRound(nextSongIndex);
        } else {
          console.log('No more songs, ending game');
          endGame();
        }
        return 'preparing'; // Reset to preparing for next round
      }
      return currentPhase;
    });
  }, [roundPhase, currentSongIndex, currentSong, playlist.length, currentRound]);

  // Initialize countdown timer
  const { secondsLeft: timeLeft, start: startTimer, stop: stopTimer, isRunning } = useCountdown(nextPhase);
  
  // Load playlist and prepare game
  useEffect(() => {
    if (sala && players.length > 0) {
      prepareGame();
    }
  }, [sala, players]);

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
      const usersForPlaylist = await getUsersForPlaylist(sala.id);
      
      if (usersForPlaylist.length === 0) {
        setError('No hay jugadores con datos de Spotify para generar la playlist');
        return;
      }
      
      // Generate playlist
      const generatedPlaylist = generateGamePlaylist(usersForPlaylist, sala.config.numSongs);
      const validation = validatePlaylistForGame(generatedPlaylist);
      
      if (!validation.hasEnoughTracks) {
        setError(`No hay suficientes canciones válidas. Se encontraron ${validation.validTracks.length} de ${sala.config.numSongs} necesarias.`);
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
      const { startGame: startGameInDB, subscribeToVotesUpdates } = await import('../lib/firestore');
      
      // Start game in database
      await startGameInDB(sala.id, playlist);
      
      // Subscribe to votes
      const unsubscribeVotes = await subscribeToVotesUpdates(sala.id, (snapshot) => {
        const votesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setVotes(votesData);
      });
      
      // Start first round
      setGameState('playing');
      startRound(0); // Start with first song (index 0)
      
      return () => {
        unsubscribeVotes();
      };
    } catch (error) {
      console.error('Error starting game:', error);
      setError('Error al iniciar el juego: ' + error.message);
    }
  };

  const startRound = (songIndex) => {
    console.log('Starting round with songIndex:', songIndex, 'Playlist length:', playlist.length);
    
    if (songIndex >= playlist.length) {
      console.log('No more songs, ending game');
      endGame();
      return;
    }
    
    const song = playlist[songIndex];
    console.log('Setting song:', song?.trackName, 'by', song?.artistName, 'at index:', songIndex);
    console.log('Song object structure:', JSON.stringify(song, null, 2));
    
    if (!song) {
      console.error('Song is null at index:', songIndex);
      setError('Error: Canción no encontrada');
      return;
    }
    
    if (!song.trackId) {
      console.error('Song missing trackId:', song);
      setError('Error: Canción sin ID de Spotify');
      return;
    }
    
    setCurrentSong(song);
    setCurrentSongIndex(songIndex);
    setCurrentRound(songIndex + 1);
    setRoundPhase('preparing');
    //startTimer(TIME_PREPARATION);
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
      const scoreUpdates = await calculateScores(sala.id, roundNumber);
      
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

  const endGame = () => {
    stopTimer();
    stopSong();
    setGameState('final_results');
  };

  const skipToNextPhase = () => {
    stopTimer();
    nextPhase();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      stopSong();
    };
  }, [stopTimer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  if (gameState === 'preparing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-spotify-gray rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">¿Listo para empezar?</h2>
            
            <div className="space-y-4 mb-8">
              <div className="text-white">
                <span className="text-gray-400">Sala:</span> {sala.codigo}
              </div>
              <div className="text-white">
                <span className="text-gray-400">Jugadores:</span> {players.length}
              </div>
              <div className="text-white">
                <span className="text-gray-400">Canciones:</span> {playlist.length}
              </div>
              <div className="text-white">
                <span className="text-gray-400">Tiempo por ronda:</span> {sala.config.timePerRound}s
              </div>
              <div className="text-white">
                <span className="text-gray-400">Reproductor Spotify:</span> 
                <span className={`ml-2 ${playerReady ? 'text-green-400' : 'text-yellow-400'}`}>
                  {playerReady ? '✅ Conectado' : '⏳ Conectando...'}
                </span>
              </div>
            </div>

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

  if (gameState === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black p-6">
        <audio ref={audioRef} />
        
        <div className="max-w-6xl mx-auto">
          {/* Game Header */}
          <div className="bg-spotify-gray rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Ronda {currentRound} de {playlist.length}
                </h2>
                <div className="text-gray-400">
                  Sala: {sala.codigo} | {players.length} jugadores
                </div>
                {/* DEBUG INFO */}
                <div className="text-xs text-yellow-400 mt-1">
                  DEBUG: Fase: {roundPhase} | Ronda: {currentRound} | Song Index: {currentSongIndex} | Canción: {currentSong?.trackName || 'No hay canción'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-spotify-green">
                  {formatTime(timeLeft)}
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

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Display */}
                  <div className="lg:col-span-2">
                    <div className="bg-spotify-gray rounded-lg p-8 text-center">
                    {currentSong && (
                      <>
                      {roundPhase === 'preparing' && (
                        <InitialPhase
                          question ={"Quien ha escuchado más esta canción?"}
                        />
                      )}

                      {roundPhase === 'voting' && (
                        <GuessingPhase
                          question={"¿Quién ha escuchado más esta canción?"}
                          currentSong={currentSong}
                          room = {sala}
                        />
                      )}

                      {roundPhase === 'results' && (
                        <ResultsPhase
                          question={"¿Quién ha escuchado más esta canción?"}
                          currentSong={currentSong}
                          room = {sala}
                          players={players}
                        />
                      )}

                      {roundPhase === 'points' && (
                        <PointsPhase
                          players={players}
                          room = {sala}
                          scores={scores}
                        />
                      )}

                      {roundPhase === 'standings' && (
                        <StandingsPhase
                          players={players}
                        />
                      )}
                      </>
                    )}
                    </div>

                    {/* Host Controls */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={skipToNextPhase}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Saltar Fase
                </button>
                
                {/* Debug Controls */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    onClick={() => console.log('Debug Info:', {
                      playerReady,
                      hasToken: !!spotifyToken,
                      currentSong: currentSong?.trackName,
                      deviceId: 'check console for useSpotifyPlayer logs'
                    })}
                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs py-1 px-2 rounded"
                  >
                    Debug Info
                  </button>
                </div>
              </div>
            </div>

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
      </div>
    );
  }

  if (gameState === 'final_results') {
    const sortedPlayers = [...players].sort((a, b) => {
      const scoreA = getPlayerScore(players, scores, a.userId);
      const scoreB = getPlayerScore(players, scores, b.userId);
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
                const playerScore = getPlayerScore(players, scores, player.userId);
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
