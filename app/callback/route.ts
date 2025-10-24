import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// OAuth callback handler - validates and transfers user data
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const code = params.get('code')
  const state = params.get('state')
  
  // Load environment variables
  const mainDomain = process.env.MAIN_DOMAIN
  const callbackPath = process.env.CALLBACK_PATH
  const errorUrl = process.env.ERROR_URL || `https://dc-auth-err.pages.dev?msg=`
  const clientId = process.env.DISCORD_CLIENT_ID
  const clientSecret = process.env.DISCORD_CLIENT_SECRET
  const authDomain = process.env.AUTH_DOMAIN

  if (!mainDomain || !callbackPath || !errorUrl || !clientId || !clientSecret || !authDomain) {
    return new Response('Server configuration error: missing required environment variables', { status: 500 })
  }

  // Helper to build error redirect URL
  const buildErrorUrl = (message: string): string => {
    return `${errorUrl}${encodeURIComponent(message)}`
  }

  // Helper to clear OAuth cookies
  const clearOAuthCookies = (response: NextResponse): NextResponse => {
    response.cookies.delete('babaji')
    return response
  }

  let goto = ''
  let stateBabaji = ''
  
  // Decode and validate state parameter
  try {
    if (!state) {
      const response = NextResponse.redirect(buildErrorUrl('Missing state parameter'))
      return clearOAuthCookies(response)
    }
    
    const decoded = JSON.parse(atob(state))
    if (!Array.isArray(decoded) || decoded.length !== 2) {
      const response = NextResponse.redirect(buildErrorUrl('Invalid state format'))
      return clearOAuthCookies(response)
    }
    
    goto = decoded[0] || ''
    stateBabaji = decoded[1]
  } catch (error) {
    const response = NextResponse.redirect(buildErrorUrl('Invalid state encoding'))
    return clearOAuthCookies(response)
  }

  // Verify CSRF token matches cookie
  const cookieBabaji = request.cookies.get('babaji')?.value
  
  if (!stateBabaji || !cookieBabaji || stateBabaji !== cookieBabaji) {
    const response = NextResponse.redirect(buildErrorUrl('Session expired or invalid, please try again'))
    return clearOAuthCookies(response)
  }

  if (!code) {
    const response = NextResponse.redirect(buildErrorUrl('Missing auth code'))
    return clearOAuthCookies(response)
  }

  try {
    // Exchange auth code for access token
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
        redirect_uri: `https://${authDomain}/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      const response = NextResponse.redirect(buildErrorUrl('Token exchange failed'))
      return clearOAuthCookies(response)
    }

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      const response = NextResponse.redirect(buildErrorUrl('Token exchange failed'))
      return clearOAuthCookies(response)
    }

    // Verify identify scope is granted
    const scopes = tokenData.scope ? tokenData.scope.split(' ') : []
    if (!scopes.includes('identify')) {
      const response = NextResponse.redirect(buildErrorUrl('Required scope missing'))
      return clearOAuthCookies(response)
    }

    // Fetch user profile from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      const response = NextResponse.redirect(buildErrorUrl('Failed to fetch your profile, please retry'))
      return clearOAuthCookies(response)
    }

    const user = await userResponse.json()

    if (!user.id || !user.username) {
      const response = NextResponse.redirect(buildErrorUrl('Invalid user data'))
      return clearOAuthCookies(response)
    }

    // Prepare user data - send all Discord user data directly
    const userData = {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      global_name: user.global_name,
      avatar: user.avatar,
      mfa_enabled: user.mfa_enabled,
      banner: user.banner,
      accent_color: user.accent_color,
      locale: user.locale,
      flags: user.flags,
      premium_type: user.premium_type,
      public_flags: user.public_flags,
      avatar_decoration_data: user.avatar_decoration_data,
      authAt: new Date().toISOString()
    }

    // Generate acknowledgment token for popup communication
    const ack = `ACK-${Math.random().toString(36).slice(2)}`
    
    // Load authentication HTML
    const authPage = await fetch(new URL('../assets/authenticate.html', import.meta.url)).then(r => r.text())
    
    const callbackUrl = `https://${mainDomain}${callbackPath}`
    const mainOrigin = `https://${mainDomain}`
    const gotoPath = goto || '/'
    
    // Inject data into HTML
    const html = authPage
      .replace('{CALLBACK_URL}', JSON.stringify(callbackUrl))
      .replace('{MAIN_ORIGIN}', JSON.stringify(mainOrigin))
      .replace('{USER_DATA}', JSON.stringify(userData))
      .replace('{GOTO}', JSON.stringify(gotoPath))
      .replace('{ACK}', JSON.stringify(ack))
      .replace('{ERROR_URL}', JSON.stringify(errorUrl))

    const tempResponse = new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
    
    const response = new NextResponse(tempResponse.body, {
      headers: tempResponse.headers,
      status: tempResponse.status
    })
    
    return clearOAuthCookies(response)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const response = NextResponse.redirect(buildErrorUrl(errorMessage))
    return clearOAuthCookies(response)
  }
}