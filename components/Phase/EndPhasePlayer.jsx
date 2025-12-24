import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import QuestionHeader from '../QuestionHeader';

const EndPhasePlayer = ({room, players, votes, onBackToLobby }) => {
    const { user } = useAuth();
    const [userPosition, setUserPosition] = useState(null);
    const [userScore, setUserScore] = useState(0);

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
