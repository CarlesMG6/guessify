import QuestionHeader from "../QuestionHeader";


const InitialPhase = ({ question }) => {
    return (
        <div className="h-full w-full items-center flex flex-col justify-center">
            <QuestionHeader question={question} />
        </div>
    );
};

export default InitialPhase;