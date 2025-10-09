# Discord OAuth Authentication Service

A lightweight, serverless Discord OAuth2 authentication service built with Next.js. This service validates Discord server membership and redirects users to your frontend application with their profile information.

## Features

- 🔐 **Secure OAuth2 Flow** - CSRF protection with state parameter validation
- 🚀 **Serverless Architecture** - Edge Runtime for optimal performance
- ✅ **Guild Membership Validation** - Verify users belong to your Discord server
- 🎯 **Role Verification** - Check if users have specific roles in your server
- 🔄 **Seamless Integration** - Easy to integrate with any frontend application
- 🛡️ **Security First** - HttpOnly cookies, environment-based configuration
- ⚡ **Fast & Lightweight** - Minimal dependencies, maximum performance

## How It Works

1. User visits your authentication service
2. Automatically redirects to Discord OAuth2 authorization
3. User authorizes and Discord redirects back
4. Service validates guild membership and role verification
5. Redirects to your frontend with user data including verification status (or error message)

## Prerequisites

- Node.js 18+ or compatible runtime
- Discord Application with OAuth2 credentials
- Discord Server (Guild) ID for membership validation

## Installation

```bash
# Clone the repository
git clone https://github.com/KnarliX/Discord-Auth.git
cd Discord-Auth

# Install dependencies
pnpm install
# or
npm install
```

## Configuration

Create a `.env.local` file in the root directory:

```env
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=https://your-domain.com
DISCORD_GUILD_ID=your_discord_server_id
VERIFIED_ROLE_ID=your_verified_role_id
CALLBACK_URL=https://your-frontend-domain.com/verification/callback
ERROR_URL=https://your-frontend-domain.com/verification/error?msg
```

### Getting Discord Credentials

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select existing one
3. Navigate to OAuth2 settings
4. Copy your Client ID and Client Secret
5. Add your redirect URI: `https://your-domain.com/callback` (your base domain + `/callback`)
6. Get your Discord Server ID by enabling Developer Mode in Discord and right-clicking your server
7. Get the Role ID by right-clicking on the role in your server settings (Developer Mode must be enabled)

**Important:** 
- Your Discord bot must be present in the server for the role verification to work with the `guilds.members.read` scope.
- The `DISCORD_REDIRECT_URI` should be your base domain (without `/callback`). The service automatically appends `/callback`.
- The `CALLBACK_URL` should be the complete callback URL where users will be redirected after successful authentication.
- The `ERROR_URL` should include the `?msg` parameter at the end (e.g., `https://example.com/error?msg`). The error message will be appended after the `=` sign.

## Usage

### Development

```bash
pnpm dev
```

The service will run on `http://localhost:5000`

### Production

```bash
pnpm build
pnpm start
```

## API Routes

### `GET /`
Initiates OAuth flow by redirecting to Discord authorization page.

**Response:** `307 Redirect` to Discord OAuth

### `GET /callback`
Handles OAuth callback from Discord.

**Query Parameters:**
- `code` - Authorization code from Discord
- `state` - CSRF protection token

**Success Response:** `307 Redirect` to `{CALLBACK_URL}?name={name}&id={id}&username={username}&avatar={avatar_hash}&verified={true|false}`

**Note:** 
- The redirect goes to the exact URL specified in `CALLBACK_URL` with query parameters appended
- The `avatar` parameter contains only the Discord avatar hash. Construct the full URL on frontend as: `https://cdn.discordapp.com/avatars/{id}/{avatar}.webp`

**Error Response:** `307 Redirect` to `{ERROR_URL}={error_message}`

**Note:**
- The `ERROR_URL` should be configured with the `?msg` parameter included (e.g., `https://your-domain.com/error?msg`)
- The error message will be appended after the `=` sign with proper URL encoding

## Integration Example

### Frontend Implementation

```javascript
// Handle success callback
const params = new URLSearchParams(window.location.search);
const displayName = params.get('name');
const userId = params.get('id');
const username = params.get('username');
const avatarHash = params.get('avatar');
const isVerified = params.get('verified') === 'true';

// Build avatar URL from hash
const avatarUrl = avatarHash 
  ? `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.webp`
  : `https://cdn.discordapp.com/embed/avatars/${parseInt('0') % 5}.webp`;

// Use the user data in your application
console.log('Authenticated user:', { displayName, userId, username, avatarUrl, isVerified });

// Show different UI based on verification status
if (isVerified) {
  console.log('User has the verified role!');
} else {
  console.log('User does not have the verified role');
}
```

### Error Handling

```javascript
// Handle error callback
const params = new URLSearchParams(window.location.search);
const errorMessage = params.get('msg');

if (errorMessage) {
  console.error('Authentication error:', errorMessage);
  // Show error to user
}
```

## Deployment

This service can be deployed to any platform that supports Next.js:

- ***[Cloudflare](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create/pages)*** (Recommended & I'm using)
- **[Vercel](https://vercel.com)** (Recommended)
- **Netlify**
- **Railway** (not recommend for this)
- Or any Node.js hosting platform

### Environment Variables

Make sure to set all required environment variables in your deployment platform.

## Security

- ✅ State parameter for CSRF protection
- ✅ HttpOnly cookies with configurable security
- ✅ Environment-based secure flag (HTTPS in production)
- ✅ 5-minute cookie expiration
- ✅ No hardcoded credentials
- ✅ Proper error handling and validation

## Error Messages

| Error | Description |
|-------|-------------|
| `Missing code` | Authorization code not received from Discord |
| `Invalid or missing state parameter` | CSRF validation failed |
| `Token exchange failed` | Failed to exchange code for access token |
| `Required scopes missing` | User didn't grant necessary permissions (identify, guilds.members.read) |
| `Failed to fetch user profile` | Couldn't retrieve user information |
| `Invalid user data` | User data is incomplete or invalid |
| `Invalid member data` | Couldn't retrieve user's role information |
| `You are not a member of the required Discord server. Please join our server first.` | User is not a member of required Discord server |

## OAuth Scopes

This service uses the following Discord OAuth2 scopes:
- **identify** - Retrieve user's Discord profile information
- **guilds.members.read** - Check user's guild membership and roles

**Note:** The `guilds.members.read` scope requires your Discord bot to be present in the server. This scope replaces the need for the `guilds` scope and provides more detailed member information including roles.

**Looking for the old version without role verification?** Check out commit [a536dab](../../tree/a536dab04815f298de7c7df49ca8e34deb5dd6ad) which only validates guild membership without checking for specific roles.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please [open an issue](../../issues) on GitHub.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Uses [Discord OAuth2 API](https://discord.com/developers/docs/topics/oauth2)

---

Made with ❤️ for the Discord community and [janvi's Discord server](https://joindc.pages.dev)
