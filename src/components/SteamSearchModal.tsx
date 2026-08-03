import React, { useState, useEffect, useCallback } from "react";
import { SteamSearchResult, Language } from "../types";
import { getTranslation } from "../translations";
import * as Icons from "lucide-react";
import { motion } from "motion/react";

interface SteamSearchModalProps {
  initialQuery?: string;
  onClose: () => void;
  onSelectGame: (result: SteamSearchResult) => void;
  language?: Language;
}

export const SteamSearchModal: React.FC<SteamSearchModalProps> = ({
  initialQuery = "",
  onClose,
  onSelectGame,
  language = "en",
}) => {
  const t = getTranslation(language);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SteamSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = useCallback(async (searchTerm?: string) => {
    const q = (searchTerm !== undefined ? searchTerm : query).trim();
    if (!q) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/steam/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, lang: language }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || t.steamSearchError || "Error al buscar en Steam.");
        setResults([]);
      } else {
        setResults(data.results || []);
      }
    } catch (err: any) {
      setError(err.message || t.serverConnError || "Error de conexión con el servidor.");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, language]);

  useEffect(() => {
    if (initialQuery.trim()) {
      handleSearch(initialQuery);
    }
  }, [initialQuery, handleSearch]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-xl bg-white dark:bg-[#141417] text-neutral-900 dark:text-white rounded-none border border-neutral-300 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-[#1b1b1f]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-none">
              <Icons.Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                {t.steamSearchTitle || "Buscar App ID en Steam"}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-gray-400">
                {t.steamSearchSubtitle || "Busca cualquier título para vincular su ID de Steam"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/10 rounded-none transition-colors cursor-pointer"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-[#17171a]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.steamSearchPlaceholder || "Buscar juego en Steam por nombre..."}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#121212] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-none transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              {isLoading ? (
                <Icons.Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Icons.Search className="w-4 h-4" />
              )}
              <span>{t.search || "Buscar"}</span>
            </button>
          </form>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
              <Icons.AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-neutral-400 gap-2">
              <Icons.Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-xs font-medium">{t.searchingSteamStore || "Buscando en la tienda de Steam..."}</p>
            </div>
          )}

          {!isLoading && !error && results.length === 0 && query.trim() !== "" && (
            <div className="py-12 text-center text-neutral-400 text-xs">
              {t.noSteamGamesFound || "No se encontraron juegos en Steam para tu búsqueda."}
            </div>
          )}

          {!isLoading &&
            results.map((item) => (
              <div
                key={item.appId}
                onClick={() => onSelectGame(item)}
                className="p-3 bg-white dark:bg-[#1b1b1f] border border-neutral-200 dark:border-white/10 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all cursor-pointer flex items-center gap-3 group"
              >
                {item.tinyImage ? (
                  <img
                    src={item.tinyImage}
                    alt={item.name}
                    className="w-16 h-12 object-cover shrink-0 border border-neutral-300 dark:border-white/10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-12 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                    <Icons.Gamepad2 className="w-6 h-6 text-neutral-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-indigo-500 transition-colors truncate">
                    {item.name}
                  </h3>
                  <p className="text-xs font-mono text-neutral-500 dark:text-gray-400">
                    App ID: <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.appId}</span>
                  </p>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0"
                >
                  {t.select || "Seleccionar"}
                </button>
              </div>
            ))}
        </div>
      </motion.div>
    </div>
  );
};
