import QuestionHeader from "../QuestionHeader";

const InitialPhasePlayer = ({question, currentRound}) => {
    return (
        <div className="flex flex-col items-center justify-center w-full">
            <div className="w-full text-center text-3xl font-bold text-white mb-6 mx-auto">
                Ronda {currentRound}
            </div>
            <QuestionHeader question={question} />
        </div>
    );
};

/*
            <h3 className="flex w-full text-center text-lg font-bold text-white mb-2">
                {question}
            </h3>
*/

export default InitialPhasePlayer;
