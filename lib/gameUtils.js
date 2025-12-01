// Game utility functions for playlist generation and song management

// Generate playlist from players' top tracks
export const generateGamePlaylist = (players, numSongsPerPlayer = 10, term = 'medium_term') => {
  if (!players || players.length === 0) {
    throw new Error('No players available for playlist generation');
  }

  console.log('Generating playlist with:', { players: players.length, numSongsPerPlayer, term });
  
  // Map term to the correct topTracks field
  const getTopTracksField = (term) => {
    switch (term) {
      case 'short_term':
        return 'topTracks_short';
      case 'medium_term':
        return 'topTracks_medium';
      case 'long_term':
        return 'topTracks_long';
      default:
        return 'topTracks_medium'; // Default fallback
    }
  };
  
  const topTracksField = getTopTracksField(term);
  console.log('Using topTracks field:', topTracksField);
  
  const generatedTracks = [];
  
  // Generate numSongsPerPlayer random numbers from 1 to 50
  const randomIndices = [];
  for (let i = 0; i < numSongsPerPlayer; i++) {
    randomIndices.push(Math.floor(Math.random() * 50) + 1); // Random number 1-50
  }
  
  console.log('Random indices generated:', randomIndices);
  
  // For each random index, get songs from all players
  randomIndices.forEach((randomIndex, indexPos) => {
    console.log(`\n--- Processing random index ${randomIndex} (position ${indexPos + 1}) ---`);
    
    // Process each player for this random index
    players.forEach(player => {
      const userData = player.userData || player;
      const topTracks = userData[topTracksField] || [];
      
      if (topTracks.length === 0) {
        console.log(`Player ${player.userId} has no ${topTracksField} tracks, skipping`);
        return;
      }
      
      let currentIndex = randomIndex;
      let attempts = 0;
      const maxAttempts = 50; // Prevent infinite loops
      
      while (attempts < maxAttempts) {
        // Adjust index to be within array bounds (0-based indexing)
        const arrayIndex = (currentIndex - 1) % topTracks.length;
        const track = topTracks[arrayIndex];
        
        if (!track || !track.id || !track.name) {
          console.log(`Invalid track at index ${arrayIndex} for player ${player.userId}`);
          currentIndex = currentIndex >= 50 ? 1 : currentIndex + 1;
          attempts++;
          continue;
        }
        
        console.log(`Checking track "${track.name}" at index ${currentIndex} for player ${player.userId}`);
        
        // If track is already in the generated list
        if (generatedTracks.some(t => t.trackId === track.id)) {
          console.log(`Track "${track.name}" already in playlist, trying next index`);
          currentIndex = currentIndex >= 50 ? 1 : currentIndex + 1;
          attempts++;
          continue;
        }
        
        // Check if this track appears in other players' lists and get their positions. The one with the highest position (lowest index) gets priority.
        const otherPlayers = players.filter(p => p.userId !== player.userId)
            .map(p => {
              const topTracks = p[topTracksField];
              const trackIndex = topTracks ? topTracks.findIndex(t => t.id === track.id) : -1;
              if (trackIndex !== -1) {
                return { userId: p.userId, name: p.nombre || `Player ${p.userId}`, position: trackIndex + 1 }; // 1-based position
              }
              return null;
            }).filter(entry => entry !== null)
            .sort((a, b) => a.position - b.position);

        let playerName = player.nombre || `Player ${player.userId}`;
        if (!!otherPlayers && otherPlayers[0].userId !== player.userId) {
          console.log(`Track "${track.name}" found higher in ${otherPlayers[0].userId}'s list (pos ${otherPlayers[0].position} vs ${currentIndex+1})`);
          playerName = otherPlayers[0].name;
        }
        
        // All checks passed, add the track
        const formattedTrack = {
          trackId: track.id,
          trackName: track.name,
          artistName: track.artists ? track.artists.map(artist => 
            typeof artist === 'string' ? artist : artist.name
          ).join(', ') : 'Artista Desconocido',
          coverUrl: track.album?.images?.[0]?.url || '',
          previewUrl: track.preview_url,
          ownerUserId: player.userId,
          order: generatedTracks.length,
          spotifyUrl: track.external_urls?.spotify,
          originalIndex: currentIndex,
          playerName: playerName,
          otherPlayersWithTrack: otherPlayers.filter(p => p.userId !== player.userId)
        };
        
        generatedTracks.push(formattedTrack);
        console.log(`✅ Added track "${track.name}" from ${player.userId} at index ${currentIndex}`);
        break; // Success, move to next player
      }
      
      if (attempts >= maxAttempts) {
        console.warn(`Could not find valid track for player ${player.userId} at random index ${randomIndex} after ${maxAttempts} attempts`);
      }
    });
  });
  
  // Shuffle the final playlist to randomize the order
  const shuffledTracks = generatedTracks.sort(() => Math.random() - 0.5);
  
  // Update order after shuffle
  shuffledTracks.forEach((track, index) => {
    track.order = index;
  });
  
  console.log(`\n Final playlist generated with ${shuffledTracks.length} tracks:`);
  shuffledTracks.forEach((track, index) => {
    console.log(`${index + 1}. "${track.trackName}" by ${track.artistName} (Owner: ${track.playerName})`);
  });
  
  return shuffledTracks;
};

// Validate that playlist has enough tracks
export const validatePlaylistForGame = (playlist) => {
  const validTracks = playlist.filter(track => track.trackId && track.trackName);
  const invalidTracks = playlist.filter(track => !track.trackId || !track.trackName);
  
  return {
    validTracks,
    invalidTracks,
    hasEnoughTracks: validTracks.length >= 4, // Minimum 4 tracks for a game
    validationPassed: invalidTracks.length === 0
  };
};

// Get users data for playlist generation
export const getUsersForPlaylist = async (roomId, term = 'medium_term') => {
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
    
    // Map term to the correct topTracks field
    const getTopTracksField = (term) => {
      switch (term) {
        case 'short_term':
          return 'topTracks_short';
        case 'medium_term':
          return 'topTracks_medium';
        case 'long_term':
          return 'topTracks_long';
        default:
          return 'topTracks_medium'; // Default fallback
      }
    };
    
    const topTracksField = getTopTracksField(term);
    
    // Filter users that have Spotify data for the specified term
    const validUsers = usersData.filter(user => 
      user.userData && user.userData[topTracksField]?.length > 0
    );
    
    console.log(`Valid users for playlist with ${topTracksField}:`, validUsers);
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
