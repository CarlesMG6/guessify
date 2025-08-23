const QuestionHeader = ({ question, skipToNextPhase, textSkip}) => {
    return (
        <div className="flex w-full">
            <h3 className="flex text-2xl font-bold bg-white text-black p-6 mb-2 mx-auto">
                {question}
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={skipToNextPhase}
                  className="bg-white text-black absolute right-4 top-4 py-2 px-4 rounded-lg"
                >
                  {textSkip}
                </button>
              </div>
        </div>
    );
};

export default QuestionHeader;
