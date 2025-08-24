import { useState, useEffect } from 'react';

const VotesBarChart = ({ room, players, currentSong, useMockData = false }) => {
    const [votes, setVotes] = useState([]);
    const [votingData, setVotingData] = useState([]);

    // Mock data for testing styles
    const mockVotingData = [
        {
            playerId: 'player1',
            playerName: 'Ana García',
            avatar: 'gato',
            voteCount: 5,
            isCorrect: true
        },
        {
            playerId: 'player2',
            playerName: 'Carlos Mendez',
            avatar: 'perro',
            voteCount: 3,
            isCorrect: false
        },
        {
            playerId: 'player3',
            playerName: 'María López',
            avatar: 'aventura',
            voteCount: 1,
            isCorrect: false
        },
        {
            playerId: 'player4',
            playerName: 'Pedro Martín',
            avatar: 'presidente',
            voteCount: 0,
            isCorrect: false
        },
        {
            playerId: 'player5',
            playerName: 'Laura Jiménez',
            avatar: 'lectura',
            voteCount: 2,
            isCorrect: false
        }
    ];

    const mockVotes = [
        { id: '1', voterUserId: 'voter1', votedForUserId: 'player1' },
        { id: '2', voterUserId: 'voter2', votedForUserId: 'player1' },
        { id: '3', voterUserId: 'voter3', votedForUserId: 'player1' },
        { id: '4', voterUserId: 'voter4', votedForUserId: 'player1' },
        { id: '5', voterUserId: 'voter5', votedForUserId: 'player1' },
        { id: '6', voterUserId: 'voter6', votedForUserId: 'player2' },
        { id: '7', voterUserId: 'voter7', votedForUserId: 'player2' },
        { id: '8', voterUserId: 'voter8', votedForUserId: 'player2' },
        { id: '9', voterUserId: 'voter9', votedForUserId: 'player3' },
        { id: '10', voterUserId: 'voter10', votedForUserId: 'player5' },
        { id: '11', voterUserId: 'voter11', votedForUserId: 'player5' }
    ];

    useEffect(() => {
        // Use mock data if enabled
        if (useMockData) {
            setVotingData(mockVotingData);
            setVotes(mockVotes);
            return;
        }

        const getVotesForCurrentRound = async () => {
            if (!room?.id || !room.state?.currentRound) return;

            try {
                const { getVotesForRound } = await import('../lib/firestore');
                const roundVotes = await getVotesForRound(room.id, room.state.currentRound);
                setVotes(roundVotes);
            } catch (error) {
                console.error('Error getting votes:', error);
            }
        };

        getVotesForCurrentRound();
    }, [room?.id, room.state?.currentRound, useMockData]);

    useEffect(() => {
        // Skip this effect if using mock data
        if (useMockData) return;

        if (votes.length === 0 || !players || !currentSong) return;

        // Count votes for each player
        const voteCounts = {};
        players.forEach(player => {
            voteCounts[player.userId] = 0;
        });

        votes.forEach(vote => {
            if (voteCounts.hasOwnProperty(vote.votedForUserId)) {
                voteCounts[vote.votedForUserId]++;
            }
        });

        // Create data for chart
        const chartData = players.map(player => ({
            playerId: player.userId,
            playerName: player.nombre,
            avatar: player.avatar,
            voteCount: voteCounts[player.userId],
            isCorrect: player.userId === currentSong.ownerUserId
        }));

        setVotingData(chartData);
    }, [votes, players, currentSong, useMockData]);

    if (votingData.length === 0) return null;

    const maxVotes = Math.max(...votingData.map(data => data.voteCount));
    const maxHeight = 120; // Maximum bar height in pixels

    return (
        <div className="w-full flex flex-col rounded-lg p-6 mt-6">
            <div className="flex w-full justify-center items-end space-x-2 md:space-x-4 min-h-[160px]">
                {votingData.map((data) => {
                    const barHeight = maxVotes > 0 ? (data.voteCount / maxVotes) * maxHeight : 0;

                    return (
                        <div key={data.playerId} className="flex flex-col items-center">
                            {/* Correct answer indicator */}
                            {data.isCorrect && (
                                <div className="mb-2">
                                    <div className="bg-green-500 rounded-full w-6 h-6 flex items-center justify-center">
                                        <span className="text-white text-sm font-bold">✓</span>
                                    </div>
                                </div>
                            )}

                            {/* Vote count above bar */}
                            <div className="text-white font-semibold mb-1 min-h-[20px]">
                                {data.voteCount > 0 && data.voteCount}
                            </div>

                            {/* Bar */}
                            <div
                                className={`w-12 md:w-28 rounded-t transition-all duration-500 ${data.isCorrect
                                        ? 'bg-green-500'
                                        : 'bg-gradient-to-t from-purple-600 to-pink-600'
                                    }`}
                                style={{
                                    height: `${Math.max(barHeight, data.voteCount > 0 ? 20 : 4)}px`,
                                    minHeight: '4px'
                                }}
                            />

                            {/* Player info */}
                            <div className="mt-2 flex flex-col items-center">
                                {/* Vote count below 
                                <span className="text-gray-400 text-xs">
                                    {data.voteCount} {data.voteCount === 1 ? 'voto' : 'votos'}
                                </span>
                                */}
                                {/* Avatar */}
                                <div className="w-8 h-8 md:w-10 md:h-10 mt-2 mb-1">
                                    {data.avatar ? (
                                        <img
                                            src={`/img/playerImages/${data.avatar}.png`}
                                            alt={data.playerName}
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gray-500 flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">
                                                {data.playerName?.[0]?.toUpperCase() || '?'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Player name */}
                                <span className="text-gray-300 text-xs text-center max-w-12 md:max-w-28 truncate ">
                                    {data.playerName}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Total votes summary */}
            {/*<div className="text-center mt-4 text-gray-400 text-sm">
                Total de votos: {votes.length}
            </div>
            */}
        </div>
    );
};

export default VotesBarChart;
