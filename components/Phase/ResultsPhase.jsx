
import { getPlayerName } from '../../lib/gameHelpers';
import QuestionHeader from '../QuestionHeader';
import VotesBarChart from '../VotesBarChart';

const ResultsPhase = ({ currentSong, question, room, players, skipToNextPhase, textSkip }) => {
    return (
        <div className='h-full w-full flex items-center flex-col justify-center'>
            <QuestionHeader question={"Resultados"} skipToNextPhase={skipToNextPhase} textSkip={textSkip} />

            {currentSong && (
                    <>
                    <div className="w-full max-w-4xl bg-spotify-gray rounded-xl p-6 mb-6 mt-20 flex items-center justify-between">
                        {/* Song Info Row */}
                        <div className="flex items-center space-x-8 flex-1">
                            {/* Album Cover */}
                            <div className="w-16 h-16 md:w-28 md:h-28 rounded-xl overflow-hidden flex-shrink-0">
                                <img
                                    src={currentSong.coverUrl}
                                    alt={currentSong.trackName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = '/img/placeholder-album.png'; // Fallback
                                    }}
                                />
                            </div>
                            
                            {/* Song Details */}
                            <div className="flex flex-col ml-8 items-start gap-3">
                                <h3 className="text-lg md:text-3xl font-bold text-white truncate">
                                    {currentSong.trackName}
                                </h3>
                                <p className="text-gray-400 text-sm md:text-xl truncate">
                                    {currentSong.artistName}
                                </p>
                            </div>
                        </div>
                        
                        {/* Correct Answer - Owner Info */}
                        <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                            <div className="text-right">
                                <div className="text-white font-semibold text-lg">
                                    {getPlayerName(players, currentSong.ownerUserId)}
                                </div>
                            </div>
                            <div className="w-12 h-12 overflow-hidden flex-shrink-0">
                                {(() => {
                                    const player = players.find(p => p.userId === currentSong.ownerUserId);
                                    return player?.avatar ? (
                                        <img
                                            src={`/img/playerImages/${player.avatar}.png`}
                                            alt={getPlayerName(players, currentSong.ownerUserId)}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.src = '/img/playerImages/gato.png'; // Fallback
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-black font-bold text-sm">
                                            {getPlayerName(players, currentSong.ownerUserId)?.charAt(0) || '?'}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                    {currentSong.otherPlayersWithTrack && currentSong.otherPlayersWithTrack.length > 0 && (
                    <div className="w-full max-w-4xl bg-spotify-gray rounded-xl p-6 mb-6 mt-6">    
                        {/* Other Players Who Had This Track */}
                        <h4 className="text-white font-semibold text-lg mb-4">También la han escuchado</h4>
                        <div className="space-y-3">
                            {currentSong.otherPlayersWithTrack.map((otherPlayer) => {
                                const playerData = players.find(p => p.userId === otherPlayer.userId);
                                return (
                                    <div key={otherPlayer.userId} className="flex items-center space-x-4 bg-gray-700 rounded-lg p-3">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 overflow-hidden flex-shrink-0">
                                            {playerData?.avatar ? (
                                                <img
                                                    src={`/img/playerImages/${playerData.avatar}.png`}
                                                    alt={otherPlayer.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.src = '/img/playerImages/gato.png';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-spotify-green rounded-full flex items-center justify-center text-black font-bold text-sm">
                                                    {otherPlayer.name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Name */}
                                        <span className="text-white font-medium">
                                            {otherPlayer.name}
                                        </span>
                                        
                                        {/* Position Text */}
                                        <span className="text-gray-400 text-sm">
                                            es su {otherPlayer.position}ª canción más escuchada
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    )}
                    </>
                )}

            <div className="flex flex-col items-center justify-center h-full w-full">
                {/* Votes Bar Chart */}
                <VotesBarChart
                    room={room}
                    players={players}
                    currentSong={currentSong}
                    useMockData={false}
                />
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