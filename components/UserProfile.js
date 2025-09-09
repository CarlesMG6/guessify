'use client';

import { useAuth } from '../contexts/AuthContext';

export default function UserProfile({ user }) {
  const { logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <p className="text-white font-medium">{user.nombre}</p>
          <p className="text-gray-400 text-sm">
            {user.topTracks_medium?.length || 0} canciones favoritas
          </p>
        </div>
      </div>
      
      <button
        onClick={logout}
        className="text-gray-400 hover:text-white transition-colors duration-200"
        title="Cerrar sesión"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      </button>
    </div>
  );
}
