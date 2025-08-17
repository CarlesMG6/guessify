import { getPlayerScore } from "../../lib/gameHelpers";

const StandingsPhasePlayer = ({ players}) => {
    return (
        <div className="bg-blue-900 rounded-lg p-6 mt-4">
            <h3 className="text-xl font-bold text-white mb-4 text-center">
                🏆 Puntuaciones Actuales
            </h3>
            <div className="space-y-3">
                {players
                    .sort((a, b) => getPlayerScore(players, b.userId) - getPlayerScore(players, a.userId))
                    .map((player, index) => (
                        <div key={player.userId} className={`flex justify-between items-center p-3 rounded-lg ${index === 0 ? 'bg-yellow-600' :
                                index === 1 ? 'bg-gray-400' :
                                    index === 2 ? 'bg-orange-600' : 'bg-gray-600'
                            }`}>
                            <span className="text-white font-semibold flex items-center">
                                <span className="mr-2">
                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                                </span>
                                {player.nombre}
                            </span>
                            <span className="text-white text-xl font-bold">
                                {getPlayerScore(players, player.userId)} pts
                            </span>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default StandingsPhasePlayer;
