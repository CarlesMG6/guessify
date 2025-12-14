import { getPlayerName } from '../../lib/gameHelpers';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ResultsPhasePlayer = ({ currentSong, question, room, players, votes, onLikeTrack }) => {
    const { user } = useAuth();
    const [userVote, setUserVote] = useState(null);
    const [userPosition, setUserPosition] = useState(null);
    const [isLiked, setIsLiked] = useState(false);
    const [isLiking, setIsLiking] = useState(false);

    const funnyPhrases = [
        "No por mucho madrugar amanece más temprano",
        "Quien mucho corre, pronto para",
        "A mal tiempo, buena cara",
        "El que ríe último, ríe mejor",
        "Quien no arriesga, no gana"
    ];

    const slowPhrases = [
        "Más vale tarde que nunca",
        "Vísteme despacio que tengo prisa",
        "Despacito y buena letra"
    ];

    useEffect(() => {
        // Find user's vote for current round
        if (votes && user?.uid && room.state?.currentRound !== undefined) {
            const currentUserVote = votes.find(
                vote => vote.voterUserId === user.uid && vote.roundNumber === room.state.currentRound
            );
            setUserVote(currentUserVote);
        }

        // Calculate user's position in leaderboard
        if (players && players.length > 0 && user?.uid) {
            const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
            const position = sortedPlayers.findIndex(player => player.userId === user.uid) + 1;
            setUserPosition(position);
        }
    }, [votes, user?.uid, room.state?.currentRound, players]);

    const handleLikeClick = async () => {
        if (isLiking || !currentSong?.trackId) return;
        
        setIsLiking(true);
        const success = await onLikeTrack(currentSong.trackId);
        
        if (success) {
            setIsLiked(true);
            setTimeout(() => setIsLiking(false), 600);
        } else {
            setIsLiking(false);
        }
    };

    const getPositionText = (position) => {
        if (position === 1) return '1ª posición';
        if (position === 2) return '2ª posición';
        if (position === 3) return '3ª posición';
        return `${position}ª posición`;
    };

    return (
        <div className="mb-6 relative flex justify-center items-center flex-col">
            <div className="w-full max-w-md text-center">

                {/* Result Status */}
                {userVote ? (
                    <div className={`p-6 rounded-lg mb-6 ${userVote.isCorrect ? 'bg-green-600' : 'bg-red-600'}`}>
                        <div className="text-6xl mb-4">
                            {userVote.isCorrect ? '✅' : '❌'}
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {userVote.isCorrect ? 'Correcto' : 'Incorrecto'}
                        </h2>

                        {userVote.isCorrect && userVote.points > 0 && (
                            <div className="text-white text-xl font-semibold">
                                +{userVote.points} puntos
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-gray-600 p-6 rounded-lg mb-6">
                        <div className="text-6xl mb-4">
                            ❌
                        </div>
                        <h2 className="text-xl text-white">
                            No votaste en esta ronda
                        </h2>
                    </div>
                )}

                {/* Position Information */}
                {userPosition && (
                    <div className=" p-4 rounded-lg">
                        {userVote?.isCorrect && userVote.points < 200 && (
                            <span className="italic text-lg text-gray-300 mb-4">
                                {slowPhrases[Math.floor(Math.random() * slowPhrases.length)]}
                            </span>
                        )}
                        {!userVote?.isCorrect && (
                            <span className="italic text-lg text-gray-300 mb-4">
                                {funnyPhrases[Math.floor(Math.random() * funnyPhrases.length)]}
                            </span>
                        )}
                        <p className="text-white text-lg">
                            Estás en <span className="font-bold text-spotify-green">{getPositionText(userPosition)}</span>
                        </p>
                    </div>
                )}

                {/* Like Button */}
                <button
                    onClick={handleLikeClick}
                    disabled={isLiking || isLiked}
                    className={`mt-6 p-4 rounded-full transition-all duration-300 ${
                        isLiked 
                            ? 'bg-spotify-green scale-110' 
                            : 'bg-gray-700 hover:bg-gray-600 hover:scale-105'
                    } ${isLiking ? 'animate-pulse' : ''}`}
                    aria-label="Me gusta esta canción"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className={`w-8 h-8 transition-all duration-300 ${
                            isLiked ? 'fill-black scale-125' : 'fill-white'
                        } ${isLiking ? 'animate-bounce' : ''}`}
                    >
                        {isLiked ? (
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        ) : (
                            <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/>
                        )}
                    </svg>
                </button>
                
                {isLiked && (
                    <p className="mt-2 text-sm text-spotify-green font-semibold animate-fade-in">
                        ¡Añadida a tus Me gusta!
                    </p>
                )}
            </div>
        </div>
    );
};

export default ResultsPhasePlayer;
