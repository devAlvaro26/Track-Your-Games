import React from "react";
import { FriendProfile, Language } from "../types";
import { getTranslation } from "../translations";
import * as Icons from "lucide-react";

interface FriendLibraryBannerProps {
  friend: FriendProfile;
  totalGames: number;
  completedGames: number;
  totalHours: number;
  onBackToMyLibrary: () => void;
  language?: Language;
}

export const FriendLibraryBanner: React.FC<FriendLibraryBannerProps> = ({
  friend,
  totalGames,
  completedGames,
  totalHours,
  onBackToMyLibrary,
  language = "en",
}) => {
  const t = getTranslation(language);

  return (
    <div
      id="friend-library-banner"
      className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-indigo-900/90 via-indigo-800/85 to-purple-900/90 text-white rounded-none border border-indigo-500/40 shadow-xl backdrop-blur-md relative overflow-hidden"
    >
      {/* Subtle background glow element */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        {/* Left: Friend Profile Header */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            {friend.avatarUrl ? (
              <img
                src={friend.avatarUrl}
                alt={friend.username}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-none object-cover border-2 border-white/40 shadow-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-none bg-indigo-600 border-2 border-white/40 flex items-center justify-center text-white font-black text-lg shadow-md">
                {friend.username ? friend.username.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-indigo-900 rounded-none"
              title="Online"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-indigo-200">
                {t.viewingFriendLibrary}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white truncate">
              {friend.username}
            </h2>
            {friend.bio && (
              <p className="text-xs text-indigo-100/80 line-clamp-1 mt-0.5">
                {friend.bio}
              </p>
            )}
          </div>
        </div>

        {/* Center/Right: Stats & Back Button */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* Quick stats pills */}
          <div className="flex items-center gap-2 text-xs">
            <div className="px-3 py-1.5 bg-black/30 border border-white/10 rounded-none flex items-center gap-1.5">
              <Icons.Gamepad2 className="w-3.5 h-3.5 text-indigo-300" />
              <span className="font-bold">{totalGames}</span>
              <span className="text-white/60 text-[11px]">{t.gamesInLibrary || "juegos"}</span>
            </div>

            <div className="px-3 py-1.5 bg-black/30 border border-white/10 rounded-none flex items-center gap-1.5">
              <Icons.Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-bold">{completedGames}</span>
              <span className="text-white/60 text-[11px]">{t.statusCompletedTag || "Completados"}</span>
            </div>

            {totalHours > 0 && (
              <div className="hidden sm:flex px-3 py-1.5 bg-black/30 border border-white/10 rounded-none items-center gap-1.5">
                <Icons.Clock className="w-3.5 h-3.5 text-emerald-300" />
                <span className="font-bold">{totalHours}h</span>
              </div>
            )}
          </div>

          {/* Action button: Return to my library */}
          <button
            onClick={onBackToMyLibrary}
            id="btn-back-to-my-library"
            className="px-4 py-2 bg-white text-indigo-950 hover:bg-neutral-100 font-extrabold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl cursor-pointer rounded-none active:scale-95 shrink-0"
          >
            <Icons.ArrowLeft className="w-4 h-4 text-indigo-900" />
            <span>{t.backToMyLibrary}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
