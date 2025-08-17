// Game utility functions for playlist generation and song management

// Generate playlist from players' top tracks
export const generateGamePlaylist = (players, numSongs = 10) => {
  if (!players || players.length === 0) {
    throw new Error('No players available for playlist generation');
  }

  const allTracks = [];
  
  // Collect all tracks from all players
  players.forEach(player => {
    if (!player.userId) {
      console.warn('Player without userId found:', player);
      return;
    }
    
    const userData = player.userData || player;
    
    // Combine all time ranges with weighted preference
    const tracks = [
      ...(userData.topTracks_short || []).map(track => ({ 
        ...track, 
        weight: 3, 
        ownerUserId: player.userId 
      })),
      ...(userData.topTracks_medium || []).map(track => ({ 
        ...track, 
        weight: 2, 
        ownerUserId: player.userId 
      })),
      ...(userData.topTracks_long || []).map(track => ({ 
        ...track, 
        weight: 1, 
        ownerUserId: player.userId 
      }))
    ].filter(track => track.id && track.name); // Filter out invalid tracks
    
    allTracks.push(...tracks);
  });

  if (allTracks.length === 0) {
    throw new Error('No valid tracks found from players');
  }

  // Remove duplicates based on track ID, keeping the one with highest weight
  const uniqueTracks = allTracks.reduce((acc, track) => {
    const existing = acc.find(t => t.id === track.id);
    if (!existing || track.weight > existing.weight) {
      if (existing) {
        acc.splice(acc.indexOf(existing), 1);
      }
      acc.push(track);
    }
    return acc;
  }, []);

  // Sort by weight and randomize within weight groups
  const weightedTracks = uniqueTracks
    .sort((a, b) => b.weight - a.weight)
    .slice(0, Math.min(numSongs * 3, uniqueTracks.length)); // Take more than needed for better randomization

  // Shuffle and take the desired number
  const shuffled = weightedTracks.sort(() => Math.random() - 0.5);
  const selectedTracks = shuffled.slice(0, numSongs);

  // Format for game use
  return selectedTracks.map((track, index) => ({
    trackId: track.id,
    trackName: track.name,
    artistName: track.artists ? track.artists.map(artist => 
      typeof artist === 'string' ? artist : artist.name
    ).join(', ') : 'Artista Desconocido',
    coverUrl: track.album?.images?.[0]?.url || '',
    previewUrl: track.preview_url,
    ownerUserId: track.ownerUserId,
    order: index,
    spotifyUrl: track.external_urls?.spotify
  }));
};

// Validate that playlist has enough tracks (no preview URL requirement for Spotify SDK)
export const validatePlaylistForGame = (playlist) => {
  const validTracks = playlist.filter(track => track.trackId && track.trackName);
  const invalidTracks = playlist.filter(track => !track.trackId || !track.trackName);
  
  return {
    validTracks,
    invalidTracks,
    hasEnoughTracks: validTracks.length >= 5, // Minimum 5 tracks for a game
    validationPassed: invalidTracks.length === 0
  };
};

// Get users data for playlist generation
export const getUsersForPlaylist = async (roomId) => {
  try {
    const { getPlayersInRoom, getUser } = await import('./firestore');
    
    const players = await getPlayersInRoom(roomId);
    console.log('Players in room:', players);
    
    const usersData = await Promise.all(
      players.map(async player => {
        try {
          const userData = await getUser(player.userId);
          console.log(`User data for ${player.userId}:`, userData);
          return {
            ...player,
            userData
          };
        } catch (error) {
          console.error(`Error getting user data for ${player.userId}:`, error);
          return {
            ...player,
            userData: null
          };
        }
      })
    );
    
    // Filter users that have Spotify data
    const validUsers = usersData.filter(user => 
      user.userData && 
      (user.userData.topTracks_short?.length > 0 || 
       user.userData.topTracks_medium?.length > 0 || 
       user.userData.topTracks_long?.length > 0)
    );
    
    console.log('Valid users for playlist:', validUsers);
    return validUsers;
  } catch (error) {
    console.error('Error getting users for playlist:', error);
    throw error;
  }
};

// Format time for display (MM:SS)
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Game state helpers
export const GAME_STATES = {
  WAITING: 'waiting',
  STARTING: 'starting',
  PLAYING: 'playing',
  VOTING: 'voting',
  ROUND_RESULTS: 'round_results',
  FINAL_RESULTS: 'final_results',
  FINISHED: 'finished'
};

export const ROUND_PHASES = {
  INTRO: 'intro', // Show song info (if enabled)
  LISTENING: 'listening', // Play song preview
  VOTING: 'voting', // Players vote
  RESULTS: 'results' // Show round results
};

// Calculate round timing
export const calculateRoundTiming = (config) => {
  const {
    delayStartTime = 5,
    timePerRound = 15,
    votingTime = 10,
    resultsTime = 5
  } = config;
  
  return {
    introTime: delayStartTime,
    listeningTime: timePerRound,
    votingTime,
    resultsTime,
    totalRoundTime: delayStartTime + timePerRound + votingTime + resultsTime
  };
};
