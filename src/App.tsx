import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { InputDashboard } from "./components/InputDashboard";
import { LoadingProgress } from "./components/LoadingProgress";
import { ComprehensiveAuditView } from "./components/ComprehensiveAuditView";
import { AuthModal } from "./components/AuthModal";
import { SavedAnalysesModal } from "./components/SavedAnalysesModal";
import {
  ComprehensiveInput,
  CareerPortfolioAuditResult,
  SavedPortfolioAudit,
} from "./types";
import { useAuth } from "./context/AuthContext";
import { saveAnalysisToUser } from "./services/analysisStorage";
import { AlertCircle } from "lucide-react";

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("career_theme");
    if (saved) return saved === "dark";
    return true;
  });

  const { currentUser } = useAuth();
  const [activeMode, setActiveMode] = useState<"analysis_draft" | "account_update">("analysis_draft");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [report, setReport] = useState<CareerPortfolioAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<ComprehensiveInput | null>(null);

  // Auth & Saved Audits Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [isSavingAnalysis, setIsSavingAnalysis] = useState(false);
  const [isSavedToAccount, setIsSavedToAccount] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("career_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("career_theme", "light");
    }
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleStartNewAnalysis = () => {
    setReport(null);
    setError(null);
    setIsSavedToAccount(false);
    setLastInput(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleClearAllData = () => {
    setReport(null);
    setError(null);
    setIsSavedToAccount(false);
    setLastInput(null);
    sessionStorage.clear();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenAuth = (mode: "login" | "signup" = "login") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleSaveToAccount = async () => {
    if (!report) return;

    if (!currentUser) {
      setAuthModalMode("signup");
      setAuthModalOpen(true);
      return;
    }

    setIsSavingAnalysis(true);
    try {
      await saveAnalysisToUser(currentUser.uid, report, lastInput || undefined);
      setIsSavedToAccount(true);
    } catch (err: any) {
      console.error("Failed to save audit:", err);
      alert("Unable to save audit right now. Please try again.");
    } finally {
      setIsSavingAnalysis(false);
    }
  };

  const handleSelectSavedAnalysis = (saved: SavedPortfolioAudit) => {
    setReport(saved.report);
    setIsSavedToAccount(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (inputPayload: ComprehensiveInput) => {
    setIsLoading(true);
    setError(null);
    setLastInput(inputPayload);
    setIsSavedToAccount(false);

    try {
      const response = await fetch("/api/analyze-portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputPayload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to generate audit. Please verify your source documents or text and try again."
        );
      }

      setReport(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Analysis failed:", err);
      setError(err.message || "An unexpected error occurred during the analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b13] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onNewAnalysis={handleStartNewAnalysis}
        onOpenAuth={handleOpenAuth}
        onOpenSavedAnalyses={() => setSavedModalOpen(true)}
        hasResult={!!report}
        currentMode={activeMode}
        onSelectMode={(mode) => setActiveMode(mode)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error message banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <p className="font-semibold">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading progress spinner */}
        {isLoading && (
          <div className="py-12">
            <LoadingProgress />
          </div>
        )}

        {/* Results Screen */}
        {!isLoading && report && (
          <ComprehensiveAuditView
            report={report}
            inputParams={
              lastInput || {
                mode: activeMode,
                uploadedFiles: [],
                pastedTexts: [],
                connectedAccounts: {} as any,
                goals: { primaryGoal: "" },
              }
            }
            onStartNewAnalysis={handleStartNewAnalysis}
            onSaveToAccount={handleSaveToAccount}
            isSaving={isSavingAnalysis}
            isSaved={isSavedToAccount}
          />
        )}

        {/* Inputs Dashboard */}
        {!isLoading && !report && (
          <InputDashboard
            onSubmit={handleSubmit}
            isLoading={isLoading}
            activeMode={activeMode}
            onModeChange={(mode) => setActiveMode(mode)}
            onClearAllData={handleClearAllData}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-[#070b13]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Career Portfolio Pro. Strict source-of-truth verification.</p>
          <p className="text-[11px] text-slate-400">
            No mock data · No scraping · Draft updates never publish automatically
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      <SavedAnalysesModal
        isOpen={savedModalOpen}
        onClose={() => setSavedModalOpen(false)}
        onSelectAnalysis={handleSelectSavedAnalysis}
      />
    </div>
  );
}
