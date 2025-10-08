import { NextRequest, NextResponse } from 'next/server'

// Use Edge runtime for better performance
export const runtime = 'edge'

/**
 * Discord OAuth2 Login Route
 * Redirects user to Discord authorization page with required scopes
 * Implements CSRF protection using state parameter
 */
export async function GET(request: NextRequest) {
  // Read environment variables
  const clientId = process.env.DISCORD_CLIENT_ID
  const redirectUri = process.env.DISCORD_REDIRECT_URI

  // Validate environment variables exist
  if (!clientId || !redirectUri) {
    return new Response('Server configuration error', { status: 500 })
  }

  // Generate secure random state parameter for CSRF protection
  const state = crypto.randomUUID()

  // Required scopes: identify (user info) and guilds.members.read (server membership with roles)
  const scopes = ['identify', 'guilds.members.read'].join(' ')

  // Construct Discord OAuth2 authorization URL
  const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize')
  discordAuthUrl.searchParams.set('client_id', clientId)
  discordAuthUrl.searchParams.set('redirect_uri', `${redirectUri}/callback`)
  discordAuthUrl.searchParams.set('response_type', 'code')
  discordAuthUrl.searchParams.set('scope', scopes)
  discordAuthUrl.searchParams.set('state', state)

  // Create response with redirect
  const response = NextResponse.redirect(discordAuthUrl.toString())
  
  // Check if request is HTTPS for secure cookie
  const isSecure = request.url.startsWith('https://')
  
  // Store state in cookie for validation (expires in 5 minutes)
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 300,
    path: '/'
  })

  return response
}
