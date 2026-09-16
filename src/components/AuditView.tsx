import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  FileText,
  Briefcase,
  Wrench,
  Award,
  Download,
  Copy,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Trash2,
  BookOpen,
  Send,
  HelpCircle,
  FolderArchive,
  Layers,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { AuditReport, UserInput } from "../types";
import { CopyButton } from "./CopyButton";
import { downloadTextFile } from "../utils/fileUtils";

interface AuditViewProps {
  report: AuditReport;
  originalInput?: Partial<UserInput>;
  onStartNewAnalysis: () => void;
  onSaveToAccount?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
}

export const AuditView: React.FC<AuditViewProps> = ({
  report,
  originalInput,
  onStartNewAnalysis,
  onSaveToAccount,
  isSaving = false,
  isSaved = false,
}) => {
  const [viewMode, setViewMode] = useState<"interactive" | "markdown" | "plaintext">("interactive");
  const [downloadFormatOpen, setDownloadFormatOpen] = useState(false);

  const handleDownloadMarkdown = () => {
    const filename = `LinkedIn-Profile-Audit-${report.sourceIntegrity.documentFilename.replace(/\.[^/.]+$/, "")}.md`;
    downloadTextFile(report.markdownReport || "", filename);
    setDownloadFormatOpen(false);
  };

  const handleDownloadPlainText = () => {
    const filename = `LinkedIn-Profile-Audit-${report.sourceIntegrity.documentFilename.replace(/\.[^/.]+$/, "")}.txt`;
    downloadTextFile(report.plainTextReport || report.markdownReport || "", filename);
    setDownloadFormatOpen(false);
  };

  return (
    <div id="audit-results-view" className="w-full space-y-6">
      {/* Top Header & Global Actions Bar */}
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Profile Presentation Score Badge */}
          <div
            id="audit-score-badge"
            className="w-16 h-16 rounded-2xl bg-blue-600 dark:bg-blue-600 text-white flex flex-col items-center justify-center font-bold shadow-md shadow-blue-600/20 shrink-0"
          >
            <span className="text-2xl leading-none">{report.executiveSummary.score}</span>
            <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider mt-0.5">/ 100</span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
                LinkedIn Profile Document Audit
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Document
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
              Source file: <strong className="text-slate-700 dark:text-slate-200">{report.sourceIntegrity.documentFilename}</strong> ({report.sourceIntegrity.documentType})
            </p>
          </div>
        </div>

        {/* Action Buttons: Copy Full Report, Download, Start New */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Save Audit (if callback provided) */}
          {onSaveToAccount && (
            <button
              type="button"
              id="save-audit-btn"
              onClick={onSaveToAccount}
              disabled={isSaving || isSaved}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border transition cursor-pointer ${
                isSaved
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                  : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
            >
              <FolderArchive className="w-4 h-4 text-blue-500" />
              <span>{isSaved ? "Saved" : isSaving ? "Saving..." : "Save"}</span>
            </button>
          )}

          {/* Copy Full Report Button */}
          <CopyButton
            id="copy-full-report-btn"
            textToCopy={report.markdownReport || report.plainTextReport || ""}
            label="Copy Full Report"
            copiedLabel="Report Copied!"
            size="md"
            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
          />

          {/* Download Dropdown */}
          <div className="relative">
            <button
              type="button"
              id="download-report-btn"
              onClick={() => setDownloadFormatOpen(!downloadFormatOpen)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Download Report</span>
            </button>

            {downloadFormatOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-fade-in">
                <button
                  type="button"
                  id="download-md-option"
                  onClick={handleDownloadMarkdown}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 transition flex items-center justify-between"
                >
                  <span>Markdown (.md)</span>
                  <span className="text-[10px] text-slate-400">Formatted</span>
                </button>
                <button
                  type="button"
                  id="download-txt-option"
                  onClick={handleDownloadPlainText}
                  className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 transition flex items-center justify-between"
                >
                  <span>Plain Text (.txt)</span>
                  <span className="text-[10px] text-slate-400">Raw</span>
                </button>
              </div>
            )}
          </div>

          {/* Start New Analysis Button */}
          <button
            type="button"
            id="start-new-analysis-btn"
            onClick={onStartNewAnalysis}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Start New Analysis</span>
          </button>
        </div>
      </div>

      {/* Format Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setViewMode("interactive")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            viewMode === "interactive"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Structured Sections
        </button>
        <button
          type="button"
          onClick={() => setViewMode("markdown")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            viewMode === "markdown"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Verbatim Markdown
        </button>
        <button
          type="button"
          onClick={() => setViewMode("plaintext")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            viewMode === "plaintext"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Plain Text
        </button>
      </div>

      {/* VIEW MODE: VERBATIM MARKDOWN */}
      {viewMode === "markdown" && (
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Verbatim Markdown Report</span>
            </h2>
            <CopyButton textToCopy={report.markdownReport || ""} label="Copy Markdown" />
          </div>
          <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-200 dark:border-slate-800 overflow-x-auto">
            {report.markdownReport}
          </pre>
        </div>
      )}

      {/* VIEW MODE: PLAIN TEXT */}
      {viewMode === "plaintext" && (
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Verbatim Plain Text Report</span>
            </h2>
            <CopyButton textToCopy={report.plainTextReport || ""} label="Copy Text" />
          </div>
          <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed border border-slate-200 dark:border-slate-800 overflow-x-auto">
            {report.plainTextReport}
          </pre>
        </div>
      )}

      {/* VIEW MODE: STRUCTURED INTERACTIVE SECTIONS */}
      {viewMode === "interactive" && (
        <div className="space-y-6">
          {/* SECTION 1: Source Integrity Statement */}
          <section
            id="section-source-integrity"
            className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Source Integrity Statement
                </h2>
              </div>
              <CopyButton
                textToCopy={`## Source Integrity Statement\n${report.sourceIntegrity.statement}\n- Document filename: ${report.sourceIntegrity.documentFilename}\n- Document type: ${report.sourceIntegrity.documentType}\n- Successfully read: ${report.sourceIntegrity.successfullyRead ? "Yes" : "No"}\n- Sections found: ${report.sourceIntegrity.sectionsFound.join(", ")}\n- Information not found: ${report.sourceIntegrity.informationNotFound.join(", ")}`}
                label="Copy Section"
              />
            </div>

            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 leading-relaxed">
                &ldquo;{report.sourceIntegrity.statement}&rdquo;
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 space-y-1.5">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Document Metadata:
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Filename: <span className="font-mono text-slate-800 dark:text-slate-200">{report.sourceIntegrity.documentFilename}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Type: <span className="text-slate-800 dark:text-slate-200">{report.sourceIntegrity.documentType}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  Successfully Read: <span className="font-semibold text-emerald-600 dark:text-emerald-400">Yes (100% processed)</span>
                </p>
                {report.sourceIntegrity.profileUrlReference && (
                  <p className="text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                    Reference URL: <span className="font-mono text-slate-800 dark:text-slate-300">{report.sourceIntegrity.profileUrlReference}</span>{" "}
                    <em className="text-[11px] text-slate-500">(Displayed as reference only; never opened or scraped)</em>
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/60 space-y-2">
                <div>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                    Sections Found in Document:
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                    {report.sourceIntegrity.sectionsFound.join(", ") || "None"}
                  </p>
                </div>
                <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700">
                  <p className="font-semibold text-amber-700 dark:text-amber-400">
                    Information Not Found in Document:
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                    {report.sourceIntegrity.informationNotFound.join(", ") || "None"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Executive Summary */}
          <section
            id="section-executive-summary"
            className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Executive Summary
                </h2>
              </div>
              <CopyButton
                textToCopy={`## Executive Summary\n- Overall profile presentation score: ${report.executiveSummary.score}/100\n- Score disclaimer: ${report.executiveSummary.scoreDisclaimer}\n\n### Three Strengths Supported by Document:\n${report.executiveSummary.strengths.map((s) => `1. ${s}`).join("\n")}\n\n### Three Improvement Priorities:\n${report.executiveSummary.improvementPriorities.map((p) => `1. ${p}`).join("\n")}\n\n### Concise Positioning Statement:\n"${report.executiveSummary.positioningStatement}"`}
                label="Copy Section"
              />
            </div>

            {/* Score and Disclaimer */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                  Overall Profile Presentation Score
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                    {report.executiveSummary.score}
                  </span>
                  <span className="text-sm font-semibold text-slate-500">/ 100</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 sm:max-w-md italic leading-relaxed">
                {report.executiveSummary.scoreDisclaimer}
              </p>
            </div>

            {/* Strengths & Improvement Priorities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Three Strengths Supported by Document</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {report.executiveSummary.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                        {idx + 1}.
                      </span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Three Improvement Priorities</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {report.executiveSummary.improvementPriorities.map((priority, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold text-amber-700 dark:text-amber-400 shrink-0">
                        {idx + 1}.
                      </span>
                      <span>{priority}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Positioning Statement */}
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/30 space-y-1">
              <span className="text-xs uppercase tracking-wider font-bold text-blue-700 dark:text-blue-300">
                Concise Positioning Statement (Using Only Document Information)
              </span>
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                &ldquo;{report.executiveSummary.positioningStatement}&rdquo;
              </p>
            </div>
          </section>

          {/* SECTION 3: Facts Found in the Document */}
          <section
            id="section-facts-found"
            className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Facts Found in the Document
                </h2>
              </div>
              <CopyButton
                textToCopy={`## Facts Found in the Document\n- Name: ${report.factsFound.name}\n- Headline: ${report.factsFound.headline}\n- Location: ${report.factsFound.location}\n- Contact information: ${report.factsFound.contactInformation}\n- About or Summary: ${report.factsFound.aboutOrSummary}\n- Companies: ${report.factsFound.companies.join(", ")}\n- Job titles: ${report.factsFound.jobTitles.join(", ")}\n- Dates: ${report.factsFound.dates.join(", ")}\n- Locations: ${report.factsFound.locations.join(", ")}\n- Skills: ${report.factsFound.skills.join(", ")}\n- Certifications: ${report.factsFound.certifications.join(", ")}\n- Education: ${report.factsFound.education.join(", ")}\n- Other sections: ${report.factsFound.otherSections.join(", ")}`}
                label="Copy Facts"
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Every item below was extracted directly from your uploaded document. Where information was not present, it is explicitly recorded as &ldquo;Not provided in the uploaded document.&rdquo;
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <FactCard title="Name" value={report.factsFound.name} />
              <FactCard title="Headline" value={report.factsFound.headline} />
              <FactCard title="Location" value={report.factsFound.location} />
              <FactCard title="Contact Information" value={report.factsFound.contactInformation} />
              <FactCard title="About or Summary" value={report.factsFound.aboutOrSummary} />
              <FactCard title="Companies" value={report.factsFound.companies} />
              <FactCard title="Job Titles" value={report.factsFound.jobTitles} />
              <FactCard title="Dates" value={report.factsFound.dates} />
              <FactCard title="Locations" value={report.factsFound.locations} />
              <FactCard title="Skills" value={report.factsFound.skills} />
              <FactCard title="Certifications" value={report.factsFound.certifications} />
              <FactCard title="Education" value={report.factsFound.education} />
              <FactCard title="Other Sections" value={report.factsFound.otherSections} />
            </div>
          </section>

          {/* SECTION 4: Keep */}
          <section
            id="section-keep"
            className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Keep
                </h2>
              </div>
              <CopyButton
                textToCopy={`## Keep\n${report.keep.map((k) => `- ${k.element}: ${k.explanation}`).join("\n")}`}
                label="Copy Section"
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              These profile elements should remain because they are clear, relevant, or useful according to the uploaded document:
            </p>

            <div className="space-y-2.5">
              {report.keep.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-start gap-3 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 dark:text-white">{item.element}</p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.explanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 5: Improve */}
          <section
            id="section-improve"
            className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  5
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Improve
                </h2>
              </div>
              <CopyButton
                textToCopy={`## Improve\n${report.improve.map((item, i) => `### Item ${i + 1}\n- Existing wording: "${item.existingWording}"\n- Problem identified: ${item.problemIdentified}\n- Why wording could be improved: ${item.whyItMatters}\n- Recommended revision: "${item.recommendedRevision}"\n- Classification: ${item.classification}`).join("\n\n")}`}
                label="Copy Section"
              />
            </div>

            <div className="space-y-4">
              {report.improve.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 space-y-2.5 text-xs shadow-2xs"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Recommendation #{idx + 1}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        item.classification.includes("Directly supported")
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300"
                          : item.classification.includes("Writing")
                          ? "bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-300"
                          : "bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-300"
                      }`}
                    >
                      {item.classification}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block not-italic">
                      Existing wording from document:
                    </span>
                    &ldquo;{item.existingWording}&rdquo;
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 dark:text-slate-400">
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 block">Problem Identified:</strong>
                      <span>{item.problemIdentified}</span>
                    </div>
                    <div>
                      <strong className="text-slate-800 dark:text-slate-200 block">Why It Could Be Improved:</strong>
                      <span>{item.whyItMatters}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-blue-900 dark:text-blue-300">
                        Recommended Revision (Based Only on Document):
                      </strong>
                      <CopyButton textToCopy={item.recommendedRevision} size="sm" label="Copy" />
                    </div>
                    <p className="font-medium leading-relaxed">&ldquo;{item.recommendedRevision}&rdquo;</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 6: Remove or Replace */}
          <section
            id="section-remove-or-replace"
            className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 flex items-center justify-center font-bold text-sm">
                  6
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Remove or Replace
                </h2>
              </div>
              <CopyButton
                textToCopy={`## Remove or Replace\n${report.removeOrReplace.map((item) => `- Exact wording: "${item.exactWording}"\n  Reason: ${item.reason}\n  Replacement: "${item.replacement}"`).join("\n")}`}
                label="Copy Section"
              />
            </div>

            <div className="space-y-3 text-xs">
              {report.removeOrReplace.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-red-950 dark:text-red-300 font-semibold">
                      &ldquo;{item.exactWording}&rdquo;
                    </span>
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                      Flagged
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    <strong>Reason for removal:</strong> {item.reason}
                  </p>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <strong className="text-slate-800 dark:text-slate-200 block mb-0.5">
                      Replacement Wording:
                    </strong>
                    <span className="text-slate-700 dark:text-slate-300">{item.replacement}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 7: Headline Recommendations */}
          <section
            id="section-headline-recommendations"
            className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  7
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Headline Recommendations
                </h2>
              </div>
              <CopyButton
                textToCopy={`## Headline Recommendations\n${report.headlineRecommendations.options.map((opt, i) => `Option ${i + 1}: "${opt}"`).join("\n")}\n\nCritique: ${report.headlineRecommendations.critique || "None"}`}
                label="Copy Options"
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Formulated using only facts, titles, and skills explicitly supported by the uploaded document:
            </p>

            {report.headlineRecommendations.insufficientDataNotice && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 text-xs text-amber-900 dark:text-amber-200">
                {report.headlineRecommendations.insufficientDataNotice}
              </div>
            )}

            <div className="space-y-3">
              {report.headlineRecommendations.options.map((option, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Option {idx + 1}
                    </span>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white font-mono">
                      {option}
                    </p>
                  </div>
                  <CopyButton textToCopy={option} size="sm" label="Copy Headline" />
                </div>
              ))}
            </div>

            {report.headlineRecommendations.critique && (
              <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                {report.headlineRecommendations.critique}
              </p>
            )}
          </section>

          {/* SECTION 8: Rewritten About Section */}
          <section
            id="section-rewritten-about"
            className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  8
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Rewritten About Section
                </h2>
              </div>
              <CopyButton
                textToCopy={report.rewrittenAbout.copyReadyVersion}
                label="Copy About Text"
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Copy-ready draft constructed exclusively from information verified in your uploaded document. No imaginary metrics or unverified achievements were introduced.
            </p>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {report.rewrittenAbout.copyReadyVersion}
            </div>

            {report.rewrittenAbout.missingDetails && report.rewrittenAbout.missingDetails.length > 0 && (
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs space-y-1.5">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Missing Details Not Included in Uploaded Document:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                  {report.rewrittenAbout.missingDetails.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* SECTION 9: Experience Rewrites */}
          <section
            id="section-experience-rewrites"
            className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  9
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Experience Rewrites
                </h2>
              </div>
              <CopyButton
                textToCopy={`## Experience Rewrites\n${report.experienceRewrites.map((exp) => `### ${exp.companyName}\n**${exp.jobTitle}**\n**Dates:** ${exp.dates}\n\n**Copy-ready version:**\n${exp.copyReadyVersion}\n\n**Missing information:**\n${exp.missingInformation.map((m) => `- ${m}`).join("\n")}`).join("\n\n")}`}
                label="Copy All Experiences"
              />
            </div>

            <div className="space-y-4">
              {report.experienceRewrites.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {exp.companyName}
                      </h3>
                      <p className="text-slate-700 dark:text-slate-300 font-semibold">
                        {exp.jobTitle} · <span className="font-normal text-slate-500">{exp.dates}</span>
                      </p>
                    </div>
                    <CopyButton textToCopy={exp.copyReadyVersion} size="sm" label="Copy Experience" />
                  </div>

                  <div>
                    <strong className="text-slate-800 dark:text-slate-200 block mb-1">
                      Copy-ready version (Rewriting only supported document info):
                    </strong>
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 whitespace-pre-wrap text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                      {exp.copyReadyVersion}
                    </div>
                  </div>

                  {exp.missingInformation && exp.missingInformation.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200">
                      <strong className="block mb-1">
                        Missing information (not provided in uploaded document):
                      </strong>
                      <ul className="list-disc list-inside space-y-0.5">
                        {exp.missingInformation.map((m, mIdx) => (
                          <li key={mIdx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 10: Skills Review */}
          <section
            id="section-skills-review"
            className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  10
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Skills Review
                </h2>
              </div>
              <CopyButton
                textToCopy={`## Skills Review\n### Skills Explicitly Present in the Document:\n${report.skillsReview.explicitlyPresent.map((s) => `- ${s}`).join("\n")}\n\n### Skills That Appear Unclear or Need Verification:\n${report.skillsReview.unclearOrNeedVerification.map((s) => `- ${s}`).join("\n")}\n\n### Skills Not Available for Recommendation:\n${report.skillsReview.notAvailableNotice}`}
                label="Copy Skills"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                <h3 className="font-bold text-emerald-900 dark:text-emerald-300">
                  Skills Explicitly Present in Document ({report.skillsReview.explicitlyPresent.length})
                </h3>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {report.skillsReview.explicitlyPresent.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
                <h3 className="font-bold text-amber-900 dark:text-amber-300">
                  Skills Unclear or Needing Verification
                </h3>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                  {report.skillsReview.unclearOrNeedVerification.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 italic">
              <strong>Notice:</strong> {report.skillsReview.notAvailableNotice}
            </div>
          </section>

          {/* SECTION 11: Certification Review */}
          <section
            id="section-certification-review"
            className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  11
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Certification Review
                </h2>
              </div>
              <CopyButton
                textToCopy={`## Certification Review\n${report.certificationReview.certifications.map((c) => `- Name: ${c.name}\n  Issuer: ${c.issuer}\n  Date: ${c.date}\n  Credential ID: ${c.credentialId}`).join("\n")}\n\n${report.certificationReview.missingDetailsNote || ""}`}
                label="Copy Certifications"
              />
            </div>

            <div className="space-y-2.5 text-xs">
              {report.certificationReview.certifications.map((cert, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-1"
                >
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{cert.name}</p>
                  <p className="text-slate-600 dark:text-slate-400">
                    Issuer: <span className="text-slate-800 dark:text-slate-200">{cert.issuer}</span> · Date:{" "}
                    <span className="text-slate-800 dark:text-slate-200">{cert.date}</span> · Credential ID:{" "}
                    <span className="text-slate-800 dark:text-slate-200">{cert.credentialId}</span>
                  </p>
                </div>
              ))}
            </div>

            {report.certificationReview.missingDetailsNote && (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                {report.certificationReview.missingDetailsNote}
              </p>
            )}
          </section>

          {/* SECTION 12: Document-Based Content Suggestions */}
          <section
            id="section-content-suggestions"
            className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  12
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Document-Based Content Suggestions
                </h2>
              </div>
              <CopyButton
                textToCopy={`## Document-Based Content Suggestions\n${report.documentContentSuggestions.map((s, i) => `Topic ${i + 1}: ${s.topic}\nSource Subject: ${s.sourceSubject}\nReasoning: ${s.reasoning}`).join("\n\n")}`}
                label="Copy Content Plan"
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Formulated strictly using documented experiences, tools, and roles from your uploaded file:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {report.documentContentSuggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Topic #{idx + 1}
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      {suggestion.topic}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      <strong>Source:</strong> {suggestion.sourceSubject}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                      {suggestion.reasoning}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 13: Final Accuracy Checklist & Statement */}
          <section
            id="section-final-checklist"
            className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
                  13
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Final Accuracy Checklist
                </h2>
              </div>
              <CopyButton
                textToCopy={`## Final Accuracy Checklist\n${report.finalAccuracyChecklist.map((c) => `- [ ] ${c}`).join("\n")}\n\n${report.finalResponseStatement}`}
                label="Copy Checklist"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {report.finalAccuracyChecklist.map((checkItem, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2"
                >
                  <input
                    type="checkbox"
                    id={`check-item-${idx}`}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`check-item-${idx}`}
                    className="text-slate-800 dark:text-slate-200 cursor-pointer select-none"
                  >
                    {checkItem}
                  </label>
                </div>
              ))}
            </div>

            {/* MANDATORY FINAL RESPONSE STATEMENT */}
            <div
              id="final-response-statement-banner"
              className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-200 text-xs sm:text-sm font-semibold leading-relaxed text-center"
            >
              &ldquo;{report.finalResponseStatement}&rdquo;
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

// Helper Fact Card component
const FactCard: React.FC<{ title: string; value: string | string[] }> = ({ title, value }) => {
  const isArray = Array.isArray(value);
  const isEmpty = isArray ? value.length === 0 : !value || value.includes("Not provided in the uploaded document");

  return (
    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-1">
      <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wider text-slate-500">
        {title}
      </span>
      {isArray ? (
        isEmpty ? (
          <span className="text-slate-400 italic">Not provided in the uploaded document.</span>
        ) : (
          <div className="flex flex-wrap gap-1 mt-1">
            {value.map((v, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px]"
              >
                {v}
              </span>
            ))}
          </div>
        )
      ) : (
        <p className={`mt-0.5 leading-relaxed ${isEmpty ? "text-slate-400 italic" : "text-slate-800 dark:text-slate-200 font-medium"}`}>
          {value || "Not provided in the uploaded document."}
        </p>
      )}
    </div>
  );
};
