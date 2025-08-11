
import { getPlayerName } from '../../lib/gameHelpers';

const ResultsPhase = ({ currentSong, question, room, players }) => {
    return (
        <div>
            <h3 className="text-2xl font-bold text-white mb-2">
                {question}
            </h3>
            {/* Spinning vinyl record */}
            <div className="relative w-48 h-48 mx-auto">
                <img
                    src={currentSong.coverUrl}
                    alt={currentSong.trackName}
                    className="w-48 h-48 rounded-lg shadow-lg"
                />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
                {currentSong.trackName}
            </h3>
            <p className="text-gray-400 text-lg mb-6">
                {currentSong.artistName}
            </p>
            <div className="bg-green-900 rounded-lg p-4 mt-4">
                <div className="text-spotify-green font-semibold">
                    Esta canción le gusta a: {getPlayerName(players, currentSong.ownerUserId)}
                </div>
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