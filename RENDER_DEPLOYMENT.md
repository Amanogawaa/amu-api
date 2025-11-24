# Deploying Server to Render

This guide will help you deploy your Express/Bun API server to Render.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub/GitLab/Bitbucket Repository**: Your code should be in a Git repository
3. **Environment Variables**: Have all your environment variables ready (see below)

## Quick Deploy via Render Dashboard

### Step 1: Create a New Web Service

1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your Git repository (if not already connected)
4. Select your repository

### Step 2: Configure the Service

Fill in the service configuration:

- **Name**: `amu-api` (or your preferred name)
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: `amu-api` (if your repo contains both client and server)
- **Runtime**: `Other` (we'll use Bun)
- **Build Command**: `bun install`
- **Start Command**: `bun run src/server.ts`
- **Plan**: Choose Free or Starter (Free has limitations)

### Step 3: Configure Environment Variables

In the Render dashboard, go to your service → **Environment** tab and add:

#### Required Environment Variables

```env
# Application
NODE_ENV=production
PORT=10000

# JWT Configuration
JWT_SECRET=your-very-secure-jwt-secret-at-least-32-characters-long

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Firebase Admin SDK Configuration
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_PROVIDER_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
FIREBASE_UNIVERSE_DOMAIN=googleapis.com

# CORS Configuration
CORS_ORIGINS=https://your-app.vercel.app,https://your-custom-domain.com

# Optional
COOKIE_NAME=FIREBASE_COOKIE_JWT
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

**Important Notes:**
- `PORT` must be set to `10000` (Render's default) or use `process.env.PORT`
- `FIREBASE_PRIVATE_KEY` must include the full key with `\n` for newlines
- `CORS_ORIGINS` should include your Vercel domain and any custom domains
- Never commit these values to Git

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies using `bun install`
   - Start your server with `bun run src/server.ts`
3. Your API will be live at `https://your-service-name.onrender.com`

## Important Configuration Details

### Port Configuration

Render automatically sets the `PORT` environment variable. Your server should use it:

```typescript
// Your server.ts already uses config.port which reads from process.env.PORT
// Make sure your config defaults to 10000 or uses process.env.PORT
```

### Firebase Private Key Format

When setting `FIREBASE_PRIVATE_KEY` in Render:

1. Copy the entire private key from your `service_account.json`
2. Keep the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines
3. Replace actual newlines with `\n` (Render will interpret this)
4. Or paste the key as-is if Render supports multiline values

**Example:**
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### CORS Configuration

Update `CORS_ORIGINS` to include:
- Your Vercel deployment URL: `https://your-app.vercel.app`
- Your custom domain (if any): `https://app.yourdomain.com`
- Local development (optional): `http://localhost:3000`

**Example:**
```
CORS_ORIGINS=https://amu-client.vercel.app,https://app.amu.com,http://localhost:3000
```

## Using Render Blueprint (Infrastructure as Code)

Create a `render.yaml` file in your repository root:

```yaml
services:
  - type: web
    name: amu-api
    runtime: other
    plan: free
    buildCommand: bun install
    startCommand: bun run src/server.ts
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: JWT_SECRET
        sync: false  # Set manually in dashboard
      - key: GEMINI_API_KEY
        sync: false
      - key: FIREBASE_TYPE
        value: service_account
      - key: FIREBASE_PROJECT_ID
        sync: false
      # Add all other environment variables
      # Use sync: false for sensitive values
```

Then:
1. Go to **Dashboard** → **New** → **Blueprint**
2. Connect your repository
3. Render will read `render.yaml` and create the service

## Custom Domain Setup

1. Go to your service → **Settings** → **Custom Domains**
2. Add your domain (e.g., `api.yourdomain.com`)
3. Follow Render's DNS configuration instructions
4. Update your Vercel client's `NEXT_PUBLIC_API_URL` to use the custom domain

## Continuous Deployment

Render automatically deploys when you push to your Git repository:

- **Auto-Deploy**: Enabled by default
- **Manual Deploy**: Go to **Manual Deploy** tab to deploy specific commits
- **Deploy Hooks**: Create webhooks for external triggers

### Branch Configuration

- **Production**: Deploys from your default branch (usually `main`)
- **Preview**: Create separate services for preview/staging environments

## Health Checks

Render automatically checks if your service is healthy:

1. Your server should have a health endpoint (check if you have `/health` route)
2. Render will ping this endpoint periodically
3. If it fails, Render will restart your service

### Adding a Health Check Endpoint

If you don't have one, add to your `src/app.ts`:

```typescript
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

## Environment Variables Management

### Setting Variables

1. Go to your service → **Environment** tab
2. Click **"Add Environment Variable"**
3. Enter key and value
4. Click **"Save Changes"** (triggers a new deployment)

### Secret Management

For sensitive values:
- Use Render's **Secret Files** feature for `service_account.json`
- Or use environment variables (recommended for this setup)
- Never commit secrets to Git

### Environment-Specific Variables

You can create separate services for:
- **Production**: `amu-api`
- **Staging**: `amu-api-staging`

Each with different environment variables.

## Monitoring and Logs

### View Logs

1. Go to your service → **Logs** tab
2. View real-time logs
3. Download logs for analysis
4. Filter by time range

### Metrics

1. Go to **Metrics** tab
2. View:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

### Alerts

1. Go to **Alerts** tab
2. Set up email/Slack notifications for:
   - Service failures
   - High error rates
   - Resource limits

## Troubleshooting

### Service Won't Start

1. **Check Logs**: Go to **Logs** tab for error messages
2. **Common Issues**:
   - Missing environment variables
   - Port configuration issues
   - Build command failures
   - Missing dependencies

### Build Fails

1. **Check Build Logs**: Look for dependency installation errors
2. **Verify Build Command**: Should be `bun install`
3. **Check Bun Version**: Render uses the latest Bun by default

### Environment Variables Not Working

1. **Verify Variable Names**: Must match exactly (case-sensitive)
2. **Check Private Key Format**: Ensure `\n` is used for newlines
3. **Redeploy**: After adding env vars, trigger a manual deploy

### CORS Errors

1. **Check CORS_ORIGINS**: Must include your Vercel domain
2. **Verify Format**: Comma-separated, no spaces (or with spaces, depending on your parser)
3. **Check Server Logs**: Look for CORS-related errors

### Firebase Connection Issues

1. **Verify Service Account**: Check all `FIREBASE_*` variables are set
2. **Check Private Key**: Ensure it's properly formatted with `\n`
3. **Verify Project ID**: Must match your Firebase project

### Socket.io Issues

1. **WebSocket Support**: Render supports WebSockets on paid plans
2. **Free Plan Limitations**: WebSockets may have limitations on free tier
3. **Check CORS**: Ensure WebSocket origins are allowed

## Free Plan Limitations

The Render free plan has some limitations:

- **Spins Down**: Service sleeps after 15 minutes of inactivity
- **Cold Starts**: First request after sleep takes longer
- **WebSocket Support**: Limited on free tier
- **Bandwidth**: 100GB/month
- **Build Time**: 90 minutes/month

**Upgrade to Starter ($7/month)** for:
- Always-on service
- Better WebSocket support
- More resources

## Scaling

### Horizontal Scaling

1. Go to **Settings** → **Scaling**
2. Enable **Auto-Scaling**
3. Set min/max instances
4. Configure scaling rules

### Vertical Scaling

1. Go to **Settings** → **Plan**
2. Upgrade to a higher plan
3. More CPU and memory resources

## Backup and Recovery

### Database Backups

If you're using a database:
1. Go to **Dashboard** → **New** → **PostgreSQL** (or your DB)
2. Enable automatic backups
3. Configure backup retention

### Environment Variables Backup

1. Export all environment variables
2. Store securely (password manager, encrypted file)
3. Document in secure location

## Security Best Practices

1. **Never Commit Secrets**: Use environment variables only
2. **Rotate Secrets**: Regularly update JWT_SECRET and API keys
3. **Use HTTPS**: Render provides SSL certificates automatically
4. **Enable Security Headers**: Already configured in your app
5. **Rate Limiting**: Already configured in your app
6. **CORS**: Restrict to known origins only

## Next Steps

1. ✅ Deploy to Render
2. ✅ Set all environment variables
3. ✅ Configure CORS with your Vercel domain
4. ✅ Test API endpoints
5. ✅ Set up monitoring and alerts
6. ✅ Configure custom domain (optional)

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render Web Services](https://render.com/docs/web-services)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Bun on Render](https://render.com/docs/runtime#bun)


