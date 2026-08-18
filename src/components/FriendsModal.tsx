import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FriendProfile, Friendship, Language } from "../types";
import { getTranslation } from "../translations";
import {
  fetchFriendships,
  searchProfiles,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from "../lib/database";
import * as Icons from "lucide-react";

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  currentUsername?: string;
  onViewFriendLibrary: (friend: FriendProfile) => void;
  language?: Language;
  onFriendshipsUpdated?: (incomingCount: number) => void;
}

type TabType = "friends" | "requests" | "add";

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  currentUserId = "current-user",
  currentUsername = "Gamer",
  onViewFriendLibrary,
  language = "en",
  onFriendshipsUpdated,
}) => {
  const t = getTranslation(language);

  const [activeTab, setActiveTab] = useState<TabType>("friends");
  const [requestsSubTab, setRequestsSubTab] = useState<"incoming" | "outgoing">("incoming");

  const [friendsList, setFriendsList] = useState<Friendship[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Friendship[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friendship[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Load friendships
  const loadFriendships = async () => {
    setIsLoading(true);
    try {
      const data = await fetchFriendships(currentUserId);
      setFriendsList(data.friends);
      setIncomingRequests(data.incoming);
      setOutgoingRequests(data.outgoing);
      if (onFriendshipsUpdated) {
        onFriendshipsUpdated(data.incoming.length);
      }
    } catch (e) {
      console.warn("Failed to load friendships:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFriendships();
      setFeedback(null);
      setSearchQuery("");
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [isOpen, currentUserId]);

  // Search execution
  const executeSearch = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchProfiles(trimmed, currentUserId);
      setSearchResults(results);
    } catch (err) {
      console.warn("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (activeTab !== "add") return;

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      executeSearch(trimmed);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, currentUserId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const showToast = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleCopyUsername = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUsername);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSendRequest = async (targetUser: FriendProfile) => {
    setActionLoadingId(targetUser.id);
    try {
      const res = await sendFriendRequest(currentUserId, targetUser.id, targetUser);
      if (res.success) {
        showToast("success", t.friendRequestSentSuccess);
        await loadFriendships();
      } else {
        const errorMsg =
          res.error === "cannotAddSelf"
            ? t.cannotAddSelf
            : res.error === "alreadyFriends"
            ? t.alreadyFriends
            : res.error === "requestPending"
            ? t.friendRequestSent
            : res.error || "Error";
        showToast("error", errorMsg);
      }
    } catch (err: any) {
      showToast("error", err?.message || "Error al enviar solicitud");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAccept = async (friendshipId: string) => {
    setActionLoadingId(friendshipId);
    try {
      const res = await acceptFriendRequest(friendshipId);
      if (res.success) {
        showToast("success", t.friendAddedSuccess);
        await loadFriendships();
      } else {
        showToast("error", res.error || "Error");
      }
    } catch (err: any) {
      showToast("error", err?.message || "Error al aceptar solicitud");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectOrCancel = async (friendshipId: string) => {
    setActionLoadingId(friendshipId);
    try {
      const res = await rejectFriendRequest(friendshipId);
      if (res.success) {
        await loadFriendships();
      } else {
        showToast("error", res.error || "Error");
      }
    } catch (err: any) {
      showToast("error", err?.message || "Error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
    if (!confirm(t.confirmRemoveFriend)) return;

    setActionLoadingId(friendshipId);
    try {
      const res = await removeFriend(friendshipId);
      if (res.success) {
        showToast("success", `${friendName} ${t.friendRemovedSuccess}`);
        await loadFriendships();
      } else {
        showToast("error", res.error || "Error");
      }
    } catch (err: any) {
      showToast("error", err?.message || "Error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Check relationship status with a user in search results
  const getUserRelationStatus = (userId: string) => {
    const isFriend = friendsList.some((f) => f.friendProfile.id === userId);
    if (isFriend) return "friend";

    const isOutgoing = outgoingRequests.some((f) => f.friendProfile.id === userId);
    if (isOutgoing) return "outgoing";

    const incoming = incomingRequests.find((f) => f.friendProfile.id === userId);
    if (incoming) return { type: "incoming", friendshipId: incoming.id };

    return "none";
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in"
      id="friends-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-[#fcfcfd] dark:bg-[#141416] text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col rounded-none overflow-hidden"
        id="friends-modal-content"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#18181b] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-none border border-indigo-500/20">
              <Icons.Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                {t.friendsTitle}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 hidden sm:block">
                {t.friendsSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="close-friends-modal"
            className="p-2 rounded-none hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer"
            title={t.close}
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 dark:border-white/10 bg-neutral-100/70 dark:bg-[#121214] shrink-0 px-3 sm:px-5 gap-2 pt-2">
          <button
            id="tab-my-friends"
            onClick={() => setActiveTab("friends")}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "friends"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <Icons.UserCheck className="w-4 h-4" />
            <span>{t.myFriends}</span>
            <span className="px-1.5 py-0.2 bg-neutral-200 dark:bg-white/10 text-[11px] rounded-none font-extrabold">
              {friendsList.length}
            </span>
          </button>

          <button
            id="tab-requests"
            onClick={() => setActiveTab("requests")}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer relative ${
              activeTab === "requests"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <Icons.Bell className="w-4 h-4" />
            <span>{t.friendRequests}</span>
            {incomingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black animate-pulse rounded-none">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            id="tab-add-friend"
            onClick={() => setActiveTab("add")}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "add"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                : "border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
            }`}
          >
            <Icons.UserPlus className="w-4 h-4" />
            <span>{t.addFriend}</span>
          </button>
        </div>

        {/* Feedback Alert */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-3 text-xs font-bold flex items-center gap-2 border-b shrink-0 ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
              }`}
            >
              {feedback.type === "success" ? (
                <Icons.CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <Icons.AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* 1. TAB: MY FRIENDS */}
          {activeTab === "friends" && (
            <div>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-neutral-400 gap-2">
                  <Icons.Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <p className="text-xs">{t.loadingFriendLibrary || "Cargando amigos..."}</p>
                </div>
              ) : friendsList.length === 0 ? (
                <div className="text-center py-12 px-4 border border-dashed border-neutral-300 dark:border-white/10 rounded-none space-y-3 bg-neutral-50/50 dark:bg-[#17171a]/50">
                  <div className="w-12 h-12 rounded-none bg-neutral-200 dark:bg-white/10 flex items-center justify-center mx-auto text-neutral-400">
                    <Icons.Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-neutral-800 dark:text-white">
                    {t.noFriendsYet}
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    {t.noFriendsDesc}
                  </p>
                  <button
                    onClick={() => setActiveTab("add")}
                    id="btn-goto-add-friend"
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors inline-flex items-center gap-1.5 cursor-pointer rounded-none shadow-sm"
                  >
                    <Icons.UserPlus className="w-3.5 h-3.5" />
                    <span>{t.addFriend}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3" id="friends-list-container">
                  {friendsList.map((f) => {
                    const profile = f.friendProfile;
                    const isBusy = actionLoadingId === f.id;

                    return (
                      <div
                        key={f.id}
                        id={`friend-card-${profile.id}`}
                        className="p-3.5 sm:p-4 bg-white dark:bg-[#1c1c20] border border-neutral-300 dark:border-white/10 rounded-none shadow-sm hover:border-indigo-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        {/* Profile Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          {profile.avatarUrl ? (
                            <img
                              src={profile.avatarUrl}
                              alt={profile.username}
                              className="w-11 h-11 rounded-none object-cover border border-neutral-300 dark:border-white/20 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-11 h-11 bg-indigo-600 text-white font-black text-base flex items-center justify-center rounded-none border border-neutral-300 dark:border-white/20 shrink-0">
                              {profile.username ? profile.username.charAt(0).toUpperCase() : "G"}
                            </div>
                          )}

                          <div className="min-w-0">
                            <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white truncate">
                              {profile.username}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Icons.Gamepad2 className="w-3 h-3 text-indigo-500" />
                                {profile.gamesCount || 0} {t.friendGamesCount}
                              </span>
                              {profile.completedCount !== undefined && profile.completedCount > 0 && (
                                <span className="flex items-center gap-1">
                                  <Icons.Trophy className="w-3 h-3 text-amber-500" />
                                  {profile.completedCount}
                                </span>
                              )}
                              {profile.favoriteConsole && (
                                <span className="px-1.5 py-0.2 bg-neutral-100 dark:bg-white/10 rounded-none text-[10px] font-bold">
                                  {profile.favoriteConsole}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => {
                              onViewFriendLibrary(profile);
                              onClose();
                            }}
                            id={`btn-view-library-${profile.id}`}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer rounded-none shadow-sm"
                            title={t.viewLibrary}
                          >
                            <Icons.BookOpen className="w-3.5 h-3.5" />
                            <span>{t.viewLibrary}</span>
                          </button>

                          <button
                            onClick={() => handleRemoveFriend(f.id, profile.username)}
                            disabled={isBusy}
                            id={`btn-remove-friend-${profile.id}`}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors border border-neutral-300 dark:border-white/10 rounded-none cursor-pointer"
                            title={t.removeFriend}
                          >
                            {isBusy ? (
                              <Icons.Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                            ) : (
                              <Icons.Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. TAB: REQUESTS */}
          {activeTab === "requests" && (
            <div className="space-y-4">
              {/* Sub-tab switcher */}
              <div className="flex gap-2 p-1 bg-neutral-200/60 dark:bg-white/5 rounded-none border border-neutral-300 dark:border-white/10">
                <button
                  onClick={() => setRequestsSubTab("incoming")}
                  className={`flex-1 py-1.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer rounded-none ${
                    requestsSubTab === "incoming"
                      ? "bg-white dark:bg-[#202024] text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                  }`}
                >
                  <Icons.ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>{t.incomingRequests}</span>
                  <span className="px-1.5 py-0.2 bg-neutral-200 dark:bg-white/10 text-[10px] rounded-none">
                    {incomingRequests.length}
                  </span>
                </button>

                <button
                  onClick={() => setRequestsSubTab("outgoing")}
                  className={`flex-1 py-1.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer rounded-none ${
                    requestsSubTab === "outgoing"
                      ? "bg-white dark:bg-[#202024] text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                  }`}
                >
                  <Icons.ArrowUpRight className="w-3.5 h-3.5" />
                  <span>{t.outgoingRequests}</span>
                  <span className="px-1.5 py-0.2 bg-neutral-200 dark:bg-white/10 text-[10px] rounded-none">
                    {outgoingRequests.length}
                  </span>
                </button>
              </div>

              {/* Sub-tab: Incoming Requests */}
              {requestsSubTab === "incoming" && (
                <div>
                  {incomingRequests.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-neutral-300 dark:border-white/10 rounded-none text-neutral-400 text-xs p-4">
                      <Icons.Inbox className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                      <p>{t.noIncomingRequests}</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {incomingRequests.map((req) => {
                        const profile = req.friendProfile;
                        const isBusy = actionLoadingId === req.id;

                        return (
                          <div
                            key={req.id}
                            className="p-3.5 bg-white dark:bg-[#1c1c20] border border-neutral-300 dark:border-white/10 rounded-none shadow-sm flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {profile.avatarUrl ? (
                                <img
                                  src={profile.avatarUrl}
                                  alt={profile.username}
                                  className="w-10 h-10 rounded-none object-cover border border-neutral-300 dark:border-white/20 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-indigo-600 text-white font-black text-sm flex items-center justify-center rounded-none shrink-0">
                                  {profile.username ? profile.username.charAt(0).toUpperCase() : "G"}
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white truncate">
                                  {profile.username}
                                </h4>
                                <p className="text-[11px] text-neutral-500">
                                  {profile.gamesCount || 0} {t.friendGamesCount}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleAccept(req.id)}
                                disabled={isBusy}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer rounded-none shadow-sm whitespace-nowrap shrink-0"
                              >
                                {isBusy ? (
                                  <Icons.Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                ) : (
                                  <Icons.Check className="w-3.5 h-3.5 shrink-0" />
                                )}
                                <span>{t.acceptRequest}</span>
                              </button>

                              <button
                                onClick={() => handleRejectOrCancel(req.id)}
                                disabled={isBusy}
                                className="px-2.5 py-1.5 bg-neutral-100 dark:bg-white/10 hover:bg-rose-500/20 text-neutral-600 dark:text-neutral-300 hover:text-rose-600 text-xs font-bold transition-colors border border-neutral-300 dark:border-white/10 cursor-pointer rounded-none inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                              >
                                <Icons.X className="w-3.5 h-3.5 shrink-0" />
                                <span>{t.rejectRequest}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab: Outgoing Requests */}
              {requestsSubTab === "outgoing" && (
                <div>
                  {outgoingRequests.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-neutral-300 dark:border-white/10 rounded-none text-neutral-400 text-xs p-4">
                      <Icons.Send className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                      <p>{t.noOutgoingRequests}</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {outgoingRequests.map((req) => {
                        const profile = req.friendProfile;
                        const isBusy = actionLoadingId === req.id;

                        return (
                          <div
                            key={req.id}
                            className="p-3.5 bg-white dark:bg-[#1c1c20] border border-neutral-300 dark:border-white/10 rounded-none shadow-sm flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {profile.avatarUrl ? (
                                <img
                                  src={profile.avatarUrl}
                                  alt={profile.username}
                                  className="w-10 h-10 rounded-none object-cover border border-neutral-300 dark:border-white/20 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-indigo-600 text-white font-black text-sm flex items-center justify-center rounded-none shrink-0">
                                  {profile.username ? profile.username.charAt(0).toUpperCase() : "G"}
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white truncate">
                                  {profile.username}
                                </h4>
                                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase rounded-none inline-flex items-center gap-1 mt-0.5">
                                  <Icons.Clock className="w-2.5 h-2.5 shrink-0" />
                                  <span>{t.requestPending}</span>
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0">
                              <button
                                onClick={() => handleRejectOrCancel(req.id)}
                                disabled={isBusy}
                                className="px-3 py-1.5 bg-neutral-100 dark:bg-white/10 hover:bg-rose-500/20 text-neutral-600 dark:text-neutral-300 hover:text-rose-600 text-xs font-bold transition-colors border border-neutral-300 dark:border-white/10 cursor-pointer rounded-none inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                              >
                                {isBusy ? (
                                  <Icons.Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                ) : (
                                  <Icons.X className="w-3.5 h-3.5 shrink-0" />
                                )}
                                <span>{t.cancelRequest}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. TAB: ADD FRIEND */}
          {activeTab === "add" && (
            <div className="space-y-4">
              {/* Share box with current user profile name */}
              <div className="p-3.5 sm:p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-none flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    {t.myFriendCode}
                  </p>
                  <p className="text-sm sm:text-base font-black text-indigo-700 dark:text-indigo-300 tracking-wide mt-0.5">
                    @{currentUsername}
                  </p>
                </div>
                <button
                  onClick={handleCopyUsername}
                  id="btn-copy-username"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer rounded-none shadow-sm self-start sm:self-center"
                >
                  {copiedCode ? (
                    <>
                      <Icons.Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>{t.copied}</span>
                    </>
                  ) : (
                    <>
                      <Icons.Copy className="w-3.5 h-3.5" />
                      <span>{t.copyUsername}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Search input form */}
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Icons.Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchUserPlaceholder}
                  className="w-full pl-10 pr-20 py-2.5 bg-white dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/15 text-sm rounded-none focus:outline-none focus:border-indigo-500 text-neutral-900 dark:text-white"
                  autoFocus
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {isSearching && (
                    <Icons.Loader2 className="w-4 h-4 animate-spin text-indigo-500 mr-1" />
                  )}
                  {!isSearching && searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                        setHasSearched(false);
                      }}
                      className="p-1 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    >
                      <Icons.X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-none transition-colors cursor-pointer"
                  >
                    {t.search}
                  </button>
                </div>
              </form>

              {/* Search Results */}
              {searchQuery.trim().length >= 1 ? (
                <div>
                  {isSearching ? (
                    <div className="py-8 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                      <Icons.Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      <span>{t.searchingUsers}</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-8 text-neutral-400 border border-dashed border-neutral-300 dark:border-white/10 rounded-none text-xs p-4">
                      <Icons.UserX className="w-6 h-6 mx-auto mb-1.5 opacity-50" />
                      <p>{t.userNotFound}</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5" id="search-results-list">
                      {searchResults.map((user) => {
                        const relStatus = getUserRelationStatus(user.id);
                        const isBusy = actionLoadingId === user.id;

                        return (
                          <div
                            key={user.id}
                            className="p-3.5 bg-white dark:bg-[#1c1c20] border border-neutral-300 dark:border-white/10 rounded-none shadow-sm flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {user.avatarUrl ? (
                                <img
                                  src={user.avatarUrl}
                                  alt={user.username}
                                  className="w-10 h-10 rounded-none object-cover border border-neutral-300 dark:border-white/20 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-indigo-600 text-white font-black text-sm flex items-center justify-center rounded-none shrink-0">
                                  {user.username ? user.username.charAt(0).toUpperCase() : "G"}
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="text-sm font-extrabold text-neutral-900 dark:text-white truncate">
                                  {user.username}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-neutral-500">
                                  <span>
                                    {user.gamesCount || 0} {t.friendGamesCount}
                                  </span>
                                  {user.favoriteConsole && (
                                    <span>• {user.favoriteConsole}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Relationship actions */}
                            <div className="shrink-0">
                              {relStatus === "friend" ? (
                                <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-none flex items-center gap-1">
                                  <Icons.Check className="w-3.5 h-3.5" />
                                  {t.alreadyFriends}
                                </span>
                              ) : relStatus === "outgoing" ? (
                                <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-none flex items-center gap-1">
                                  <Icons.Clock className="w-3.5 h-3.5" />
                                  {t.friendRequestSent}
                                </span>
                              ) : typeof relStatus === "object" && relStatus.type === "incoming" ? (
                                <button
                                  onClick={() => handleAccept(relStatus.friendshipId)}
                                  disabled={isBusy}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-none cursor-pointer flex items-center gap-1 shadow-sm"
                                >
                                  <Icons.Check className="w-3.5 h-3.5" />
                                  {t.acceptRequest}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSendRequest(user)}
                                  disabled={isBusy}
                                  id={`btn-send-request-${user.id}`}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-none transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                                >
                                  {isBusy ? (
                                    <Icons.Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Icons.UserPlus className="w-3.5 h-3.5" />
                                  )}
                                  <span>{t.sendFriendRequest}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-neutral-400 text-xs">
                  <p>{t.friendSearchPrompt}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-neutral-100/70 dark:bg-[#18181b] border-t border-neutral-200 dark:border-white/10 flex justify-between items-center text-xs text-neutral-500 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-neutral-200 font-bold transition-colors cursor-pointer rounded-none"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
