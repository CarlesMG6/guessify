import { getPlayerScore } from "../../lib/gameHelpers";
import QuestionHeader from "../QuestionHeader";
import { useState } from "react";

const EndPhase = ({ players, room, onRestartGame }) => {

    const playersData = Array.isArray(players) ? players : [];
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Configuration state - initialize with current room config
    const [config, setConfig] = useState({
        numSongs: room?.config?.numSongsPerUser || room?.config?.numSongs || 3,
        timePerRound: room?.config?.timePerRound || 30,
        autoStart: room?.config?.autoStart || false,
        revealSongName: room?.config?.revealSongName ?? true,
        revealArtists: room?.config?.revealArtists ?? true,
        revealCover: room?.config?.revealCover ?? true,
        term: room?.config?.term || 'medium_term'
    });

    const handlePlayAgain = async () => {
        setLoading(true);
        setError('');
        
        try {
            const { resetRoomForNewGame } = await import('../../lib/firestore');
            const { getUsersForPlaylist, generateGamePlaylist, validatePlaylistForGame } = await import('../../lib/gameUtils');
            const { startGame: startGameInDB } = await import('../../lib/firestore');
            
            // Reset room with same configuration
            await resetRoomForNewGame(room.id, null);
            
            // Generate new playlist
            const term = room.config?.term || 'medium_term';
            const usersForPlaylist = await getUsersForPlaylist(room.id, term);
            
            if (usersForPlaylist.length === 0) {
                setError(`No hay jugadores con datos de Spotify para el período seleccionado`);
                return;
            }
            
            const numSongs = room.config?.numSongsPerUser || room.config?.numSongs || 10;
            const generatedPlaylist = generateGamePlaylist(usersForPlaylist, numSongs, term);
            const validation = validatePlaylistForGame(generatedPlaylist);
            
            if (!validation.hasEnoughTracks) {
                setError(`No hay suficientes canciones válidas. Se encontraron ${validation.validTracks.length} de ${numSongs} necesarias.`);
                return;
            }
            
            // Save the new playlist to the room
            await startGameInDB(room.id, validation.validTracks);
            
            console.log('Room reset successfully with new playlist');
            
            // Notify parent component
            if (onRestartGame) {
                onRestartGame();
            }
            
        } catch (error) {
            console.error('Error restarting game:', error);
            setError('Error al reiniciar el juego: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfigureAndPlay = async () => {
        setLoading(true);
        setError('');
        
        try {
            const { resetRoomForNewGame } = await import('../../lib/firestore');
            const { getUsersForPlaylist, generateGamePlaylist, validatePlaylistForGame } = await import('../../lib/gameUtils');
            const { startGame: startGameInDB } = await import('../../lib/firestore');
            
            // Prepare new configuration
            const newConfig = {
                numSongsPerUser: config.numSongs,
                numSongs: config.numSongs,
                autoStart: config.autoStart,
                delayStartTime: 5,
                timePerRound: config.timePerRound,
                revealSongName: config.revealSongName,
                revealArtists: config.revealArtists,
                revealCover: config.revealCover,
                term: config.term,
                hostPlaying: room.config?.hostPlaying || false
            };
            
            // Reset room with new configuration
            await resetRoomForNewGame(room.id, newConfig);
            
            // Generate new playlist with new configuration
            const usersForPlaylist = await getUsersForPlaylist(room.id, config.term);
            
            if (usersForPlaylist.length === 0) {
                setError(`No hay jugadores con datos de Spotify para el período seleccionado`);
                return;
            }
            
            const generatedPlaylist = generateGamePlaylist(usersForPlaylist, config.numSongs, config.term);
            const validation = validatePlaylistForGame(generatedPlaylist);
            
            if (!validation.hasEnoughTracks) {
                setError(`No hay suficientes canciones válidas. Se encontraron ${validation.validTracks.length} de ${config.numSongs} necesarias.`);
                return;
            }
            
            // Save the new playlist to the room
            await startGameInDB(room.id, validation.validTracks);
            
            console.log('Room reset successfully with new configuration and playlist');
            
            // Close modal
            setShowConfigModal(false);
            
            // Notify parent component
            if (onRestartGame) {
                onRestartGame();
            }
            
        } catch (error) {
            console.error('Error restarting game with new config:', error);
            setError('Error al configurar y reiniciar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Configuration Modal
    const ConfigurationModal = () => {
        if (!showConfigModal) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-spotify-dark rounded-xl p-6 max-w-md w-full mx-4 border border-spotify-gray max-h-[90vh] overflow-y-auto">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-white mb-2">Configuración de la Sala</h2>
                        <p className="text-gray-300">Personaliza tu experiencia de juego</p>
                    </div>

                    {error && (
                        <div className="bg-red-600 text-white p-3 rounded-lg mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Number of Songs */}
                        <div>
                            <label className="block text-white font-semibold mb-3">
                                Canciones por usuario: {config.numSongs}
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={config.numSongs}
                                onChange={(e) => setConfig(prev => ({...prev, numSongs: parseInt(e.target.value)}))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>1</span>
                                <span>10</span>
                            </div>
                        </div>

                        {/* Time per Round */}
                        <div>
                            <label className="block text-white font-semibold mb-3">
                                Tiempo por ronda: {config.timePerRound}s
                            </label>
                            <input
                                type="range"
                                min="1"
                                max="90"
                                value={config.timePerRound}
                                onChange={(e) => setConfig(prev => ({...prev, timePerRound: parseInt(e.target.value)}))}
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>1s</span>
                                <span>90s</span>
                            </div>
                        </div>

                        {/* Auto Start */}
                        <div className="flex items-center justify-between">
                            <label className="text-white font-semibold">Avance automático</label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.autoStart}
                                    onChange={(e) => setConfig(prev => ({...prev, autoStart: e.target.checked}))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-spotify-green"></div>
                            </label>
                        </div>

                        {/* Time Period Selection */}
                        <div>
                            <label className="block text-white font-semibold mb-3">Canciones de:</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setConfig(prev => ({...prev, term: 'short_term'}))}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                        config.term === 'short_term'
                                            ? 'bg-spotify-green text-black'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    Último mes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfig(prev => ({...prev, term: 'medium_term'}))}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                        config.term === 'medium_term'
                                            ? 'bg-spotify-green text-black'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    Últimos 6 meses
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setConfig(prev => ({...prev, term: 'long_term'}))}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                        config.term === 'long_term'
                                            ? 'bg-spotify-green text-black'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    Último año
                                </button>
                            </div>
                        </div>

                        {/* Reveal Options */}
                        <div className="space-y-3">
                            <h3 className="text-white font-semibold">Mostrar durante el juego:</h3>
                            
                            <div className="flex items-center justify-between">
                                <label className="text-gray-300">Nombre de la canción</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.revealSongName}
                                        onChange={(e) => setConfig(prev => ({...prev, revealSongName: e.target.checked}))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-spotify-green"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-gray-300">Nombre del artista</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.revealArtists}
                                        onChange={(e) => setConfig(prev => ({...prev, revealArtists: e.target.checked}))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-spotify-green"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-gray-300">Portada del álbum</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={config.revealCover}
                                        onChange={(e) => setConfig(prev => ({...prev, revealCover: e.target.checked}))}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-spotify-green"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex flex-col space-y-3 mt-8">
                        <button
                            onClick={handleConfigureAndPlay}
                            disabled={loading}
                            className="w-full bg-spotify-green hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                                    <span>Reiniciando...</span>
                                </div>
                            ) : (
                                'Aplicar y Jugar'
                            )}
                        </button>
                        <button
                            onClick={() => setShowConfigModal(false)}
                            disabled={loading}
                            className="w-full bg-transparent border border-gray-500 hover:border-gray-400 text-gray-300 hover:text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <style jsx>{`
                .slider::-webkit-slider-thumb {
                    appearance: none;
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #1db954;
                    cursor: pointer;
                    border: 2px solid #1db954;
                }
                
                .slider::-moz-range-thumb {
                    height: 20px;
                    width: 20px;
                    border-radius: 50%;
                    background: #1db954;
                    cursor: pointer;
                    border: 2px solid #1db954;
                }
            `}</style>
            <div className='h-full w-full flex items-center flex-col justify-center'>
                <QuestionHeader question={"Resultados de partida"}/>
                
                {error && !showConfigModal && (
                    <div className="bg-red-600 text-white p-4 rounded-lg mb-4 max-w-3xl mx-auto">
                        {error}
                    </div>
                )}
                
                <div className="flex flex-col items-center justify-center h-full mx-auto w-full max-w-3xl space-y-3">
                    {playersData
                        .sort((a, b) => {
                            return getPlayerScore(players, b.userId) - getPlayerScore(players, a.userId);
                        })
                        .map((player, index) => {
                            // Define realistic medal colors with gradients and shadows
                            let bgClasses = '';
                            let textShadow = '';
                            
                            if (index === 0) {
                                // Gold - Gradient with warm gold tones and shimmer effect
                                bgClasses = 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/50';
                                textShadow = 'drop-shadow-lg';
                            } else if (index === 1) {
                                // Silver - Cool metallic silver with shine
                                bgClasses = 'bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 shadow-lg shadow-gray-400/50';
                                textShadow = 'drop-shadow-lg';
                            } else if (index === 2) {
                                // Bronze - Warm bronze tones with copper highlights
                                bgClasses = 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 shadow-lg shadow-amber-600/50';
                                textShadow = 'drop-shadow-lg';
                            } else {
                                // Regular positions - Simple dark gradient
                                bgClasses = 'bg-gradient-to-r from-gray-600 to-gray-700';
                            }
                            
                            return (
                                <div key={player.userId} className={`flex justify-between w-full items-center p-4 rounded-lg border transition-all duration-300 hover:scale-105 ${bgClasses} ${
                                    index < 3 ? 'border-white border-opacity-30' : 'border-gray-500'
                                }`}>
                                    <span className={`font-semibold flex items-center ${
                                        index < 3 ? 'text-white filter ' + textShadow : 'text-white'
                                    }`}>
                                        <span className="w-12 text-2xl flex items-center justify-center">
                                            <div className="mx-auto">
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                                            </div>
                                        </span>
                                        <div className="ml-3 text-xl">
                                        {player.nombre}
                                        </div>
                                    </span>
                                    <span className={`text-xl font-bold ${
                                        index < 3 ? 'text-white filter ' + textShadow : 'text-white'
                                    }`}>
                                        {getPlayerScore(players, player.userId)} pts
                                    </span>
                                </div>
                            );
                        })}
                    
                    {/* Action Buttons */}
                    <div className="w-full flex flex-col sm:flex-row gap-3 mt-6">
                        <button
                            onClick={handlePlayAgain}
                            disabled={loading}
                            className="flex-1 bg-spotify-green hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                                    <span>Reiniciando...</span>
                                </div>
                            ) : (
                                'Jugar de nuevo'
                            )}
                        </button>
                        <button
                            onClick={() => setShowConfigModal(true)}
                            disabled={loading}
                            className="flex-1 bg-white hover:bg-gray-200 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                        >
                            Configurar Sala
                        </button>
                    </div>
                </div>
            </div>
            
            <ConfigurationModal />
        </>
    );
};

export default EndPhase;