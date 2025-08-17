const InitialPhasePlayer = ({question, currentRound}) => {
    return (
        <div className="flex flex-col items-center justify-center w-full">
            <div className="w-full text-center text-2xl font-bold text-white mb-2 mx-auto">
                Ronda {currentRound}
            </div>
            <h3 className="flex w-full text-center text-lg font-bold text-white mb-2">
                {question}
            </h3>
            <h3 className="w-full text-center text-white mt-8">
                5, 4, 3, 2, 1...
            </h3>
        </div>
    );
};

export default InitialPhasePlayer;
