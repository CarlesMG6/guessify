// Game helper functions for player and vote management

/**
 * Filters votes for a specific round
 * @param {Array} votes - Array of all votes
 * @param {number} currentRound - The current round number
 * @returns {Array} Votes for the current round
 */
export const getVotesForCurrentRound = (votes, currentRound) => {
  return votes.filter(vote => vote.roundNumber === currentRound);
};

/**
 * Gets the display name for a player by their userId
 * @param {Array} players - Array of players
 * @param {string} userId - The user ID to look up
 * @returns {string} Player name or 'Desconocido' if not found
 */
export const getPlayerName = (players, userId) => {
  console.log("PLAYERS_",players)
  if (!players || !Array.isArray(players)) {
    console.warn('Invalid players array:', players);
    return 'Desconocido';
  }
  const player = players.find(p => p.userId === userId);
  return player?.nombre || 'Desconocido';
};

/**
 * Gets the current score for a player
 * @param {Array} players - Array of players
 * @param {Object} scores - Scores object with userId as keys
 * @param {string} userId - The user ID to look up
 * @returns {number} Player's current score
 */
export const getPlayerScore = (players, userId) => {
  console.log("PLAYERS_", players);
  const player = players.find(p => p.userId === userId);
  return player?.score || 0;
};
