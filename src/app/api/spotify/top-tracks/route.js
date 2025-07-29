import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '../../auth/authOptions'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.accessToken) {
      console.log('No session or access token found:', { session: !!session, accessToken: !!session?.accessToken })
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    console.log('Making request to Spotify API with token:', session.accessToken?.substring(0, 10) + '...')
    
    const response = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term', {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error from Spotify API:', response.status, response.statusText, errorText)
      return NextResponse.json(
        { error: `Error al obtener datos de Spotify: ${response.status} ${response.statusText}` }, 
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Spotify API response:', { totalItems: data.items?.length, hasItems: !!data.items })
    
    if (!data.items || data.items.length === 0) {
      return NextResponse.json({
        tracks: [],
        total: 0,
        message: 'No se encontraron top tracks. Asegúrate de tener historial de escucha en Spotify.'
      })
    }
    
    // Filtrar canciones que tengan preview_url
    const tracksWithPreviews = data.items.filter(track => track.preview_url)
    console.log('Tracks with previews:', tracksWithPreviews.length, 'out of', data.items.length)
    
    return NextResponse.json({
      tracks: tracksWithPreviews,
      total: tracksWithPreviews.length,
      totalOriginal: data.items.length
    })
    
  } catch (error) {
    console.error('Error en la API de top tracks:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    )
  }
}
