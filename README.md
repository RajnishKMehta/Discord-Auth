# Discord OAuth Authentication Service

A lightweight, serverless Discord OAuth2 authentication service built with Next.js. This service validates Discord server membership and securely transfers user data to your frontend application using popup-based authentication.

## Features

- 🔐 **Secure OAuth2 Flow** - CSRF protection with state parameter validation
- 🚀 **Serverless Architecture** - Edge Runtime for optimal performance
- ✅ **Guild Membership Validation** - Verify users belong to your Discord server
- 🎯 **Role Verification** - Check if users have specific roles in your server
- 🔄 **Seamless Integration** - Easy to integrate with any frontend application
- 🛡️ **Security First** - Secure data transfer via postMessage, HttpOnly cookies
- ⚡ **Fast & Lightweight** - Minimal dependencies, maximum performance
- 🪟 **Popup-Based Authentication** - Avoids localStorage partitioning issues

## How It Works

1. User visits your authentication service
2. Automatically redirects to Discord OAuth2 authorization
3. User authorizes and Discord redirects back
4. Service validates guild membership and role verification
5. Shows authentication screen where user clicks to continue
6. Opens popup window to securely transfer data via postMessage API
7. User data is saved to localStorage on your main domain
8. User is redirected to your frontend after successful authentication

## Prerequisites

- Node.js 18+ or compatible runtime
- Discord Application with OAuth2 credentials
- Discord Server (Guild) ID for membership validation

## Installation

1. Clone the repository
2. Install dependencies
- `pnpm install` or `npm install`

## Configuration

Create a `.env.local` file in the root directory:

```env
DISCORD_CLIENT_ID=discord bot clientId
DISCORD_CLIENT_SECRET=discord Bot client secret
AUTH_DOMAIN=auth.example.com (this service domain)
DISCORD_GUILD_ID=Discord serverId
ROLE_ID=verified_role_id
MAIN_DOMAIN=example.com (website domain)
CALLBACK_PATH=callback
ERROR_URL=error url like this https://dc-auth-err.pages.dev?msg= (optional)
```

### Getting Discord Credentials

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select existing one
3. Navigate to OAuth2 settings
4. Copy your Client ID and Client Secret
5. Add your redirect URI: `https://auth.example.com/callback` (your auth domain + `/callback`)
6. Get your Discord Server ID by enabling Developer Mode in Discord and right-clicking your server
7. Get the Role ID by right-clicking on the role in your server settings (Developer Mode must be enabled)

**Important:** 
- Your Discord bot must be present in the server for the role verification to work with the `guilds.members.read` scope.
- `AUTH_DOMAIN`: is your authentication service (this service) domain (without `https://` or `/callback`). Example: `auth.example.com`
- `MAIN_DOMAIN`: is your main website domain (without `https://`). Example: `example.com`
- `CALLBACK_PATH`: is the path (page) on your main domain where the callback receiver is located. Must start with `/`. Example: `/callback` or `/auth/callback`
- The `ERROR_URL`(optional): should include the `?msg=` parameter at the end with the `=` sign (e.g., `https://dc-auth-err.pages.dev?msg=`). The error message will be appended directly. 

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

**Optional Query Parameters:**
- `to` - Redirect path after successful authentication (e.g., `/?to=/dashboard` will redirect to `https://{MAIN_DOMAIN}/dashboard` after auth)

**Response:** `307 Redirect` to Discord OAuth

**Example Usage:**
- `https://auth.example.com/` - Redirects to `https://example.com/` after auth
- `https://auth.example.com/?to=/dashboard` - Redirects to `https://example.com/dashboard` after auth
- `https://auth.example.com/?goto=/profile/settings` - Redirects to `https://example.com/profile/settings` after auth

### `GET /callback`
Handles OAuth callback from Discord and securely transfers user data using popup-based postMessage.

**Query Parameters:**
- `code` - Authorization code from Discord
- `state` - CSRF protection token

**Success Response:** 
Serves an HTML page that:
1. Displays a continue screen prompting user to click anywhere or press any key
2. Opens a popup window to your main domain's callback page
3. Sends user data via `postMessage()` to the popup
4. Waits for acknowledgment from the main domain
5. Redirects to `https://{MAIN_DOMAIN}` (or specified path) after successful data transfer

**User Data Sent via postMessage:**
```json
{
  "type": "auth",
  "ack": "random_string",
  "userData": {
    "userid": "1212719184870383621",
    "username": "Janvidreamer",
    "name": "Janvi Mehta",
    "avatar": "a1cf882453857e...",
    "banner": null,
    "accent_color": 2523036,
    "avatar_decoration_data": {
    "asset": "a_64c339e0c8dcb.......",
    "sku_id": "1400667489.....",
    "expires_at": 1761433200
    },
    "verified": {true||false},
    "authAt": "2025-01-07T17:14:00.000Z"
  },
  "goto": "/dashboard"
}
```

