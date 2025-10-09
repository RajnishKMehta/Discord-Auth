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
# - DISCORD_REDIRECT_URI (base domain without /callback)
# - DISCORD_GUILD_ID
# - VERIFIED_ROLE_ID
# - CALLBACK_URL (full callback URL with /verification/callback)
# - ERROR_URL (error page URL with ?msg parameter, e.g., https://example.com/error?msg)

# Run development server
pnpm dev
```

## Code Standards

- **TypeScript**: All code should be written in TypeScript
- **Edge Runtime**: API routes should use Edge Runtime when possible
- **Security**: Never commit sensitive credentials or API keys
- **Comments**: Add comments for complex logic
- **Error Handling**: Implement proper error handling and validation

## Testing Your Changes

Before submitting a Pull Request:

1. Test the OAuth flow end-to-end
2. Verify error handling works correctly
3. Test role verification feature with users who have and don't have the verified role
4. Ensure the `verified` parameter is correctly passed in the callback URL
5. Ensure no console errors or warnings
6. Test with both development and production builds
7. Verify that your Discord bot is in the server for `guilds.members.read` scope to work

## Pull Request Process

1. Update the README.md if you've added new features
2. Ensure your code follows the existing code style
3. Describe your changes clearly in the PR description
4. Reference any related issues

## Reporting Bugs

When reporting bugs, please include:

- Description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment details (OS, Node version, etc.)

## Feature Requests

We welcome feature requests! Please:

- Check if the feature already exists or is planned
- Describe the feature and its use case
- Explain why it would be valuable

## Questions?

Feel free to open an issue for questions or discussions.

## Code of Conduct

Be respectful and constructive in all interactions. We're all here to learn and build together.
