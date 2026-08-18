<div align="center">
  <img src="public/tyg_logo.png" alt="Track Your Games logo" width="128" />
  <h1>Track Your Games</h1>
</div>

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?logo=supabase)](https://supabase.com/)

## Overview

Track Your Games is a React application for organizing a personal video game library. It supports guest usage with browser storage and optional accounts with Supabase, while an Express server provides the external API integrations used by the interface.

## Features

- Add and edit games with platforms, genres, release and acquisition dates, ratings, play time, notes, cover art, barcode, and status.
- Track statuses including pending, playing, played, completed, and wishlist, plus a separate favorite flag.
- Search IGDB through the server proxy and import summaries, platforms, genres, release dates, cover art, and ratings.
- Search Steam for an App ID and import Steam achievements. The server uses `STEAM_API_KEY` when available and falls back to the public Steam Community XML endpoint.
- Browse a console picker with categorized platforms, console logos, manufacturer colors, and dynamic banners.
- Review library statistics such as total games, play time, average rating, platform and genre breakdowns, and completion rate.
- Create a profile with a username and avatar, switch between English and Spanish, and use light or dark theme.
- Add friends, manage incoming and outgoing requests, and view an accepted friend's library.
- Use the app without an account through `localStorage`, or sign in to sync games and profiles through Supabase with Row Level Security.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Motion, Lucide React, and Vercel Analytics.
- **Server:** Express 5 running the Vite middleware in development and serving the production build, with a Vercel function adapter in `api/index.ts`.
- **Integrations:** IGDB API v4 through Twitch OAuth, Steam Store and Steam achievements endpoints.
- **Database and auth:** Supabase JS v2 and PostgreSQL with Row Level Security.

## Project Structure

```text
.
├── api/index.ts                 # Vercel serverless entrypoint
├── public/tyg_logo.png          # Application logo
├── server.ts                    # Express server, API routes, and Vite integration
├── src/
│   ├── App.tsx                  # Application state and main library view
│   ├── components/              # Library, search, auth, profile, friends, and settings UI
│   ├── consoles.ts              # Console definitions and categories
│   ├── translations.ts          # English and Spanish translations
│   ├── types.ts                 # Shared TypeScript types
│   └── lib/                     # Persistence, favorite normalization, and branding helpers
├── supabase/schema.sql          # Tables, indexes, triggers, and RLS policies
├── vercel.json                  # Vercel API rewrite
├── package.json                 # Scripts and dependencies
└── vite.config.ts               # Vite, React, and Tailwind configuration
```

## Getting Started

### Requirements

- Node.js 18 or newer
- npm 9 or newer

### Installation

```bash
git clone https://github.com/devAlvaro26/track-your-games.git
cd track-your-games
npm install
```

Create a `.env` file in the project root only if you want external integrations or cloud accounts. No `.env.example` file is currently included.

```env
# Required for IGDB search. IGDB uses Twitch OAuth client credentials.
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret

# Optional: enables the Supabase database, authentication, and friends features.
VITE_DATABASE_URL=https://your-project.supabase.co
VITE_DATABASE_ANON_KEY=your_anon_key

# Optional: enables the Steam Web API achievement lookup before XML fallback.
STEAM_API_KEY=your_steam_api_key
```

Start the development server:

```bash
npm run dev
```

The app and API are available at `http://localhost:3000` by default. Set `PORT` to use another port.

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Starts Express with Vite middleware and the API routes. |
| `npm run build` | Creates the Vite production build in `dist/`. |
| `npm run lint` | Runs TypeScript checking without emitting files. |
| `npm run start` | Starts the production server using `dist/server.cjs` when that artifact is provided by the deployment workflow. |
| `npm run clean` | Removes `dist` and `server.js` on environments that support `rm -rf`. |

## Supabase Setup (Optional)

1. Create a project at [Supabase](https://supabase.com).
2. Open the Supabase SQL Editor.
3. Run [`supabase/schema.sql`](supabase/schema.sql).
4. Set `VITE_DATABASE_URL` and `VITE_DATABASE_ANON_KEY` in `.env`.

Without these variables, the app remains usable in guest mode and stores the local library in the browser. With Supabase enabled, authentication, profiles, cloud game storage, and friend relationships use the tables and RLS policies defined in the schema.

## Deployment

The repository includes a Vercel rewrite that sends `/api/*` requests to `api/index.ts`. Configure the required environment variables in the deployment provider before enabling IGDB, Steam Web API, or Supabase features.

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

