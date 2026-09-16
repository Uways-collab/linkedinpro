import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  getUserSavedAnalyses, 
  deleteUserSavedAnalysis 
} from "../services/analysisStorage";
import { SavedAnalysis } from "../types";
import { 
  X, 
  Trash2, 
  ExternalLink, 
  Clock, 
  Award, 
  FolderArchive, 
  AlertCircle,
  Briefcase
} from "lucide-react";

interface SavedAnalysesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnalysis: (analysis: SavedAnalysis) => void;
}

export const SavedAnalysesModal: React.FC<SavedAnalysesModalProps> = ({
  isOpen,
  onClose,
  onSelectAnalysis,
}) => {
  const { currentUser } = useAuth();
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadAnalyses();
    }
  }, [isOpen, currentUser]);

  const loadAnalyses = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const items = await getUserSavedAnalyses(currentUser.uid);
      setAnalyses(items);
    } catch (err: any) {
      console.error("Error loading analyses:", err);
      setError("Unable to load saved analyses. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (analysisId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    if (!confirm("Are you sure you want to delete this saved analysis?")) return;

    setDeletingId(analysisId);
    try {
      await deleteUserSavedAnalysis(currentUser.uid, analysisId);
      setAnalyses((prev) => prev.filter((a) => a.analysisId !== analysisId));
    } catch (err: any) {
      console.error("Error deleting analysis:", err);
      alert("Failed to delete analysis. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="saved-analyses-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Saved Profile Analyses
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                View your historical executive audits and restore side-by-side comparisons
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {error && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading saved analyses...</p>
            </div>
          ) : analyses.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Briefcase className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No saved analyses yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Run a profile audit and click &quot;Save to Account&quot; to securely archive your reports and compare iterations over time.
              </p>
            </div>
          ) : (
            analyses.map((item) => (
              <div
                key={item.analysisId}
                onClick={() => {
                  onSelectAnalysis(item);
                  onClose();
                }}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-850/60 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Score pill */}
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shrink-0 group-hover:border-blue-400 dark:group-hover:border-blue-600 transition">
                    <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 leading-none">
                      {item.score}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">score</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {item.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {item.targetRole && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.targetRole}
                        </span>
                      )}
                      {item.targetGoal && (
                        <span>Goal: {item.targetGoal}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition hidden sm:inline-flex items-center gap-1">
                    Load &amp; Compare <ExternalLink className="w-3 h-3" />
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.analysisId, e)}
                    disabled={deletingId === item.analysisId}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                    title="Delete saved analysis"
                  >
                    {deletingId === item.analysisId ? (
                      <span className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
