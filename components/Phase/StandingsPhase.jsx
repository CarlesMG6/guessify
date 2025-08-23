import { getPlayerScore } from "../../lib/gameHelpers";
import QuestionHeader from "../QuestionHeader";

const StandingsPhase = ({ players, useMockData = false, skipToNextPhase, textSkip }) => {

    // Mock data for testing styles
    const mockPlayers = [
        {
            userId: 'player1',
            nombre: 'Ana García',
            avatar: 'gato',
            score: 2850
        },
        {
            userId: 'player2',
            nombre: 'Carlos Mendez',
            avatar: 'perro',
            score: 2340
        },
        {
            userId: 'player3',
            nombre: 'María López',
            avatar: 'aventura',
            score: 1890
        },
        {
            userId: 'player4',
            nombre: 'Pedro Martín',
            avatar: 'presidente',
            score: 1650
        },
        {
            userId: 'player5',
            nombre: 'Laura Jiménez',
            avatar: 'lectura',
            score: 1420
        },
        {
            userId: 'player6',
            nombre: 'Diego Ruiz',
            avatar: 'ciclista',
            score: 980
        }
    ];

    // Use mock data if enabled, otherwise use real players data
    const playersData = useMockData ? mockPlayers : players;

    return (
        <div className='h-full w-full flex items-center flex-col justify-center'>
            <QuestionHeader question={"Clasificación"} skipToNextPhase={skipToNextPhase} textSkip={textSkip} />
            <div className="flex flex-col items-center justify-center h-full mx-auto w-full max-w-3xl space-y-3">
                {playersData
                    .sort((a, b) => {
                        if (useMockData) {
                            return b.score - a.score;
                        }
                        return getPlayerScore(players, b.userId) - getPlayerScore(players, a.userId);
                    })
                    .map((player, index) => {
                        // Define realistic medal colors with gradients and shadows
                        let bgClasses = '';
                        let textShadow = '';
                        
                        if (index === 0) {
                            // Gold - Gradient with warm gold tones and shimmer effect
                            bgClasses = 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/50';
                            textShadow = 'drop-shadow-lg';
                        } else if (index === 1) {
                            // Silver - Cool metallic silver with shine
                            bgClasses = 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 shadow-lg shadow-gray-400/50';
                            textShadow = 'drop-shadow-lg';
                        } else if (index === 2) {
                            // Bronze - Warm bronze tones with copper highlights
                            bgClasses = 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 shadow-lg shadow-amber-600/50';
                            textShadow = 'drop-shadow-lg';
                        } else {
                            // Regular positions - Simple dark gradient
                            bgClasses = 'bg-gradient-to-r from-gray-600 to-gray-700';
                        }
                        
                        return (
                            <div key={player.userId} className={`flex justify-between w-full items-center p-4 rounded-lg border transition-all duration-300 hover:scale-105 ${bgClasses} ${
                                index < 3 ? 'border-white border-opacity-30' : 'border-gray-500'
                            }`}>
                                <span className={`font-semibold flex items-center ${
                                    index < 3 ? 'text-white filter ' + textShadow : 'text-white'
                                }`}>
                                    <span className="w-12 text-2xl flex items-center justify-center">
                                        <div className="mx-auto">
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                                        </div>
                                    </span>
                                    <div className="ml-3 text-xl">
                                    {player.nombre}
                                    </div>
                                </span>
                                <span className={`text-xl font-bold ${
                                    index < 3 ? 'text-white filter ' + textShadow : 'text-white'
                                }`}>
                                    {useMockData ? player.score : getPlayerScore(players, player.userId)} pts
                                </span>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
};

export default StandingsPhase;