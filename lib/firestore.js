// Simplified Firestore functions that work without SSR issues

// Helper to get Firestore instance
const getDb = async () => {
  const { initializeApp } = await import('firebase/app');
  const { getFirestore } = await import('firebase/firestore');
  
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  };

  const app = initializeApp(firebaseConfig);
  return getFirestore(app);
};

// users collection functions
export const createUser = async (userData) => {
  try {
    const db = await getDb();
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userData.id);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true }); // Use merge to avoid overwriting existing data
    return userRef;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUserSpotifyData = async (userId, spotifyData) => {
  try {
    console.log('Updating user Spotify data for userId:', userId);
    console.log('New Spotify data:', spotifyData);
    const db = await getDb();
    const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);
    
    // Verificar si el documento ya existe y obtener los datos actuales
    const docSnap = await getDoc(userRef);
    const exists = docSnap.exists();
    const existingData = exists ? docSnap.data() : {};
    
    const userData = {
      spotifyId: spotifyData.spotifyId,
      nombre: spotifyData.nombre,
      email: spotifyData.email,
      topTracks_short: spotifyData.topTracks_short || [],
      topTracks_medium: spotifyData.topTracks_medium || [],
      topTracks_long: spotifyData.topTracks_long || [],
      spotifyTokens: spotifyData.spotifyTokens,
      // Mantener el googleId si ya existe
      googleId: existingData.googleId || null,
      // Mantener isAnonymous si ya existe
      isAnonymous: existingData.isAnonymous || false,
      updatedAt: serverTimestamp()
    };
    
    // Solo agregar createdAt si es un documento nuevo
    if (!exists) {
      userData.createdAt = serverTimestamp();
    }
    
    await setDoc(userRef, userData, { merge: true });
  } catch (error) {
    console.error('Error updating user Spotify data:', error);
    throw error;
  }
};

