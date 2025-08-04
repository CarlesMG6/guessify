import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '../../auth/authOptions'

export async function GET() {
  console.log('=== TOP TRACKS API CALLED ===')
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.accessToken) {
      console.log('No session or access token found:', { session: !!session, accessToken: !!session?.accessToken })
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const spotifyUrl = 'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term'
    const response = await fetch(spotifyUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

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
    
    if (!data.items || data.items.length === 0) {
      return NextResponse.json({
        tracks: [],
        total: 0,
        totalOriginal: 0,
        message: 'No se encontraron top tracks. Asegúrate de tener historial de escucha en Spotify.',
        rawResponse: data
      })
    }
    
    // Devolver todas las canciones (para usar con Spotify SDK)
    const allTracks = data.items
    
    const result = {
      tracks: allTracks,
      total: allTracks.length,
      totalOriginal: data.items.length
    }
    
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
