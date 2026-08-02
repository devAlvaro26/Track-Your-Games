import { useState, useEffect } from "react";
import { Game, AppSettings, Language } from "./types";
import { GameCard } from "./components/GameCard";
import { GameDetailModal } from "./components/GameDetailModal";
import { AddGameForm } from "./components/AddGameForm";
import { LibraryStatsPanel } from "./components/LibraryStatsPanel";
import { SettingsModal } from "./components/SettingsModal";
import { AuthModal } from "./components/AuthModal";
import { ProfileAvatar } from "./components/ProfileAvatar";
import { AvatarModal } from "./components/AvatarModal";
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
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  // App Settings state (theme, language, username, avatarUrl)
  const [settings, setSettings] = useState<AppSettings>(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const savedLang = localStorage.getItem("language") as Language | null;
    const savedUser = localStorage.getItem("username");
    const savedAvatar = localStorage.getItem("avatarUrl");

    return {
      theme: savedTheme || "dark",
      language: savedLang || "es",
      username: savedUser || "Gamer",
      avatarUrl: savedAvatar || undefined,
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
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileStatusFilterOpen, setIsMobileStatusFilterOpen] = useState(false);

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
    if (settings.avatarUrl) {
      localStorage.setItem("avatarUrl", settings.avatarUrl);
    } else {
      localStorage.removeItem("avatarUrl");
    }
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
          avatarUrl: profile.avatar_url || prev.avatarUrl,
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
  const countAll = games.filter((g) => g.status !== "Deseados" && g.status !== "Quiero Jugar").length;
  const countPlaying = games.filter((g) => g.status === "Jugando").length;
  const countPending = games.filter((g) => g.status === "Pendiente").length;
  const countWishlist = games.filter((g) => g.status === "Deseados" || g.status === "Quiero Jugar").length;
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

      const matchesStatus =
        statusFilter === "All"
          ? (game.status !== "Deseados" && game.status !== "Quiero Jugar")
          : game.status === statusFilter ||
          (statusFilter === "Deseados" && game.status === "Quiero Jugar") ||
          (statusFilter === "Quiero Jugar" && game.status === "Deseados");
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
    { id: "Pendiente", label: t.statusPending || "Pendientes", icon: Icons.Bookmark, count: countPending },
    { id: "Deseados", label: t.statusWishlist || "Quiero Jugar", icon: Icons.Heart, count: countWishlist },
    { id: "Completado", label: t.statusCompleted || "Completados", icon: Icons.CheckCircle2, count: countCompleted },
    { id: "Favoritos", label: t.statusFavorites || "Favoritos", icon: Icons.Star, count: countFavorites },
  ];

  return (
    <div className="h-screen w-full bg-neutral-100 dark:bg-[#0d0d0f] text-neutral-900 dark:text-neutral-100 font-sans flex flex-col md:flex-row overflow-hidden select-none" id="app-root">

      {/* MOBILE TOP NAVIGATION BAR (Visible only on mobile < md) */}
      <header className="md:hidden bg-white dark:bg-[#141417] border-b border-neutral-200 dark:border-white/10 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm" id="mobile-top-bar">
        <div className="flex items-center gap-2.5">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 bg-neutral-100 dark:bg-[#1b1b1f] hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-white rounded-none border border-neutral-300 dark:border-white/10 transition-colors cursor-pointer flex items-center justify-center"
            title="Abrir menú"
            id="btn-open-mobile-menu"
          >
            <Icons.Menu className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-2.5">
            <ProfileAvatar
              avatarUrl={settings.avatarUrl}
              username={settings.username}
              size="sm"
              onClick={() => setIsAvatarModalOpen(true)}
            />
            <div>
              <h1 className="text-xs font-black tracking-wider uppercase text-neutral-900 dark:text-white truncate">
                {t.appTitle}
              </h1>
              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate font-medium flex items-center gap-1">
                <span
                  className={`w-2 h-2 rounded-full inline-block shrink-0 ${user ? "bg-emerald-500" : "bg-orange-500"
                    }`}
                />
                <span className="truncate">{settings.username}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddOpen(true)}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-none shadow transition-colors cursor-pointer flex items-center gap-1"
            title={t.addGame}
            id="btn-mobile-add-game"
          >
            <Icons.Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">{t.addGame}</span>
          </button>
        </div>
      </header>

      {/* MOBILE FULLSCREEN SIDEBAR MENU OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col bg-white dark:bg-[#141417] text-neutral-900 dark:text-white overflow-y-auto" id="mobile-fullscreen-sidebar">
            <motion.div
              initial={{ opacity: 0, x: "-100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="flex flex-col min-h-full p-5 justify-between space-y-6"
            >
              {/* Header inside mobile menu */}
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar
                      avatarUrl={settings.avatarUrl}
                      username={settings.username}
                      size="md"
                      onClick={() => {
                        setIsAvatarModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                    />
                    <div>
                      <h2 className="text-base font-black tracking-wider uppercase text-neutral-900 dark:text-white">
                        {t.appTitle}
                      </h2>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 font-medium">
                        <span
                          className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 ${user
                            ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                            : "bg-orange-500"
                            }`}
                        />
                        <span>
                          {settings.username} {user ? `(${t.statusOnline})` : `(${t.statusOffline})`}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-[#1b1b1f] hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-300 dark:border-white/10 rounded-none transition-colors cursor-pointer"
                    title={t.close}
                    id="btn-close-mobile-menu"
                  >
                    <Icons.X className="w-6 h-6 stroke-[2.5]" />
                  </button>
                </div>

                {/* Nav Links inside mobile menu */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs font-black tracking-widest uppercase text-neutral-500 dark:text-neutral-500 px-2">
                      {t.navigation}
                    </p>
                    <button
                      onClick={() => {
                        setStatusFilter("All");
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-none text-sm font-bold transition-all cursor-pointer border ${statusFilter === "All"
                        ? "bg-indigo-600 text-white border-indigo-500 shadow"
                        : "bg-neutral-50 dark:bg-[#1b1b1f] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-white/10"
                        }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icons.Home className="w-5 h-5" />
                        <span>{t.homeLibrary}</span>
                      </span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-black/10 dark:bg-white/10 rounded">
                        {countAll}
                      </span>
                    </button>
                  </div>

                  {/* COLLECTIONS LIST */}
                  <div className="space-y-2">
                    <p className="text-xs font-black tracking-widest uppercase text-neutral-500 dark:text-neutral-500 px-2">
                      {t.collections}
                    </p>
                    <div className="space-y-1.5">
                      {collectionTabs.slice(1).map((tab) => {
                        const IconComponent = tab.icon;
                        const isSelected = statusFilter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => {
                              setStatusFilter(tab.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-none text-sm font-bold transition-all cursor-pointer border ${isSelected
                              ? "bg-indigo-600 text-white border-indigo-500 shadow"
                              : "bg-neutral-50 dark:bg-[#1b1b1f] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5"
                              }`}
                          >
                            <span className="flex items-center gap-3 truncate">
                              <IconComponent className="w-5 h-5 shrink-0" />
                              <span className="truncate">{tab.label}</span>
                            </span>
                            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-neutral-200 dark:bg-black/40 rounded text-neutral-800 dark:text-neutral-300 shrink-0">
                              {tab.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions inside mobile menu */}
              <div className="pt-5 border-t border-neutral-200 dark:border-white/10 space-y-3">
                <button
                  onClick={() => {
                    setIsAddOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-none border border-indigo-400/30 transition-all cursor-pointer shadow"
                >
                  <Icons.Plus className="w-5 h-5 stroke-[3]" />
                  <span>{t.addGame}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center justify-center gap-2 p-3 bg-neutral-100 dark:bg-[#1b1b1f] hover:bg-neutral-200 dark:hover:bg-[#25252a] text-neutral-800 dark:text-neutral-300 text-xs font-bold rounded-none border border-neutral-300 dark:border-white/10 transition-colors cursor-pointer"
                  >
                    {settings.theme === "dark" ? <Icons.Sun size={16} className="text-amber-400" /> : <Icons.Moon size={16} className="text-indigo-600" />}
                    <span>{settings.theme === "dark" ? t.lightTheme : t.darkTheme}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsSettingsOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 p-3 bg-neutral-100 dark:bg-[#1b1b1f] hover:bg-neutral-200 dark:hover:bg-[#25252a] text-neutral-800 dark:text-neutral-300 text-xs font-bold rounded-none border border-neutral-300 dark:border-white/10 transition-colors cursor-pointer"
                  >
                    <Icons.Settings size={16} className="text-indigo-600 dark:text-indigo-400" />
                    <span>{t.settings}</span>
                  </button>
                </div>

                <div>
                  {user ? (
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-none border border-red-500/20 transition-all cursor-pointer"
                    >
                      <Icons.LogOut size={16} />
                      <span>{t.logoutBtn}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsAuthOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-none border border-indigo-500/20 transition-all cursor-pointer"
                    >
                      <Icons.LogIn size={16} />
                      <span>{t.loginBtn}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR (Visible only on desktop md+) */}
      <aside className="hidden md:flex md:w-64 h-full bg-white dark:bg-[#141417] border-r border-neutral-300 dark:border-white/10 flex-col justify-between shrink-0 p-4 space-y-6 overflow-hidden" id="launcher-sidebar">

        {/* Top Branding & User Profile */}
        <div className="space-y-6 flex-1 overflow-y-auto min-h-0 pr-1">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-200 dark:border-white/10">
            <ProfileAvatar
              avatarUrl={settings.avatarUrl}
              username={settings.username}
              size="md"
              onClick={() => setIsAvatarModalOpen(true)}
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-black tracking-wider uppercase text-neutral-900 dark:text-white truncate">
                {t.appTitle}
              </h1>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate flex items-center gap-1.5 font-medium">
                <span
                  className={`w-2.5 h-2.5 rounded-full inline-block shrink-0 transition-colors ${user
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-none text-xs font-bold transition-all cursor-pointer border ${statusFilter === "All"
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
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-none text-xs font-bold transition-all cursor-pointer border ${isSelected
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
        <div className="pt-4 border-t border-neutral-200 dark:border-white/10 space-y-2 shrink-0">

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
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-neutral-100 dark:bg-[#0d0d0f]" id="app-main-content">

        {/* TOP LAUNCHER HEADER BAR */}
        <header className="bg-white dark:bg-[#141417] border-b border-neutral-200 dark:border-white/10 px-3 sm:px-6 py-2.5 sm:py-4 flex flex-row items-center justify-between gap-3 sm:gap-4 shrink-0 z-30" id="main-header">

          {/* DESKTOP Collection Tab Selector Bar (Visible md+) */}
          <div className="hidden md:flex items-center gap-1.5 overflow-x-auto w-auto pb-0 scrollbar-none" id="collection-tabs-bar-desktop">
            {collectionTabs.map((tab) => {
              const isSelected = statusFilter === tab.id;
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-none border transition-all cursor-pointer shrink-0 ${isSelected
                    ? "bg-indigo-600 text-white border-indigo-500 dark:bg-white dark:text-black dark:border-white shadow-md"
                    : "bg-neutral-100 dark:bg-[#1b1b1f] text-neutral-700 dark:text-neutral-400 border-neutral-200 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white"
                    }`}
                  id={`tab-${tab.id}`}
                >
                  <IconComponent className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? "bg-black/20 text-white dark:bg-black/10 dark:text-black font-extrabold" : "bg-neutral-300/60 dark:bg-black/40 text-neutral-800 dark:text-neutral-400"}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* MOBILE Collection Tab Selector Dropdown Button (Visible < md) */}
          {(() => {
            const activeTab = collectionTabs.find((t) => t.id === statusFilter) || collectionTabs[0];
            const ActiveIcon = activeTab.icon;
            return (
              <div className="relative w-full md:w-auto md:hidden" id="collection-tabs-mobile-filter">
                <button
                  onClick={() => setIsMobileStatusFilterOpen(!isMobileStatusFilterOpen)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-none border border-indigo-500 shadow-sm transition-all cursor-pointer"
                  id="btn-mobile-status-filter"
                  title={t.filterByStatus || "Filtrar por estado"}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icons.Filter className="w-3.5 h-3.5 shrink-0 text-indigo-200" />
                    <span className="truncate flex items-center gap-1.5">
                      <ActiveIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{activeTab.label}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-1.5 py-0.5 text-[10px] font-mono bg-black/25 text-white font-extrabold rounded">
                      {activeTab.count}
                    </span>
                    <Icons.ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMobileStatusFilterOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {/* Dropdown Menu Options */}
                <AnimatePresence>
                  {isMobileStatusFilterOpen && (
                    <>
                      {/* Invisible Backdrop to close on tap outside */}
                      <div
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
                        onClick={() => setIsMobileStatusFilterOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 shadow-xl rounded-none py-1 overflow-hidden"
                        id="mobile-status-dropdown-menu"
                      >
                        <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-white/5">
                          {t.filterByStatus || "Filtrar por estado"}
                        </div>
                        {collectionTabs.map((tab) => {
                          const isSelected = statusFilter === tab.id;
                          const IconComponent = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => {
                                setStatusFilter(tab.id);
                                setIsMobileStatusFilterOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold transition-colors cursor-pointer text-left border-b last:border-b-0 border-neutral-100 dark:border-white/5 ${isSelected
                                ? "bg-indigo-600 text-white font-extrabold"
                                : "text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5"
                                }`}
                            >
                              <span className="flex items-center gap-2.5 truncate">
                                <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-neutral-400"}`} />
                                <span className="truncate uppercase tracking-wider">{tab.label}</span>
                              </span>
                              <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${isSelected ? "bg-black/20 text-white" : "bg-neutral-200 dark:bg-black/40 text-neutral-700 dark:text-neutral-300"
                                }`}>
                                {tab.count}
                              </span>
                            </button>
                          );
                        })}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            );
          })()}

          {/* Quick Stats Toggle & Header Action */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-none border transition-all cursor-pointer ${showStats
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
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto min-h-0">

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
          <div className="p-3 sm:p-4 bg-white dark:bg-[#141417] border border-neutral-200 dark:border-white/10 flex flex-col md:flex-row gap-3 items-center justify-between" id="controls-section">

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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">

              {/* Console Filter */}
              <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-200 dark:border-white/10 px-3 py-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <Icons.MonitorPlay className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-neutral-500 dark:text-neutral-400 font-semibold uppercase text-[10px] mr-1">{t.consoleLabel}:</span>
                </div>
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="bg-transparent text-xs font-bold text-neutral-900 dark:text-white focus:outline-none cursor-pointer max-w-[180px] truncate"
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
              <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-200 dark:border-white/10 px-3 py-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <Icons.ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-neutral-500 dark:text-neutral-400 font-semibold uppercase text-[10px] mr-1">{t.sortByLabel}:</span>
                </div>
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
          <AnimatePresence mode="wait">
            {filteredGames.length === 0 ? (
              <motion.div
                key={`empty-${statusFilter}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="text-center py-12 sm:py-20 bg-white dark:bg-[#141417] border border-neutral-200 dark:border-white/10 p-4 sm:p-8 space-y-4"
                id="empty-state-view"
              >
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
              </motion.div>
            ) : (
              <motion.div
                key={`grid-${statusFilter}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-3 min-[480px]:grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1.5 sm:gap-3.5"
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
          </AnimatePresence>

        </div>

        {/* FOOTER (Always fixed at bottom of main section) */}
        <footer className="shrink-0 border-t border-neutral-200 dark:border-white/10 bg-white dark:bg-[#141417] py-2.5 px-6 text-center text-[11px] text-neutral-600 dark:text-neutral-500 z-20" id="app-footer">
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
            onEnlargeAvatar={() => setIsAvatarModalOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* AVATAR LARGE VIEW MODAL OVERLAY */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <AvatarModal
            isOpen={isAvatarModalOpen}
            onClose={() => setIsAvatarModalOpen(false)}
            avatarUrl={settings.avatarUrl}
            username={settings.username}
            language={settings.language}
            onOpenSettings={() => setIsSettingsOpen(true)}
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

      {/* VERCEL WEB ANALYTICS */}
      <Analytics />

    </div>
  );
}