export const getUser = async (userId) => {
  try {
    const db = await getDb();
    const { doc, getDoc } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

export const getUserByGoogleId = async (googleId) => {
  try {
    const db = await getDb();
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("googleId", "==", googleId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Return the first matching user
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error('Error getting user by Google ID:', error);
    throw error;
  }
};

export const updateUser = async (userId, updateData) => {
  try {
    const db = await getDb();
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Rooms collection functions
export const createRoom = async (hostUserId, config) => {
  try {
    const db = await getDb();
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const roomId = Math.floor(100000 + Math.random() * 900000).toString(); // Generate 6-digit numeric room code
    const roomRef = doc(db, 'rooms', roomId);

    const roomData = {
      id: roomId,
      hostUserId,
      config: {
        numSongsPerUser: config.numSongs || 10,
        autoStart: config.autoStart || false,
        delayStartTime: config.delayStartTime || 5,
        timePerRound: config.timePerRound || 10,
        revealSongName: config.revealSongName || true,
        revealArtists: config.revealArtists || true,
        revealCover: config.revealCover || true,
        ...config
      },
      state: {
        started: false,
        currentRound: 0,
        finished: false
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(roomRef, roomData);
    return { id: roomId, ...roomData };
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

export const getRoom = async (roomId) => {
  try {
    const db = await getDb();
    const { doc, getDoc } = await import('firebase/firestore');
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await getDoc(roomRef);

    if (roomSnap.exists()) {
      return { id: roomSnap.id, ...roomSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting room:', error);
    throw error;
  }
};

export const updateRoom = async (roomId, updateData) => {
  try {
    const db = await getDb();
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating room:', error);
    throw error;
  }
};

// Players subcollection functions
export const addPlayerToRoom = async (roomId, userId, playerName) => {
  try {
    const db = await getDb();
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const playerRef = doc(db, 'rooms', roomId, 'players', userId);
    
    // Lista de avatares disponibles
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
    const playerData = {
      userId,
      nombre: playerName,
      score: 0,
      joinedAt: serverTimestamp(),
      complete: false,
      avatar: availableAvatars[randomIndex]
    };
    
    await setDoc(playerRef, playerData);
    return playerData;
  } catch (error) {
    console.error('Error adding player to room:', error);
    throw error;
  }
};

export const updatePlayerProfile = async (roomId, userId, playerName, avatar) => {
  try {
    const db = await getDb();
    const { doc, updateDoc } = await import('firebase/firestore');
    const playerRef = doc(db, 'rooms', roomId, 'players', userId);
    
    const updateData = {
      nombre: playerName,
      avatar: avatar,
      complete: true
    };
    
    await updateDoc(playerRef, updateData);
    return updateData;
  } catch (error) {
    console.error('Error updating player profile:', error);
    throw error;
  }
};

export const removePlayerFromRoom = async (roomId, userId) => {
  try {
    const db = await getDb();
    const { doc, deleteDoc } = await import('firebase/firestore');
    const playerRef = doc(db, 'rooms', roomId, 'players', userId);
    await deleteDoc(playerRef);
  } catch (error) {
    console.error('Error removing player from room:', error);
    throw error;
  }
};

export const getPlayersInRoom = async (roomId) => {
  try {
    const db = await getDb();
    const { collection, getDocs } = await import('firebase/firestore');
    const playersRef = collection(db, 'rooms', roomId, 'players');
    const playersSnapshot = await getDocs(playersRef);
    
    return playersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting players:', error);
    throw error;
  }
};

// Songs subcollection functions
export const addSongToRoom = async (roomId, songData) => {
  try {
    const db = await getDb();
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const songsRef = collection(db, 'rooms', roomId, 'songs');
    const songRef = await addDoc(songsRef, {
      ...songData,
      addedAt: serverTimestamp()
    });
    
    return songRef;
  } catch (error) {
    console.error('Error adding song to room:', error);
    throw error;
  }
};

// Votes subcollection functions
// Note: Use addVote() for game voting which prevents duplicates
// This function is for general vote addition without duplicate prevention
export const addVoteToRoom = async (roomId, voteData) => {
  try {
    const db = await getDb();
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const votesRef = collection(db, 'rooms', roomId, 'votes');
    const voteRef = await addDoc(votesRef, {
      ...voteData,
      timestamp: serverTimestamp()
    });
    
    return voteRef;
  } catch (error) {
    console.error('Error adding vote to room:', error);
    throw error;
  }
};

// Game management functions
export const startGame = async (roomId, playlistData) => {
  try {
    const db = await getDb();
    const { doc, updateDoc, collection, addDoc, serverTimestamp } = await import('firebase/firestore');

    // Update room state
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
      'state.started': true,
      'state.starting': false,
      'state.currentRound': 1,
      'state.currentSong': 0,
      'state.roundStartTime': serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Add songs to room
    const songsRef = collection(db, 'rooms', roomId, 'songs');
    const songPromises = playlistData.map((song, index) => 
      addDoc(songsRef, {
        ...song,
        order: index,
        addedAt: serverTimestamp()
      })
    );
    
    await Promise.all(songPromises);
    
    return true;
  } catch (error) {
    console.error('Error starting game:', error);
    throw error;
  }
};

export const updateGameState = async (roomId, stateUpdate) => {
  try {
    const db = await getDb();
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    const roomRef = doc(db, 'rooms', roomId);

    const updateData = {};
    Object.keys(stateUpdate).forEach(key => {
      updateData[`state.${key}`] = stateUpdate[key];
    });
    updateData.updatedAt = serverTimestamp();

    await updateDoc(roomRef, updateData);
  } catch (error) {
    console.error('Error updating game state:', error);
    throw error;
  }
};

export const getSongsInRoom = async (roomId) => {
  try {
    const db = await getDb();
    const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
    const songsRef = collection(db, 'rooms', roomId, 'songs');
    const q = query(songsRef, orderBy('order'));
    const songsSnapshot = await getDocs(q);
    
    return songsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting songs:', error);
    throw error;
  }
};

// Helper function to calculate current streak for a player
const calculateStreak = async (roomId, voterUserId, currentRoundNumber) => {
  try {
    if (currentRoundNumber === 0) return 0;
    
    const db = await getDb();
    const { doc, getDoc } = await import('firebase/firestore');
    
    // Get the vote from the immediately previous round
    const previousRoundNumber = currentRoundNumber - 1;
    const previousVoteId = `${voterUserId}_${previousRoundNumber}`;
    const previousVoteRef = doc(db, 'rooms', roomId, 'votes', previousVoteId);
    const previousVoteSnap = await getDoc(previousVoteRef);
    
    if (!previousVoteSnap.exists()) {
      // No vote in previous round, streak starts at 0
      return 0;
    }
    
    const previousVote = previousVoteSnap.data();
    
    if (!previousVote.isCorrect) {
      // Previous vote was incorrect, streak is broken
      return 0;
    }
    
    // Previous vote was correct, continue the streak
    return previousVote.streakCount || 1; // Use stored streakCount or default to 1
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
};

export const addVote = async (roomId, voterUserId, votedForUserId, trackId, roundNumber, phaseStartTime, phaseEndTime) => {
  try {
    const db = await getDb();
    const { doc, setDoc, serverTimestamp, Timestamp } = await import('firebase/firestore');
    
    // Create a unique vote ID using voterUserId and roundNumber to prevent duplicates
    const voteId = `${voterUserId}_${roundNumber}`;
    const voteRef = doc(db, 'rooms', roomId, 'votes', voteId);

    // Get the song to check if vote is correct
    const songs = await getSongsInRoom(roomId);
    const currentSong = songs.find(song => song.trackId === trackId);
    const isCorrect = currentSong ? currentSong.ownerUserId === votedForUserId : false;
    
    // Calculate points based on voting time
    const voteTime = Date.now();
    const phaseStartMs = phaseStartTime?.seconds ? phaseStartTime.seconds * 1000 : Date.now();
    const phaseEndMs = phaseEndTime?.seconds ? phaseEndTime.seconds * 1000 : Date.now() + 30000;
    
    const totalPhaseTime = phaseEndMs - phaseStartMs; // Total time available for voting
    const timeSpent = voteTime - phaseStartMs; // Time spent before voting
    const timeRemaining = Math.max(0, totalPhaseTime - timeSpent); // Time remaining when voted
    
    // Points formula: 1000 * (tiempo_restante / tiempo_total)
    let points = 0;
    if (isCorrect && totalPhaseTime > 0) {
      points = Math.round(1000 * (timeRemaining / totalPhaseTime));
      points = Math.max(0, points); // Ensure points are not negative
    }
    
    // Calculate streak bonus if correct answer
    let currentStreak = 0;
    let streakBonus = 0;
    if (isCorrect) {
      currentStreak = await calculateStreak(roomId, voterUserId, roundNumber);
      const totalStreak = currentStreak + 1; // Include current correct answer
      // Bonus starts at streak of 4 (100 pts), 5 (200 pts), etc.
      if (totalStreak >= 4) {
        streakBonus = (totalStreak - 3) * 100; // 4th = 100, 5th = 200, etc.
      }
      // Add streak bonus to total points
      points += streakBonus;
    }
    
    const voteData = {
      voterUserId,
      votedForUserId,
      trackId,
      roundNumber,
      isCorrect,
      points,
      basePoints: isCorrect ? Math.round(1000 * (timeRemaining / totalPhaseTime)) : 0,
      streakCount: isCorrect ? currentStreak + 1 : 0, // Include current correct answer
      streakBonus: streakBonus,
      voteTime: serverTimestamp(),
      phaseStartTime,
      phaseEndTime,
      timeSpentMs: timeSpent,
      totalPhaseTimeMs: totalPhaseTime
    };
    
    // Use setDoc instead of addDoc to set a specific document ID
    await setDoc(voteRef, voteData);
    return { id: voteId, ...voteData };
  } catch (error) {
    console.error('Error adding vote:', error);
    throw error;
  }
};

export const getVotesForRound = async (roomId, roundNumber) => {
  try {
    const db = await getDb();
    const { collection, getDocs, where, query } = await import('firebase/firestore');
    const votesRef = collection(db, 'rooms', roomId, 'votes');
    const q = query(votesRef, where('roundNumber', '==', roundNumber));
    const votesSnapshot = await getDocs(q);
    
    return votesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting votes for round:', error);
    throw error;
  }
};

export const hasUserVotedInRound = async (roomId, voterUserId, roundNumber) => {
  try {
    const db = await getDb();
    const { doc, getDoc } = await import('firebase/firestore');
    
    // Check if vote document exists with the specific ID pattern
    const voteId = `${voterUserId}_${roundNumber}`;
    const voteRef = doc(db, 'rooms', roomId, 'votes', voteId);
    const voteSnap = await getDoc(voteRef);
    
    return voteSnap.exists();
  } catch (error) {
    console.error('Error checking if user has voted:', error);
    throw error;
  }
};

export const updatePlayerScore = async (roomId, userId, newScore) => {
  try {
    const db = await getDb();
    const { doc, updateDoc } = await import('firebase/firestore');
    const playerRef = doc(db, 'rooms', roomId, 'players', userId);
    await updateDoc(playerRef, {
      score: newScore
    });
  } catch (error) {
    console.error('Error updating player score:', error);
    throw error;
  }
};

export const calculateScores = async (roomId, roundNumber) => {
  try {
    const votes = await getVotesForRound(roomId, roundNumber);
    const players = await getPlayersInRoom(roomId);

    // Calculate points for each player based on their votes
    const scoreUpdates = {};
    
    votes.forEach(vote => {
      if (vote.isCorrect && vote.points > 0) {
        // Voter gets the calculated points for correct guess
        scoreUpdates[vote.voterUserId] = (scoreUpdates[vote.voterUserId] || 0) + vote.points;
      }
    });
    
    // Update player scores
    const updatePromises = Object.keys(scoreUpdates).map(async (userId) => {
      const player = players.find(p => p.userId === userId);
      if (player) {
        const newScore = player.score + scoreUpdates[userId];
        await updatePlayerScore(roomId, userId, newScore);
      }
    });
    
    await Promise.all(updatePromises);
    
    return scoreUpdates;
  } catch (error) {
    console.error('Error calculating scores:', error);
    throw error;
  }
};

// Real-time listeners
export const subscribeToRoomUpdates = async (roomId, callback) => {
  const db = await getDb();
  const { doc, onSnapshot } = await import('firebase/firestore');
  const roomRef = doc(db, 'rooms', roomId);
  return onSnapshot(roomRef, callback);
};

export const subscribeToPlayersUpdates = async (roomId, callback) => {
  const db = await getDb();
  const { collection, onSnapshot } = await import('firebase/firestore');
  const playersRef = collection(db, 'rooms', roomId, 'players');
  return onSnapshot(playersRef, callback);
};

export const subscribeToVotesUpdates = async (roomId, callback) => {
  const db = await getDb();
  const { collection, onSnapshot } = await import('firebase/firestore');
  const votesRef = collection(db, 'rooms', roomId, 'votes');
  return onSnapshot(votesRef, callback);
};

// Reset room functions
export const deleteAllVotes = async (roomId) => {
  try {
    const db = await getDb();
    const { collection, getDocs, deleteDoc } = await import('firebase/firestore');
    const votesRef = collection(db, 'rooms', roomId, 'votes');
    const votesSnapshot = await getDocs(votesRef);
    
    const deletePromises = votesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`Deleted ${deletePromises.length} votes from room ${roomId}`);
  } catch (error) {
    console.error('Error deleting votes:', error);
    throw error;
  }
};

export const deleteAllSongs = async (roomId) => {
  try {
    const db = await getDb();
    const { collection, getDocs, deleteDoc } = await import('firebase/firestore');
    const songsRef = collection(db, 'rooms', roomId, 'songs');
    const songsSnapshot = await getDocs(songsRef);
    
    const deletePromises = songsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`Deleted ${deletePromises.length} songs from room ${roomId}`);
  } catch (error) {
    console.error('Error deleting songs:', error);
    throw error;
  }
};

export const resetPlayerScores = async (roomId) => {
  try {
    const db = await getDb();
    const { collection, getDocs, updateDoc } = await import('firebase/firestore');
    const playersRef = collection(db, 'rooms', roomId, 'players');
    const playersSnapshot = await getDocs(playersRef);
    
    const updatePromises = playersSnapshot.docs.map(doc => 
      updateDoc(doc.ref, { score: 0 })
    );
    await Promise.all(updatePromises);
    
    console.log(`Reset scores for ${updatePromises.length} players in room ${roomId}`);
  } catch (error) {
    console.error('Error resetting player scores:', error);
    throw error;
  }
};

export const resetRoomForNewGame = async (roomId, newConfig = null) => {
  try {
    const db = await getDb();
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    const roomRef = doc(db, 'rooms', roomId);
    
    // Delete all votes and songs
    await deleteAllVotes(roomId);
    await deleteAllSongs(roomId);
    
    // Reset player scores
    await resetPlayerScores(roomId);
    
    // Prepare the update data
    const updateData = {
      state: {
        started: false,
        starting: false,
        currentRound: 0,
        finished: false,
        currentPhase: 'preparing'
      },
      updatedAt: serverTimestamp()
    };
    
    // If new config is provided, update it
    if (newConfig) {
      updateData.config = newConfig;
    }
    
    // Update the room
    await updateDoc(roomRef, updateData);
    
    console.log(`Room ${roomId} has been reset for a new game`);
    return true;
  } catch (error) {
    console.error('Error resetting room:', error);
    throw error;
  }
};
