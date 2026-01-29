# SEVR 

A privacy-first tool to discover all services linked to your Gmail account. Scan happens entirely in your browser — your emails never leave your device. Optional end-to-end encrypted cloud sync.

## Features

- **Gmail Scanning**: Discovers services from verification, welcome, and password reset emails
- **Smart Sorting**: Sort by frequency, filter spam/marketing senders, hide inactive services
- **Community Guides**: User-contributed guides for changing email on each service (Markdown)
- **End-to-End Encryption**: Your service list is encrypted before leaving your browser
- **Cross-Device Sync**: Sign in to sync your progress across devices
- **Recovery Options**: Recovery key backup and password reset options
- **Self-Hostable**: Deploy on your own server, Raspberry Pi, or cloud

## How It Works

1. Authenticate with Google (read-only access to email headers only)
2. The app scans your inbox locally for account-related emails
3. Results are sorted by frequency with spam detection
4. Optionally sign in to encrypt and sync your data

**Your emails never touch any server.** Gmail API calls go directly from your browser to Google.

## Quick Start (Development)

```bash
# Frontend
npm install
npm run dev

# Backend (in separate terminal)
cd server
npm install
npm run dev
```

Open http://localhost:5173

## Google Cloud Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **Gmail API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Gmail API" → Click "Enable"

### 2. Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Fill in required fields (app name, support email)
4. Add scope: `https://www.googleapis.com/auth/gmail.readonly`
5. Add test users (your Gmail address)

### 3. Create OAuth Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: **Web application**
4. Add Authorized JavaScript origins:
   - `http://localhost:5173` (Vite dev)
   - `http://localhost:3001` (Docker)
   - Your production domain
5. Copy the **Client ID** and update `src/App.jsx`

## Production Deployment

### Docker (Recommended)

```bash
# Create environment file
cp .env.example .env
# Edit .env and set JWT_SECRET (required!)
openssl rand -hex 32  # Generate a secure secret

# Build and run
docker compose up -d
```

The app will be available at http://localhost:3001

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret for signing tokens (min 32 chars) |
| `JWT_EXPIRES_IN` | No | Access token expiry (default: 15m) |
| `REFRESH_EXPIRES_IN` | No | Refresh token expiry (default: 30d) |
| `DATABASE_PATH` | No | SQLite database path |
| `SMTP_*` | No | Email settings for OTP (see .env.example) |

### Raspberry Pi

Works on Pi 3/4/5 (ARM64). Build directly on the Pi or use multi-arch images:

```bash
# On a faster machine, build multi-arch
docker buildx build --platform linux/amd64,linux/arm64 \
  -t yourusername/sevr:latest --push .

# On the Pi
docker compose up -d
```

### Reverse Proxy (HTTPS)

Put nginx, Caddy, or Traefik in front for SSL. Example Caddy config:

```
yourdomain.com {
    reverse_proxy localhost:3001
}
```

## Security

### Gmail Access
- Read-only access to email headers (sender, subject)
- Token stays in your browser, never sent to backend
- API calls go directly to Gmail, not through our server

### End-to-End Encryption
- Password-derived key using PBKDF2 (100,000 iterations)
- Data encrypted with AES-256-GCM before upload
- Server stores only encrypted blobs — cannot read your data
- Recovery key generated for account recovery

### What's Stored on Server
- Your email address (for login)
- Encrypted service list (unreadable without your password)
- Encryption salt and verifier
- Community guides (shared, not encrypted)

### What's NOT Stored
- Your Gmail access token
- Your emails or email content
- Your encryption password

See the in-app Security FAQ for more details.

## Limitations

- Only scans emails matching common account patterns
- May miss services without standard verification emails
- Oldest emails may not be indexed by Gmail search
- Requires JavaScript enabled

## Development

```bash
# Frontend (Vite)
npm run dev

# Backend (Express)
cd server && npm run dev

# Build for production
npm run build
docker build -t sevr .
```

### Project Structure

```
├── src/                  # React frontend
│   ├── App.jsx          # Main application
│   ├── crypto.js        # E2E encryption utilities
│   └── App.css          # Styles
├── server/              # Express backend
│   └── src/
│       ├── index.js     # Server entry
│       ├── db.js        # SQLite database
│       ├── auth.js      # Authentication
│       └── routes/      # API routes
├── Dockerfile           # Production build
└── docker-compose.yml   # Docker deployment
```

## License

MIT
