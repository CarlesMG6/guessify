import QuestionHeader from "../QuestionHeader";


const GuessingPhase = ({ currentSong, question, room }) => {
    // show image, title and author based on room.config.revealSongName and room.config.revealSongCover and room.config.revealSongArtist
    const showCover = room?.config?.revealCover;
    const showTitle = room?.config?.revealSongName;
    const showArtist = room?.config?.revealArtists;
    return (
        <div className="h-full mb-6 relative flex justify-center items-center flex-col">
            <QuestionHeader question={question} />
            <div className="flex flex-col items-center justify-center h-full">
                {/* Spinning vinyl record */}
                <div className="relative w-48 md:w-80 h-48 md:h-80 mx-auto">
                    {showCover ? (
                        <img
                            src={currentSong.coverUrl}
                            alt={currentSong.trackName}
                            className="w-48 md:w-80 h-48 md:h-80 rounded-full shadow-lg animate-spin-slow"
                        />
                    ) : (
                        <img
                            src={'/img/hiddenCover.jpg'}
                            alt={"Portada oculta"}
                            className="w-48 md:w-80 h-48 md:h-80 rounded-full shadow-lg animate-spin-slow"
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
                <h3 className="text-2xl md:text-4xl font-bold text-white mt-8 mb-2">
                    {showTitle ? currentSong.trackName : 'Título oculto'}
                </h3>
                <p className="md:text-2xl text-gray-400 text-lg mb-6">
                    {showArtist ? currentSong.artistName : 'Artista oculto'}
                </p>
            </div>
        </div>
    );
};

export default GuessingPhase;