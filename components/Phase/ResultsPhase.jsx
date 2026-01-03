
import { useState, useEffect } from 'react';
import { getPlayerName } from '../../lib/gameHelpers';
import QuestionHeader from '../QuestionHeader';
import VotesBarChart from '../VotesBarChart';

const ResultsPhase = ({ currentSong, question, room, players, skipToNextPhase, textSkip }) => {
    const [votes, setVotes] = useState([]);
    const [roundPoints, setRoundPoints] = useState({});
    const [streakInfo, setStreakInfo] = useState({});
    const [showAnimation, setShowAnimation] = useState(false);
    const [animatedPlayers, setAnimatedPlayers] = useState([]);
    const [fastestPlayer, setFastestPlayer] = useState(null);

    // Load votes for current round
    useEffect(() => {
        const loadVotes = async () => {
            if (!room?.id || room.state?.currentRound === undefined) return;
            
            try {
                const { getVotesForRound } = await import('../../lib/firestore');
                const roundVotes = await getVotesForRound(room.id, room.state.currentRound);
                setVotes(roundVotes);

                // Calculate points gained this round
                const pointsThisRound = {};
                const streakData = {};
                let maxPoints = 0;
                let fastest = null;

                roundVotes.forEach(vote => {
                    if (vote.isCorrect && vote.points > 0) {
                        pointsThisRound[vote.voterUserId] = (pointsThisRound[vote.voterUserId] || 0) + vote.points;
                        
                        // Store streak information
                        if (vote.streakCount >= 4 && vote.streakBonus > 0) {
                            streakData[vote.voterUserId] = {
                                count: vote.streakCount,
                                bonus: vote.streakBonus
                            };
                        }
                        
                        // Track fastest player (most points)
                        if (pointsThisRound[vote.voterUserId] > maxPoints) {
                            maxPoints = pointsThisRound[vote.voterUserId];
                            fastest = vote.voterUserId;
                        }
                    }
                });

                setRoundPoints(pointsThisRound);
                setStreakInfo(streakData);
                setFastestPlayer(fastest);

                // Initialize animated players with current order
                const playersWithPoints = players.map(p => ({
                    ...p,
                    roundPoints: pointsThisRound[p.userId] || 0,
                    streakCount: streakData[p.userId]?.count || 0,
                    streakBonus: streakData[p.userId]?.bonus || 0,
                    previousScore: p.score - (pointsThisRound[p.userId] || 0),
                    newScore: p.score
                }));
                setAnimatedPlayers(playersWithPoints);

                // Start animation sequence
                setTimeout(() => setShowAnimation(true), 2000); // Mostrar puntos durante 2 segundos antes de animar
            } catch (error) {
                console.error('Error loading votes:', error);
            }
        };

        loadVotes();
    }, [room?.id, room?.state?.currentRound, players]);

    // Handle reordering after animation
    useEffect(() => {
        if (!showAnimation) return;

        const timer = setTimeout(() => {
            // Sort players by new score
            const sorted = [...animatedPlayers].sort((a, b) => b.newScore - a.newScore);
            setAnimatedPlayers(sorted);
        }, 5000); // Tiempo total: 2s de espera + 3s de animación

        return () => clearTimeout(timer);
    }, [showAnimation]);

    return (
        <div className='h-full w-full flex items-center flex-col justify-center'>
            <QuestionHeader question={"Resultados"} skipToNextPhase={skipToNextPhase} textSkip={textSkip} />

            {currentSong && (
                    <>
                    <div className="w-full max-w-4xl bg-spotify-gray rounded-xl p-6 mb-6 mt-20 flex items-center justify-between">
                        {/* Song Info Row */}
                        <div className="flex items-center space-x-8 flex-1">
                            {/* Album Cover */}
                            <div className="w-16 h-16 md:w-28 md:h-28 rounded-xl overflow-hidden flex-shrink-0">
                                <img
                                    src={currentSong.coverUrl}
                                    alt={currentSong.trackName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = '/img/placeholder-album.png'; // Fallback
                                    }}
                                />
                            </div>
                            
                            {/* Song Details */}
                            <div className="flex flex-col ml-8 items-start gap-3">
                                <h3 className="text-lg md:text-3xl font-bold text-white truncate">
                                    {currentSong.trackName}
                                </h3>
                                <p className="text-gray-400 text-sm md:text-xl truncate">
                                    {currentSong.artistName}
                                </p>
                            </div>
                        </div>
                        
                        {/* Correct Answer - Owner Info */}
                        <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                            <div className="text-right">
                                <div className="text-white font-semibold text-lg">
                                    {getPlayerName(players, currentSong.ownerUserId)}
                                </div>
                            </div>
                            <div className="w-12 h-12 overflow-hidden flex-shrink-0">
                                {(() => {
                                    const player = players.find(p => p.userId === currentSong.ownerUserId);
                                    return player?.avatar ? (
                                        <img
                                            src={`/img/playerImages/${player.avatar}.png`}
                                            alt={getPlayerName(players, currentSong.ownerUserId)}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.src = '/img/playerImages/gato.png'; // Fallback
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-black font-bold text-sm">
                                            {getPlayerName(players, currentSong.ownerUserId)?.charAt(0) || '?'}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                    {currentSong.otherPlayersWithTrack && currentSong.otherPlayersWithTrack.length > 0 && (
                    <div className="w-full max-w-4xl bg-spotify-gray rounded-xl p-6 mb-6 mt-6">    
                        {/* Other Players Who Had This Track */}
                        <h4 className="text-white font-semibold text-lg mb-4">También la han escuchado</h4>
                        <div className="space-y-3">
                            {currentSong.otherPlayersWithTrack.map((otherPlayer) => {
                                const playerData = players.find(p => p.userId === otherPlayer.userId);
                                return (
                                    <div key={otherPlayer.userId} className="flex items-center space-x-4 bg-gray-700 rounded-lg p-3">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 overflow-hidden flex-shrink-0">
                                            {playerData?.avatar ? (
                                                <img
                                                    src={`/img/playerImages/${playerData.avatar}.png`}
                                                    alt={otherPlayer.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.src = '/img/playerImages/gato.png';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-spotify-green rounded-full flex items-center justify-center text-black font-bold text-sm">
                                                    {otherPlayer.name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Name */}
                                        <span className="text-white font-medium">
                                            {otherPlayer.name}
                                        </span>
                                        
                                        {/* Position Text */}
                                        <span className="text-gray-400 text-sm">
                                            es su {otherPlayer.position}ª canción más escuchada
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    )}
                    </>
                )}

            <div className="flex flex-col items-center justify-center h-full w-full">
                {/* Player Rankings with Score Animation */}
                {animatedPlayers.length > 0 && (
                    <div className="w-full max-w-2xl mb-6 space-y-2">
                        {animatedPlayers.map((player, index) => (
                            <div
                                key={player.userId}
                                className="bg-spotify-gray rounded-lg p-4 transition-all duration-1000 ease-in-out"
                                style={{
                                    transform: `translateY(${index * 100}%)`,
                                }}
                            >
                                <div className="flex items-center justify-between">
                                    {/* Left: Position + Avatar + Name */}
                                    <div className="flex items-center space-x-4">
                                        <span className="text-white font-bold text-xl w-8">
                                            {index + 1}
                                        </span>
                                        
                                        {player.avatar ? (
                                            <img
                                                src={`/img/playerImages/${player.avatar}.png`}
                                                alt={player.nombre}
                                                className="w-10 h-10 rounded-full"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold">
                                                {player.nombre?.[0]?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                        
                                        <span className="text-white font-semibold">
                                            {player.nombre}
                                        </span>
                                    </div>

                                    {/* Right: Score with animation */}
                                    <div className="flex items-center space-x-2 relative">
                                        {/* Fastest player indicator */}
                                        {fastestPlayer === player.userId && (
                                            <div className="mr-2">
                                                <span className="text-yellow-400 text-2xl">
                                                    ⚡
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* Streak bonus badge */}
                                        {player.streakCount >= 4 && (
                                            <div className="flex flex-col items-end mr-2">
                                                <span className="text-yellow-400 text-xs font-semibold">
                                                    🔥 Racha de {player.streakCount}
                                                </span>
                                                <span className="text-yellow-400 text-sm font-bold">
                                                    +{player.streakBonus}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* Points gained this round */}
                                        {player.roundPoints > 0 && (
                                            <span
                                                className={`text-green-400 font-bold transition-all duration-[3000ms] ${
                                                    showAnimation ? 'opacity-0 translate-x-20' : 'opacity-100'
                                                }`}
                                            >
                                                +{player.roundPoints}
                                            </span>
                                        )}
                                        
                                        {/* Total score */}
                                        <span className="text-white font-bold text-xl">
                                            {showAnimation ? player.newScore : player.previousScore} pts
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Votes Bar Chart */}
                <VotesBarChart
                    room={room}
                    players={players}
                    currentSong={currentSong}
                    useMockData={false}
                />
            </div>
        </div>
    );
};


/*

                  <div className="mt-4 text-center">
                    <div className="text-gray-400 text-sm">
                      Votos: {getVotesForCurrentRound().length} / {players.length}
                    </div>
                  </div>

 */
export default ResultsPhase;