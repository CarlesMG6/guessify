import { getPlayerName } from '../../lib/gameHelpers';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const EndPhasePlayer = ({room, players, votes }) => {
    const { user } = useAuth();
    const [userVote, setUserVote] = useState(null);
    const [userPosition, setUserPosition] = useState(null);

    useEffect(() => {
        // Find user's vote for current round
        if (Array.isArray(votes) && user?.uid && room.state?.currentRound !== undefined) {
            const currentUserVote = votes.find(
                vote => vote.voterUserId === user.uid && vote.roundNumber === room.state.currentRound
            );
            setUserVote(currentUserVote);
        }

        // Calculate user's position in leaderboard
        if (Array.isArray(players) && players.length > 0 && user?.uid) {
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

                {/* Position Information */}
                {userPosition && (
                    <div className="bg-spotify-gray p-4 rounded-lg">
                        <p className="text-white text-lg">
                            Has quedado en <span className="font-bold text-spotify-green">{getPositionText(userPosition)}</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EndPhasePlayer;
