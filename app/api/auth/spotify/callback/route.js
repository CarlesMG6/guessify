import { spotifyConfig, spotifyEndpoints } from '../../../../../lib/spotify';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return Response.redirect(new URL(`/?error=${error}`, request.url));
  }

  if (!code) {
    return Response.redirect(new URL('/?error=no_code', request.url));
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch(spotifyEndpoints.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${spotifyConfig.clientId}:${spotifyConfig.clientSecret}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: spotifyConfig.redirectUri
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    // Get user profile
    const profileResponse = await fetch(spotifyEndpoints.userProfile, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = await profileResponse.json();

    // Get user's top tracks for different time ranges
    const topTracksPromises = ['short_term', 'medium_term', 'long_term'].map(async (timeRange) => {
      const response = await fetch(spotifyEndpoints.topTracks(timeRange), {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { timeRange, tracks: data.items };
      }
      return { timeRange, tracks: [] };
    });

    const topTracksResults = await Promise.all(topTracksPromises);
    const topTracks = {};
    
    topTracksResults.forEach(result => {
      topTracks[result.timeRange] = result.tracks.map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists,
        album: {
          name: track.album.name,
          images: track.album.images
        },
        preview_url: track.preview_url,
        external_urls: track.external_urls
      }));
    });

    // Create user data object
    const userData = {
      id: profile.id,
      spotifyId: profile.id,
      nombre: profile.display_name,
      email: profile.email,
      imageUrl: profile.images[0]?.url,
      topTracks_short: topTracks.short_term || [],
      topTracks_medium: topTracks.medium_term || [],
      topTracks_long: topTracks.long_term || [],
      spotifyTokens: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type
      }
    };

    // Create a success page with the user data
    const successPage = `
<!DOCTYPE html>
<html>
<head>
    <title>Spotify Authentication Successful</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: rgb(0, 0, 0);
            color: white;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 10px;
            max-width: 400px;
        }
        .spinner {
            border: 3px solid #333;
            border-top: 3px solid #1db954;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
    </div>
    
    <script>
        // Store user data in localStorage
        const userData = ${JSON.stringify(userData)};
        localStorage.setItem('spotify_user_data', JSON.stringify(userData));
        localStorage.setItem('spotify_auth_success', 'true');
        
        // Get redirect URL from localStorage or default to main page
        const redirectUrl = localStorage.getItem('spotify_redirect_after_auth') || '/';
        
        // Clear the redirect URL from localStorage
        localStorage.removeItem('spotify_redirect_after_auth');
        
        // Redirect to the stored URL or main page
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1500);
    </script>
</body>
</html>`;

    return new Response(successPage, {
      headers: {
        'Content-Type': 'text/html'
      }
    });

  } catch (error) {
    console.error('Spotify auth error:', error);
    return Response.redirect(new URL(`/?error=auth_failed&message=${encodeURIComponent(error.message)}`, request.url));
  }
}
