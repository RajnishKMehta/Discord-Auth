# Discord OAuth Authentication Service

A lightweight, serverless Discord OAuth2 authentication service built with Next.js that securely transfers user data to frontend applications using popup-based postMessage architecture.

## ✨ Features

- 🔐 **Secure OAuth2 Flow** - Industry-standard Discord OAuth implementation
- 🚀 **Edge Runtime** - Blazing fast with Next.js Edge Runtime
- 🔒 **Popup-based Transfer** - Secure postMessage architecture (no URL exposure)
- 🎯 **Simple Integration** - Easy to integrate with any frontend application
- 🛡️ **CSRF Protection** - Built-in state validation with secure cookies
- ⚡ **Stateless** - No database required
- 🌐 **Cross-Domain** - Works seamlessly across different domains
- 📦 **Complete User Data** - All Discord user profile data forwarded directly

## 🚨 Security

This version uses **secure popup-based postMessage** for transferring authentication data, eliminating security vulnerabilities present in older versions that exposed user data in URL parameters.

### Why Popup-based?

- **No URL Exposure**: User data never appears in URL parameters
- **No localStorage Partitioning**: Works around browser storage isolation
- **Acknowledgment System**: Ensures data is received before proceeding
- **Timeout Protection**: Automatic fallback if transfer fails

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Discord Application Credentials
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Domain Configuration
AUTH_DOMAIN=auth.example.com
MAIN_DOMAIN=example.com

# Callback Configuration
CALLBACK_PATH=/callback
ERROR_URL=https://example.com/error?msg=
```

### Variable Descriptions

| Variable | Description | Example |
|----------|-------------|---------|
| `DISCORD_CLIENT_ID` | Your Discord application client ID | `123456789012345678` |
| `DISCORD_CLIENT_SECRET` | Your Discord application client secret | `abc123def456...` |
| `AUTH_DOMAIN` | Authentication service domain (without https://) | `auth.example.com` |
| `MAIN_DOMAIN` | Your main application domain (without https://) | `example.com` |
| `CALLBACK_PATH` | Callback endpoint path on main domain | `/callback` |
| `ERROR_URL` | Error page URL with message parameter support | `https://example.com/error?msg=` |

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
# or
npm install
# or
yarn install
```

### 2. Set Up Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select an existing one
3. Navigate to OAuth2 section
4. Add redirect URI: `https://YOUR_AUTH_DOMAIN/callback`
5. Copy Client ID and Client Secret

### 3. Configure Environment Variables

Create `.env.local` file with your Discord credentials and domain configuration (see above).

### 4. Run Development Server

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

### 5. Build for Production

```bash
pnpm build
# or
npm run build
# or
yarn build
```

## 📖 How It Works

### Authentication Flow

1. User visits: `https://auth.example.com/?to=/dashboard`
2. Redirected to Discord OAuth authorization
3. After approval, Discord redirects back to auth domain
4. Auth service validates OAuth code and fetches user data
5. Continue screen is displayed
6. User clicks or presses any key to proceed
7. Popup window opens to `https://example.com/callback`
8. User data is transferred via secure postMessage
9. Main domain saves data to localStorage
10. Popup closes automatically
11. User is redirected to the intended page

### Data Transfer Security

- **CSRF Protection**: Random token validation prevents cross-site attacks
- **Origin Validation**: Only whitelisted domains can receive data
- **HTTP-Only Cookies**: Tokens stored securely, inaccessible to JavaScript
- **Acknowledgment System**: Ensures data receipt before proceeding
- **Timeout Mechanisms**: Automatic error handling if transfer fails

## 📊 User Data Structure

The service returns all Discord user profile data:

```typescript
{
  id: string                    // User's Discord ID
  username: string              // Username
  discriminator: string         // User discriminator (legacy)
  global_name: string           // Display name
  avatar: string                // Avatar hash
  mfa_enabled: boolean          // MFA enabled
  banner: string                // Banner hash
  accent_color: number          // Accent color
  locale: string                // User locale
  flags: number                 // User flags
  premium_type: number          // Nitro subscription type
  public_flags: number          // Public flags
  avatar_decoration_data: any   // Avatar decoration
  authAt: string                // Authentication timestamp
}
```

### Example Response

Here's a real example of the data structure you'll receive:

```json
{
  "id": "1212719184870383621",
  "username": "janvidreamer",
  "discriminator": "7876",
  "global_name": "Janvi Mehta",
  "avatar": "a1cf882453857e.....",
  "mfa_enabled": true,
  "banner": null,
  "accent_color": 2523036,
  "locale": "en-US",
  "flags": 4194368,
  "premium_type": 0,
  "public_flags": 4194368,
  "avatar_decoration_data": {
    "asset": "a_64c339e0c8dcb.......",
    "sku_id": "1400667489.....",
    "expires_at": 1761433200
  },
  "authAt": "2025-01-07T17:14:00.000Z"
}
```

