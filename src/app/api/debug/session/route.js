import { getServerSession } from 'next-auth/next'
import { NextResponse } from 'next/server'
import { authOptions } from '../../auth/authOptions'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      hasSession: !!session,
      sessionKeys: session ? Object.keys(session) : [],
      hasAccessToken: !!session?.accessToken,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      accessTokenPrefix: session?.accessToken?.substring(0, 20) + '...',
      expiresAt: session?.expiresAt
    })
    
  } catch (error) {
    console.error('Error checking session:', error)
    return NextResponse.json(
      { error: 'Error checking session', details: error.message }, 
      { status: 500 }
    )
  }
}
