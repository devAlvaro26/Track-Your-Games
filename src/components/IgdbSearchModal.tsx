import React, { useState, useEffect, useCallback } from "react";
import { IgdbSearchResult, Language } from "../types";
import { getTranslation } from "../translations";
import * as Icons from "lucide-react";
import { motion } from "motion/react";

interface IgdbSearchModalProps {
  initialQuery?: string;
  onClose: () => void;
  onSelectGame: (result: IgdbSearchResult) => void;
  language?: Language;
}

export const IgdbSearchModal: React.FC<IgdbSearchModalProps> = ({
  initialQuery = "",
  onClose,
  onSelectGame,
  language = "en",
}) => {
  const t = getTranslation(language);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<IgdbSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchNotice, setSearchNotice] = useState("");
  const [statusError, setStatusError] = useState("");
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  // Check IGDB API status on mount
  useEffect(() => {
    fetch(`/api/igdb/status?lang=${language}`)
      .then(async (res) => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (e) {
          return {
            configured: false,
            error: t.invalidServerResponse,
          };
        }
      })
      .then((data) => {
        setIsConfigured(Boolean(data.configured));
        if (data.error) {
          setStatusError(data.error);
        } else {
          setStatusError("");
        }
      })
      .catch(() => {
        setIsConfigured(false);
        setStatusError(t.igdbStatusConnectionError);
      });
  }, [language, t.igdbStatusConnectionError]);

  const handleSearch = useCallback(async (searchTerm?: string) => {
    const q = (searchTerm !== undefined ? searchTerm : query).trim();
    if (!q) return;

    setIsLoading(true);
    setError("");
    setSearchNotice("");

    try {
      const res = await fetch("/api/igdb/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, limit: 10, lang: language }),
      });

      const responseText = await res.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error("IGDB search returned non-JSON response:", responseText.slice(0, 100));
        setError(t.igdbHtmlError);
        setResults([]);
        return;
      }

      if (!res.ok || data.error) {
        let errMessage = data.error || t.igdbDefaultError;
        if (typeof errMessage === "string" && (errMessage.includes("Unexpected token") || errMessage.includes("is not valid JSON"))) {
          errMessage = t.igdbJsonError;
        }
        setError(errMessage);
        setResults([]);
        if (data.configured !== undefined) {
          setIsConfigured(data.configured);
        }
        return;
      }

      setResults(data.games || []);
      if (data.configured !== undefined) {
        setIsConfigured(data.configured);
      }

      if (data.games && data.games.length > 0) {
        setSearchNotice(
          t.igdbSearchSuccessNotice.replace("{count}", String(data.games.length))
        );
      } else {
        setSearchNotice(
          t.igdbSearchZeroNotice.replace("{query}", q)
        );
      }
    } catch (err: any) {
      console.error("Error searching IGDB:", err);
      let errMsg = err?.message || t.aiConnectionError;
      if (typeof errMsg === "string" && (errMsg.includes("Unexpected token") || errMsg.includes("is not valid JSON"))) {
        errMsg = t.cannotParseServerResponse;
      }
      setError(errMsg);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, language, t.igdbDefaultError, t.igdbSearchSuccessNotice, t.igdbSearchZeroNotice, t.aiConnectionError]);

  // Perform initial search once on mount if query is provided
  useEffect(() => {
    if (initialQuery.trim()) {
      handleSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
      id="igdb-search-modal-backdrop"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-3xl bg-white dark:bg-[#141417] text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/10 rounded-none shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
        id="igdb-search-modal-card"
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-[#1b1b1f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-none shadow-sm">
              <Icons.Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                {t.igdbModalTitle}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-gray-400">
                {t.igdbModalSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white rounded-none hover:bg-neutral-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            id="close-igdb-search-modal"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>

        {/* IGDB Status Banner */}
        <div className="px-5 py-2.5 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-white/10 flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${isConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
              />
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                {isConfigured ? t.igdbConnected : t.igdbNotConfigured}
              </span>
            </div>
            {!isConfigured && !statusError && (
              <span
                className="text-[11px] text-neutral-500 dark:text-gray-400 truncate max-w-[420px]"
                title={t.igdbConfigureHint}
              >
                {t.igdbConfigureHint}
              </span>
            )}
          </div>

          {statusError && (
            <div className="mt-1 p-2 bg-amber-500/10 border border-amber-500/20 rounded-none text-amber-800 dark:text-amber-300 flex items-start gap-2 text-xs">
              <Icons.AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">{t.igdbConfigWarning} </span>
                <span>{statusError}</span>
              </div>
            </div>
          )}
        </div>

        {/* Search Input Bar */}
        <div className="p-5 border-b border-neutral-200 dark:border-white/10">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Icons.Search className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                autoFocus
                placeholder={t.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                id="input-igdb-query"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 font-bold text-xs text-white rounded-none shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              id="btn-igdb-search-submit"
            >
              {isLoading ? (
                <>
                  <Icons.Loader2 className="w-4 h-4 animate-spin" />
                  {t.igdbSearching}
                </>
              ) : (
                <>
                  <Icons.Search className="w-4 h-4" />
                  {t.igdbSearchBtn}
                </>
              )}
            </button>
          </form>

          {/* Error Alert Box */}
          {error && (
            <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-none text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <Icons.AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">{t.igdbQueryErrorTitle}</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Success / Result Notice Banner */}
          {!error && searchNotice && (
            <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-none text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 font-medium">
              <Icons.CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{searchNotice}</span>
            </div>
          )}
        </div>

        {/* Search Results Grid */}
        <div className="p-5 max-h-[480px] overflow-y-auto space-y-3">
          {isLoading ? (
            <div className="py-12 text-center space-y-3">
              <Icons.Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
              <p className="text-xs text-neutral-500 dark:text-gray-400 font-medium">
                {t.igdbSearching}
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Icons.Gamepad2 className="w-10 h-10 text-neutral-300 dark:text-gray-700 mx-auto" />
              <p className="text-sm font-semibold text-neutral-600 dark:text-gray-300">
                {query.trim() ? t.noGamesMatch : t.igdbSearchPlaceholderPrompt}
              </p>
              <p className="text-xs text-neutral-400 dark:text-gray-500 max-w-sm mx-auto">
                {t.igdbSearchHint}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="igdb-results-container">
              {results.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectGame(item)}
                  className="p-3 bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 hover:border-indigo-500 rounded-none transition-all cursor-pointer flex gap-3 group relative overflow-hidden"
                >
                  {/* Thumbnail Cover */}
                  <div className="w-20 h-28 bg-neutral-200 dark:bg-neutral-800 rounded-none overflow-hidden flex-shrink-0 shadow-sm relative border border-neutral-300 dark:border-white/10">
                    {item.coverUrl ? (
                      <img
                        src={item.coverUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Fallback if image fails
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 p-2 text-center">
                        <Icons.ImageOff className="w-6 h-6 mb-1 opacity-50" />
                        <span className="text-[9px] uppercase font-bold">{t.noCoverText}</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {item.name}
                        </h3>
                        {item.rating !== undefined && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-0.5 flex-shrink-0">
                            <Icons.Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                            {item.rating}
                          </span>
                        )}
                      </div>

                      {item.firstReleaseDate && (
                        <p className="text-[11px] font-semibold text-neutral-500 dark:text-gray-400 mt-0.5">
                          {item.firstReleaseDate.substring(0, 4)}
                        </p>
                      )}

                      {item.genres && item.genres.length > 0 && (
                        <p className="text-[10px] uppercase font-bold text-indigo-600/80 dark:text-indigo-400/80 tracking-wider mt-1 truncate">
                          {item.genres.join(" • ")}
                        </p>
                      )}

                      {item.platforms && item.platforms.length > 0 && (
                        <p className="text-[10px] text-neutral-400 dark:text-gray-500 truncate mt-0.5">
                          {item.platforms.slice(0, 3).join(", ")}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-neutral-200/50 dark:border-white/5 mt-2">
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <Icons.PlusCircle className="w-3.5 h-3.5" />
                        {t.igdbSelectGame}
                      </span>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-neutral-400 hover:text-indigo-500 transition-colors"
                          title={t.viewOnIgdb}
                        >
                          <Icons.ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-[#1A1A1A]/30 flex justify-between items-center text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Icons.CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
            {t.igdbFooterCredits}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-white/5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
