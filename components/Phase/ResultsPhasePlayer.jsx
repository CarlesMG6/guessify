import { getPlayerName } from '../../lib/gameHelpers';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ResultsPhasePlayer = ({ currentSong, question, room, players, votes }) => {
    const { user } = useAuth();
    const [userVote, setUserVote] = useState(null);
    const [userPosition, setUserPosition] = useState(null);

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
            </div>
        </div>
    );
};

export default ResultsPhasePlayer;
