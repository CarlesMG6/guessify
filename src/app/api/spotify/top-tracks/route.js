import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '../../auth/authOptions'

export async function GET() {
  console.log('=== TOP TRACKS API CALLED ===')
  try {
    const session = await getServerSession(authOptions)
    console.log('Session check:', { 
      hasSession: !!session, 
      hasAccessToken: !!session?.accessToken,
      tokenPrefix: session?.accessToken?.substring(0, 10) + '...'
    })
    
    if (!session || !session.accessToken) {
      console.log('No session or access token found:', { session: !!session, accessToken: !!session?.accessToken })
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('Making request to Spotify API...')
    const spotifyUrl = 'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term'
    console.log('Spotify URL:', spotifyUrl)
    
    const response = await fetch(spotifyUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    console.log('Spotify API response status:', response.status, response.statusText)
    console.log('Spotify API response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error from Spotify API:', response.status, response.statusText, errorText)
      return NextResponse.json(
        { 
          error: `Error al obtener datos de Spotify: ${response.status} ${response.statusText}`,
          details: errorText
        }, 
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Spotify API full response:', JSON.stringify(data, null, 2))
    console.log('Spotify API response summary:', { 
      totalItems: data.items?.length, 
      hasItems: !!data.items,
      dataKeys: Object.keys(data)
    })
    
    if (!data.items || data.items.length === 0) {
      console.log('No items found in Spotify response')
      return NextResponse.json({
        tracks: [],
        total: 0,
        totalOriginal: 0,
        message: 'No se encontraron top tracks. Asegúrate de tener historial de escucha en Spotify.',
        rawResponse: data
      })
    }
    
    // Devolver todas las canciones, no solo las que tienen preview
    const allTracks = data.items
    const tracksWithPreviews = data.items.filter(track => track.preview_url)
    console.log('Total tracks:', allTracks.length, 'Tracks with previews:', tracksWithPreviews.length)
    
    const result = {
      tracks: allTracks, // Cambio: devolver todas las canciones
      total: allTracks.length,
      totalWithPreviews: tracksWithPreviews.length
    }
    
    console.log('Returning result:', { 
      tracksCount: result.tracks.length, 
      total: result.total, 
      totalWithPreviews: result.totalWithPreviews
    })
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('=== ERROR in TOP TRACKS API ===')
    console.error('Error details:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error.message,
        stack: error.stack
      }, 
      { status: 500 }
    )
  }
}
