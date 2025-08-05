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

// Usuarios collection functions
export const createUser = async (userData) => {
  try {
    const db = await getDb();
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const userRef = doc(db, 'usuarios', userData.id);
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
    const db = await getDb();
    const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const userRef = doc(db, 'usuarios', userId);
    
    // Verificar si el documento ya existe
    const docSnap = await getDoc(userRef);
    const exists = docSnap.exists();
    
    const userData = {
      spotifyId: spotifyData.spotifyId,
      nombre: spotifyData.nombre,
      email: spotifyData.email,
      imageUrl: spotifyData.imageUrl,
      topTracks_short: spotifyData.topTracks_short || [],
      topTracks_medium: spotifyData.topTracks_medium || [],
      topTracks_long: spotifyData.topTracks_long || [],
      spotifyTokens: spotifyData.spotifyTokens,
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
    const userRef = doc(db, 'usuarios', userId);
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

export const updateUser = async (userId, updateData) => {
  try {
    const db = await getDb();
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    const userRef = doc(db, 'usuarios', userId);
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Salas collection functions
export const createSala = async (hostUserId, config) => {
  try {
    const { v4: uuidv4 } = await import('uuid');
    const db = await getDb();
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    
    const salaId = uuidv4().slice(0, 8).toUpperCase(); // Generate 8-char room code
    const salaRef = doc(db, 'salas', salaId);
    
    const salaData = {
      id: salaId,
      hostUserId,
      config: {
        numSongs: config.numSongs || 10,
        autoStart: config.autoStart || false,
        delayStartTime: config.delayStartTime || 5,
        timePerRound: config.timePerRound || 10,
        revealSongName: config.revealSongName || false,
        revealArtists: config.revealArtists || false,
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
    
    await setDoc(salaRef, salaData);
    return { id: salaId, ...salaData };
  } catch (error) {
    console.error('Error creating sala:', error);
    throw error;
  }
};

export const getSala = async (salaId) => {
  try {
    const db = await getDb();
    const { doc, getDoc } = await import('firebase/firestore');
    const salaRef = doc(db, 'salas', salaId);
    const salaSnap = await getDoc(salaRef);
    
    if (salaSnap.exists()) {
      return { id: salaSnap.id, ...salaSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting sala:', error);
    throw error;
  }
};

export const updateSala = async (salaId, updateData) => {
  try {
    const db = await getDb();
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    const salaRef = doc(db, 'salas', salaId);
    await updateDoc(salaRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating sala:', error);
    throw error;
  }
};

// Players subcollection functions
export const addPlayerToSala = async (salaId, userId, playerName) => {
  try {
    const db = await getDb();
    const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
    const playerRef = doc(db, 'salas', salaId, 'players', userId);
    const playerData = {
      userId,
      nombre: playerName,
      score: 0,
      joinedAt: serverTimestamp()
    };
    
    await setDoc(playerRef, playerData);
    return playerData;
  } catch (error) {
    console.error('Error adding player to sala:', error);
    throw error;
  }
};

export const getPlayersInSala = async (salaId) => {
  try {
    const db = await getDb();
    const { collection, getDocs } = await import('firebase/firestore');
    const playersRef = collection(db, 'salas', salaId, 'players');
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
export const addSongToSala = async (salaId, songData) => {
  try {
    const db = await getDb();
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const songsRef = collection(db, 'salas', salaId, 'songs');
    const songRef = await addDoc(songsRef, {
      ...songData,
      addedAt: serverTimestamp()
    });
    
    return songRef;
  } catch (error) {
    console.error('Error adding song to sala:', error);
    throw error;
  }
};

// Votes subcollection functions
export const addVoteToSala = async (salaId, voteData) => {
  try {
    const db = await getDb();
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const votesRef = collection(db, 'salas', salaId, 'votes');
    const voteRef = await addDoc(votesRef, {
      ...voteData,
      timestamp: serverTimestamp()
    });
    
    return voteRef;
  } catch (error) {
    console.error('Error adding vote to sala:', error);
    throw error;
  }
};

// Game management functions
export const startGame = async (salaId, playlistData) => {
  try {
    const db = await getDb();
    const { doc, updateDoc, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    
    // Update sala state
    const salaRef = doc(db, 'salas', salaId);
    await updateDoc(salaRef, {
      'state.started': true,
      'state.currentRound': 1,
      'state.currentSong': 0,
      'state.roundStartTime': serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Add songs to sala
    const songsRef = collection(db, 'salas', salaId, 'songs');
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

export const updateGameState = async (salaId, stateUpdate) => {
  try {
    const db = await getDb();
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    const salaRef = doc(db, 'salas', salaId);
    
    const updateData = {};
    Object.keys(stateUpdate).forEach(key => {
      updateData[`state.${key}`] = stateUpdate[key];
    });
    updateData.updatedAt = serverTimestamp();
    
    await updateDoc(salaRef, updateData);
  } catch (error) {
    console.error('Error updating game state:', error);
    throw error;
  }
};

export const getSongsInSala = async (salaId) => {
  try {
    const db = await getDb();
    const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
    const songsRef = collection(db, 'salas', salaId, 'songs');
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

export const addVote = async (salaId, voterUserId, votedForUserId, trackId, roundNumber) => {
  try {
    const db = await getDb();
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const votesRef = collection(db, 'salas', salaId, 'votes');
    
    // Get the song to check if vote is correct
    const songs = await getSongsInSala(salaId);
    const currentSong = songs.find(song => song.trackId === trackId);
    const isCorrect = currentSong ? currentSong.ownerUserId === votedForUserId : false;
    
    const voteData = {
      voterUserId,
      votedForUserId,
      trackId,
      roundNumber,
      isCorrect,
      timestamp: serverTimestamp()
    };
    
    const voteRef = await addDoc(votesRef, voteData);
    return { id: voteRef.id, ...voteData };
  } catch (error) {
    console.error('Error adding vote:', error);
    throw error;
  }
};

export const getVotesForRound = async (salaId, roundNumber) => {
  try {
    const db = await getDb();
    const { collection, getDocs, where, query } = await import('firebase/firestore');
    const votesRef = collection(db, 'salas', salaId, 'votes');
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

export const updatePlayerScore = async (salaId, userId, newScore) => {
  try {
    const db = await getDb();
    const { doc, updateDoc } = await import('firebase/firestore');
    const playerRef = doc(db, 'salas', salaId, 'players', userId);
    await updateDoc(playerRef, {
      score: newScore
    });
  } catch (error) {
    console.error('Error updating player score:', error);
    throw error;
  }
};

export const calculateScores = async (salaId, roundNumber) => {
  try {
    const votes = await getVotesForRound(salaId, roundNumber);
    const players = await getPlayersInSala(salaId);
    
    // Calculate points for each player
    const scoreUpdates = {};
    
    votes.forEach(vote => {
      if (vote.isCorrect) {
        // Voter gets points for correct guess
        scoreUpdates[vote.voterUserId] = (scoreUpdates[vote.voterUserId] || 0) + 100;
        
        // Song owner gets points for being guessed
        scoreUpdates[vote.votedForUserId] = (scoreUpdates[vote.votedForUserId] || 0) + 50;
      }
    });
    
    // Update player scores
    const updatePromises = Object.keys(scoreUpdates).map(async (userId) => {
      const player = players.find(p => p.userId === userId);
      if (player) {
        const newScore = player.score + scoreUpdates[userId];
        await updatePlayerScore(salaId, userId, newScore);
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
export const subscribeToSalaUpdates = async (salaId, callback) => {
  const db = await getDb();
  const { doc, onSnapshot } = await import('firebase/firestore');
  const salaRef = doc(db, 'salas', salaId);
  return onSnapshot(salaRef, callback);
};

export const subscribeToPlayersUpdates = async (salaId, callback) => {
  const db = await getDb();
  const { collection, onSnapshot } = await import('firebase/firestore');
  const playersRef = collection(db, 'salas', salaId, 'players');
  return onSnapshot(playersRef, callback);
};

export const subscribeToVotesUpdates = async (salaId, callback) => {
  const db = await getDb();
  const { collection, onSnapshot } = await import('firebase/firestore');
  const votesRef = collection(db, 'salas', salaId, 'votes');
  return onSnapshot(votesRef, callback);
};
