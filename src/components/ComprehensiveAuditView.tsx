import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  Award,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Download,
  Send,
  Lock,
  Layers,
  FileText,
  Briefcase,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Eye,
  Edit3,
} from "lucide-react";
import {
  CareerPortfolioAuditResult,
  PlatformType,
  ComprehensiveInput,
} from "../types";
import { downloadTextFile } from "../utils/fileUtils";
import { CopyButton } from "./CopyButton";

interface ComprehensiveAuditViewProps {
  report: CareerPortfolioAuditResult;
  inputParams: ComprehensiveInput;
  onStartNewAnalysis: () => void;
  onSaveToAccount: () => void;
  isSaving: boolean;
  isSaved: boolean;
}

export const ComprehensiveAuditView: React.FC<ComprehensiveAuditViewProps> = ({
  report,
  inputParams,
  onStartNewAnalysis,
  onSaveToAccount,
  isSaving,
  isSaved,
}) => {
  // Navigation tabs for the results
  const [activeTab, setActiveTab] = useState<
    "overview" | "source_reviews" | "consistency" | "drafts" | "keep_improve" | "publish_approval"
  >("overview");

  // Selected draft platform sub-tab
  const [selectedPlatformDraft, setSelectedPlatformDraft] = useState<PlatformType>("linkedin");

  // Draft editing state
  const [editingDraftKey, setEditingDraftKey] = useState<string | null>(null);
  const [editedDrafts, setEditedDrafts] = useState<Record<string, string>>({});

  // Two-step Confirmation modal for Connected Account Update Mode
  const [isConfirmingPublish, setIsConfirmingPublish] = useState(false);
  const [hasConfirmedSecondReview, setHasConfirmedSecondReview] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "in_progress" | "failed" | "published">("idle");
  const [publishMessage, setPublishMessage] = useState<string | null>(null);

  const {
    sourceIntegrity,
    executiveSummary,
    sourceBySourceReviews = {},
    keep = [],
    improve = [],
    removeOrReplace = [],
    consistencyReport,
    drafts = {},
    finalStatement,
  } = report;

  // Handle Draft text editing
  const handleEditDraft = (key: string, currentVal: string) => {
    setEditingDraftKey(key);
    if (!editedDrafts[key]) {
      setEditedDrafts((prev) => ({ ...prev, [key]: currentVal }));
    }
  };

  const handleSaveDraftEdit = () => {
    setEditingDraftKey(null);
  };

  // Publishing simulation following strict rules:
  // "If an update fails, show: 'The update was not completed. Your existing profile was not changed.' Do not claim success unless the official API confirms success."
  const handleExecuteUpdate = () => {
    if (!hasConfirmedSecondReview) {
      alert("Please confirm that you have reviewed and approved these exact changes for publication.");
      return;
    }

    setPublishStatus("in_progress");

    // Simulate official API update attempt
    setTimeout(() => {
      // In web preview without live server-to-server 3P OAuth credentials:
      setPublishStatus("failed");
      setPublishMessage("The update was not completed. Your existing profile was not changed.");
    }, 1200);
  };

  return (
    <div id="career-portfolio-audit-view" className="space-y-8 animate-fade-in max-w-6xl mx-auto">
      {/* Top Banner Actions */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              Audit Complete
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Generated {new Date(report.createdAt).toLocaleTimeString()}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Career Portfolio Pro Audit
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onSaveToAccount}
            disabled={isSaving || isSaved}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              isSaved
                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            }`}
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{isSaved ? "Saved to Account" : isSaving ? "Saving..." : "Save Audit to Account"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              downloadTextFile(report.markdownReport, `Career-Portfolio-Audit-${Date.now()}.md`);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Markdown</span>
          </button>

          <button
            type="button"
            onClick={() => {
              downloadTextFile(report.plainTextReport, `Career-Portfolio-Audit-${Date.now()}.txt`);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download TXT</span>
          </button>

          <button
            type="button"
            onClick={onStartNewAnalysis}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start New Analysis</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 text-xs font-semibold gap-1 pb-px">
        {[
          { id: "overview", label: "Executive Summary" },
          { id: "drafts", label: "Copy-Ready Drafts" },
          { id: "consistency", label: "Cross-Platform Consistency" },
          { id: "source_reviews", label: "Source-by-Source Review" },
          { id: "keep_improve", label: "Keep, Improve & Remove" },
          { id: "publish_approval", label: "Account Update & Publishing" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 border-b-2 font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/30 dark:bg-blue-950/20"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & EXECUTIVE SUMMARY */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Source Integrity Statement Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Source Integrity Statement
              </h3>
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 italic border-l-4 border-emerald-500 pl-3 py-1">
              "{sourceIntegrity.statement}"
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Sources Successfully Analyzed ({sourceIntegrity.sourcesAnalyzed.length})
                </span>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                  {sourceIntegrity.sourcesAnalyzed.map((s, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <strong>{s.name}</strong> ({s.type}) - {s.details || "Verified"}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Sections Found ({sourceIntegrity.sectionsFound.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sourceIntegrity.sectionsFound.map((sec, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px]"
                    >
                      {sec}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Overall Presentation Score
                </span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold text-blue-600 dark:text-blue-400">
                    {executiveSummary.overallScore}
                  </span>
                  <span className="text-lg font-bold text-slate-400">/ 100</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                {executiveSummary.scoreDisclaimer}
              </p>
            </div>

            {/* Strengths & Priority Improvements */}
            <div className="md:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Three Strongest Areas
                </span>
                <ul className="mt-3 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {executiveSummary.threeStrongestAreas.map((area, idx) => (
                    <li key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      {area}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Three Priority Improvements
                </span>
                <ul className="mt-3 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  {executiveSummary.threePriorityImprovements.map((imp, idx) => (
                    <li key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      {imp}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Positioning Statement & Next Action */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Verified Positioning Statement
              </span>
              <p className="text-base font-medium text-slate-900 dark:text-white mt-1 leading-relaxed">
                "{executiveSummary.verifiedPositioningStatement}"
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
                Most Important Next Action:
              </span>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {executiveSummary.mostImportantNextAction}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COPY-READY DRAFTS */}
      {activeTab === "drafts" && (
        <div className="space-y-6">
          {/* Platform Sub-Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "linkedin", label: "LinkedIn" },
              { key: "instagram", label: "Instagram" },
              { key: "twitter", label: "X / Twitter" },
              { key: "facebook", label: "Facebook" },
              { key: "tiktok", label: "TikTok" },
              { key: "github", label: "GitHub" },
              { key: "portfolio", label: "Portfolio / Website" },
              { key: "cv_resume", label: "CV or Resume" },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelectedPlatformDraft(p.key as PlatformType)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedPlatformDraft === p.key
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Draft Content Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">
                  {selectedPlatformDraft.replace("_", " ")} Copy-Ready Draft
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Draft Mode · Not Published
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Preserves all verified dates, companies, and roles.
              </p>
            </div>

            {/* Render selected platform draft */}
            {selectedPlatformDraft === "linkedin" && drafts.linkedin && (
              <div className="space-y-6">
                {/* Headline */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Headline Recommendation
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {drafts.linkedin.headline.charCount} / {drafts.linkedin.headline.maxChars} chars
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {drafts.linkedin.headline.text}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <CopyButton textToCopy={drafts.linkedin.headline.text} label="Copy Headline" />
                  </div>
                </div>

                {/* About */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      About Section
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {drafts.linkedin.about.charCount} / {drafts.linkedin.about.maxChars} chars
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {drafts.linkedin.about.text}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <CopyButton textToCopy={drafts.linkedin.about.text} label="Copy About Section" />
                  </div>
                </div>

                {/* Verified Skills */}
                {drafts.linkedin.skills && drafts.linkedin.skills.length > 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Verified Skills (Traceable to Source Document)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {drafts.linkedin.skills.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-600">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedPlatformDraft === "instagram" && drafts.instagram && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Display Name & Bio
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Bio: {drafts.instagram.bio.charCount}/{drafts.instagram.bio.maxChars} chars
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {drafts.instagram.displayName.text}
                  </p>
                  <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line">
                    {drafts.instagram.bio.text}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Link: {drafts.instagram.linkInBioText}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <CopyButton textToCopy={`${drafts.instagram.displayName.text}\n${drafts.instagram.bio.text}\n${drafts.instagram.linkInBioText}`} label="Copy Bio" />
                  </div>
                </div>

                {/* Pinned Posts */}
                {drafts.instagram.threePinnedPostRecommendations && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                      Three Pinned Post Recommendations
                    </span>
                    <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                      {drafts.instagram.threePinnedPostRecommendations.map((post, i) => (
                        <li key={i} className="p-2 rounded-lg bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600">
                          {post}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {selectedPlatformDraft === "twitter" && drafts.twitter && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      X / Twitter Bio
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {drafts.twitter.bio.charCount}/{drafts.twitter.bio.maxChars} chars
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200">
                    {drafts.twitter.bio.text}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <CopyButton textToCopy={drafts.twitter.bio.text} label="Copy Twitter Bio" />
                  </div>
                </div>
              </div>
            )}

            {selectedPlatformDraft === "github" && drafts.github && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      GitHub Profile Bio
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {drafts.github.bio.charCount}/{drafts.github.bio.maxChars} chars
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200">
                    {drafts.github.bio.text}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    README Structure
                  </span>
                  <pre className="text-xs p-3 rounded-lg bg-slate-900 text-slate-100 overflow-x-auto whitespace-pre-wrap font-mono">
                    {drafts.github.profileReadmeStructure}
                  </pre>
                </div>
              </div>
            )}

            {selectedPlatformDraft === "portfolio" && drafts.portfolio && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Homepage Headline & Intro
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {drafts.portfolio.homepageHeadline}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {drafts.portfolio.introduction}
                  </p>
                </div>
              </div>
            )}

            {selectedPlatformDraft === "cv_resume" && drafts.cvResume && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Professional Summary
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                    {drafts.cvResume.professionalSummary}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <CopyButton textToCopy={drafts.cvResume.professionalSummary} label="Copy Summary" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CROSS-PLATFORM CONSISTENCY */}
      {activeTab === "consistency" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Cross-Platform Consistency Report
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Compares available verified sources. Conflicting information is never resolved by guessing.
              </p>
            </div>

            {/* Consistent Information */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Consistent Information Across Sources
              </span>
              {consistencyReport.consistentInformation.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Not provided by the connected source or uploaded document.
                </p>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {consistencyReport.consistentInformation.map((item, idx) => (
                    <li key={idx} className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-slate-800 dark:text-slate-200">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Inconsistent Information */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Inconsistent Information
              </span>
              {consistencyReport.inconsistentInformation.length === 0 ? (
                <p className="text-xs text-slate-500 italic">None identified across analyzed sources.</p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {consistencyReport.inconsistentInformation.map((item, idx) => (
                    <li key={idx} className="p-3 rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-slate-800 dark:text-slate-200">
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Conflicting Information (With Exact Statement) */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Conflicting Facts Detected
              </span>
              {consistencyReport.conflictingInformation.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No conflicting facts detected.</p>
              ) : (
                <div className="space-y-3">
                  {consistencyReport.conflictingInformation.map((conf, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs space-y-2">
                      <div className="font-bold text-rose-800 dark:text-rose-300">
                        {conf.field}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <strong>{conf.sourceA.name}:</strong> "{conf.sourceA.claim}"
                        </div>
                        <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          <strong>{conf.sourceB.name}:</strong> "{conf.sourceB.claim}"
                        </div>
                      </div>
                      <p className="font-bold text-rose-700 dark:text-rose-400 italic pt-1">
                        "{conf.statement}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SOURCE-BY-SOURCE REVIEW */}
      {activeTab === "source_reviews" && (
        <div className="space-y-6">
          {Object.keys(sourceBySourceReviews).length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              No specific platform review sections found.
            </div>
          ) : (
            Object.entries(sourceBySourceReviews).map(([key, sec]) => {
              const review = sec as any;
              return (
                <div key={key} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {review.platformName || key} Review
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 block">What is working</span>
                      <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                        {review.whatIsWorking?.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-amber-600 dark:text-amber-400 block">What needs improvement</span>
                      <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                        {review.whatNeedsImprovement?.map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 5: KEEP, IMPROVE & REMOVE */}
      {activeTab === "keep_improve" && (
        <div className="space-y-6">
          {/* Keep */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Keep (Content Supported by Available Sources)</span>
            </h3>
            {keep.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Not provided by the connected source or uploaded document.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {keep.map((k, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">{k.element}</p>
                    <p className="text-slate-600 dark:text-slate-400">{k.justification}</p>
                    <span className="text-[10px] text-slate-400 block pt-1">Source: {k.source}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Improve */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <span>Improve (Precision Wording & Recommendations)</span>
            </h3>
            <div className="space-y-3 text-xs">
              {improve.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Existing Wording
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 italic">"{item.existingWording}"</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                        Copy-Ready Improvement
                      </span>
                      <p className="text-slate-900 dark:text-white font-semibold">"{item.copyReadyImprovement}"</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-[11px] pt-1">
                    <span><strong>Problem:</strong> {item.problem}</span>
                    <span><strong>Why it matters:</strong> {item.whyItMatters}</span>
                    <span><strong>Source:</strong> {item.sourceSupporting}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Remove or Replace */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>Remove or Replace</span>
            </h3>
            <div className="space-y-3 text-xs">
              {removeOrReplace.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Original Wording to Remove</span>
                      <p className="text-slate-900 dark:text-white font-semibold line-through">"{item.exactOriginalWording}"</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.isFullySupported ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                      {item.isFullySupported ? "Supported Replacement" : "Needs Information"}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400"><strong>Reason:</strong> {item.reason}</p>
                  <p className="text-slate-800 dark:text-slate-200"><strong>Replacement wording:</strong> "{item.replacementWording}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ACCOUNT UPDATE & PUBLISHING SCREEN (MODE 2) */}
      {activeTab === "publish_approval" && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Send className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Connected Account Update & Publishing Control
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Review exact diffs before publication. The application separates generating drafts, reviewing, editing, and publishing. Nothing is published automatically.
            </p>
          </div>

          {/* Mandatory Confirmation Header Box */}
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <p className="font-bold">Review the exact changes below. Nothing will be published until you approve this update.</p>
            <p>
              In accordance with account safety rules, updates must be confirmed through official APIs. If no authorized connection is active, your accounts remain untouched.
            </p>
          </div>

          {/* Before & After Proposed Update Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                Proposed Update: LinkedIn Headline & Summary
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                Status: Pending Approval
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Current Version (Extracted from Source)
                </span>
                <p className="text-slate-700 dark:text-slate-300 italic">
                  {report.improve[0]?.existingWording || "Current unformatted experience text."}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                  Proposed Version (Exact Changes Highlighted)
                </span>
                <p className="text-slate-900 dark:text-white font-semibold">
                  {drafts.linkedin?.headline.text || report.improve[0]?.copyReadyImprovement || "Optimized copy-ready update."}
                </p>
                <span className="text-[10px] text-slate-500 block mt-2">
                  Character count: {drafts.linkedin?.headline.charCount || 65} chars · Platform: LinkedIn
                </span>
              </div>
            </div>

            {/* Second Confirmation Checkbox */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80">
              <label className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConfirmedSecondReview}
                  onChange={(e) => setHasConfirmedSecondReview(e.target.checked)}
                  className="mt-0.5 rounded-sm text-blue-600"
                />
                <span className="font-semibold">
                  “I confirm that I reviewed and approve these exact changes for publication.”
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("drafts")}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Edit Draft
              </button>
              <button
                type="button"
                onClick={onSaveToAccount}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={handleExecuteUpdate}
                disabled={!hasConfirmedSecondReview || publishStatus === "in_progress"}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {publishStatus === "in_progress" ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Communicating with Official API...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Approve and Update</span>
                  </>
                )}
              </button>
            </div>

            {/* Failed Update Safety Message Display */}
            {publishMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-semibold">{publishMessage}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FINAL RESPONSE STATEMENT (MANDATORY RULE) */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
        <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
          Final Verification Mandate
        </p>
        <p>"{finalStatement}"</p>
      </div>
    </div>
  );
};
