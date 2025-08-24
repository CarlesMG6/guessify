const GuessingPhasePlayer = ({ question, players, handleVote, hasVoted }) => {

    const funnyPhrases = [
        "No por mucho madrugar amanece más temprano",
        "Más vale tarde que nunca",
        "Quien mucho corre, pronto para",
        "Vísteme despacio que tengo prisa",
        "A mal tiempo, buena cara",
        "El que ríe último, ríe mejor",
        "Quien no arriesga, no gana"
    ]

    console.log(players);

    return (
        <div className="mb-6 relative flex justify-center items-center flex-col">
            <style>
                {`
                .spinner {
                    border: 3px solid #333;
                    border-top: 3px solid #1db954;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 20px auto;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg);}
                    100% { transform: rotate(360deg);}
                }
                `}
            </style>
            <div className="w-full max-w-md">
                {hasVoted ? (
                    <div className=" text-white p-3 rounded-lg mb-4 text-center flex-col flex gap-8">
                        <span className="flex items-center justify-center">
                            <span className="spinner"></span>
                        </span>
                        <span className="italic text-lg text-gray-300">
                            Espera al resto de jugadores...
                        </span>
                        {/*
                        <span className="italic text-lg text-gray-300">
                            {funnyPhrases[Math.floor(Math.random() * funnyPhrases.length)]}
                        </span>
                        */}
                    </div>
                ) : (
                    <>
                        {/*
                            <h3 className="text-xl font-bold text-white mb-4 text-center">
                                {question}
                            </h3>
                        */}

                        <div className="grid grid-cols-2 gap-3">
                            {players.map((player) => (
                                <button
                                    key={player.id}
                                    onClick={() => !hasVoted && handleVote(player.userId)}
                                    disabled={hasVoted}
                                    className={`flex items-center p-3 rounded-lg transition-all duration-200 ${hasVoted
                                        ? 'bg-gray-500 cursor-not-allowed opacity-50'
                                        : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 active:scale-95'
                                        }`}
                                >
                                    {player?.avatar ? (
                                        <img
                                            src={`/img/playerImages/${player?.avatar}.png`}
                                            alt={"Avatar de " + player?.nombre}
                                            className="w-12 h-12 md:w-16 md:h-16 mx-auto"
                                        />
                                    ) : (
                                        <span>{player.nombre?.[0]?.toUpperCase() || '?'}</span>
                                    )}
                                    <span className="text-white font-medium text-left flex-1 truncate">
                                        {player.nombre}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default GuessingPhasePlayer;
