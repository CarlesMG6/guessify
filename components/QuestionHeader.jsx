const QuestionHeader = ({ question }) => {
    return (
        <h3 className="flex text-2xl font-bold bg-white text-black p-6 mb-2">
            {question}
        </h3>
    );
};

export default QuestionHeader;
