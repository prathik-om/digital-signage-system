# Digital Signage App - Working Version Milestone

**Date**: September 18, 2025  
**Version**: Post Google Photos Removal  
**Status**: ✅ Fully Functional  

## 🎯 Overview

This document captures the working state of the Digital Signage application after removing Google Photos functionality. This milestone represents a stable, production-ready version with core functionality intact.

## 🏗️ Architecture Overview

### Frontend Applications
- **Dashboard** (`web-clients/dashboard/`): React-based admin interface
- **TV Player** (`web-clients/tv-player/`): React-based display client for screens

### Backend Services
- **Zoho Catalyst Functions**: Serverless Node.js functions
- **Local Development Proxy**: Express.js proxy for local development
- **Database**: Zoho Catalyst Data Store (SQLite-based)

## 🔧 Key Components

### 1. Authentication System

**Location**: `web-clients/dashboard/src/contexts/AuthContext.js`

**Key Features**:
- OAuth 2.0 integration with Zoho
- Token refresh mechanism
- Protected routes
- User session management

**Critical Logic**:
```javascript
// Token refresh on API calls
const refreshToken = async () => {
  // Automatic token refresh when expired
  // Stores new tokens in localStorage
}

// Protected route wrapper
<ProtectedRoute>
  // Ensures user is authenticated before rendering
</ProtectedRoute>
```

### 2. Local Development Proxy

**Location**: `local-test-proxy.js`

**Purpose**: Routes frontend API calls to Catalyst backend during development

**Key Endpoints**:
- `/content` → `{catalystBaseUrl}/content`
- `/playlist` → `{catalystBaseUrl}/playlist`
- `/media-upload` → `{catalystBaseUrl}/media-upload`
- `/auth` → `{catalystBaseUrl}/auth`
- `/settings` → `{catalystBaseUrl}/settings`
- `/events` → `{catalystBaseUrl}/events`
- `/screens` → `{catalystBaseUrl}/screens`

**Critical Features**:
- CORS handling
- Request/response proxying
- Error handling
- Development logging

### 3. Backend Functions

#### Content Management (`functions/content/index.js`)

**Actions**:
- `getAll`: Fetch all content items
- `create`: Create new content
- `update`: Update existing content
- `delete`: Delete content
- `getDefaultFallbackImage`: Get fallback image configuration
- `updateDefaultFallbackImage`: Update fallback image settings
- `getLiveCliqMessages`: Get Zoho Cliq messages for content

**Key Logic**:
```javascript
// Fallback image system
case 'getDefaultFallbackImage':
  // Retrieves stored fallback image config from content table
  // Falls back to Zoho logo if no config found

case 'updateDefaultFallbackImage':
  // Stores fallback image config in content table
  // Uses 'default_fallback_config' title for identification
```

#### Playlist Management (`functions/playlist/index.js`)

**Actions**:
- `getAll`: Fetch all playlists
- `create`: Create new playlist
- `update`: Update playlist
- `delete`: Delete playlist
- `activate`: Activate a playlist (deactivates others)
- `getActive`: Get currently active playlist

**Key Logic**:
```javascript
// Single active playlist system
case 'activate':
  // Deactivates all other playlists
  // Activates only the selected playlist
  // Ensures only one playlist is active at a time
```

#### Media Upload (`functions/media-upload/index.js`)

**Purpose**: Handle file uploads and media object creation

**Key Features**:
- File upload handling
- Media object creation
- Content-media linking
- Upload status tracking

#### Authentication (`functions/auth/index.js`)

**Purpose**: Handle OAuth authentication and user management

**Key Features**:
- OAuth token validation
- User profile management
- Session handling

## 🗄️ Database Schema

### Content Table
```sql
- ROWID (Primary Key)
- title (Content title)
- content (Content data/URL)
- content_type (image, text, video, etc.)
- user_id (User identifier)
- is_active (Boolean)
- priority_order (Display order)
- duration (Display duration in seconds)
- CREATEDTIME
- MODIFIEDTIME
- CREATORID
```

### Playlists Table
```sql
- ROWID (Primary Key)
- name (Playlist name)
- description (Playlist description)
- items (JSON string of content items)
- duration (Default duration)
- is_active (Boolean - only one can be true)
- CREATEDTIME
- MODIFIEDTIME
- CREATORID
```

### Media Upload Table
```sql
- ROWID (Primary Key)
- file_name (Original filename)
- mime_type (File MIME type)
- size_bytes (File size)
- object_url (File URL)
- stratus_bucket (Storage bucket)
- stratus_object_key (Storage key)
- upload_status (completed, pending, failed)
- content_id (Linked content ROWID)
- is_active (Boolean)
```

## 🎨 Frontend Architecture

### Dashboard Components

#### ContentManager (`src/components/ContentManager.js`)
- Content CRUD operations
- Content preview
- Content categorization
- Zoho Cliq integration

#### PlaylistManager (`src/components/PlaylistManager.js`)
- Playlist CRUD operations
- Content selection for playlists
- Active playlist management
- Fallback image display

#### SettingsManager (`src/components/SettingsManager.js`)
- Fallback image configuration
- URL-based image input
- Quick preset buttons
- Live image preview

#### AuthContext (`src/contexts/AuthContext.js`)
- Authentication state management
- Token refresh logic
- User session handling
- Protected route logic

