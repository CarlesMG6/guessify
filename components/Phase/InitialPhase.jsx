import QuestionHeader from "../QuestionHeader";


const InitialPhase = ({ question, skipToNextPhase, textSkip }) => {
    return (
        <div className="h-full w-full items-center flex flex-col justify-center">
            <QuestionHeader question={question} skipToNextPhase={skipToNextPhase} textSkip={textSkip} />
        </div>
    );
};

export default InitialPhase;