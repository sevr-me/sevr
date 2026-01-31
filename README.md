# SEVR

A privacy-first tool to discover all services linked to your Gmail account. Scanning happens entirely in your browser — your emails never leave your device.

## Features

- **Gmail Scanning**: Discovers services from verification, welcome, and password reset emails
- **Privacy First**: Gmail API calls go directly from your browser to Google — emails never touch the server
- **End-to-End Encryption**: Your service list is encrypted in your browser before syncing
- **Community Guides**: User-contributed guides for changing email on each service
- **Admin Dashboard**: Monitor signups, user stats, and activity in real-time

## Requirements

- Node.js 18+
- A Google Cloud project with Gmail API enabled
- A domain with HTTPS (for production)
- Optional: [Resend](https://resend.com) account for sending OTP emails

## Google Cloud Setup

Before running the app, you need to configure Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a new project

2. Enable the Gmail API:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Gmail API" and click "Enable"

3. Configure OAuth consent screen:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Select "External" user type
   - Fill in app name and support email
   - Add scope: `https://www.googleapis.com/auth/gmail.readonly`
   - Add your email as a test user

4. Create OAuth credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Select "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)
   - Save the **Client ID**

5. Add the Client ID to your environment:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

## Development

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..

# Start frontend (terminal 1)
npm run dev

# Start backend (terminal 2)
cd server && npm run dev
```

Open http://localhost:5173

OTP codes are logged to the server console when `RESEND_API_KEY` is not set.

## Production Deployment

### 1. Clone and install

```bash
git clone https://github.com/yourusername/sevr.git
cd sevr

# Install dependencies
npm install
cd server && npm install && cd ..
```

### 2. Configure environment

Create the environment files:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

Edit `.env` (frontend):

```bash
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Edit `server/.env` (backend):

```bash
# Required: Generate a secure secret
# Run: openssl rand -hex 32
JWT_SECRET=your-64-character-random-string

# Optional: Admin users (comma-separated emails)
ADMIN_EMAILS=admin@example.com

# Optional: Email delivery via Resend
# Without this, OTP codes are logged to console
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com
```

### 3. Build the frontend

```bash
npm run build
```

This creates a `dist/` folder with the static frontend files.

### 4. Start the server

For production, use a process manager like PM2:

```bash
npm install -g pm2

cd server
NODE_ENV=production pm2 start src/index.js --name sevr
```

Or with systemd, create `/etc/systemd/system/sevr.service`:

```ini
[Unit]
Description=SEVR
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/sevr/server
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable sevr
sudo systemctl start sevr
```

The server runs on port 3001 by default.

### Docker Deployment (Raspberry Pi / Self-hosted)

For running on a Raspberry Pi or any machine on your internal network:

#### 1. Create a Cloudflare Tunnel

1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. Navigate to **Networks** → **Tunnels**
3. Click **Create a tunnel** → Select **Cloudflared**
4. Name your tunnel (e.g., "sevr")
5. Copy the tunnel token (starts with `eyJ...`)
6. Configure a public hostname:
   - Subdomain: `sevr` (or your choice)
   - Domain: Select your Cloudflare domain
   - Service: `http://app:3001`

#### 2. Configure environment

Create a `.env` file in the project root:

```bash
# Required
JWT_SECRET=your-64-character-random-string
CLOUDFLARE_TUNNEL_TOKEN=eyJ...your-tunnel-token

# Optional: Email delivery via Resend
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=noreply@yourdomain.com
```

#### 3. Build and run

```bash
# Build for your architecture (arm64 for Raspberry Pi 4/5)
docker compose build

# Run with Cloudflare Tunnel
docker compose --profile tunnel up -d
```

The `--profile tunnel` flag enables the cloudflared service. Without it, only the app runs (useful for local development or if using a different reverse proxy).

#### 4. Update Google OAuth

Add your tunnel hostname (e.g., `https://sevr.yourdomain.com`) to the authorized JavaScript origins in Google Cloud Console.

### 5. Configure reverse proxy

Alternatively, use Caddy, nginx, or another reverse proxy for HTTPS.

**Caddy** (automatic HTTPS):

```
yourdomain.com {
    reverse_proxy localhost:3001
}
```

**nginx**:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. Redeployment

To pull updates and redeploy:

```bash
./deploy.sh
```

This pulls from git, reinstalls dependencies, rebuilds the frontend, and restarts PM2.

### 7. Update Google OAuth

Add your production domain to the authorized JavaScript origins in Google Cloud Console.

## Environment Variables

**Frontend** (`.env`):

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Yes | Google OAuth Client ID |

**Backend** (`server/.env`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | - | Secret for signing tokens. Use `openssl rand -hex 32` |
| `PORT` | No | 3001 | Server port |
| `DATABASE_PATH` | No | `./data/sevr.db` | SQLite database location |
| `JWT_EXPIRES_IN` | No | 15m | Access token expiry |
| `REFRESH_EXPIRES_IN` | No | 30d | Refresh token expiry |
| `ADMIN_EMAILS` | No | - | Comma-separated admin emails |
| `RESEND_API_KEY` | No | - | Resend API key for sending OTP emails |
| `EMAIL_FROM` | No | - | From address for OTP emails |

**Docker** (`.env` in project root):

| Variable | Required | Description |
|----------|----------|-------------|
| `CLOUDFLARE_TUNNEL_TOKEN` | For tunnel | Token from Cloudflare Zero Trust dashboard |

## Admin Dashboard

Users with emails listed in `ADMIN_EMAILS` see an "Admin" button in the header.

The dashboard shows:
- Total users and community guides count
- User growth chart over time
- Geographic distribution of users
- Real-time activity feed (signups, guide edits)

Admins cannot access individual user data or encrypted content.

## Security

**Gmail Access**
- Read-only access to email metadata (sender, subject)
- OAuth token stays in browser, never sent to backend
- API calls go directly to Google

**End-to-End Encryption**
- Key derived from password using PBKDF2 (100,000 iterations)
- Data encrypted with AES-256-GCM before upload
- Server stores only encrypted blobs
- Recovery key for account recovery

**Server Storage**
- Email address (for login)
- Encrypted service list (unreadable without password)
- Community guides (shared, unencrypted)

**Not Stored**
- Gmail tokens
- Email content
- Encryption passwords

## License

MIT
