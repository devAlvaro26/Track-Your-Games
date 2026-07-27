import { useState, FormEvent } from "react";
import { Language } from "../types";
import { getTranslation } from "../translations";
import { db, isDatabaseConfigured } from "../lib/database";
import * as Icons from "lucide-react";
import { motion } from "motion/react";

interface AuthModalProps {
  language: Language;
  onClose: () => void;
  onSuccess: (user: any, username?: string) => void;
}

export function AuthModal({ language, onClose, onSuccess }: AuthModalProps) {
  const t = getTranslation(language);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSwitchToLogin, setShowSwitchToLogin] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setShowSwitchToLogin(false);
    setSuccessMsg(null);

    if (!isDatabaseConfigured || !db) {
      setErrorMsg(t.databaseNotConfiguredErr);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMsg(t.fillEmailPasswordErr);
      return;
    }

    if (!isLogin && !username.trim()) {
      setErrorMsg(t.usernameRequiredErr);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await db.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (error) throw error;

        if (data.user) {
          setSuccessMsg(t.loginSuccess);
          setTimeout(() => {
            onSuccess(data.user);
            onClose();
          }, 800);
        }
      } else {
        const { data, error } = await db.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              username: username.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          setSuccessMsg(t.signupSuccess);
          setTimeout(() => {
            onSuccess(data.user, username.trim());
            onClose();
          }, 1000);
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      const rawMsg = err?.message || "";
      const lower = rawMsg.toLowerCase();

      if (
        lower.includes("already registered") ||
        lower.includes("already exists") ||
        lower.includes("already in use") ||
        lower.includes("user_already_exists")
      ) {
        setErrorMsg(t.userAlreadyRegisteredErr);
        setShowSwitchToLogin(true);
      } else if (
        lower.includes("invalid login credentials") ||
        lower.includes("invalid credentials") ||
        lower.includes("invalid_grant")
      ) {
        setErrorMsg(t.invalidCredentialsErr);
      } else if (lower.includes("at least 6 characters") || lower.includes("password should be")) {
        setErrorMsg(t.passwordMinLengthErr);
      } else {
        setErrorMsg(rawMsg || t.authDefaultErr);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      id="auth-modal-backdrop"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-lg bg-white dark:bg-[#141417] text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/10 rounded-none shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        id="auth-modal-card"
      >
        {/* Header matching project style */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-neutral-200 dark:border-white/10 bg-neutral-100 dark:bg-[#1b1b1f]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-none">
              <Icons.UserCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                {isLogin ? t.loginTitle : t.signupTitle}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t.authSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-white/10 rounded-none transition-colors cursor-pointer"
            id="btn-close-auth"
            title={t.close}
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Mode Segmented Controls matching launcher tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-[#1b1b1f] border border-neutral-200 dark:border-white/10 rounded-none">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setErrorMsg(null);
              }}
              className={`py-2 px-3 text-xs font-bold uppercase tracking-wider transition-all rounded-none border ${
                isLogin
                  ? "bg-indigo-600 text-white border-indigo-500 shadow"
                  : "bg-transparent text-neutral-600 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {t.loginBtn}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setErrorMsg(null);
              }}
              className={`py-2 px-3 text-xs font-bold uppercase tracking-wider transition-all rounded-none border ${
                !isLogin
                  ? "bg-indigo-600 text-white border-indigo-500 shadow"
                  : "bg-transparent text-neutral-600 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {t.signupBtn}
            </button>
          </div>

          {/* Database status warning if not connected */}
          {!isDatabaseConfigured && (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-none text-amber-700 dark:text-amber-300 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                <Icons.AlertTriangle size={15} className="text-amber-500 shrink-0" />
                <span>{t.databaseNotConnected}</span>
              </div>
              <p className="text-[11px] font-normal leading-relaxed">
                {t.databaseWarningDesc}
              </p>
            </div>
          )}

          {/* Alert Messages */}
          {errorMsg && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-none text-red-600 dark:text-red-400 text-xs flex flex-col gap-2 font-medium">
              <div className="flex items-start gap-2">
                <Icons.AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
              {showSwitchToLogin && (
                <div className="pl-6 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setErrorMsg(null);
                      setShowSwitchToLogin(false);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] uppercase tracking-wider rounded-none cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow"
                  >
                    <Icons.LogIn size={13} />
                    <span>{t.switchToLoginBtn}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-none text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-medium">
              <Icons.CheckCircle size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                  {t.usernameLabel} *
                </label>
                <div className="relative">
                  <Icons.User className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t.usernamePlaceholder}
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                {t.emailLabel} *
              </label>
              <div className="relative">
                <Icons.Mail className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                {t.passwordLabel} *
              </label>
              <div className="relative">
                <Icons.Lock className="absolute left-3 top-3 w-4 h-4 text-neutral-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 dark:bg-[#1b1b1f] border border-neutral-300 dark:border-white/10 rounded-none text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !isDatabaseConfigured}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-none shadow transition-all border border-indigo-400/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Icons.Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isLogin ? t.signingIn : t.signingUp}</span>
                  </>
                ) : (
                  <span>{isLogin ? t.loginBtn : t.signupBtn}</span>
                )}
              </button>
            </div>
          </form>

          {/* Mode switcher footer link */}
          <div className="pt-4 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between text-xs">
            <span className="text-neutral-500 dark:text-neutral-400">
              {isLogin ? t.dontHaveAccount : t.alreadyHaveAccount}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg(null);
              }}
              className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer uppercase tracking-wider text-[11px]"
            >
              {isLogin ? t.signupBtn : t.loginBtn}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
