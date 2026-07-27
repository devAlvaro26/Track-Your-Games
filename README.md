# Track‑It 🎮

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?logo=supabase)](https://supabase.com/)

---

## 📋 Overview

**Track‑It** is a modern web application designed to organize, catalog, and track your personal video game collection. It features native integration with the **IGDB API v4**, optional cloud persistence via **Supabase**, a full vector branding catalog for over 60 video game consoles, detailed library analytics, and multi-language support (English and Spanish).

---

## 🌟 Key Features

- 🎮 **Comprehensive Library Management**:
  - Categorize by play status: *Playing*, *Backlog / Wishlist*, *Completed*, and *Favorites*.
  - Detailed metadata tracking: platforms, genres, personal ratings (1-10 stars), hours played, acquisition date, personal notes, and interactive achievements/trophies list.
  - Barcode / EAN code entry field for physical games.

- 🔍 **IGDB API v4 Search & Integration**:
  - Real-time video game search powered by a secure Express backend proxy.
  - Automatic import of high-resolution cover art (`t_cover_big_2x`), game summaries, release dates, and global IGDB community ratings.

- 🎨 **Console Identity & Vector Branding**:
  - Extensive collection of vector logos and badges for over 60 gaming platforms and systems (PlayStation, Nintendo, Xbox, Sega, PC, Atari, Retro, and Arcade).
  - Categorized console picker featuring official manufacturer color schemes.

- 💾 **Dual Storage (Cloud + Local Storage)**:
  - **Cloud Mode (Supabase)**: User authentication (sign up & sign in) with isolated user data using Row Level Security (RLS).
  - **Local / Guest Mode**: Instant out-of-the-box usage saving data locally via `localStorage` without requiring account creation.

- 📊 **Library Analytics & Statistics**:
  - Visual metrics for your game collection: total games tracked, total playtime, average user rating, breakdown by platform, top genres, and completion rate.

- 🌐 **Multilingual Support & Customization**:
  - Languages: English (`en`) and Spanish (`es`) with dynamic interface and genre translations.
  - Persistent Light and Dark mode.
  - Advanced filtering by console or status, instant search, and sorting by title, hours played, rating, or purchase date.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Motion (Framer Motion), Lucide React.
- **Backend / API Proxy**: Express 5, Node.js
- **Database & Auth**: Supabase JS v2, PostgreSQL with Row Level Security.

---

## 📁 Project Structure

```
.
├── server.ts                  # Express server (IGDB API proxy + Vite static server)
├── src/
│   ├── App.tsx                # Main application component and user interface
│   ├── components/            # UI components and modals
│   │   ├── AddGameForm.tsx    # Modal form to add or edit video games
│   │   ├── AuthModal.tsx      # Supabase authentication modal
│   │   ├── ConsolePicker.tsx  # Interactive console platform selector
│   │   ├── GameCard.tsx       # Individual game card display
│   │   ├── GameDetailModal.tsx# Game details, playtime tracker, achievements & notes
│   │   ├── IgdbSearchModal.tsx# IGDB API live search modal
│   │   ├── LibraryStatsPanel.tsx # Library analytics & statistical graphs
│   │   └── SettingsModal.tsx  # User preferences (language, theme, auth)
│   ├── consoles.ts            # Console definitions, logos, and categories
│   ├── translations.ts        # Translation strings (English / Spanish)
│   ├── types.ts               # Shared TypeScript interface definitions
│   └── lib/
│       ├── consoleBranding.ts # Console branding & color palette mapping
│       ├── database.ts        # Supabase client & fallback local persistence
│       └── svg/               # Vector SVG console logos
├── supabase/
│   └── schema.sql             # SQL database schema and RLS policies for Supabase
└── .env.example               # Environment variables template
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/devAlvaro26/track-it.git
   cd track-it
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file from the provided example template:
   ```bash
   cp .env.example .env
   ```
   Set up your credentials based on the features you want to enable:
   ```env
   # Twitch / IGDB API Credentials (Required for IGDB live search)
   TWITCH_CLIENT_ID="your_client_id"
   TWITCH_CLIENT_SECRET="your_client_secret"

   # Supabase Credentials (Optional for cloud sync and user accounts)
   VITE_DATABASE_URL="https://your-project.supabase.co"
   VITE_DATABASE_ANON_KEY="your_anon_key"
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
---

## 🗄️ Supabase Setup (Optional)

To enable cloud storage and user accounts:

1. Create a project at [Supabase](https://supabase.com).
2. Open the **SQL Editor** tab in the Supabase Dashboard.
3. Run the SQL script found in `supabase/schema.sql`.
4. Copy your project credentials into `VITE_DATABASE_URL` and `VITE_DATABASE_ANON_KEY` in your `.env` file.

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
