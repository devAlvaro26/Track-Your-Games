import React, { useState } from "react";
import { AppSettings, Language } from "../types";
import { getTranslation } from "../translations";
import * as Icons from "lucide-react";
import { motion } from "motion/react";

interface SettingsModalProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
}) => {
  const [theme, setTheme] = useState<"light" | "dark">(settings.theme);
  const [language, setLanguage] = useState<Language>(settings.language);
  const [username, setUsername] = useState<string>(settings.username);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const t = getTranslation(language);

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    const root = window.document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      theme,
      language,
      username: username.trim() || "Coleccionista",
    });
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      id="settings-modal-backdrop"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#141417] text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/10 rounded-none shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        id="settings-modal-card"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-[#1b1b1f]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-none">
              <Icons.Settings className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                {t.settingsTitle}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t.settingsSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/10 rounded-none transition-colors cursor-pointer"
            id="btn-close-settings"
            title={t.close}
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Username setting */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <Icons.User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              {t.usernameLabel}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.usernamePlaceholder}
              maxLength={30}
              required
              className="w-full px-4 py-2 text-sm bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
              id="input-username"
            />
          </div>

          {/* Theme setting */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <Icons.SunMoon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              {t.themeLabel}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-none border font-bold text-xs transition-all cursor-pointer ${
                  theme === "dark"
                    ? "bg-indigo-600 text-white border-indigo-500 shadow"
                    : "bg-neutral-100 dark:bg-[#1b1b1f] text-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-white/10 hover:border-neutral-400 dark:hover:border-white/20"
                }`}
              >
                <Icons.Moon className="w-4 h-4" />
                {t.themeDark}
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`flex items-center justify-center gap-2.5 p-3 rounded-none border font-bold text-xs transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-indigo-600 text-white border-indigo-500 shadow"
                    : "bg-neutral-100 dark:bg-[#1b1b1f] text-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-white/10 hover:border-neutral-400 dark:hover:border-white/20"
                }`}
              >
                <Icons.Sun className="w-4 h-4" />
                {t.themeLight}
              </button>
            </div>
          </div>

          {/* Language setting */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              <Icons.Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {t.languageLabel}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLanguage("es")}
                className={`flex items-center justify-center gap-2 p-3 rounded-none border font-bold text-xs transition-all cursor-pointer ${
                  language === "es"
                    ? "bg-indigo-600 text-white border-indigo-500 shadow"
                    : "bg-neutral-100 dark:bg-[#1b1b1f] text-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-white/10 hover:border-neutral-400 dark:hover:border-white/20"
                }`}
              >
                <span className="text-[11px] font-mono font-black px-1.5 py-0.5 bg-black/15 dark:bg-white/10 rounded-none">ES</span>
                {t.languageEs}
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`flex items-center justify-center gap-2 p-3 rounded-none border font-bold text-xs transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-indigo-600 text-white border-indigo-500 shadow"
                    : "bg-neutral-100 dark:bg-[#1b1b1f] text-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-white/10 hover:border-neutral-400 dark:hover:border-white/20"
                }`}
              >
                <span className="text-[11px] font-mono font-black px-1.5 py-0.5 bg-black/15 dark:bg-white/10 rounded-none">EN</span>
                {t.languageEn}
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Icons.CheckCircle2 className="w-4 h-4" />
                {t.settingsSavedMsg}
              </span>
            ) : (
              <span className="text-xs text-neutral-500">
                {t.saveToApply}
              </span>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-white/10 rounded-none hover:bg-neutral-100 dark:hover:bg-white/5 transition-all cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-none shadow transition-all cursor-pointer"
              >
                {t.saveSettings}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
