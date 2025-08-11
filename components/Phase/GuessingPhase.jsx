

const GuessingPhase = ({ currentSong, question, room }) => {
    // show image, title and author based on room.config.revealSongName and room.config.revealSongCover and room.config.revealSongArtist
    const showCover = room?.config?.revealSongCover;
    const showTitle = room?.config?.revealSongName;
    const showArtist = room?.config?.revealSongArtist;   
    return (
        <div className="mb-6 relative flex justify-center items-center flex-col">
            <h3 className="text-2xl font-bold text-white mb-2">
                {question}
            </h3>
            {/* Spinning vinyl record */}
            <div className="relative w-48 h-48 mx-auto">
                {showCover ? (
                    <img
                        src={currentSong.coverUrl}
                        alt={currentSong.trackName}
                        className="w-48 h-48 rounded-full shadow-lg animate-spin-slow"
                        style={{
                            border: '12px solid #222', // vinyl edge
                        boxShadow: '0 0 24px #111 inset',
                    }}
                    />
                ): (
                    <div className="w-48 h-48 rounded-full bg-gray-800 flex items-center justify-center">
                        <span className="text-gray-500">Portada oculta</span>
                    </div>
                )}
                {/* Spinning effect */}
                {/* Center hole */}
                <div
                    className="absolute"
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '32px',
                        height: '32px',
                        background: '#222',
                        borderRadius: '50%',
                        border: '4px solid #444',
                        boxShadow: '0 0 8px #000 inset',
                        zIndex: 2,
                    }}
                />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
                {showTitle ? currentSong.trackName : 'Título oculto'}
            </h3>
            <p className="text-gray-400 text-lg mb-6">
                {showArtist ? currentSong.artistName : 'Artista oculto'}
            </p>
        </div>
    );
};

export default GuessingPhase;