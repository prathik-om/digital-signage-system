# Zoho OAuth Setup Guide

## Step 1: Create a Zoho Developer Account

1. Go to [Zoho Developer Console](https://api-console.zoho.com/)
2. Sign in with your Zoho account or create a new one
3. Click on "Add Client" to create a new OAuth client

## Step 2: Configure OAuth Client

1. **Client Name**: Digital Signage Dashboard
2. **Client Type**: Web-based
3. **Homepage URL**: `http://localhost:3000`
4. **Authorized Redirect URIs**: `http://localhost:3000/auth/callback`
5. **Scope**: `openid profile email phone`

## Step 3: Get Your Credentials

After creating the client, you'll get:
- **Client ID**: A long string like `1000.XXXXXXXXXXXXXX`
- **Client Secret**: A long string like `XXXXXXXXXXXXXXXXXXXXXXXXX`

## Step 4: Set Up Environment Variables

Create a `.env` file in your dashboard directory with:

```env
# Zoho OAuth Configuration
REACT_APP_ZOHO_CLIENT_ID=your_client_id_here
REACT_APP_ZOHO_REDIRECT_URI=http://localhost:3000/auth/callback

# API Configuration
REACT_APP_API_BASE_URL=https://atrium-60045083855.development.catalystserverless.in
```

## Step 5: Set Up Backend Environment Variables

For your Catalyst functions, you'll also need to set environment variables for the backend:

```env
ZOHO_CLIENT_ID=your_client_id_here
ZOHO_CLIENT_SECRET=your_client_secret_here
```

## Step 6: Test the Setup

1. Start your development server: `npm start`
2. Go to `http://localhost:3000`
3. You should be redirected to the login page
4. Click "Sign in with Zoho"
5. You'll be redirected to Zoho for authentication
6. After successful login, you'll be redirected back to your dashboard

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI"**: Make sure the redirect URI in your Zoho client matches exactly: `http://localhost:3000/auth/callback`

2. **"Invalid client"**: Double-check your Client ID and Client Secret

3. **"Access denied"**: Make sure you've granted the required permissions in Zoho

4. **CORS errors**: The backend is already configured with CORS headers

### What is OAuth?

**OAuth** (Open Authorization) is a secure way for users to sign in to your application using their existing accounts from other services (like Zoho, Google, Facebook, etc.).

**How it works:**
1. User clicks "Sign in with Zoho"
2. They're redirected to Zoho's login page
3. After entering their credentials, Zoho sends them back to your app with a special code
4. Your app exchanges this code for an access token
5. Using the access token, your app can get the user's information
6. User is now logged in!

**Benefits:**
- No need to create new passwords
- Enhanced security
- Quick and easy sign-in process
- Users trust established platforms like Zoho