### Using Discord CDN Assets

#### Avatar URL

To display user avatars, use Discord's CDN:

```javascript
const avatarUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.webp?size=4096`;
```

**Available sizes:** 16, 32, 64, 128, 256, 512, 1024, 2048, 4096

**Format options:** `.png`, `.jpg`, `.webp`, `.gif` (if animated)

#### Avatar Decoration

If user has an avatar decoration:

```javascript
if (userData.avatar_decoration_data) {
  const decorationUrl = `https://cdn.discordapp.com/avatar-decoration-presets/${userData.avatar_decoration_data.asset}.png`;
}
```

**Important:** Avatar decorations shown with `.png` extension, but if the decoration is animated, the actual format is `.apng` (Animated PNG). The CDN will serve the correct format automatically.

## 📦 Ready-to-Use Templates

We provide pre-built HTML templates in the **[`templates/`](templates/)** directory that you can directly use:

### Available Templates

- **[`templates/callback.html`](templates/callback.html)** - Callback page for your main domain
  - Handles postMessage communication with auth domain
  - Saves user data to localStorage
  - Sends acknowledgment back
  - Includes timeout protection and error handling
  - Beautiful animated loading UI

- **[`templates/errormsg.html`](templates/errormsg.html)** - Error page template
  - Beautiful error page with animations
  - Supports Discord-style formatting (bold, italic, links)
  - Click-to-copy error codes
  - Fully responsive design

## 🔌 Integration Guide

### Quick Integration Steps

1. **Copy the callback template** to your main domain at the path specified in `CALLBACK_PATH`
2. **Update the origin** in `templates/callback.html`:
   ```javascript
   const auth_origin = 'https://your-auth-domain.com';
   ```
3. **Deploy and test** the authentication flow

### Understanding the Callback Page

The callback page listens for authentication data using postMessage:

```javascript
// Listen for auth data from the auth domain
window.addEventListener('message', (event) => {
  // Verify origin for security
  if (event.origin !== auth_origin) return;
  
  const { userData, goto, ack } = event.data;
  
  // Save to localStorage
  localStorage.setItem('login_data', JSON.stringify(userData));
  
  // Send acknowledgment
  event.source.postMessage({ ack }, event.origin);
  
  // Redirect
  window.location.href = goto || '/';
});
```

**📁 Full implementation with error handling and timeout protection:** See **[`templates/callback.html`](templates/callback.html)**

### Initiating Authentication

```html
<a href="https://auth.example.com/?to=/dashboard">Login with Discord</a>
```

## 🛠️ Tech Stack

- **Next.js 15.5+** - Framework with Edge Runtime support
- **TypeScript 5.9+** - Type safety
- **Discord OAuth2 API** - Authentication provider

## 📝 Required Discord Scope

- `identify` - Access to user profile information

This scope provides:
- User ID, username, discriminator
- Avatar, banner, accent color
- Locale, flags, premium type
- And all other basic profile data

## Deployment

This service can be deployed to any platform that supports Next.js:

- ***[Cloudflare](https://dash.cloudflare.com/?to=/:account/workers-and-pages/create/pages)*** (Recommended & I'm using)
- **[Vercel](https://vercel.com)** (Recommended)
- **Netlify**
- **Railway** (not recommend for this)
- Or any Node.js hosting platform

## 🐛 Troubleshooting

### Common Issues

**1. CORS Errors**
- Ensure `MAIN_DOMAIN` and `AUTH_DOMAIN` are correctly configured
- Verify origin validation in postMessage handlers

**2. Popup Blocked**
- Service includes fallback for popup blockers
- Users may need to allow popups for the auth domain

**3. Authentication Timeout**
- Check network connectivity
- Verify Discord application credentials
- Ensure callback URL matches in Discord Developer Portal

**4. Missing Environment Variables**
- Double-check all required variables are set
- Restart development server after changing `.env.local`

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Report Issues**: [Here](../../issues)
- **Discord Developer Portal**: https://discord.com/developers/applications
- **Next.js Documentation**: https://nextjs.org/docs

## 📚 Old Versions

**⚠️ These versions expose user data in URL parameters and are not recommended for production use:**
- **[Version with Role Verification](../../tree/568479d49cc1193fe1cc44335a60db5f5721f292)** (Unsecure) - Uses URL parameters for data transfer
- **[Version without Role Verification](../../tree/a536dab04815f298de7c7df49ca8e34deb5dd6ad)** (Unsecure) - Basic guild membership validation only

**Current version** uses secure popup-based postMessage for data transfer, eliminating security vulnerabilities present in older versions.

## ⭐ Support

If you find this project helpful, please consider giving it a [star on GitHub](../../stargazers)!

## 📞 Contact

For questions, issues, or feature requests, please [open an issue](../../issues).

---

Made with ❤️ for the Discord community
