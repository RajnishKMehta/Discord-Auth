import { NextRequest, NextResponse } from 'next/server'

// Use Edge runtime for better performance
export const runtime = 'edge'

/**
 * Discord OAuth2 Callback Route
 * Handles the OAuth callback from Discord:
 * 1. Validates authorization code
 * 2. Exchanges code for access token
 * 3. Fetches user profile and guild membership
 * 4. Validates guild membership
 * 5. Redirects based on validation results
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  // Validate all required environment variables
  const callbackUrl = process.env.CALLBACK_URL
  const errorUrl = process.env.ERROR_URL
  const clientId = process.env.DISCORD_CLIENT_ID
  const clientSecret = process.env.DISCORD_CLIENT_SECRET
  const redirectUri = process.env.DISCORD_REDIRECT_URI
  const guildId = process.env.DISCORD_GUILD_ID
  const verifiedRoleId = process.env.VERIFIED_ROLE_ID

  if (!callbackUrl || !errorUrl || !clientId || !clientSecret || !redirectUri || !guildId || !verifiedRoleId) {
    return new Response('Server configuration error: missing required environment variables', { status: 500 })
  }

  // Helper function to build error redirect URL with proper encoding (using %20 for spaces)
  const buildErrorUrl = (message: string): string => {
    return `${errorUrl}=${encodeURIComponent(message)}`
  }

  // Helper function to clear oauth cookie
  const clearOAuthCookie = (response: NextResponse): NextResponse => {
    response.cookies.delete('oauth_state')
    return response
  }

  // Step 1: Validate state parameter for CSRF protection
  const storedState = request.cookies.get('oauth_state')?.value
  
  if (!state || !storedState || state !== storedState) {
    const response = NextResponse.redirect(buildErrorUrl('Invalid or missing state parameter'))
    return clearOAuthCookie(response)
  }

  // Step 2: Validate that authorization code exists
  if (!code) {
    const response = NextResponse.redirect(buildErrorUrl('Missing code'))
    return clearOAuthCookie(response)
  }

  try {
    // Step 3: Exchange authorization code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${redirectUri}/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      const response = NextResponse.redirect(buildErrorUrl('Token exchange failed'))
      return clearOAuthCookie(response)
    }

    const tokenData = await tokenResponse.json()

    // Step 4: Validate access token exists
    if (!tokenData.access_token) {
      const response = NextResponse.redirect(buildErrorUrl('Token exchange failed'))
      return clearOAuthCookie(response)
    }

    // Step 5: Validate required scopes (identify and guilds.members.read)
    const scopes = tokenData.scope ? tokenData.scope.split(' ') : []
    if (!scopes.includes('identify') || !scopes.includes('guilds.members.read')) {
      const response = NextResponse.redirect(buildErrorUrl('Required scopes missing'))
      return clearOAuthCookie(response)
    }

    // Step 6: Fetch user profile from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      const response = NextResponse.redirect(buildErrorUrl('Failed to fetch user profile'))
      return clearOAuthCookie(response)
    }

    const user = await userResponse.json()

    // Step 7: Validate user data
    if (!user.id || !user.username) {
      const response = NextResponse.redirect(buildErrorUrl('Invalid user data'))
      return clearOAuthCookie(response)
    }

    // Step 8: Fetch user's guild member information (includes roles)
    const memberResponse = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    // Step 9: Check if user is member of the required guild
    if (!memberResponse.ok) {
      const response = NextResponse.redirect(buildErrorUrl('You are not in our server please join janvi\'s server first'))
      return clearOAuthCookie(response)
    }

    const member = await memberResponse.json()

    // Step 10: Validate member data
    if (!member.roles || !Array.isArray(member.roles)) {
      const response = NextResponse.redirect(buildErrorUrl('Invalid member data'))
      return clearOAuthCookie(response)
    }

    // Step 11: Check if user has the verified role
    const hasVerifiedRole = member.roles.includes(verifiedRoleId)

    // Step 12: Build success redirect URL with user data
    // Get display name (global_name or username as fallback)
    const displayName = user.global_name || user.username

    // Construct success callback URL with user parameters
    const successUrl = new URL(callbackUrl)
    successUrl.searchParams.set('name', displayName)
    successUrl.searchParams.set('id', user.id)
    successUrl.searchParams.set('username', user.username)
    successUrl.searchParams.set('avatar', user.avatar || '')
    successUrl.searchParams.set('verified', hasVerifiedRole.toString())

    // Redirect to frontend with user data and clear oauth cookie
    const response = NextResponse.redirect(successUrl.toString())
    return clearOAuthCookie(response)

  } catch (error) {
    // Handle any unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const response = NextResponse.redirect(buildErrorUrl(errorMessage))
    return clearOAuthCookie(response)
  }
}