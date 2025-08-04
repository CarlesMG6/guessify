'use client';

export default function GameHost({ sala, players, user, spotifyUser }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black">
      <header className="p-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-spotify-green">🎵 Guessify - Host</h1>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Sala</p>
            <p className="text-white text-xl font-bold">{sala.id}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="bg-spotify-gray rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Vista del Anfitrión</h2>
          <p className="text-gray-300 mb-6">
            Esta vista se desarrollará en la Fase 2. Aquí se controlará la reproducción de música 
            y se mostrarán los resultados en tiempo real.
          </p>
          
          <div className="bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Jugadores Conectados</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {players.map((player, index) => (
                <div key={player.id} className="bg-gray-600 rounded-lg p-4">
                  <p className="text-white font-medium">{player.nombre}</p>
                  <p className="text-gray-300 text-sm">Puntos: {player.score}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
