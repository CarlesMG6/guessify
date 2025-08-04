// Spotify API configuration
export const spotifyConfig = {
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/auth/spotify/callback',
  scopes: [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state'
  ].join(' ')
};

// Spotify API endpoints
export const spotifyEndpoints = {
  auth: 'https://accounts.spotify.com/authorize',
  token: 'https://accounts.spotify.com/api/token',
  api: 'https://api.spotify.com/v1',
  topTracks: (timeRange = 'medium_term', limit = 50) => 
    `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
  userProfile: 'https://api.spotify.com/v1/me'
};

// Helper function to generate Spotify auth URL
export const getSpotifyAuthUrl = (state) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: spotifyConfig.clientId,
    scope: spotifyConfig.scopes,
    redirect_uri: spotifyConfig.redirectUri,
    state: state || ''
  });
  
  return `${spotifyEndpoints.auth}?${params.toString()}`;
};
