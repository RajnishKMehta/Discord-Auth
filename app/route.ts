import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// Main OAuth login route - redirects to Discord authorization
export async function GET(request: NextRequest) {
  // Load environment variables
  const mainDomain = process.env.MAIN_DOMAIN
  const callbackPath = process.env.CALLBACK_PATH
  const errorUrl = process.env.ERROR_URL || `https://dc-auth-err.pages.dev?msg=`
  const clientId = process.env.DISCORD_CLIENT_ID
  const clientSecret = process.env.DISCORD_CLIENT_SECRET
  const authDomain = process.env.AUTH_DOMAIN
  const guildId = process.env.DISCORD_GUILD_ID 
  const roleId = process.env.ROLE_ID

  // Check all required env vars are present
  if (!mainDomain || !callbackPath || !errorUrl || !clientId || !clientSecret || !authDomain || !guildId || !roleId) {
    return new Response(`Server configuration error: missing required environment variables\n\n\nif you are visitor: check back in few hours or inform the owner if you know her/him\n\nif you are owner: add .env file like this in environment variables section:\nDISCORD_CLIENT_ID=discord_bot_clientId\nDISCORD_CLIENT_SECRET=discord_bot_client_secret\nAUTH_DOMAIN=this stie domain\nDISCORD_GUILD_ID=discord server\nROLE_ID=RoleId\nMAIN_DOMAIN=your main website domain\nCALLBACK_PATH=callback path from main website\nERROR_URL=error page url like https://dc-auth-err.pages.dev?msg`, { status: 500 })
  }

  // Get redirect path from URL params
  const baigan = request.nextUrl.searchParams
  const goto = baigan.get('to') || baigan.get('goto') || baigan.get('redirect') || '/'

  // Validate redirect to prevent open redirect attacks
  const validatedGoto = (goto && goto.startsWith('/') && !goto.startsWith('//')) ? goto : ''

  // Generate CSRF token
  const babaji = `RJ_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;

  // Create state parameter with redirect path and CSRF token
  const infodata = [validatedGoto, babaji];
  const state = btoa(JSON.stringify(infodata));

  // Discord OAuth scopes needed
  const scopes = ['identify', 'guilds.members.read'].join(' ')

  // Build Discord authorization URL
  const discordAuthUrl = new URL('https://discord.com/api/oauth2/authorize')
  discordAuthUrl.searchParams.set('client_id', clientId)
  discordAuthUrl.searchParams.set('redirect_uri', `https://${authDomain}/callback`)
  discordAuthUrl.searchParams.set('response_type', 'code')
  discordAuthUrl.searchParams.set('scope', scopes)
  discordAuthUrl.searchParams.set('state', state)

  // Redirect to Discord
  const response = NextResponse.redirect(discordAuthUrl.toString())
  const isSecure = request.url.startsWith('https://')

  // Save CSRF token in secure cookie
  response.cookies.set('babaji', babaji, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 300, // 5 minutes
    path: '/'
  })

  return response
};