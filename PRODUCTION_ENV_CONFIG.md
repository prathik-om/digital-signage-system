# Production Environment Configuration

## Dashboard Environment Variables

Create `.env.production` in `web-clients/dashboard/`:

```bash
REACT_APP_API_BASE_URL=https://atrium-60045083855.development.catalystserverless.in
REACT_APP_ZOHO_CLIENT_ID=your_production_client_id_here
REACT_APP_ZOHO_REDIRECT_URI=https://your-dashboard-domain.com/auth/callback
NODE_ENV=production
```

## TV Player Environment Variables

Create `.env.production` in `web-clients/tv-player/`:

```bash
REACT_APP_API_BASE_URL=https://atrium-60045083855.development.catalystserverless.in
NODE_ENV=production
```

## Vercel Environment Variables

For Vercel deployment, set these in the Vercel dashboard:

- `REACT_APP_API_BASE_URL`: `https://atrium-60045083855.development.catalystserverless.in`
- `REACT_APP_ZOHO_CLIENT_ID`: Your production Zoho client ID
- `REACT_APP_ZOHO_REDIRECT_URI`: Your production callback URL
- `NODE_ENV`: `production`
