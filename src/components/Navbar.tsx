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
  Layers,
  Send,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNewAnalysis: () => void;
  onOpenAuth: (mode?: "login" | "signup") => void;
  onOpenSavedAnalyses: () => void;
  hasResult: boolean;
  currentMode: "analysis_draft" | "account_update";
  onSelectMode: (mode: "analysis_draft" | "account_update") => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  onNewAnalysis,
  onOpenAuth,
  onOpenSavedAnalyses,
  hasResult,
  currentMode,
  onSelectMode,
}) => {
  const { currentUser, logout } = useAuth();

  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 w-full backdrop-blur-md border-b bg-white/95 dark:bg-[#090d16]/95 border-slate-200 dark:border-slate-800 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            id="brand-logo"
            onClick={onNewAnalysis}
            className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/25 cursor-pointer transition hover:opacity-90"
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
                Career Portfolio Pro
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                Multi-Platform Audit
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400">
              Strict Source-of-Truth · Zero Hallucination · Two Separate Modes
            </p>
          </div>
        </div>

        {/* Center Mode Switcher Tabs */}
        <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs font-semibold">
          <button
            type="button"
            id="nav-mode-draft"
            onClick={() => onSelectMode("analysis_draft")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              currentMode === "analysis_draft"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Analysis & Drafting</span>
          </button>
          <button
            type="button"
            id="nav-mode-publish"
            onClick={() => onSelectMode("account_update")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              currentMode === "account_update"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>2. Connected Account Update</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Strict Policy indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Verified Sources Only</span>
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

          {/* Saved Audits Button */}
          {currentUser && (
            <button
              type="button"
              id="nav-saved-analyses-btn"
              onClick={onOpenSavedAnalyses}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition shadow-2xs cursor-pointer"
              title="View your saved career audits"
            >
              <FolderArchive className="w-4 h-4 text-blue-500" />
              <span className="hidden sm:inline">Saved Audits</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            type="button"
            id="theme-toggle-btn"
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Account / Auth Section */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
                  {currentUser.displayName || currentUser.email?.split("@")[0] || "Account"}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 justify-end">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Connected
                </span>
              </div>
              <button
                type="button"
                id="user-logout-btn"
                onClick={() => logout()}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                title="Sign out of account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                id="nav-login-btn"
                onClick={() => onOpenAuth("login")}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                id="nav-signup-btn"
                onClick={() => onOpenAuth("signup")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-2xs transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Mode Switcher Bar */}
      <div className="md:hidden px-4 py-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900/60">
        <button
          type="button"
          onClick={() => onSelectMode("analysis_draft")}
          className={`px-3 py-1 text-xs rounded-lg font-semibold transition ${
            currentMode === "analysis_draft"
              ? "bg-blue-600 text-white"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          1. Analysis & Drafting
        </button>
        <button
          type="button"
          onClick={() => onSelectMode("account_update")}
          className={`px-3 py-1 text-xs rounded-lg font-semibold transition ${
            currentMode === "account_update"
              ? "bg-blue-600 text-white"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          2. Account Update
        </button>
      </div>
    </header>
  );
};
