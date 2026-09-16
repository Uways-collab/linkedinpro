import React from "react";
import {
  Sparkles,
  Sun,
  Moon,
  ShieldCheck,
  RefreshCw,
  FolderArchive,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNewAnalysis: () => void;
  onOpenAuth: (mode?: "login" | "signup") => void;
  onOpenSavedAnalyses: () => void;
  hasResult: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  onNewAnalysis,
  onOpenAuth,
  onOpenSavedAnalyses,
  hasResult,
}) => {
  const { currentUser, logout } = useAuth();

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 w-full backdrop-blur-md border-b bg-white/95 dark:bg-[#0f172a]/95 border-slate-200 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div
            id="brand-logo"
            onClick={onNewAnalysis}
            className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 cursor-pointer transition hover:opacity-90"
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                id="brand-title"
                onClick={onNewAnalysis}
                className="font-bold text-lg tracking-tight text-slate-900 dark:text-white cursor-pointer"
              >
                LinkedIn Profile Pro
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                Document Audit
              </span>
            </div>
            <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400">
              Strict document source-of-truth · Zero hallucination
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Source Integrity Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Document Source of Truth</span>
          </div>

          {/* Start New Analysis button (visible when results exist) */}
          {hasResult && (
            <button
              type="button"
              id="nav-new-analysis-btn"
              onClick={onNewAnalysis}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Start New Analysis</span>
            </button>
          )}

          {/* Saved Audits Button (Firebase integrated) */}
          {currentUser && (
            <button
              type="button"
              id="nav-saved-analyses-btn"
              onClick={onOpenSavedAnalyses}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition shadow-2xs cursor-pointer"
              title="View your saved profile audits"
            >
              <FolderArchive className="w-4 h-4 text-blue-500" />
              <span className="hidden sm:inline">Saved Audits</span>
            </button>
          )}

          {/* User Auth Status or Login Button */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium max-w-[120px] sm:max-w-[180px] truncate"
                title={currentUser.email || "User"}
              >
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{currentUser.displayName || currentUser.email?.split("@")[0] || "Account"}</span>
              </div>
              <button
                type="button"
                id="nav-logout-btn"
                onClick={() => logout()}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              id="nav-login-btn"
              onClick={() => onOpenAuth("login")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-500" />
              <span>Sign In</span>
            </button>
          )}

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            id="nav-theme-toggle-btn"
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Toggle theme"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
