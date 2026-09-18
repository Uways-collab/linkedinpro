import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  getUserSavedAnalyses, 
  deleteUserSavedAnalysis 
} from "../services/analysisStorage";
import { SavedPortfolioAudit } from "../types";
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
  onSelectAnalysis: (analysis: SavedPortfolioAudit) => void;
}

export const SavedAnalysesModal: React.FC<SavedAnalysesModalProps> = ({
  isOpen,
  onClose,
  onSelectAnalysis,
}) => {
  const { currentUser } = useAuth();
  const [analyses, setAnalyses] = useState<SavedPortfolioAudit[]>([]);
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
      setError("Unable to load saved audits. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (analysisId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    if (!confirm("Are you sure you want to delete this saved audit?")) return;

    setDeletingId(analysisId);
    try {
      await deleteUserSavedAnalysis(currentUser.uid, analysisId);
      setAnalyses((prev) => prev.filter((a) => a.id !== analysisId));
    } catch (err: any) {
      console.error("Error deleting audit:", err);
      alert("Failed to delete audit.");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="saved-analyses-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Your Saved Career Audits
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified portfolio and profile audits saved to your account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading saved audits...</p>
            </div>
          ) : analyses.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <FolderArchive className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="font-semibold text-sm">No saved audits yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                After generating an audit, click "Save Audit to Account" to store it securely in your Firestore database.
              </p>
            </div>
          ) : (
            analyses.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectAnalysis(item);
                  onClose();
                }}
                className="group p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {item.title}
                    </span>
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {item.overallScore}/100
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span>
                      {item.report.sourceIntegrity.sourcesAnalyzed.length} source(s) verified
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    disabled={deletingId === item.id}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                    title="Delete saved audit"
                  >
                    {deletingId === item.id ? (
                      <span className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin inline-block" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                  <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    View
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
