# 🎬 Digital Signage System

A modern digital signage application built with React and Node.js, featuring content management, playlist creation, and emergency messaging capabilities.

## 🏗️ Architecture

- **Frontend**: React dashboard and TV player (deployed on Vercel)
- **Backend**: Zoho Catalyst functions (auth, content, playlist, emergency, etc.)
- **Database**: Zoho Catalyst Data Store
- **File Storage**: Zoho Catalyst File Store

## 🚀 Quick Start

### Frontend (Dashboard)
```bash
cd web-clients/dashboard
npm install
npm start
```

### Frontend (TV Player)
```bash
cd web-clients/tv-player
npm install
npm start
```

## 📁 Project Structure

```
├── functions/                 # Catalyst backend functions
│   ├── auth/                 # Authentication
│   ├── content/              # Content management
│   ├── playlist/             # Playlist management
│   ├── emergency/            # Emergency messages
│   ├── settings/             # System settings
│   ├── media-upload/         # File upload handling
│   └── zoho-integration/     # Zoho Cliq integration
├── web-clients/              # Frontend applications
│   ├── dashboard/            # Admin dashboard
│   └── tv-player/           # TV display application
└── catalyst.json             # Catalyst project configuration
```

## 🔧 Backend Functions

All functions are deployed on Zoho Catalyst and include CORS headers for cross-origin requests.

- **`/auth`** - User authentication and management
- **`/content`** - Content CRUD operations
- **`/playlist`** - Playlist creation and management
- **`/emergency`** - Emergency message system
- **`/settings`** - System configuration
- **`/media-upload`** - File upload handling
- **`/zoho-integration`** - Zoho Cliq bot integration

## 🌐 Frontend Applications

### Dashboard
- Content management interface
- Playlist creation and scheduling
- Emergency message system
- User management
- System settings

### TV Player
- Content display application
- Playlist playback
- Emergency message overlay
- Responsive design for various screen sizes

## 🚀 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Automatic deployment on every push

### Backend (Catalyst)
```bash
catalyst deploy
```

## 🔑 Environment Variables

Create `.env` files in each frontend application:

```bash
REACT_APP_API_BASE_URL=https://your-catalyst-domain.catalystserverless.in
```

## 📱 Features

- ✅ **Content Management** - Upload, organize, and manage media files
- ✅ **Playlist Creation** - Create dynamic playlists with scheduling
- ✅ **Emergency Messages** - Override normal content with urgent information
- ✅ **User Authentication** - Secure access control
- ✅ **Responsive Design** - Works on all device sizes
- ✅ **Real-time Updates** - Live content synchronization

## 🛠️ Tech Stack

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Zoho Catalyst
- **Database**: Zoho Catalyst Data Store
- **Deployment**: Vercel (frontend), Catalyst (backend)

## 📄 License

This project is proprietary software. 