/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { InputForm } from "./components/InputForm";
import { LoadingProgress } from "./components/LoadingProgress";
import { AuditView } from "./components/AuditView";
import { AuthModal } from "./components/AuthModal";
import { SavedAnalysesModal } from "./components/SavedAnalysesModal";
import { UserInput, AuditReport, SavedAnalysis } from "./types";
import { AlertCircle, Sparkles, ShieldCheck, CheckCircle2, FileText, Lock } from "lucide-react";
import { useAuth } from "./context/AuthContext";
import { saveAnalysisToUser } from "./services/analysisStorage";

export default function App() {
  // Theme state: dark mode (navy/charcoal) by default for executive feel
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("lipro_theme");
    if (saved) return saved === "dark";
    return true;
  });

  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState<Partial<UserInput>>({});

  // Auth & Saved Analyses Modal States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup">("login");
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [isSavingAnalysis, setIsSavingAnalysis] = useState(false);
  const [isSavedToAccount, setIsSavedToAccount] = useState(false);

  // Sync dark mode class on document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("lipro_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("lipro_theme", "light");
    }
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleStartNewAnalysis = () => {
    setReport(null);
    setError(null);
    setIsSavedToAccount(false);
    setLastInput({});
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
      await saveAnalysisToUser(currentUser.uid, report, lastInput);
      setIsSavedToAccount(true);
    } catch (err: any) {
      console.error("Failed to save analysis:", err);
      alert("Unable to save analysis right now. Please try again.");
    } finally {
      setIsSavingAnalysis(false);
    }
  };

  const handleSelectSavedAnalysis = (saved: SavedAnalysis) => {
    setReport(saved.report);
    setLastInput({
      profileUrl: saved.profileUrl,
      uploadedFileName: saved.report.sourceIntegrity.documentFilename,
      targetGoal: saved.targetGoal,
      targetRole: saved.targetRole,
      targetIndustry: saved.targetIndustry,
    });
    setIsSavedToAccount(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAuditSubmit = async (input: UserInput) => {
    setIsLoading(true);
    setError(null);
    setIsSavedToAccount(false);
    setLastInput(input);

    try {
      const res = await fetch("/api/analyze-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Unable to analyze document. Please ensure your file is a valid LinkedIn profile export and try again."
        );
      }

      setReport(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      console.error("Audit submission error:", err);
      setError(err?.message || "An unexpected error occurred during profile analysis.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onNewAnalysis={handleStartNewAnalysis}
        onOpenAuth={handleOpenAuth}
        onOpenSavedAnalyses={() => setSavedModalOpen(true)}
        hasResult={!!report}
      />

      {/* Main App Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Error State Banner */}
        {error && (
          <div
            id="global-error-banner"
            className="mb-8 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 flex items-start gap-3.5 shadow-xs"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm space-y-1">
              <p className="font-bold">Notice:</p>
              <p className="leading-relaxed">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-200/60 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-900 transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-8">
            <LoadingProgress />
          </div>
        )}

        {/* Success State: Audit View */}
        {!isLoading && report && (
          <AuditView
            report={report}
            originalInput={lastInput}
            onStartNewAnalysis={handleStartNewAnalysis}
            onSaveToAccount={handleSaveToAccount}
            isSaving={isSavingAnalysis}
            isSaved={isSavedToAccount}
          />
        )}

        {/* Upload-First Screen */}
        {!isLoading && !report && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header / Intro */}
            <div className="text-center space-y-3 pt-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/70 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Strict Document Source-of-Truth Engine</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                LinkedIn Profile Pro
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Upload your LinkedIn profile document (PDF, DOCX, or TXT). The application analyzes exclusively the information present in your document to tell you what to keep, improve, add, remove, or rewrite — with zero hallucinations or guessed facts.
              </p>
            </div>

            {/* Upload-First Input Form */}
            <InputForm
              key={JSON.stringify(lastInput)}
              onSubmit={handleAuditSubmit}
              isLoading={isLoading}
              initialInput={lastInput}
            />

            {/* Core Verification Commitments Bento */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#1e293b]/60 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Document Exclusivity</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  The uploaded document is the only permitted source of truth. No assumptions, public profile scraping, or external search data.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#1e293b]/60 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified Accuracy</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Every bullet and rewrite is traced directly to facts in your file. Missing information is explicitly identified, never invented.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#1e293b]/60 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase tracking-wider">
                  <Lock className="w-4 h-4" />
                  <span>Private In-Memory Audit</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your uploaded file is processed in memory for the audit session. No credentials or permanent document retention required.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 bg-white dark:bg-[#0f172a] transition-colors mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              LinkedIn Profile Pro
            </span>
            <span>·</span>
            <span>Document-Based Editorial Assessment</span>
          </div>
          <p className="text-center sm:text-right">
            Independent profile review tool. Not affiliated with or endorsed by LinkedIn Corporation.
          </p>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />

      {/* Saved Profile Analyses Modal */}
      <SavedAnalysesModal
        isOpen={savedModalOpen}
        onClose={() => setSavedModalOpen(false)}
        onSelectAnalysis={handleSelectSavedAnalysis}
      />
    </div>
  );
}