**Error Response:** `307 Redirect` to `{ERROR_URL}={error_message}`

**Note:**
- The `avatar` field contains only the Discord avatar hash. Construct the full URL as: `https://cdn.discordapp.com/avatars/{userid}/{avatar}.webp`
- The `ERROR_URL` should be configured with the `?msg=` parameter included (e.g., `https://example.com/error?msg=`)
- User data is never exposed in URL parameters for security
- Popup-based authentication prevents localStorage partitioning issues in modern browsers

## Integration Example

### Frontend Implementation

**Step 1:** Create a callback receiver page at `https://{MAIN_DOMAIN}{CALLBACK_PATH}`

```javascript
// Listen for authentication messages from auth domain
const TRUSTED_AUTH_ORIGIN = 'https://auth.example.com';

window.addEventListener('message', (event) => {
  // Verify message origin
  if (event.origin !== TRUSTED_AUTH_ORIGIN) return;
  
  const message = event.data || {};
  
  // Handle auth message
  if (message.type === 'auth' && message.userData && message.ack) {
    // Save user data to localStorage
    localStorage.setItem('discord_auth_data', JSON.stringify(message.userData));
    
    // Send acknowledgment back
    event.source.postMessage(
      { type: 'auth-ack', ack: message.ack },
      event.origin
    );
    
    // Try to close popup, or redirect if can't close
    setTimeout(() => {
      try {
        window.close();
        setTimeout(() => {
          if (!window.closed) {
            window.location.href = message.goto || '/';
          }
        }, 100);
      } catch (e) {
        window.location.href = message.goto || '/';
      }
    }, 100);
  }
});
```

**Step 2:** Use the stored authentication data in your app

```javascript
// Retrieve stored auth data
const authData = JSON.parse(localStorage.getItem('discord_auth_data') || 'null');

if (authData) {
  const { userid, username, name, avatar, verified } = authData;
  
  // Build avatar URL from hash
  const avatarUrl = avatar 
    ? `https://cdn.discordapp.com/avatars/${userid}/${avatar}.webp`
    : `https://cdn.discordapp.com/embed/avatars/0.webp`;
    
  console.log('Authenticated user:', { name, username, avatarUrl, verified });
  
  // Show different UI based on verification status
  if (verified) {
    console.log('User has the verified role!');
  } else {
    console.log('User does not have the verified role');
  }
}
```

**Step 3:** Redirect users to auth service

```javascript
// Redirect to auth service
const authUrl = 'https://auth.example.com';

// Without redirect path (goes to homepage after auth)
window.location.href = authUrl;

// OR with redirect path (goes to specific page after auth)
const returnPath = '/dashboard';
window.location.href = `${authUrl}?to=${returnPath}`;
```

### Error Handling

```javascript
// Handle error from URL parameter
const urlParams = new URLSearchParams(window.location.search);
const errorMessage = urlParams.get('msg');

if (errorMessage) {
  console.error('Authentication error:', errorMessage);
  // Display error to user
}
```

### Complete Example Files

See the `templates` folder for complete implementations:
- [templates/callback.html](../main/templates/callback.html) - Complete callback receiver page
- [templates/errormsg.html](../main/templates/errormsg.html) - Error page implementation
- [templates/error-simple.html](../main/templates/error-simple.html) - Simple error page template

## Security

- ✅ **Secure Data Transfer** - Uses postMessage API with popup windows instead of URL parameters
- ✅ **CSRF Protection** - State parameter validation with secure cookies
- ✅ **Origin Verification** - postMessage communication restricted to trusted domains only
- ✅ **HttpOnly Cookies** - Secure session management with configurable security flags
- ✅ **No Data in URLs** - User information never exposed in URL parameters or browser history
- ✅ **Environment-based Configuration** - HTTPS enforcement in production
- ✅ **Time-limited Sessions** - 5-minute cookie expiration for auth flow
- ✅ **Proper Error Handling** - Comprehensive validation at every step
- ✅ **Popup-based Authentication** - Avoids localStorage partitioning issues in modern browsers

## License

This project is licensed under the MIT License - see the [LICENSE](../main/LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Uses [Discord OAuth2 API](https://discord.com/developers/docs/topics/oauth2)

---

Made with ❤️ for the [janvi's Discord server](https://joindc.pages.dev)