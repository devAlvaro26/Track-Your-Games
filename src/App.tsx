import { useState, useEffect } from "react";
import { Game, AppSettings, Language } from "./types";
import { GameCard } from "./components/GameCard";
import { GameDetailModal } from "./components/GameDetailModal";
import { AddGameForm } from "./components/AddGameForm";
import { LibraryStatsPanel } from "./components/LibraryStatsPanel";
import { SettingsModal } from "./components/SettingsModal";
import { AuthModal } from "./components/AuthModal";
import { getTranslation, translateGenre } from "./translations";
import {
  db,
  isDatabaseConfigured,
  fetchUserGamesFromDb,
  saveGameToDb,
  deleteGameFromDb,
  fetchUserProfile,
  saveUserProfile,
} from "./lib/database";
import * as Icons from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // App Settings state (theme, language, username)
  const [settings, setSettings] = useState<AppSettings>(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const savedLang = localStorage.getItem("language") as Language | null;
    const savedUser = localStorage.getItem("username");

    return {
      theme: savedTheme || "dark",
      language: savedLang || "es",
      username: savedUser || "Gamer",
    };
  });

  const t = getTranslation(settings.language);

  // User Auth & Session state
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);

  // Games list
  const [games, setGames] = useState<Game[]>(() => {
    const saved = localStorage.getItem("game_library_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading games from localStorage", e);
      }
    }
    return [];
  });

  // UI Modals state
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Search, filter and sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [platformFilter, setPlatformFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"title" | "playTime" | "rating" | "acquisitionDate">("acquisitionDate");

  // Sync settings & theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (settings.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", settings.theme);
    localStorage.setItem("language", settings.language);
    localStorage.setItem("username", settings.username);
  }, [settings]);

  // Save local games cache
  useEffect(() => {
    if (!user) {
      localStorage.setItem("game_library_user", JSON.stringify(games));
    }
  }, [games, user]);

  // Listen to database auth state
  useEffect(() => {
    if (!db || !isDatabaseConfigured) {
      setAuthLoading(false);
      return;
    }

    db.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        loadUserData(currentUser.id, currentUser.user_metadata?.username);
      } else {
        setAuthLoading(false);
      }
    });

    const { data: authListener } = db.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (event === "SIGNED_IN" && currentUser) {
        loadUserData(currentUser.id, currentUser.user_metadata?.username);
      } else if (event === "SIGNED_OUT") {
        setGames([]);
        localStorage.removeItem("game_library_user");
        setAuthLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Load user data from database
  const loadUserData = async (userId: string, defaultUsername?: string) => {
    setSyncLoading(true);
    try {
      const userGames = await fetchUserGamesFromDb(userId);
      setGames(userGames);

      const profile = await fetchUserProfile(userId);
      if (profile) {
        setSettings((prev) => ({
          ...prev,
          username: profile.username || prev.username,
          language: (profile.language as Language) || prev.language,
          theme: (profile.theme as "light" | "dark") || prev.theme,
        }));
      } else if (defaultUsername) {
        setSettings((prev) => ({ ...prev, username: defaultUsername }));
      }
    } catch (err) {
      console.error("Error loading user data from database:", err);
    } finally {
      setSyncLoading(false);
      setAuthLoading(false);
    }
  };

  // Auth handlers
  const handleLogout = async () => {
    if (db && isDatabaseConfigured) {
      await db.auth.signOut();
    }
    setUser(null);
    setGames([]);
    localStorage.removeItem("game_library_user");
  };

  const handleAuthSuccess = (authUser: any, authUsername?: string) => {
    setUser(authUser);
    if (authUsername) {
      setSettings((prev) => {
        const nextSettings = { ...prev, username: authUsername };
        if (isDatabaseConfigured) {
          saveUserProfile(authUser.id, nextSettings);
        }
        return nextSettings;
      });
    }
    loadUserData(authUser.id, authUsername);
  };

  const toggleTheme = () => {
    setSettings((prev) => {
      const nextSettings: AppSettings = {
        ...prev,
        theme: prev.theme === "dark" ? "light" : "dark",
      };
      if (user && isDatabaseConfigured) {
        saveUserProfile(user.id, nextSettings);
      }
      return nextSettings;
    });
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    if (user && isDatabaseConfigured) {
      await saveUserProfile(user.id, newSettings);
    }
  };

  // Game CRUD Handlers
  const handleAddGame = async (gameData: Omit<Game, "id">) => {
    const newGame: Game = {
      ...gameData,
      id: `game-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };

    setGames((prev) => [newGame, ...prev]);
    setIsAddOpen(false);

    if (user && isDatabaseConfigured) {
      try {
        await saveGameToDb(newGame, user.id);
      } catch (err) {
        console.error("Could not sync added game to database:", err);
      }
    }
  };

  const handleUpdateGame = async (updatedGame: Game) => {
    setGames((prev) => prev.map((g) => (g.id === updatedGame.id ? updatedGame : g)));

    if (user && isDatabaseConfigured) {
      try {
        await saveGameToDb(updatedGame, user.id);
      } catch (err) {
        console.error("Could not sync updated game to database:", err);
      }
    }
  };

  const handleDeleteGame = async (id: string) => {
    setGames((prev) => prev.filter((g) => g.id !== id));
    setSelectedGameId(null);

    if (user && isDatabaseConfigured) {
      try {
        await deleteGameFromDb(id, user.id);
      } catch (err) {
        console.error("Could not delete game from database:", err);
      }
    }
  };

  const selectedGame = games.find((g) => g.id === selectedGameId);

  // Counts for each collection category
  const countAll = games.length;
  const countPlaying = games.filter((g) => g.status === "Jugando").length;
  const countPending = games.filter((g) => g.status === "Pendiente").length;
  const countCompleted = games.filter((g) => g.status === "Completado").length;
  const countFavorites = games.filter((g) => g.status === "Favoritos").length;

  // Filter & Sort logic
  const filteredGames = games
    .filter((game) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        game.title.toLowerCase().includes(query) ||
        game.genre.toLowerCase().includes(query) ||
        translateGenre(game.genre, settings.language).toLowerCase().includes(query) ||
        game.barcode.includes(query);

      const matchesStatus = statusFilter === "All" || game.status === statusFilter;
      const matchesPlatform = platformFilter === "All" || game.platforms.includes(platformFilter);

      return matchesSearch && matchesStatus && matchesPlatform;
    })
    .sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "playTime") {
        return b.playTime - a.playTime;
      }
      if (sortBy === "rating") {
        return b.rating - a.rating;
      }
      if (sortBy === "acquisitionDate") {
        return new Date(b.acquisitionDate || 0).getTime() - new Date(a.acquisitionDate || 0).getTime();
      }
      return 0;
    });

  // Extract all available platforms in the library
  const allPlatforms = Array.from(new Set(games.flatMap((g) => g.platforms))).sort();

  // Helper for collection tabs configuration
  const collectionTabs = [
    { id: "All", label: t.allStatuses || "Todos los Juegos", icon: Icons.LayoutGrid, count: countAll },
    { id: "Jugando", label: t.statusPlaying || "Jugando", icon: Icons.PlayCircle, count: countPlaying },
    { id: "Pendiente", label: t.statusPending || "Pendientes / Deseados", icon: Icons.Bookmark, count: countPending },
    { id: "Completado", label: t.statusCompleted || "Completados", icon: Icons.CheckCircle2, count: countCompleted },
    { id: "Favoritos", label: t.statusFavorites || "Favoritos", icon: Icons.Star, count: countFavorites },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-[#0d0d0f] text-neutral-900 dark:text-neutral-100 font-sans flex flex-col md:flex-row select-none" id="app-root">

      {/* LEFT SIDEBAR (LAUNCHER STYLE LIKE IN SCREENSHOT) */}
      <aside className="w-full md:w-64 bg-white dark:bg-[#141417] border-r border-neutral-300 dark:border-white/10 flex flex-col justify-between shrink-0 p-4 space-y-6" id="launcher-sidebar">
        
        {/* Top Branding & User Profile */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-200 dark:border-white/10">
            <div className="p-2.5 bg-indigo-600 rounded-none text-white shadow-md flex items-center justify-center font-black">
              <Icons.Library className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-black tracking-wider uppercase text-neutral-900 dark:text-white truncate">
                {t.appTitle}
              </h1>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate flex items-center gap-1.5 font-medium">
                <span
                  className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 transition-colors ${
                    user
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                      : "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] animate-pulse"
                  }`}
                  title={user ? t.statusOnline : t.statusOffline}
                />
                <span className={user ? "text-neutral-700 dark:text-neutral-300 truncate" : "text-orange-600 dark:text-orange-400 font-semibold truncate"}>
                  {settings.username} {user ? `(${t.statusOnline})` : `(${t.statusOffline})`}
                </span>
              </p>
            </div>
          </div>

          {/* Nav Categories */}
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-widest uppercase text-neutral-500 dark:text-neutral-500 px-2 mb-2">
                {t.navigation}
              </p>
              <button
                onClick={() => setStatusFilter("All")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-none text-xs font-bold transition-all cursor-pointer border ${
                  statusFilter === "All"
                    ? "bg-indigo-600 text-white border-indigo-500 shadow"
                    : "bg-transparent text-neutral-700 dark:text-neutral-300 border-transparent hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icons.Home className="w-4 h-4" />
                  <span>{t.homeLibrary}</span>
                </span>
                <span className="text-[10px] font-mono opacity-80">{countAll}</span>
              </button>
            </div>

            {/* COLLECTIONS LIST */}
            <div className="space-y-1">
              <p className="text-[10px] font-black tracking-widest uppercase text-neutral-500 dark:text-neutral-500 px-2 mb-2">
                {t.collections}
              </p>
              {collectionTabs.slice(1).map((tab) => {
                const IconComponent = tab.icon;
                const isSelected = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-none text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-500 shadow"
                        : "bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white border-transparent"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <IconComponent className="w-4 h-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-neutral-200 dark:bg-black/40 rounded text-neutral-800 dark:text-neutral-300 shrink-0">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Sidebar Action Controls */}
        <div className="pt-4 border-t border-neutral-200 dark:border-white/10 space-y-2">
          
          {/* Add Game Button */}
          <button
            onClick={() => setIsAddOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-none border border-indigo-400/30 transition-all cursor-pointer shadow"
            id="sidebar-add-game"
          >
            <Icons.Plus className="w-4 h-4 stroke-[3]" />
            <span>{t.addGame}</span>
          </button>

          {/* Theme & Settings Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center gap-1.5 p-2 bg-neutral-100 dark:bg-[#1b1b1f] hover:bg-neutral-200 dark:hover:bg-[#25252a] text-neutral-800 dark:text-neutral-300 text-xs font-semibold rounded-none border border-neutral-300 dark:border-white/10 transition-colors cursor-pointer"
              title={settings.theme === "dark" ? t.themeLight : t.themeDark}
            >
              {settings.theme === "dark" ? <Icons.Sun size={14} className="text-amber-400" /> : <Icons.Moon size={14} className="text-indigo-600" />}
              <span>{settings.theme === "dark" ? t.lightTheme : t.darkTheme}</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center justify-center gap-1.5 p-2 bg-neutral-100 dark:bg-[#1b1b1f] hover:bg-neutral-200 dark:hover:bg-[#25252a] text-neutral-800 dark:text-neutral-300 text-xs font-semibold rounded-none border border-neutral-300 dark:border-white/10 transition-colors cursor-pointer"
              title={t.settings}
            >
              <Icons.Settings size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>{t.settings}</span>
            </button>
          </div>

          {/* Account session control */}
          <div>
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-none border border-red-500/20 transition-all cursor-pointer"
              >
                <Icons.LogOut size={14} />
                <span>{t.logoutBtn}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="w-full flex items-center justify-center gap-2 p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-none border border-indigo-500/20 transition-all cursor-pointer"
              >
                <Icons.LogIn size={14} />
                <span>{t.loginBtn}</span>
              </button>
            )}
          </div>

        </div>

      </aside>

      {/* RIGHT MAIN LAUNCHER CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-neutral-100 dark:bg-[#0d0d0f]" id="app-main-content">
        
        {/* TOP LAUNCHER HEADER BAR */}
        <header className="bg-white dark:bg-[#141417] border-b border-neutral-200 dark:border-white/10 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-30" id="main-header">
          
          {/* Collection Tab Selector Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none" id="collection-tabs-bar">
            {collectionTabs.map((tab) => {
              const isSelected = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-none border transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-500 dark:bg-white dark:text-black dark:border-white shadow-md"
                      : "bg-neutral-100 dark:bg-[#1b1b1f] text-neutral-700 dark:text-neutral-400 border-neutral-200 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? "bg-black/10 text-white dark:text-black font-extrabold" : "bg-neutral-300/60 dark:bg-black/40 text-neutral-800 dark:text-neutral-400"}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Stats Toggle & Header Action */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-none border transition-all cursor-pointer ${
                showStats
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "bg-neutral-100 dark:bg-[#1b1b1f] text-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/10"
              }`}
            >
              <Icons.BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t.statistics}</span>
            </button>
          </div>

        </header>

        {/* MAIN BODY CONTENT */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">

          {/* Sync indicator */}
          {syncLoading && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-none text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center gap-2 font-bold animate-pulse">
              <Icons.Loader2 className="w-4 h-4 animate-spin" />
              <span>{t.syncingData}</span>
            </div>
          )}

          {/* Collapsible Stats Board */}
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <LibraryStatsPanel games={games} language={settings.language} />
            </motion.div>
          )}

          {/* TOOLBAR CONTROLS BAR: SEARCH, CONSOLE FILTER, SORTING */}
          <div className="p-4 bg-white dark:bg-[#141417] border border-neutral-200 dark:border-white/10 flex flex-col md:flex-row gap-3 items-center justify-between" id="controls-section">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-200 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500 font-medium"
                id="search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                >
                  <Icons.X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter & Sorting Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              
              {/* Console Filter */}
              <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-200 dark:border-white/10 px-3 py-1.5 text-xs">
                <Icons.MonitorPlay className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-neutral-500 dark:text-neutral-400 font-semibold uppercase text-[10px] mr-1">{t.consoleLabel}:</span>
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
                  id="filter-platform"
                >
                  <option value="All" className="bg-white dark:bg-[#1b1b1f] text-neutral-900 dark:text-white">{t.allConsoles}</option>
                  {allPlatforms.map((plat) => (
                    <option key={plat} value={plat} className="bg-white dark:bg-[#1b1b1f] text-neutral-900 dark:text-white">
                      {plat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-1.5 bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-200 dark:border-white/10 px-3 py-1.5 text-xs">
                <Icons.ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-neutral-500 dark:text-neutral-400 font-semibold uppercase text-[10px] mr-1">{t.sortByLabel}:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-neutral-900 dark:text-white focus:outline-none cursor-pointer"
                  id="sort-select"
                >
                  <option value="acquisitionDate" className="bg-white dark:bg-[#1b1b1f] text-neutral-900 dark:text-white">{t.sortAcquisitionDate}</option>
                  <option value="title" className="bg-white dark:bg-[#1b1b1f] text-neutral-900 dark:text-white">{t.sortTitle}</option>
                  <option value="playTime" className="bg-white dark:bg-[#1b1b1f] text-neutral-900 dark:text-white">{t.sortPlayTime}</option>
                  <option value="rating" className="bg-white dark:bg-[#1b1b1f] text-neutral-900 dark:text-white">{t.sortRating}</option>
                </select>
              </div>

            </div>

          </div>

          {/* RESULTS GRID OR EMPTY STATE */}
          {filteredGames.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#141417] border border-neutral-200 dark:border-white/10 p-8 space-y-4" id="empty-state-view">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-[#1b1b1f] rounded-none border border-neutral-200 dark:border-white/10 flex items-center justify-center mx-auto text-neutral-500">
                <Icons.Gamepad2 size={36} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">{t.noGamesMatch}</h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                  {t.noGamesMatchDesc}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("All");
                    setPlatformFilter("All");
                    setSortBy("acquisitionDate");
                  }}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-none hover:bg-indigo-500/10 transition-all cursor-pointer"
                >
                  {t.resetFilters}
                </button>
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="text-xs font-bold text-white bg-indigo-600 px-4 py-2 rounded-none hover:bg-indigo-500 transition-all cursor-pointer shadow"
                >
                  + {t.addGame}
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              id="games-grid"
            >
              <AnimatePresence mode="popLayout">
                {filteredGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    language={settings.language}
                    onClick={() => setSelectedGameId(game.id)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

        </div>

        {/* FOOTER */}
        <footer className="border-t border-neutral-200 dark:border-white/10 bg-white dark:bg-[#141417] py-4 px-6 text-center text-[11px] text-neutral-600 dark:text-neutral-500 mt-auto" id="app-footer">
          <p>© {new Date().getFullYear()} {t.appTitle} • {user ? t.cloudSynced : t.localStorageNotice}</p>
        </footer>

      </main>

      {/* SETTINGS MODAL OVERLAY */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* AUTH MODAL OVERLAY */}
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal
            language={settings.language}
            onClose={() => setIsAuthOpen(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </AnimatePresence>

      {/* DETAIL MODAL OVERLAY */}
      <AnimatePresence>
        {selectedGame && (
          <GameDetailModal
            game={selectedGame}
            language={settings.language}
            onClose={() => setSelectedGameId(null)}
            onUpdate={handleUpdateGame}
            onDelete={handleDeleteGame}
          />
        )}
      </AnimatePresence>

      {/* ADD GAME FORM OVERLAY */}
      <AnimatePresence>
        {isAddOpen && (
          <AddGameForm
            language={settings.language}
            onClose={() => setIsAddOpen(false)}
            onAdd={handleAddGame}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
