import { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from "react";
import { Game, AppSettings, Language, FriendProfile } from "./types";
import { GameCard } from "./components/GameCard";
import { ProfileAvatar } from "./components/ProfileAvatar";
import { FriendLibraryBanner } from "./components/FriendLibraryBanner";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { getTranslation, translateGenre } from "./translations";
import {
  db,
  isDatabaseConfigured,
  fetchUserGamesFromDb,
  fetchUserProfile,
  saveUserProfile,
  fetchFriendGames,
  fetchFriendships,
} from "./lib/database";
import { useGameSync, readPendingOps, applyPendingOps } from "./lib/useGameSync";
import { isWishlist } from "./lib/gameStatus";
import { dateToTimestamp } from "./lib/dates";
import { useModalA11y } from "./lib/useModalA11y";
import {
  LayoutGrid,
  PlayCircle,
  CheckCircle,
  Bookmark,
  Heart,
  CheckCircle2,
  Star,
  Menu,
  Users,
  ArrowLeft,
  Plus,
  X,
  Home,
  Sun,
  Moon,
  Settings,
  LogOut,
  LogIn,
  Filter,
  ChevronDown,
  BarChart2,
  Loader2,
  Search,
  MonitorPlay,
  ArrowUpDown,
  Gamepad2,
  RefreshCw,
  CloudOff,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Analytics } from "@vercel/analytics/react";
import { normalizeGame, isFavoriteGame } from "./lib/gameFavorite";

// Lazy-loaded modal components to reduce initial bundle size and improve LCP/TBT
const GameDetailModal = lazy(() =>
  import("./components/GameDetailModal").then((m) => ({ default: m.GameDetailModal }))
);
const AddGameForm = lazy(() =>
  import("./components/AddGameForm").then((m) => ({ default: m.AddGameForm }))
);
const LibraryStatsPanel = lazy(() =>
  import("./components/LibraryStatsPanel").then((m) => ({ default: m.LibraryStatsPanel }))
);
const SettingsModal = lazy(() =>
  import("./components/SettingsModal").then((m) => ({ default: m.SettingsModal }))
);
const AuthModal = lazy(() =>
  import("./components/AuthModal").then((m) => ({ default: m.AuthModal }))
);
const AvatarModal = lazy(() =>
  import("./components/AvatarModal").then((m) => ({ default: m.AvatarModal }))
);
const FriendsModal = lazy(() =>
  import("./components/FriendsModal").then((m) => ({ default: m.FriendsModal }))
);

const GUEST_IMPORT_DISMISSED_KEY = "tyg_guest_import_dismissed";

function createGameId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `game-${crypto.randomUUID()}`;
  return `game-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

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
      username: savedUser && savedUser !== "Gamer" ? savedUser : "",
      avatarUrl: savedAvatar || undefined,
    };
  });

  const t = getTranslation(settings.language);

  // User Auth & Session state
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [guestImportCandidates, setGuestImportCandidates] = useState<Game[]>([]);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const loadedUserIdRef = useRef<string | null>(null);
  const loadingUserIdRef = useRef<string | null>(null);

  const { enqueueUpsert, enqueueDelete, retryNow, pendingCount, syncError } = useGameSync(user?.id ?? null);

  // Games list
  const [games, setGames] = useState<Game[]>(() => {
    const saved = localStorage.getItem("game_library_user");
    if (saved) {
      try {
        return JSON.parse(saved).map((game: any) => normalizeGame(game) as Game);
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
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileStatusFilterOpen, setIsMobileStatusFilterOpen] = useState(false);
  const mobileMenuRef = useModalA11y(() => setIsMobileMenuOpen(false), isMobileMenuOpen);

  // Friend library viewing state
  const [activeFriend, setActiveFriend] = useState<FriendProfile | null>(null);
  const [friendGames, setFriendGames] = useState<Game[]>([]);
  const [isLoadingFriendGames, setIsLoadingFriendGames] = useState(false);
  const [incomingFriendRequestsCount, setIncomingFriendRequestsCount] = useState(0);

  useEffect(() => {
    localStorage.removeItem("game_library_local_friendships");
  }, []);

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

    db.auth.getSession().then(({ data }) => {
      const currentUser = data?.session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        void loadUserData(currentUser.id, currentUser.user_metadata?.username);
      } else {
        setAuthLoading(false);
      }
    }).catch((err) => {
      console.warn("Could not check auth session from database:", err?.message || err);
      setAuthLoading(false);
    });

    const { data: authListener } = db.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (event === "SIGNED_IN" && currentUser) {
        // Supabase calls must not run inside this callback; defer to avoid a deadlock.
        setTimeout(() => {
          void loadUserData(currentUser.id, currentUser.user_metadata?.username);
        }, 0);
      } else if (event === "SIGNED_OUT") {
        loadedUserIdRef.current = null;
        loadingUserIdRef.current = null;
        setGames([]);
        localStorage.removeItem("game_library_user");
        setAuthLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const refreshFriendRequestsCount = useCallback(async (userId: string) => {
    try {
      const data = await fetchFriendships(userId);
      setIncomingFriendRequestsCount(data.incoming.length);
    } catch (e) {
      console.warn("Could not refresh friend requests:", e);
    }
  }, []);

  const readGuestGames = (): Game[] => {
    try {
      const raw = localStorage.getItem("game_library_user");
      if (raw) return (JSON.parse(raw) as any[]).map((game) => normalizeGame(game) as Game);
    } catch (e) {
      console.warn("Could not read guest games:", e);
    }
    return [];
  };

  // Offer to upload games created while signed out, skipping ones already in the account.
  const offerGuestImport = (cloudGames: Game[]) => {
    const guestGames = readGuestGames();
    if (guestGames.length === 0) return;

    const isSameGame = (a: Game, b: Game) =>
      (a.igdbId !== undefined && a.igdbId === b.igdbId) ||
      (a.title.trim().toLowerCase() === b.title.trim().toLowerCase() &&
        a.platforms.some((p) => b.platforms.includes(p)));

    const importable = guestGames.filter((g) => !cloudGames.some((c) => isSameGame(c, g)));
    if (importable.length === 0) {
      localStorage.removeItem("game_library_user");
      return;
    }
    if (sessionStorage.getItem(GUEST_IMPORT_DISMISSED_KEY)) return;
    setGuestImportCandidates(importable);
  };

  // Load user data from database. Safe to call repeatedly: one load per signed-in user.
  const loadUserData = useCallback(async (userId: string, defaultUsername?: string) => {
    if (loadedUserIdRef.current === userId || loadingUserIdRef.current === userId) return;
    loadingUserIdRef.current = userId;
    setSyncLoading(true);
    setLoadError(false);

    try {
      const pending = readPendingOps(userId);
      try {
        const cloudGames = await fetchUserGamesFromDb(userId);
        const merged = applyPendingOps(cloudGames, pending);
        setGames(merged);
        offerGuestImport(merged);
        loadedUserIdRef.current = userId;
      } catch (err: any) {
        console.warn("Could not load games from database:", err?.message || err);
        setGames(applyPendingOps([], pending));
        setLoadError(true);
      }

      const profile = await fetchUserProfile(userId);
      const fallbackName = defaultUsername?.trim() || "";

      if (profile) {
        setSettings((prev) => ({
          ...prev,
          username: profile.username?.trim() || fallbackName,
          language: (profile.language as Language) || prev.language,
          theme: (profile.theme as "light" | "dark") || prev.theme,
          avatarUrl: profile.avatar_url || prev.avatarUrl,
        }));
      } else if (fallbackName) {
        setSettings((prev) => ({ ...prev, username: fallbackName }));
        await saveUserProfile(userId, { username: fallbackName });
      } else {
        setSettings((prev) => ({ ...prev, username: "" }));
      }

      refreshFriendRequestsCount(userId);
    } catch (err: any) {
      console.warn("Could not load user data from database:", err?.message || err);
    } finally {
      loadingUserIdRef.current = null;
      setSyncLoading(false);
      setAuthLoading(false);
    }
  }, [refreshFriendRequestsCount]);

  const handleRetryLoad = useCallback(() => {
    if (user) void loadUserData(user.id, user.user_metadata?.username);
  }, [user, loadUserData]);

  const handleImportGuestGames = useCallback(() => {
    const toImport = guestImportCandidates;
    setGuestImportCandidates([]);
    setGames((prev) => [...toImport, ...prev]);
    toImport.forEach(enqueueUpsert);
    localStorage.removeItem("game_library_user");
  }, [guestImportCandidates, enqueueUpsert]);

  const handleDismissGuestImport = useCallback(() => {
    sessionStorage.setItem(GUEST_IMPORT_DISMISSED_KEY, "1");
    setGuestImportCandidates([]);
  }, []);

  // Auth handlers
  const handleLogout = useCallback(async () => {
    if (db && isDatabaseConfigured) {
      await db.auth.signOut();
    }
    loadedUserIdRef.current = null;
    loadingUserIdRef.current = null;
    sessionStorage.removeItem(GUEST_IMPORT_DISMISSED_KEY);
    setUser(null);
    setGames([]);
    setGuestImportCandidates([]);
    setLoadError(false);
    setActiveFriend(null);
    setFriendGames([]);
    setIncomingFriendRequestsCount(0);
    localStorage.removeItem("game_library_user");
  }, []);

  const handleAuthSuccess = useCallback((authUser: any, authUsername?: string) => {
    setUser(authUser);
    if (authUsername) {
      const nextSettings = { ...settingsRef.current, username: authUsername };
      setSettings(nextSettings);
      if (isDatabaseConfigured) {
        saveUserProfile(authUser.id, nextSettings);
      }
    }
    void loadUserData(authUser.id, authUsername);
  }, [loadUserData]);

  // Friend Library view handlers
  const handleViewFriendLibrary = useCallback(async (friend: FriendProfile) => {
    setActiveFriend(friend);
    setIsLoadingFriendGames(true);
    setStatusFilter("All");
    setPlatformFilter("All");
    setSearchQuery("");
    try {
      const g = await fetchFriendGames(friend.id);
      setFriendGames(g);
    } catch (e) {
      console.warn("Could not load friend games:", e);
      setFriendGames([]);
    } finally {
      setIsLoadingFriendGames(false);
    }
  }, []);

  const handleBackToMyLibrary = useCallback(() => {
    setActiveFriend(null);
    setFriendGames([]);
    setStatusFilter("All");
    setPlatformFilter("All");
    setSearchQuery("");
  }, []);

  const toggleTheme = useCallback(() => {
    const nextSettings: AppSettings = {
      ...settingsRef.current,
      theme: settingsRef.current.theme === "dark" ? "light" : "dark",
    };
    setSettings(nextSettings);
    if (user && isDatabaseConfigured) {
      saveUserProfile(user.id, nextSettings);
    }
  }, [user]);

  const handleSaveSettings = useCallback(async (newSettings: AppSettings) => {
    setSettings(newSettings);
    if (user && isDatabaseConfigured) {
      await saveUserProfile(user.id, newSettings);
    }
  }, [user]);

  // Game CRUD handlers: the UI updates immediately and writes go through the retrying sync queue.
  const handleAddGame = useCallback((gameData: Omit<Game, "id">) => {
    const newGame: Game = {
      ...gameData,
      id: createGameId(),
    };

    setGames((prev) => [newGame, ...prev]);
    setIsAddOpen(false);

    if (user && isDatabaseConfigured) enqueueUpsert(newGame);
  }, [user, enqueueUpsert]);

  const handleUpdateGame = useCallback((updatedGame: Game) => {
    setGames((prev) => prev.map((g) => (g.id === updatedGame.id ? updatedGame : g)));

    if (user && isDatabaseConfigured) enqueueUpsert(updatedGame);
  }, [user, enqueueUpsert]);

  const handleDeleteGame = useCallback((id: string) => {
    setGames((prev) => prev.filter((g) => g.id !== id));
    setSelectedGameId(null);

    if (user && isDatabaseConfigured) enqueueDelete(id);
  }, [user, enqueueDelete]);

  const currentDisplayGames = useMemo(
    () => (activeFriend ? friendGames : games),
    [activeFriend, friendGames, games]
  );

  const selectedGame = useMemo(
    () => currentDisplayGames.find((g) => g.id === selectedGameId),
    [currentDisplayGames, selectedGameId]
  );

  // Counts for each collection category computed in a single pass
  const {
    countAll,
    countPlaying,
    countPlayed,
    countPending,
    countWishlist,
    countCompleted,
    countFavorites,
  } = useMemo(() => {
    let all = 0;
    let playing = 0;
    let played = 0;
    let pending = 0;
    let wishlist = 0;
    let completed = 0;
    let favorites = 0;

    for (const g of currentDisplayGames) {
      const isWish = isWishlist(g.status);
      if (!isWish) all++;
      if (g.status === "playing") playing++;
      if (g.status === "played") played++;
      if (g.status === "pending") pending++;
      if (isWish) wishlist++;
      if (g.status === "completed") completed++;
      if (isFavoriteGame(g)) favorites++;
    }

    return {
      countAll: all,
      countPlaying: playing,
      countPlayed: played,
      countPending: pending,
      countWishlist: wishlist,
      countCompleted: completed,
      countFavorites: favorites,
    };
  }, [currentDisplayGames]);

  // Filter & Sort logic
  const filteredGames = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const isAllStatus = statusFilter === "All";
    const isFavStatus = statusFilter === "favorites";

    return currentDisplayGames
      .filter((game) => {
        const matchesSearch =
          !query ||
          game.title.toLowerCase().includes(query) ||
          game.genre.toLowerCase().includes(query) ||
          translateGenre(game.genre, settings.language).toLowerCase().includes(query) ||
          game.barcode.includes(query);

        const matchesStatus = isAllStatus
          ? !isWishlist(game.status)
          : isFavStatus
            ? isFavoriteGame(game)
            : game.status === statusFilter;

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
          return dateToTimestamp(b.acquisitionDate) - dateToTimestamp(a.acquisitionDate);
        }
        return 0;
      });
  }, [currentDisplayGames, searchQuery, statusFilter, platformFilter, sortBy, settings.language]);

  // Extract all available platforms in the library
  const allPlatforms = useMemo(
    () => Array.from(new Set(currentDisplayGames.flatMap((g) => g.platforms))).sort(),
    [currentDisplayGames]
  );

  // Helper for collection tabs configuration
  const collectionTabs = useMemo(
    () => [
      { id: "All", label: t.allStatuses, icon: LayoutGrid, count: countAll },
      { id: "playing", label: t.statusPlaying, icon: PlayCircle, count: countPlaying },
      { id: "played", label: t.statusPlayed, icon: CheckCircle, count: countPlayed },
      { id: "pending", label: t.statusPending, icon: Bookmark, count: countPending },
      { id: "wishlist", label: t.statusWishlist, icon: Heart, count: countWishlist },
      { id: "completed", label: t.statusCompleted, icon: CheckCircle2, count: countCompleted },
      { id: "favorites", label: t.statusFavorites, icon: Star, count: countFavorites },
    ],
    [t, countAll, countPlaying, countPlayed, countPending, countWishlist, countCompleted, countFavorites]
  );

  return (
    <div className="h-dvh w-full bg-neutral-100 dark:bg-[#0d0d0f] text-neutral-900 dark:text-neutral-100 font-sans flex flex-col md:flex-row overflow-hidden" id="app-root">

      {/* MOBILE TOP NAVIGATION BAR (Visible only on mobile < md) */}
      <header className="md:hidden bg-white dark:bg-[#141417] border-b border-neutral-200 dark:border-white/10 px-3 py-2.5 flex items-center justify-between sticky top-0 z-40 shadow-sm" id="mobile-top-bar">
        <div className="flex items-center gap-2">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label={t.navigation}
            className="min-w-[44px] min-h-[44px] p-2.5 bg-neutral-100 dark:bg-[#1b1b1f] hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-white rounded-none border border-neutral-300 dark:border-white/10 transition-colors cursor-pointer flex items-center justify-center relative"
            title={t.navigation}
            id="btn-open-mobile-menu"
          >
            <Menu className="w-5 h-5 stroke-[2.5]" />
            {incomingFriendRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <ProfileAvatar
              avatarUrl={settings.avatarUrl}
              username={settings.username}
              size="sm"
              language={settings.language}
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
          {/* Stats toggle: the desktop header button is hidden below sm */}
          <button
            onClick={() => setShowStats((prev) => !prev)}
            aria-label={t.statistics}
            aria-pressed={showStats}
            className={`sm:hidden min-w-[44px] min-h-[44px] p-2.5 rounded-none border transition-colors cursor-pointer flex items-center justify-center ${showStats
              ? "bg-indigo-600 text-white border-indigo-500"
              : "bg-neutral-100 dark:bg-[#1b1b1f] hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-white/10"
              }`}
            title={t.statistics}
            id="btn-mobile-stats"
          >
            <BarChart2 className="w-4 h-4" />
          </button>

          {/* Friends are available only for authenticated accounts backed by Supabase. */}
          {user && isDatabaseConfigured && (
          <button
            onClick={() => setIsFriendsModalOpen(true)}
            aria-label={t.friendsTitle || "Amigos"}
            className="min-w-[44px] min-h-[44px] p-2.5 bg-neutral-100 dark:bg-[#1b1b1f] hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-800 dark:text-neutral-200 rounded-none border border-neutral-300 dark:border-white/10 transition-colors cursor-pointer flex items-center justify-center relative"
            title={t.friendsTitle}
            id="btn-mobile-friends"
          >
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            {incomingFriendRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-rose-500 text-white text-[9px] font-black rounded-none">
                {incomingFriendRequestsCount}
              </span>
            )}
          </button>
          )}

          {activeFriend ? (
            <button
              onClick={handleBackToMyLibrary}
              aria-label={t.backToMyLibrary || "Volver a mi biblioteca"}
              className="min-h-[44px] px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-none shadow transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              title={t.backToMyLibrary}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t.homeLibrary}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddOpen(true)}
              aria-label={t.addGame || "Añadir Juego"}
              className="min-h-[44px] px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-none shadow transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              title={t.addGame}
              id="btn-mobile-add-game"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">{t.addGame}</span>
            </button>
          )}
        </div>
      </header>

      {/* MOBILE FULLSCREEN SIDEBAR MENU OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.navigation}
            className="fixed inset-0 z-50 md:hidden flex flex-col text-neutral-900 dark:text-white overflow-y-auto"
            id="mobile-fullscreen-sidebar"
          >
            <motion.div
              initial={{ opacity: 0, x: "-100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="flex flex-col min-h-full p-5 justify-between space-y-6 bg-white dark:bg-[#141417]"
            >
              {/* Header inside mobile menu */}
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar
                      avatarUrl={settings.avatarUrl}
                      username={settings.username}
                      size="md"
                      language={settings.language}
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
                    aria-label={t.close || "Cerrar menú"}
                    className="min-w-[44px] min-h-[44px] p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-[#1b1b1f] hover:bg-neutral-200 dark:hover:bg-white/10 border border-neutral-300 dark:border-white/10 rounded-none transition-colors cursor-pointer flex items-center justify-center"
                    title={t.close}
                    id="btn-close-mobile-menu"
                  >
                    <X className="w-6 h-6 stroke-[2.5]" />
                  </button>
                </div>

                {/* Nav Links inside mobile menu */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="text-xs font-black tracking-widest uppercase text-neutral-500 dark:text-neutral-500 px-2">
                      {t.navigation}
                    </p>

                    {/* Active Friend Banner Button in Mobile Menu if active */}
                    {activeFriend && (
                      <button
                        onClick={() => {
                          handleBackToMyLibrary();
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-none text-sm font-bold bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 transition-all cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <ArrowLeft className="w-4 h-4" />
                          <span>{t.backToMyLibrary}</span>
                        </span>
                      </button>
                    )}

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
                        <Home className="w-5 h-5" />
                        <span>{activeFriend ? t.friendLibraryTitle.replace("{name}", activeFriend.username) : t.homeLibrary}</span>
                      </span>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-black/10 dark:bg-white/10 rounded">
                        {countAll}
                      </span>
                    </button>

                    {/* Friends Button in Mobile Menu */}
                    {user && isDatabaseConfigured && (
                    <button
                      onClick={() => {
                        setIsFriendsModalOpen(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-none text-sm font-bold transition-all cursor-pointer border bg-neutral-50 dark:bg-[#1b1b1f] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5"
                    >
                      <span className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <span>{t.friendsTitle}</span>
                      </span>
                      {incomingFriendRequestsCount > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 bg-rose-500 text-white rounded font-mono animate-pulse">
                          {incomingFriendRequestsCount} {t.friendRequests}
                        </span>
                      )}
                    </button>
                    )}
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
                {activeFriend ? (
                  <button
                    onClick={() => {
                      handleBackToMyLibrary();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-none border border-indigo-400/30 transition-all cursor-pointer shadow"
                  >
                    <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    <span>{t.backToMyLibrary}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsAddOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-none border border-indigo-400/30 transition-all cursor-pointer shadow"
                  >
                    <Plus className="w-5 h-5 stroke-[3]" />
                    <span>{t.addGame}</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center justify-center gap-2 p-3 bg-neutral-100 dark:bg-[#1b1b1f] hover:bg-neutral-200 dark:hover:bg-[#25252a] text-neutral-800 dark:text-neutral-300 text-xs font-bold rounded-none border border-neutral-300 dark:border-white/10 transition-colors cursor-pointer"
                  >
                    {settings.theme === "dark" ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-indigo-600" />}
                    <span>{settings.theme === "dark" ? t.lightTheme : t.darkTheme}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsSettingsOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 p-3 bg-neutral-100 dark:bg-[#1b1b1f] hover:bg-neutral-200 dark:hover:bg-[#25252a] text-neutral-800 dark:text-neutral-300 text-xs font-bold rounded-none border border-neutral-300 dark:border-white/10 transition-colors cursor-pointer"
                  >
                    <Settings size={16} className="text-indigo-600 dark:text-indigo-400" />
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
                      <LogOut size={16} />
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
                      <LogIn size={16} />
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
              language={settings.language}
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

              {/* Active Friend Banner Button in Desktop Sidebar if active */}
              {activeFriend && (
                <button
                  onClick={handleBackToMyLibrary}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-none text-xs font-bold bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/20 transition-all cursor-pointer mb-1"
                >
                  <span className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>{t.backToMyLibrary}</span>
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  setStatusFilter("All");
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-none text-xs font-bold transition-all cursor-pointer border ${statusFilter === "All"
                  ? "bg-indigo-600 text-white border-indigo-500 shadow"
                  : "bg-transparent text-neutral-700 dark:text-neutral-300 border-transparent hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white"
                  }`}
              >
                <span className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  <span>{activeFriend ? t.friendLibraryTitle.replace("{name}", activeFriend.username) : t.homeLibrary}</span>
                </span>
                <span className="text-[10px] font-mono opacity-80">{countAll}</span>
              </button>

              {/* Friends button in Desktop Sidebar */}
              {user && isDatabaseConfigured && (
              <button
                onClick={() => setIsFriendsModalOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-none text-xs font-bold transition-all cursor-pointer border bg-transparent text-neutral-700 dark:text-neutral-300 border-transparent hover:bg-neutral-100 dark:hover:bg-white/5 hover:text-neutral-900 dark:hover:text-white"
                id="sidebar-friends-btn"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>{t.friendsTitle}</span>
                </span>
                {incomingFriendRequestsCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-rose-500 text-white rounded font-bold animate-pulse">
                    {incomingFriendRequestsCount}
                  </span>
                )}
              </button>
              )}
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

          {/* Add Game Button / Back to Library */}
          {activeFriend ? (
            <button
              onClick={handleBackToMyLibrary}
              aria-label={t.backToMyLibrary || "Volver a mi biblioteca"}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-none border border-indigo-400/30 transition-all cursor-pointer shadow"
              id="sidebar-back-my-library"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              <span>{t.backToMyLibrary}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddOpen(true)}
              aria-label={t.addGame || "Añadir Juego"}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-none border border-indigo-400/30 transition-all cursor-pointer shadow"
              id="sidebar-add-game"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>{t.addGame}</span>
            </button>
          )}

          {/* Theme & Settings Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={toggleTheme}
              aria-label={settings.theme === "dark" ? (t.themeLight || "Cambiar a tema claro") : (t.themeDark || "Cambiar a tema oscuro")}
              className="flex items-center justify-center gap-1.5 p-2 bg-neutral-100 dark:bg-[#1b1b1f] hover:bg-neutral-200 dark:hover:bg-[#25252a] text-neutral-800 dark:text-neutral-300 text-xs font-semibold rounded-none border border-neutral-300 dark:border-white/10 transition-colors cursor-pointer"
              title={settings.theme === "dark" ? t.themeLight : t.themeDark}
            >
              {settings.theme === "dark" ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-indigo-600" />}
              <span>{settings.theme === "dark" ? t.lightTheme : t.darkTheme}</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              aria-label={t.settings || "Ajustes"}
              className="flex items-center justify-center gap-1.5 p-2 bg-neutral-100 dark:bg-[#1b1b1f] hover:bg-neutral-200 dark:hover:bg-[#25252a] text-neutral-800 dark:text-neutral-300 text-xs font-semibold rounded-none border border-neutral-300 dark:border-white/10 transition-colors cursor-pointer"
              title={t.settings}
            >
              <Settings size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span>{t.settings}</span>
            </button>
          </div>

          {/* Account session control */}
          <div>
            {user ? (
              <button
                onClick={handleLogout}
                aria-label={t.logoutBtn || "Cerrar Sesión"}
                className="w-full flex items-center justify-center gap-2 p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-none border border-red-500/20 transition-all cursor-pointer"
              >
                <LogOut size={14} />
                <span>{t.logoutBtn}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                aria-label={t.loginBtn || "Iniciar Sesión / Registro"}
                className="w-full flex items-center justify-center gap-2 p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-none border border-indigo-500/20 transition-all cursor-pointer"
              >
                <LogIn size={14} />
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
                  aria-label={`${tab.label} (${tab.count})`}
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
                  aria-label={t.filterByStatus || "Filtrar por estado"}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Filter className="w-3.5 h-3.5 shrink-0 text-indigo-200" />
                    <span className="truncate flex items-center gap-1.5">
                      <ActiveIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{activeTab.label}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-1.5 py-0.5 text-[10px] font-mono bg-black/25 text-white font-extrabold rounded">
                      {activeTab.count}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isMobileStatusFilterOpen ? "rotate-180" : ""}`} />
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
                              aria-label={`${tab.label} (${tab.count})`}
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
              aria-label={t.statistics || "Estadísticas"}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-none border transition-all cursor-pointer ${showStats
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-neutral-100 dark:bg-[#1b1b1f] text-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-white/10 hover:bg-neutral-200 dark:hover:bg-white/10"
                }`}
            >
              <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{t.statistics}</span>
            </button>
          </div>

        </header>

        {/* MAIN BODY CONTENT */}
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto min-h-0">

          {/* FRIEND LIBRARY ACTIVE BANNER */}
          {activeFriend && (
            <FriendLibraryBanner
              friend={activeFriend}
              language={settings.language}
              onBackToMyLibrary={handleBackToMyLibrary}
              totalGames={friendGames.length}
              completedGames={friendGames.filter((g) => g.status === "completed").length}
              totalHours={friendGames.reduce((acc, g) => acc + (g.playTime || 0), 0)}
            />
          )}

          {/* Sync indicator */}
          {syncLoading && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-none text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center gap-2 font-bold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t.syncingData}</span>
            </div>
          )}

          {/* Cloud library could not be loaded */}
          {user && loadError && !syncLoading && (
            <div role="alert" className="p-3 bg-red-500/10 border border-red-500/20 rounded-none text-red-700 dark:text-red-400 text-xs flex flex-wrap items-center justify-center gap-3 font-bold">
              <span className="flex items-center gap-2">
                <CloudOff className="w-4 h-4" />
                {t.loadLibraryError}
              </span>
              <button
                type="button"
                onClick={handleRetryLoad}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white cursor-pointer"
              >
                {t.retry}
              </button>
            </div>
          )}

          {/* Loading Friend Games Indicator */}
          {isLoadingFriendGames && (
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-none text-indigo-600 dark:text-indigo-400 text-xs flex items-center justify-center gap-2 font-bold animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t.loadingFriendLibrary}</span>
            </div>
          )}

          {/* Collapsible Stats Board */}
          <AnimatePresence initial={false}>
            {showStats && (
              <motion.div
                key="stats-board"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Suspense fallback={<div className="p-4 text-center text-xs text-neutral-500">{t.loadingStats}</div>}>
                  <LibraryStatsPanel games={currentDisplayGames} language={settings.language} />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TOOLBAR CONTROLS BAR: SEARCH, CONSOLE FILTER, SORTING */}
          <div className="p-3 sm:p-4 bg-white dark:bg-[#141417] border border-neutral-200 dark:border-white/10 flex flex-col md:flex-row gap-3 items-center justify-between" id="controls-section">

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label={t.searchPlaceholder || "Buscar juegos por título o género"}
                className="w-full pl-9 pr-8 py-2 text-xs bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-200 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500 font-medium"
                id="search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label={t.clearSearch}
                  className="absolute right-0 top-0 bottom-0 w-9 flex items-center justify-center text-neutral-400 hover:text-neutral-800 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter & Sorting Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto">

              {/* Console Filter */}
              <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-200 dark:border-white/10 px-3 py-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <MonitorPlay className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-neutral-500 dark:text-neutral-400 font-semibold uppercase text-[10px] mr-1">{t.consoleLabel}:</span>
                </div>
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  aria-label={t.consoleLabel || "Filtrar por consola"}
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
                  <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-neutral-500 dark:text-neutral-400 font-semibold uppercase text-[10px] mr-1">{t.sortByLabel}:</span>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  aria-label={t.sortByLabel || "Ordenar juegos"}
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
                key={`empty-${statusFilter}-${activeFriend?.id || "mine"}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="text-center py-12 sm:py-20 bg-white dark:bg-[#141417] border border-neutral-200 dark:border-white/10 p-4 sm:p-8 space-y-4"
                id="empty-state-view"
              >
                <div className="w-16 h-16 bg-neutral-100 dark:bg-[#1b1b1f] rounded-none border border-neutral-200 dark:border-white/10 flex items-center justify-center mx-auto text-neutral-500">
                  <Gamepad2 size={36} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                    {activeFriend ? t.friendHasNoGames : t.noGamesMatch}
                  </h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-md mx-auto">
                    {activeFriend
                      ? `${activeFriend.username} ${t.noGamesMatchDesc}`
                      : t.noGamesMatchDesc}
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
                    aria-label={t.resetFilters || "Restablecer filtros"}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-none hover:bg-indigo-500/10 transition-all cursor-pointer"
                  >
                    {t.resetFilters}
                  </button>
                  {activeFriend ? (
                    <button
                      onClick={handleBackToMyLibrary}
                      aria-label={t.backToMyLibrary || "Volver a mi biblioteca"}
                      className="text-xs font-bold text-white bg-indigo-600 px-4 py-2 rounded-none hover:bg-indigo-500 transition-all cursor-pointer shadow flex items-center gap-1.5"
                    >
                      <ArrowLeft size={14} />
                      {t.backToMyLibrary}
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsAddOpen(true)}
                      aria-label={t.addGame || "Añadir juego"}
                      className="text-xs font-bold text-white bg-indigo-600 px-4 py-2 rounded-none hover:bg-indigo-500 transition-all cursor-pointer shadow"
                    >
                      + {t.addGame}
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`grid-${statusFilter}-${activeFriend?.id || "mine"}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-3 min-[480px]:grid-cols-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 gap-1.5 sm:gap-3.5"
                id="games-grid"
              >
                <AnimatePresence mode="popLayout">
                  {filteredGames.map((game, index) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      language={settings.language}
                      priority={index < 4}
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

      {/* FRIENDS MODAL OVERLAY */}
      <AnimatePresence>
        {isFriendsModalOpen && user && isDatabaseConfigured && (
          <Suspense fallback={null}>
            <FriendsModal
              isOpen={isFriendsModalOpen}
              onClose={() => {
                setIsFriendsModalOpen(false);
                if (user) {
                  refreshFriendRequestsCount(user.id);
                }
              }}
              currentUserId={user.id}
              currentUsername={settings.username}
              language={settings.language}
              onViewFriendLibrary={(friend) => {
                setIsFriendsModalOpen(false);
                handleViewFriendLibrary(friend);
              }}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL OVERLAY */}
      <AnimatePresence>
        {isSettingsOpen && (
          <Suspense fallback={null}>
            <SettingsModal
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onClose={() => setIsSettingsOpen(false)}
              onEnlargeAvatar={() => setIsAvatarModalOpen(true)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* AVATAR LARGE VIEW MODAL OVERLAY */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <Suspense fallback={null}>
            <AvatarModal
              isOpen={isAvatarModalOpen}
              onClose={() => setIsAvatarModalOpen(false)}
              avatarUrl={settings.avatarUrl}
              username={settings.username}
              language={settings.language}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* AUTH MODAL OVERLAY */}
      <AnimatePresence>
        {isAuthOpen && (
          <Suspense fallback={null}>
            <AuthModal
              language={settings.language}
              onClose={() => setIsAuthOpen(false)}
              onSuccess={handleAuthSuccess}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL OVERLAY */}
      <AnimatePresence>
        {selectedGame && (
          <Suspense fallback={null}>
            <GameDetailModal
              game={selectedGame}
              language={settings.language}
              readOnly={Boolean(activeFriend)}
              onClose={() => setSelectedGameId(null)}
              onUpdate={handleUpdateGame}
              onDelete={handleDeleteGame}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* ADD GAME FORM OVERLAY */}
      <AnimatePresence>
        {isAddOpen && (
          <Suspense fallback={null}>
            <AddGameForm
              language={settings.language}
              onClose={() => setIsAddOpen(false)}
              onAdd={handleAddGame}
            />
          </Suspense>
        )}
      </AnimatePresence>

      {/* PENDING / FAILED CLOUD WRITES */}
      {user && (syncError || pendingCount > 0) && (
        <div
          role="status"
          className={`fixed bottom-3 left-1/2 -translate-x-1/2 z-40 max-w-[92vw] flex items-center gap-3 px-3 py-2 text-xs font-bold border shadow-xl ${syncError
            ? "bg-red-600 text-white border-red-400"
            : "bg-white dark:bg-[#1b1b1f] text-neutral-800 dark:text-neutral-200 border-neutral-300 dark:border-white/10"
            }`}
        >
          {syncError ? <CloudOff className="w-4 h-4 shrink-0" /> : <Loader2 className="w-4 h-4 shrink-0 animate-spin" />}
          <span>
            {syncError
              ? (typeof navigator !== "undefined" && !navigator.onLine ? t.syncOffline : t.syncFailed).replace("{count}", String(pendingCount))
              : t.syncPending.replace("{count}", String(pendingCount))}
          </span>
          {syncError && (
            <button
              type="button"
              onClick={retryNow}
              className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              {t.retry}
            </button>
          )}
        </div>
      )}

      {/* IMPORT GAMES CREATED WHILE SIGNED OUT */}
      {guestImportCandidates.length > 0 && (
        <ConfirmDialog
          title={t.importLocalGamesTitle}
          message={t.importLocalGamesMessage.replace("{count}", String(guestImportCandidates.length))}
          confirmLabel={t.importLocalGamesConfirm}
          cancelLabel={t.notNow}
          onConfirm={handleImportGuestGames}
          onCancel={handleDismissGuestImport}
        />
      )}

      {/* VERCEL WEB ANALYTICS */}
      <Analytics />

    </div>
  );
}
