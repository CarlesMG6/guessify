'use client';

import { useEffect, useRef, useState } from 'react';
import { addPlayerToRoom } from '../lib/firestore';

export default function HostLobby({ room, players, role, onStartGame, user, spotifyUser }) {
    const [playerName, setPlayerName] = useState(spotifyUser?.nombre || '');
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');

    const isPlayerInRoom = players.some(player => player.userId === user?.uid);
    const canStart = players.length >= 1 && role === 'host';

    const handleJoinAsPlayer = async () => {
        if (!user || !spotifyUser || !playerName.trim()) {
            setError('Debes conectar Spotify y ingresar un nombre');
            return;
        }

        setJoining(true);
        setError('');

        try {
            await addPlayerToRoom(room.id, user.uid, playerName.trim());
        } catch (error) {
            console.error('Error joining room:', error);
            setError('Error al unirse a la room');
        } finally {
            setJoining(false);
        }
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(room.id);
        // You could add a toast notification here
    };

    function QRCode({ url, size = 128 }) {
        const ref = useRef(null);
        useEffect(() => {
            if (!url || !ref.current) return;
            import('qrcode').then(QR => {
                QR.toCanvas(ref.current, url, { width: size, margin: 1, color: { dark: '#000', light: '#fff' } });
            });
        }, [url, size]);
        return <canvas ref={ref} width={size} height={size} style={{ background: '#fff', borderRadius: 4, boxShadow: '0 2px 8px #0001' }} />;
    }

    /* <QRCode url={url} size={160} /> */
    return (
        <div className="min-h-screen bg-gradient-to-br from-spotify-dark via-spotify-gray to-black">

            <div className="max-w-4xl mx-auto p-6">
                <div className='flex flex-row items-center mt-12'>
                    {/* Room Info */}

                    <div className="flex flex-col items-center flex-1">
                        <h1 className="text-7xl font-extrabold text-center text-primary mb-0">{room.id}</h1>
                        <p className="text-xl text-center mt-2">
                            Accede a <span className="font-bold">guessify.vercel.app</span> e introduce este código
                        </p>
                    </div>
                    <QRCode url={"https://guessify.vercel.app/join/" + room.id} size={160} />
                </div>
            </div>

            {/* Players List */}
            <div className="rounded-lg p-6">
                {/*}
                <h3 className="text-lg font-bold text-white mb-4">
                    Jugadores ({players.length}/12)
                </h3>
                */}
                <div className="w-10/12 md:w-full max-w-sm mx-auto mt-6">
                    <button
                        onClick={onStartGame}
                        disabled={!canStart}
                        className="w-full bg-spotify-green hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                    >
                        {canStart ? 'Iniciar Juego' : `Necesitas al menos 1 jugador`}
                    </button>
                </div>
                <div className="mt-60">
                    {players.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">
                            Esperando jugadores...
                        </p>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-3">
                            {players.map((player, index) => (
                                <div
                                    key={player.id}
                                    className="flex items-center space-x-3 bg-gray-700 rounded-lg p-3"
                                >
                                    <div className="w-8 h-8 bg-spotify-green rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{player.nombre}</p>
                                        {player.userId === room.hostUserId && (
                                            <p className="text-spotify-green text-xs">Anfitrión</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
