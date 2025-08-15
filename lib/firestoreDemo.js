// Mock Firestore functions for demo purposes
let mockDb = {
  usuarios: {},
  salas: {}
};

// Generate UUID for demo
const generateId = () => Math.random().toString(36).substr(2, 8).toUpperCase();

// Mock functions
export const createUser = async (userData) => {
  console.log('Mock: Creating user', userData);
  mockDb.usuarios[userData.id] = {
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  return { id: userData.id };
};

export const getUser = async (userId) => {
  console.log('Mock: Getting user', userId);
  return mockDb.usuarios[userId] || null;
};

export const updateUser = async (userId, updateData) => {
  console.log('Mock: Updating user', userId, updateData);
  if (mockDb.usuarios[userId]) {
    mockDb.usuarios[userId] = {
      ...mockDb.usuarios[userId],
      ...updateData,
      updatedAt: new Date()
    };
  }
};

export const createRoom = async (hostUserId, config) => {
  console.log('Mock: Creating sala', hostUserId, config);
  const salaId = generateId();
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
    players: {},
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  mockDb.salas[salaId] = salaData;
  return salaData;
};

export const getRoom = async (salaId) => {
  console.log('Mock: Getting sala', salaId);
  return mockDb.salas[salaId] || null;
};

export const updateRoom = async (salaId, updateData) => {
  console.log('Mock: Updating sala', salaId, updateData);
  if (mockDb.salas[salaId]) {
    mockDb.salas[salaId] = {
      ...mockDb.salas[salaId],
      ...updateData,
      updatedAt: new Date()
    };
  }
};

export const addPlayerToRoom = async (salaId, userId, playerName) => {
  console.log('Mock: Adding player to sala', salaId, userId, playerName);
  if (mockDb.salas[salaId]) {
    if (!mockDb.salas[salaId].players) {
      mockDb.salas[salaId].players = {};
    }
    mockDb.salas[salaId].players[userId] = {
      userId,
      nombre: playerName,
      score: 0,
      joinedAt: new Date()
    };
  }
  return { userId, nombre: playerName, score: 0 };
};

export const getPlayersInRoom = async (salaId) => {
  console.log('Mock: Getting players in sala', salaId);
  const sala = mockDb.salas[salaId];
  if (!sala || !sala.players) return [];
  
  return Object.values(sala.players);
};

// Mock listeners that just return empty functions
export const subscribeToRoomUpdates = async (salaId, callback) => {
  console.log('Mock: Subscribing to sala updates', salaId);
  // Simulate immediate callback with current data
  const sala = mockDb.salas[salaId];
  if (sala) {
    setTimeout(() => {
      callback({
        exists: () => true,
        id: salaId,
        data: () => sala
      });
    }, 100);
  }
  
  // Return unsubscribe function
  return () => {
    console.log('Mock: Unsubscribing from sala updates');
  };
};

export const subscribeToPlayersUpdates = async (salaId, callback) => {
  console.log('Mock: Subscribing to players updates', salaId);
  // Simulate immediate callback with current data
  const sala = mockDb.salas[salaId];
  if (sala && sala.players) {
    setTimeout(() => {
      const playersArray = Object.values(sala.players).map(player => ({
        id: player.userId,
        data: () => player
      }));
      callback({
        docs: playersArray
      });
    }, 100);
  }
  
  // Return unsubscribe function
  return () => {
    console.log('Mock: Unsubscribing from players updates');
  };
};
