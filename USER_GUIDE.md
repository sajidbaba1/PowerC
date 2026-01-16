# Power Couple - User Authentication System

## Overview
A complete multi-user authentication system with role-based dashboards.

## User Roles & Credentials

### 1. **Sajid** (User)
- **Username:** Sajid
- **Password:** `sajid123`
- **Dashboard Features:**
  - Chat with Nasywa (with Indonesian translation)
  - Chat with Admin
  - Real-time AI translation using Gemini
  - Word-by-word breakdown panel
  - Hindi reference translations

### 2. **Nasywa** (User)
- **Username:** Nasywa
- **Password:** `nasywa123`
- **Dashboard Features:**
  - Chat with Sajid (with English translation)
  - Chat with Admin
  - Real-time AI translation using Gemini
  - Word-by-word breakdown panel
  - Hindi reference translations

### 3. **Admin** (Administrator)
- **Username:** Admin
- **Password:** `admin123`
- **Dashboard Features:**
  - **Overview Tab:**
    - System statistics (Total Users, Messages, Active API Keys, System Status)
    - Theme palette switcher (Indigo, Emerald, Rose, Amber)
  - **API Keys Tab:**
    - Add/Remove Gemini API keys
    - View key usage statistics
    - Automatic key rotation
  - **Users Tab:**
    - View all users (Sajid & Nasywa)
    - Monitor user activity
    - User statistics

## Features

### Authentication
- Beautiful login screen with role selection
- Secure password authentication
- Demo credentials displayed for easy testing

### Chat System
- Real-time translation between English and Indonesian
- Hindi reference translations
- Word-by-word meaning breakdown
- Message history per conversation
- Online status indicators

### Admin Controls
- Full API key management
- User monitoring
- System statistics
- Theme customization
- Database status monitoring

## How to Use

1. **Start the app:** Already running at http://localhost:3001
2. **Select a user** on the login screen
3. **Enter password** (shown on login screen)
4. **Access your dashboard** based on your role

## Technical Stack
- Next.js 15 with App Router
- TypeScript
- Framer Motion for animations
- Gemini 2.0 Flash AI for translations
- Tailwind CSS with glassmorphism
- Prisma + Neon DB (optional)

## Notes
- All chats use real AI translation via Gemini API
- Messages are stored in component state (can be persisted to DB)
- Admin can manage API keys to prevent rate limiting
- Theme changes apply globally across all users
