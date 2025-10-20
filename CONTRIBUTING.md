# Contributing to Discord OAuth Authentication Service

Thank you for considering contributing to this project! We welcome contributions from everyone.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your feature or bug fix
4. Make your changes
5. Test your changes thoroughly
6. Commit your changes with clear, descriptive messages
7. Push to your fork
8. Submit a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/Discord-Auth.git
cd Discord-Auth

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Add your Discord credentials to .env.local
# Make sure to include:
# - DISCORD_CLIENT_ID
# - DISCORD_CLIENT_SECRET
# - AUTH_DOMAIN (authentication domain without https://, e.g., auth.example.com)
# - MAIN_DOMAIN (main website domain without https://, e.g., example.com)
# - CALLBACK_PATH (callback path on main domain, e.g., /callback)
# - ERROR_URL (error page URL with ?msg parameter, e.g., https://example.com/error?msg=)

# Run development server
pnpm dev
```

## Code Standards

- **TypeScript**: All code should be written in TypeScript
- **Edge Runtime**: API routes should use Edge Runtime when possible
- **Security**: Never commit sensitive credentials or API keys
- **Comments**: Add comments for complex logic
- **Error Handling**: Implement proper error handling and validation
- **No React Components**: This project uses pure API endpoints with HTML templates

## Ready-to-Use Templates

The project includes pre-built templates in **[`templates/`](templates/)** directory that you can use for testing and integration:

### Available Templates

- **[`templates/callback.html`](templates/callback.html)** - Callback page for main domain
  - Handles postMessage communication with auth domain
  - Saves user data to localStorage
  - Sends acknowledgment back to auth domain
  - Includes timeout protection and error handling
  - Beautiful animated loading UI
  
- **[`templates/errormsg.html`](templates/errormsg.html)** - Error page template
  - Beautiful UI with smooth animations
  - Supports Discord-style formatting (bold, italic, links)
  - Click-to-copy error codes
  - Fully responsive design
  - Perfect for production use

### Using Templates for Testing

1. **For callback page testing:**
   - Copy **[`templates/callback.html`](templates/callback.html)** to your test main domain
   - Update the `auth_origin` variable to match your `AUTH_DOMAIN`
   - Deploy and test the full authentication flow
   - Verify data is saved to localStorage correctly

2. **For error page testing:**
   - Use **[`templates/errormsg.html`](templates/errormsg.html)** as your error page
   - Test various error scenarios
   - Verify formatting and error code display

## Testing Your Changes

Before submitting a Pull Request:

1. Test the OAuth flow end-to-end
2. Verify error handling works correctly
3. Test with different Discord user accounts
4. Ensure no console errors or warnings
5. Test with both development and production builds
6. Verify the popup-based data transfer works correctly
7. Test timeout and acknowledgment mechanisms
8. Test with the provided templates

## Pull Request Process

1. Update the README.md if you've added new features
2. Ensure your code follows the existing code style
3. Describe your changes clearly in the PR description
4. Reference any related issues
5. Wait for review and address any feedback

## Reporting Bugs

When reporting bugs, please include:

- Description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, browser, etc.)
- Error messages or screenshots if applicable

**Report bugs:** [here](../../issues)

## Feature Requests

We welcome feature requests! Please:

- Check if the feature already exists or is planned
- Describe the feature and its use case
- Explain why it would be valuable
- Consider if it aligns with the project's security-first approach

**Submit feature requests:** [here](../../issues)

## Questions?

Feel free to [open an issue](../../issues) for questions or discussions.

## Code of Conduct

Be respectful and constructive in all interactions. We're all here to learn and build together.

---

Thank you for contributing! 🎉