### TV Player Components

#### ContentPlayer (`src/components/ContentPlayer.js`)
- Content display logic
- Duration management
- Content cycling
- Fallback content handling

#### App.js (TV Player)
- Playlist fetching
- Content cycling logic
- Fallback system
- Error handling

## 🔄 Key Workflows

### 1. Content Creation Workflow
1. User creates content in ContentManager
2. Content stored in `content` table
3. Media objects created in `media_upload` table
4. Content linked to media objects via `content_id`

### 2. Playlist Management Workflow
1. User creates playlist in PlaylistManager
2. User selects content items for playlist
3. Playlist stored in `playlists` table with JSON items
4. Only one playlist can be active at a time

### 3. TV Player Content Display Workflow
1. TV Player fetches active playlist
2. Cycles through playlist items
3. Fetches media objects for each content item
4. Displays content with specified duration
5. Falls back to default content if no active playlist

### 4. Fallback System
**Priority Order**:
1. Active playlist content
2. Zoho Cliq content (if available)
3. Default fallback image (configurable)

## 🚀 Deployment Configuration

### Catalyst Configuration (`catalyst.json`)
```json
{
  "functions": [
    "auth",
    "content", 
    "playlist",
    "media-upload",
    "settings",
    "setup_database_multiuser",
    "zoho-integration",
    "events",
    "screens"
  ]
}
```

### Environment Variables
- `REACT_APP_API_BASE_URL`: API base URL for frontend
- `REACT_APP_ZOHO_CLIENT_ID`: Zoho OAuth client ID
- `REACT_APP_ZOHO_REDIRECT_URI`: OAuth redirect URI

## 🔧 Development Setup

### Local Development
1. Start local proxy: `node local-test-proxy.js`
2. Start dashboard: `cd web-clients/dashboard && npm start`
3. Start TV player: `cd web-clients/tv-player && npm start`

### Production Deployment
1. Deploy functions: `catalyst deploy`
2. Build frontend: `npm run build`
3. Deploy to hosting service (Vercel, etc.)

## 🧪 Testing Endpoints

### Content API
```bash
# Get all content
curl -X POST http://localhost:3001/content \
  -H "Content-Type: application/json" \
  -d '{"action": "getAll"}'

# Get fallback image
curl -X POST http://localhost:3001/content \
  -H "Content-Type: application/json" \
  -d '{"action": "getDefaultFallbackImage"}'
```

### Playlist API
```bash
# Get all playlists
curl -X POST http://localhost:3001/playlist \
  -H "Content-Type: application/json" \
  -d '{"action": "getAll"}'

# Get active playlist
curl -X POST http://localhost:3001/playlist \
  -H "Content-Type: application/json" \
  -d '{"action": "getActive"}'
```

## 🎯 Key Learnings

### 1. Authentication Architecture
- **OAuth 2.0 Flow**: Implemented with automatic token refresh
- **Protected Routes**: React context-based protection
- **Session Management**: localStorage for token persistence

### 2. Proxy Pattern
- **Local Development**: Express.js proxy for API routing
- **CORS Handling**: Proper CORS headers for cross-origin requests
- **Error Handling**: Comprehensive error handling and logging

### 3. Database Design
- **Single Active Playlist**: Only one playlist can be active at a time
- **Content-Media Linking**: Separate tables for content and media objects
- **Fallback System**: Multi-tier fallback for content display

### 4. Frontend Architecture
- **Component Separation**: Clear separation of concerns
- **State Management**: React context for global state
- **Error Boundaries**: Proper error handling in components

### 5. Catalyst Integration
- **Function Deployment**: Individual function deployment
- **Data Store**: SQLite-based database with automatic fields
- **API Gateway**: Automatic endpoint creation

## 🚨 Critical Dependencies

### Frontend Dependencies
- `react`: ^18.2.0
- `react-router-dom`: ^6.8.0
- `lucide-react`: ^0.263.1
- `tailwindcss`: ^3.2.0

### Backend Dependencies
- `@zoho/catalyst-sdk`: Latest version
- `express`: ^4.18.0 (for local proxy)

## 🔄 Reversion Strategy

To revert to this working version:

1. **Restore Files**:
   - All current files are in working state
   - No Google Photos references remain

2. **Database State**:
   - Content table with fallback image config
   - Playlists table with active playlist system
   - Media upload table with content linking

3. **Deployment**:
   - Functions deployed and working
   - Frontend builds successfully
   - All APIs responding correctly

## 📝 Notes

- **Google Photos Removed**: All Google Photos functionality has been completely removed
- **Fallback System**: Robust fallback system for content display
- **Single Active Playlist**: Only one playlist can be active at a time
- **URL-based Images**: Fallback images use URL input (no file upload)
- **Production Ready**: All core functionality working and tested

## 🎉 Success Criteria Met

- ✅ Content management working
- ✅ Playlist management working  
- ✅ TV player displaying content
- ✅ Authentication working
- ✅ Fallback system working
- ✅ All APIs responding
- ✅ Frontend building successfully
- ✅ No Google Photos dependencies
- ✅ Clean, maintainable codebase

---

**This milestone represents a stable, production-ready version of the Digital Signage application with all core functionality intact and Google Photos dependencies removed.**
