import React from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Icons from "lucide-react";
import { Language } from "../types";
import { getTranslation } from "../translations";

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl?: string;
  username: string;
  language?: Language;
  onOpenSettings?: () => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  isOpen,
  onClose,
  avatarUrl,
  username,
  language = "es",
  onOpenSettings,
}) => {
  const t = getTranslation(language);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        id="avatar-modal-backdrop"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-[#141417] text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/10 shadow-2xl p-6 flex flex-col items-center gap-5 text-center overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          id="avatar-modal-card"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title={t.close}
            id="btn-close-avatar-modal"
          >
            <Icons.X className="w-5 h-5" />
          </button>

          {/* User Name Header */}
          <div className="space-y-1 mt-1">
            <h3 className="text-lg font-black tracking-wider uppercase text-neutral-900 dark:text-white">
              {username || "Coleccionista"}
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest font-mono">
              {t.avatarLabel}
            </p>
          </div>

          {/* Large Image Container */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 bg-indigo-950/40 border-2 border-indigo-500/60 shadow-2xl flex items-center justify-center overflow-hidden group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={username}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-indigo-400">
                <Icons.Library className="w-24 h-24 stroke-[1.5]" />
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Sin foto personalizada
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full pt-2">
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                id="btn-edit-avatar-from-modal"
              >
                <Icons.Edit3 className="w-4 h-4" />
                <span>{t.changeAvatar}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 bg-neutral-200 dark:bg-white/10 hover:bg-neutral-300 dark:hover:bg-white/20 text-neutral-800 dark:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              id="btn-dismiss-avatar-modal"
            >
              {t.close}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
