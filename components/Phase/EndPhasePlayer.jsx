import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import QuestionHeader from '../QuestionHeader';

const EndPhasePlayer = ({room, players, votes, onBackToLobby }) => {
    const { user } = useAuth();
    const [userPosition, setUserPosition] = useState(null);
    const [userScore, setUserScore] = useState(0);
    const [mostKnownPlayer, setMostKnownPlayer] = useState(null);
    const [leastKnownPlayer, setLeastKnownPlayer] = useState(null);
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

        // Find player with most points (most known)
        const mostKnown = playersWithSongs.reduce((max, current) => 
            current.totalPoints > max.totalPoints ? current : max
        );
        
        // Find player with least points (least known)
        const leastKnown = playersWithSongs.reduce((min, current) => 
            current.totalPoints < min.totalPoints ? current : min
        );

        // Calculate percentages
        mostKnown.successRate = mostKnown.totalSongs > 0 
            ? Math.round((mostKnown.correctVotes / mostKnown.totalSongs) * 100) 
            : 0;
        
        leastKnown.successRate = leastKnown.totalSongs > 0 
            ? Math.round((leastKnown.correctVotes / leastKnown.totalSongs) * 100) 
            : 0;

        setMostKnownPlayer(mostKnown);
        setLeastKnownPlayer(leastKnown);

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
            <QuestionHeader question={"Resultados de partida"}/>
            
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
                            <div className={`text-7xl ${
                                userPosition <= 3 ? 'filter ' + styles.textShadow : ''
                            }`}>
                                {getMedalEmoji(userPosition)}
                            </div>
                            
                            {/* Position Text */}
                            <div className={`text-3xl font-bold ${
                                userPosition <= 3 ? 'text-white filter ' + styles.textShadow : 'text-white'
                            }`}>
                                {getPositionText(userPosition)}
                            </div>
                            
                            {/* Score */}
                            <div className={`text-4xl font-bold ${
                                userPosition <= 3 ? 'text-white filter ' + styles.textShadow : 'text-white'
                            }`}>
                                {userScore} pts
                            </div>
                        </div>
                    </div>
                )}
                {/* Statistics Section */}
                {(mostKnownPlayer || leastKnownPlayer) && (
                    <div className="w-full space-y-4">
                        {/* Most Known Player */}
                        {mostKnownPlayer && (
                            <div className="bg-spotify-gray p-6 rounded-lg">
                                <h3 className="text-spotify-green text-xl font-bold mb-4 text-center">
                                    A quien conoces más
                                </h3>
                                <div className="flex items-center space-x-4">
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        {mostKnownPlayer.avatar ? (
                                            <img
                                                src={`/img/playerImages/${mostKnownPlayer.avatar}.png`}
                                                alt={mostKnownPlayer.nombre}
                                                className="w-16 h-16 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-white text-2xl font-bold">
                                                {mostKnownPlayer.nombre?.[0]?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Player Info */}
                                    <div className="flex-grow">
                                        <p className="text-white text-lg font-semibold">
                                            {mostKnownPlayer.nombre}
                                        </p>
                                        <div className="text-gray-300 text-sm mt-1 space-y-1">
                                            <p>
                                                🎯 {mostKnownPlayer.successRate}% de acierto 
                                                <span className="text-gray-400"> ({mostKnownPlayer.correctVotes}/{mostKnownPlayer.totalSongs} canciones)</span>
                                            </p>
                                            <p>
                                                ⭐ {mostKnownPlayer.totalPoints} puntos conseguidos
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Least Known Player */}
                        {leastKnownPlayer && mostKnownPlayer?.userId !== leastKnownPlayer?.userId && (
                            <div className="bg-spotify-gray p-6 rounded-lg">
                                <h3 className="text-red-400 text-xl font-bold mb-4 text-center">
                                    A quien conoces menos
                                </h3>
                                <div className="flex items-center space-x-4">
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        {leastKnownPlayer.avatar ? (
                                            <img
                                                src={`/img/playerImages/${leastKnownPlayer.avatar}.png`}
                                                alt={leastKnownPlayer.nombre}
                                                className="w-16 h-16 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-white text-2xl font-bold">
                                                {leastKnownPlayer.nombre?.[0]?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Player Info */}
                                    <div className="flex-grow">
                                        <p className="text-white text-lg font-semibold">
                                            {leastKnownPlayer.nombre}
                                        </p>
                                        <div className="text-gray-300 text-sm mt-1 space-y-1">
                                            <p>
                                                🎯 {leastKnownPlayer.successRate}% de acierto 
                                                <span className="text-gray-400"> ({leastKnownPlayer.correctVotes}/{leastKnownPlayer.totalSongs} canciones)</span>
                                            </p>
                                            <p>
                                                ⭐ {leastKnownPlayer.totalPoints} puntos conseguidos
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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
