import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import QuestionHeader from '../QuestionHeader';

const EndPhasePlayer = ({room, players, votes, onBackToLobby }) => {
    const { user } = useAuth();
    const [userPosition, setUserPosition] = useState(null);
    const [userScore, setUserScore] = useState(0);
    const [rankedPlayers, setRankedPlayers] = useState([]);
    const [songs, setSongs] = useState([]);

    // Load songs from room
    useEffect(() => {
        const loadSongs = async () => {
            if (room?.id) {
                try {
                    const { getSongsInRoom } = await import('../../lib/firestore');
                    const songsData = await getSongsInRoom(room.id);
                    setSongs(songsData);
                } catch (error) {
                    console.error('Error loading songs:', error);
                }
            }
        };
        loadSongs();
    }, [room?.id]);

    useEffect(() => {
        // Calculate user's position in leaderboard
        if (Array.isArray(players) && players.length > 0 && user?.uid) {
            const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
            const position = sortedPlayers.findIndex(player => player.userId === user.uid) + 1;
            setUserPosition(position);
            
            // Get user's score
            const currentPlayer = players.find(p => p.userId === user.uid);
            setUserScore(currentPlayer?.score || 0);
        }
    }, [players, user?.uid]);

    // Calculate statistics about which player the user knows most/least
    useEffect(() => {
        if (!Array.isArray(votes) || !Array.isArray(songs) || !Array.isArray(players) || !user?.uid || songs.length === 0) {
            return;
        }

        // Filter votes made by current user
        const userVotes = votes.filter(vote => vote.voterUserId === user.uid);
        
        if (userVotes.length === 0) {
            return;
        }

        // Create a map of stats per player (excluding self)
        const playerStats = {};
        
        // Initialize stats for all other players
        players.forEach(player => {
            if (player.userId !== user.uid) {
                playerStats[player.userId] = {
                    userId: player.userId,
                    nombre: player.nombre,
                    avatar: player.avatar,
                    totalPoints: 0,
                    correctVotes: 0,
                    totalSongs: 0
                };
            }
        });

        // Process each user vote
        userVotes.forEach(vote => {
            // Find the song for this vote
            const song = songs.find(s => s.trackId === vote.trackId);
            
            if (song && song.ownerUserId && song.ownerUserId !== user.uid) {
                const ownerId = song.ownerUserId;
                
                // Initialize if not exists
                if (!playerStats[ownerId]) {
                    const ownerPlayer = players.find(p => p.userId === ownerId);
                    playerStats[ownerId] = {
                        userId: ownerId,
                        nombre: ownerPlayer?.nombre || 'Desconocido',
                        avatar: ownerPlayer?.avatar,
                        totalPoints: 0,
                        correctVotes: 0,
                        totalSongs: 0
                    };
                }
                
                // Add stats
                playerStats[ownerId].totalSongs += 1;
                playerStats[ownerId].totalPoints += vote.points || 0;
                if (vote.isCorrect) {
                    playerStats[ownerId].correctVotes += 1;
                }
            }
        });

        // Filter players who have at least one song
        const playersWithSongs = Object.values(playerStats).filter(stat => stat.totalSongs > 0);

        if (playersWithSongs.length === 0) {
            return;
        }

        // Sort players by total points (descending)
        const sortedPlayers = playersWithSongs.sort((a, b) => b.totalPoints - a.totalPoints);

        // Calculate success rate for each player
        sortedPlayers.forEach(player => {
            player.successRate = player.totalSongs > 0 
                ? Math.round((player.correctVotes / player.totalSongs) * 100) 
                : 0;
        });

        setRankedPlayers(sortedPlayers);

    }, [votes, songs, players, user?.uid]);

    const getPositionText = (position) => {
        if (position === 1) return '1ª posición';
        if (position === 2) return '2ª posición';
        if (position === 3) return '3ª posición';
        return `${position}ª posición`;
    };

    const getMedalEmoji = (position) => {
        if (position === 1) return '🥇';
        if (position === 2) return '🥈';
        if (position === 3) return '🥉';
        return `${position}º`;
    };

    const getMedalStyles = (position) => {
        if (position === 1) {
            // Gold - Gradient with warm gold tones and shimmer effect
            return {
                bgClasses: 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/50',
                textShadow: 'drop-shadow-lg'
            };
        } else if (position === 2) {
            // Silver - Cool metallic silver with shine
            return {
                bgClasses: 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 shadow-lg shadow-gray-400/50',
                textShadow: 'drop-shadow-lg'
            };
        } else if (position === 3) {
            // Bronze - Warm bronze tones with copper highlights
            return {
                bgClasses: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 shadow-lg shadow-amber-600/50',
                textShadow: 'drop-shadow-lg'
            };
        }
        // Regular positions
        return {
            bgClasses: 'bg-gradient-to-r from-gray-600 to-gray-700',
            textShadow: ''
        };
    };

    const styles = userPosition ? getMedalStyles(userPosition) : { bgClasses: 'bg-spotify-gray', textShadow: '' };

    return (
        <div className="h-full w-full flex items-center flex-col justify-center">
            
            <div className="flex flex-col items-center justify-center h-full mx-auto w-full max-w-2xl space-y-6">
                {/* Position Card */}
                {userPosition && (
                    <div className={`w-full p-8 rounded-lg border transition-all duration-300 ${
                        styles.bgClasses
                    } ${
                        userPosition <= 3 ? 'border-white border-opacity-30' : 'border-gray-500'
                    }`}>
                        <div className="flex flex-col items-center space-y-4">
                            {/* Medal/Position */}
                            <div className={`text-3xl ${
                                userPosition <= 3 ? 'filter ' + styles.textShadow : ''
                            }`}>
                                {getMedalEmoji(userPosition)}
                            </div>
                            
                            {/* Position Text */}
                            <div className={`text-xl font-bold ${
                                userPosition <= 3 ? 'text-white filter ' + styles.textShadow : 'text-white'
                            }`}>
                                {getPositionText(userPosition)}
                            </div>
                            
                            {/* Score */}
                            <div className={`text-2xl font-bold ${
                                userPosition <= 3 ? 'text-white filter ' + styles.textShadow : 'text-white'
                            }`}>
                                {userScore} pts
                            </div>
                        </div>
                    </div>
                )}
                {/* Statistics Section */}
                {rankedPlayers.length > 0 && (
                    <div className="w-full space-y-3">
                        <h3 className="text-spotify-green text-xl font-bold mb-4 text-center mt-6">
                            ¿A quién conoces mejor?
                        </h3>
                        {rankedPlayers.map((player, index) => (
                            <div key={player.userId} className="bg-spotify-gray p-4 rounded-lg">
                                <div className="flex items-center space-x-4">
                                    {/* Rank Number */}
                                    <div className="flex-shrink-0 w-8 text-center">
                                        <span className="text-white text-lg font-bold">
                                            {index + 1}
                                        </span>
                                    </div>
                                    
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        {player.avatar ? (
                                            <img
                                                src={`/img/playerImages/${player.avatar}.png`}
                                                alt={player.nombre}
                                                className="w-12 h-12 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white text-xl font-bold">
                                                {player.nombre?.[0]?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Player Info */}
                                    <div className="flex-grow">
                                        <p className="text-white text-base font-semibold">
                                            {player.nombre}
                                        </p>
                                        <div className="text-gray-300 text-sm mt-1">
                                            <span className="mr-3">
                                                🎯 {player.correctVotes}/{player.totalSongs}
                                            </span>
                                            <span>
                                                ⭐ {player.totalPoints} pts
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {/* Exit Button */}
                {onBackToLobby && (
                    <button
                        onClick={onBackToLobby}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 w-full max-w-xs"
                    >
                        Salir
                    </button>
                )}
            </div>
        </div>
    );
};

export default EndPhasePlayer;
