// Game utility functions for playlist generation and song management

// Generate playlist from players' top tracks
export const generateGamePlaylist = (players, numSongsPerPlayer = 10) => {
  if (!players || players.length === 0) {
    throw new Error('No players available for playlist generation');
  }

  console.log('Generating playlist with:', { players: players.length, numSongsPerPlayer });
  
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
      const topTracks = userData.topTracks_short || [];
      
      if (topTracks.length === 0) {
        console.log(`Player ${player.userId} has no medium tracks, skipping`);
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
        
        // Check if track is already in the generated list
        const isAlreadyAdded = generatedTracks.some(t => t.trackId === track.id);
        
        if (isAlreadyAdded) {
          console.log(`Track "${track.name}" already in playlist, trying next index`);
          currentIndex = currentIndex >= 50 ? 1 : currentIndex + 1;
          attempts++;
          continue;
        }
        
        // Check if this track appears in other players' lists and verify this player has it higher
        let isTopListener = true;
        
        for (const otherPlayer of players) {
          if (otherPlayer.userId === player.userId) continue;
          
          const otherUserData = otherPlayer.userData || otherPlayer;
          const otherTopTracks = otherUserData.topTracks_medium || [];
          
          // Find this track in the other player's list
          const otherTrackIndex = otherTopTracks.findIndex(t => t.id === track.id);
          
          if (otherTrackIndex !== -1) {
            // Track found in other player's list, check positions
            const currentPlayerPosition = arrayIndex + 1; // Convert to 1-based
            const otherPlayerPosition = otherTrackIndex + 1; // Convert to 1-based
            
            if (otherPlayerPosition < currentPlayerPosition) {
              console.log(`Track "${track.name}" found higher in ${otherPlayer.userId}'s list (pos ${otherPlayerPosition} vs ${currentPlayerPosition})`);
              isTopListener = false;
              break;
            }
          }
        }
        
        if (!isTopListener) {
          console.log(`Player ${player.userId} is not the top listener for "${track.name}", trying next index`);
          currentIndex = currentIndex >= 50 ? 1 : currentIndex + 1;
          attempts++;
          continue;
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
          playerName: player.nombre || `Player ${player.userId}`
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
  
  console.log(`\n🎵 Final playlist generated with ${shuffledTracks.length} tracks:`);
  shuffledTracks.forEach((track, index) => {
    console.log(`${index + 1}. "${track.trackName}" by ${track.artistName} (Owner: ${track.playerName})`);
  });
  
  return shuffledTracks;
};

// Validate that playlist has enough tracks (no preview URL requirement for Spotify SDK)
export const validatePlaylistForGame = (playlist) => {
  const validTracks = playlist.filter(track => track.trackId && track.trackName);
  const invalidTracks = playlist.filter(track => !track.trackId || !track.trackName);
  
  return {
    validTracks,
    invalidTracks,
    hasEnoughTracks: validTracks.length >= 3, // Minimum 5 tracks for a game
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
