
import { getPlayerName } from '../../lib/gameHelpers';
import QuestionHeader from '../QuestionHeader';
import VotesBarChart from '../VotesBarChart';

const ResultsPhase = ({ currentSong, question, room, players, skipToNextPhase, textSkip }) => {
    return (
        <div className='h-full w-full flex items-center flex-col justify-center'>
            <QuestionHeader question={"Resultados"} skipToNextPhase={skipToNextPhase} textSkip={textSkip} />

            {/* Spinning vinyl record */}
            <div className="flex flex-col items-center justify-center h-full w-full">
                {/* Votes Bar Chart */}
                <VotesBarChart
                    room={room}
                    players={players}
                    currentSong={currentSong}
                    useMockData={false}
                />
                {/*<div className="relative w-48 md:w-80 h-48 md:h-80 mx-auto">
                    <img
                        src={currentSong.coverUrl}
                        alt={currentSong.trackName}
                        className="w-48 md:w-80 h-48 md:h-80 rounded-lg shadow-lg"
                    />
                </div>
                <h3 className="text-2xl md:text-4xl font-bold text-white mt-8 mb-2">
                    {currentSong.trackName}
                </h3>
                <p className="md:text-2xl text-gray-400 text-lg mb-6">
                    {currentSong.artistName}
                </p>*/}
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