

const GuessingPhase = ({ currentSong, question, room }) => {
    // show image, title and author based on room.config.revealSongName and room.config.revealSongCover and room.config.revealSongArtist
    const showCover = room?.config?.revealCover;
    const showTitle = room?.config?.revealSongName;
    const showArtist = room?.config?.revealArtists;   
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
                    />
                ): (
                    <img
                        src={'/img/hiddenCover.jpg'}
                        alt={"Portada oculta"}
                        className="w-48 h-48 rounded-full shadow-lg animate-spin-slow"
                    />
                )}
                {/* Spinning effect */}
                {/* Center hole */}
                <div
                    className="absolute rounded-full"
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '24px',
                        height: '24px',
                        background: '#222',
                        zIndex: 2,
                    }}
                />
            </div>
            <h3 className="text-2xl font-bold text-white mt-8 mb-2">
                {showTitle ? currentSong.trackName : 'Título oculto'}
            </h3>
            <p className="text-gray-400 text-lg mb-6">
                {showArtist ? currentSong.artistName : 'Artista oculto'}
            </p>
        </div>
    );
};

export default GuessingPhase;