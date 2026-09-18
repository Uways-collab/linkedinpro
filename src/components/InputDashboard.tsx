import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Link as LinkIcon,
  ShieldCheck,
  Plus,
  Trash2,
  Lock,
  Globe,
  Github,
  Linkedin,
  Instagram,
  Twitter,
  Facebook,
  Layers,
  HelpCircle,
} from "lucide-react";
import {
  ComprehensiveInput,
  UploadedFileItem,
  PastedTextItem,
  UserGoals,
} from "../types";

interface InputDashboardProps {
  onSubmit: (input: ComprehensiveInput) => void;
  isLoading: boolean;
  activeMode: "analysis_draft" | "account_update";
  onModeChange: (mode: "analysis_draft" | "account_update") => void;
  onClearAllData: () => void;
}

const MAX_FILE_SIZE_MB = 25;

export const InputDashboard: React.FC<InputDashboardProps> = ({
  onSubmit,
  isLoading,
  activeMode,
  onModeChange,
  onClearAllData,
}) => {
  // 1. Uploaded files list
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 2. Pasted text items
  const [pastedTexts, setPastedTexts] = useState<PastedTextItem[]>([]);
  const [newPasteCategory, setNewPasteCategory] = useState<PastedTextItem["category"]>("profile_text");
  const [newPasteTitle, setNewPasteTitle] = useState("");
  const [newPasteContent, setNewPasteContent] = useState("");
  const [isAddingPaste, setIsAddingPaste] = useState(false);

  // 3. Profile URL state & live preview
  const [profileUrl, setProfileUrl] = useState("");
  const [isVerifyingUrl, setIsVerifyingUrl] = useState(false);
  const [urlProfileData, setUrlProfileData] = useState<any | null>(null);
  const [urlVerifyStatus, setUrlVerifyStatus] = useState<"idle" | "verified" | "error">("idle");
  const [urlMessage, setUrlMessage] = useState<string | null>(null);

  // 4. Goals & parameters
  const [goals, setGoals] = useState<UserGoals>({
    primaryGoal: "Improve professional credibility",
    targetRole: "",
    targetIndustry: "",
    targetAudience: "",
    location: "",
    preferredTone: "",
    brandOrCompany: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileCategory, setSelectedFileCategory] = useState<UploadedFileItem["category"]>("linkedin_pdf");

  // Handle URL Inspection
  const handleInspectUrl = async () => {
    const trimmed = profileUrl.trim();
    if (!trimmed) {
      setUrlVerifyStatus("error");
      setUrlMessage("Please enter your profile or website URL first.");
      return;
    }

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setUrlVerifyStatus("error");
      setUrlMessage("Please enter a full URL beginning with https:// or http://");
      return;
    }

    setIsVerifyingUrl(true);
    setUrlVerifyStatus("idle");
    setUrlMessage(null);

    try {
      const res = await fetch("/api/inspect-profile-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to inspect profile URL.");
      }

      setUrlProfileData(data.profileData);
      setUrlVerifyStatus("verified");
      setUrlMessage(
        data.profileData?.fetchNotes ||
          `Successfully extracted profile data from ${data.profileData?.platform || "the provided link"}.`
      );
    } catch (err: any) {
      console.error("URL inspection error:", err);
      setUrlVerifyStatus("error");
      setUrlMessage(err.message || "Unable to load profile data from this URL. You can still paste content or upload a document.");
    } finally {
      setIsVerifyingUrl(false);
    }
  };

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploadError(null);
    setIsReadingFile(true);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const sizeMb = file.size / (1024 * 1024);

      if (sizeMb > MAX_FILE_SIZE_MB) {
        setUploadError(`File "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
        continue;
      }

      const lowerName = file.name.toLowerCase();
      const validExtensions = [".pdf", ".docx", ".txt", ".md", ".jpg", ".jpeg", ".png"];
      const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));

      if (!isValid) {
        setUploadError("I could not read this file. Please upload a clearer PDF, DOCX, TXT, JPG, or PNG file.");
        continue;
      }

      try {
        const base64 = await toBase64(file);
        // Call backend extraction
        const res = await fetch("/api/extract-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file.name,
            type: file.type,
            base64,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "I could not read this file. Please upload a clearer PDF, DOCX, TXT, JPG, or PNG file.");
        }

        const newItem: UploadedFileItem = {
          id: "file_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          base64,
          category: selectedFileCategory,
          extractedText: data.extractedText || "",
          status: "ready",
        };

        setUploadedFiles((prev) => [...prev, newItem]);
      } catch (err: any) {
        console.error("File processing error:", err);
        setUploadError(err.message || "I could not read this file. Please upload a clearer PDF, DOCX, TXT, JPG, or PNG file.");
      }
    }

    setIsReadingFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = (error) => reject(error);
    });

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Handle Add Pasted Text
  const handleAddPaste = () => {
    if (!newPasteContent.trim()) return;

    const newItem: PastedTextItem = {
      id: "paste_" + Date.now(),
      category: newPasteCategory,
      title: newPasteTitle.trim() || `${newPasteCategory.replace("_", " ").toUpperCase()}`,
      content: newPasteContent.trim(),
    };

    setPastedTexts((prev) => [...prev, newItem]);
    setNewPasteContent("");
    setNewPasteTitle("");
    setIsAddingPaste(false);
  };

  const handleRemovePaste = (id: string) => {
    setPastedTexts((prev) => prev.filter((p) => p.id !== id));
  };

  // Submit Handler
  const handleStartAnalysis = (e: React.FormEvent) => {
    e.preventDefault();

    const hasProfileUrl = profileUrl.trim().length > 0;
    const hasSources =
      hasProfileUrl ||
      uploadedFiles.length > 0 ||
      pastedTexts.length > 0;

    if (!hasSources) {
      setUploadError(
        "Please provide your profile URL, upload a document, or paste your profile content before starting the analysis."
      );
      return;
    }

    const payload: ComprehensiveInput = {
      mode: activeMode,
      uploadedFiles,
      pastedTexts,
      profileUrl: profileUrl.trim() || undefined,
      optionalProfileUrl: profileUrl.trim() || undefined,
      goals,
    };

    onSubmit(payload);
  };

  const totalSourcesCount =
    (profileUrl.trim() ? 1 : 0) +
    uploadedFiles.length +
    pastedTexts.length;

  return (
    <div id="input-dashboard" className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Mode Selection Header & Notice */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Operational Mode
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {activeMode === "analysis_draft"
                ? "1. Analysis & Drafting Mode"
                : "2. Connected Account Update Mode"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              {activeMode === "analysis_draft"
                ? "Analyzes verified facts, checks cross-platform consistency, and prepares exact copy-ready drafts. No changes are sent to any platform."
                : "Allows explicit, user-confirmed profile updates to officially connected accounts with highlighted before-and-after diffs."}
            </p>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => onModeChange("analysis_draft")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeMode === "analysis_draft"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Drafting Mode</span>
            </button>
            <button
              type="button"
              onClick={() => onModeChange("account_update")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeMode === "account_update"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Update Mode</span>
            </button>
          </div>
        </div>

        {/* Unbreakable Mode Guarantee */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            <strong>Safety Guarantee:</strong> The application never confuses a draft recommendation with a published update. Direct publishing requires explicit, step-by-step confirmation.
          </span>
        </div>
      </div>

      {/* Strict Source-of-Truth Policy Banner */}
      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <p className="font-bold mb-0.5">Strict Source-of-Truth Policy Active</p>
          <p>
            The AI analyzes <strong>only</strong> information from your provided profile URLs, uploaded documents, and pasted text. The AI inspects and understands the real content on your profile without requiring social media account logins or OAuth connectors. No mock data, fake metrics, or fabricated details are ever generated. If a fact is not provided, it will be labeled: <em>“Not provided by the provided profile URL or uploaded document.”</em>
          </p>
        </div>
      </div>

      {/* Global Error Banner */}
      {uploadError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{uploadError}</p>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Form Grid */}
      <form onSubmit={handleStartAnalysis} className="space-y-8">
        {/* SECTION 1: SOURCE MANAGER */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Verified Source Manager</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {totalSourcesCount} Available
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Provide profile URLs, upload documents, or paste profile excerpts.
              </p>
            </div>

            {totalSourcesCount > 0 && (
              <button
                type="button"
                onClick={onClearAllData}
                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Data</span>
              </button>
            )}
          </div>

          {/* Sub-tabs / Source Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel A: Upload Documents */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Upload Documents</span>
                </label>
                <select
                  value={selectedFileCategory}
                  onChange={(e) => setSelectedFileCategory(e.target.value as any)}
                  className="text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-300"
                >
                  <option value="linkedin_pdf">LinkedIn Profile PDF</option>
                  <option value="cv_resume">CV or Resume</option>
                  <option value="portfolio_doc">Portfolio Document</option>
                  <option value="screenshot">Profile Screenshot</option>
                  <option value="export">Profile Export</option>
                  <option value="markdown_txt">Text / Markdown</option>
                </select>
              </div>

              {/* Upload Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-8 h-8 mx-auto text-slate-400 group-hover:text-blue-500 transition mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Click or drag files here
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  PDF, DOCX, TXT, Markdown, JPG, PNG (up to 25MB)
                </p>
              </div>

              {isReadingFile && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                  <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Verifying source document authenticity...</span>
                </div>
              )}

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Uploaded Documents ({uploadedFiles.length})
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {uploadedFiles.map((f) => (
                      <div
                        key={f.id}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <div className="truncate">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {f.name}
                            </p>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {f.category.replace("_", " ")} · {(f.size / 1024).toFixed(0)} KB
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(f.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Panel B: Paste Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Paste Profile Content</span>
                </label>
                {!isAddingPaste && (
                  <button
                    type="button"
                    onClick={() => setIsAddingPaste(true)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Text Excerpt</span>
                  </button>
                )}
              </div>

              {isAddingPaste ? (
                <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/40 dark:bg-blue-950/20 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newPasteCategory}
                      onChange={(e) => setNewPasteCategory(e.target.value as any)}
                      className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-slate-800 dark:text-slate-200"
                    >
                      <option value="profile_text">Profile Text</option>
                      <option value="about_bio">About Section / Bio</option>
                      <option value="cv_text">CV / Resume Text</option>
                      <option value="portfolio_text">Portfolio Excerpt</option>
                      <option value="social_captions">Social Captions / Description</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Title or label"
                      value={newPasteTitle}
                      onChange={(e) => setNewPasteTitle(e.target.value)}
                      className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <textarea
                    rows={4}
                    placeholder="Paste exact wording here..."
                    value={newPasteContent}
                    onChange={(e) => setNewPasteContent(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingPaste(false)}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddPaste}
                      disabled={!newPasteContent.trim()}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save Text Excerpt
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsAddingPaste(true)}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30 group"
                >
                  <FileCode className="w-8 h-8 mx-auto text-slate-400 group-hover:text-indigo-500 transition mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Paste Profile or Bio Text
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    About section, experience bullets, portfolio case studies
                  </p>
                </div>
              )}

              {/* Pasted Texts List */}
              {pastedTexts.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Pasted Content ({pastedTexts.length})
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {pastedTexts.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs"
                      >
                        <div className="truncate flex-1 pr-2">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {p.title}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {p.content.slice(0, 50)}...
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePaste(p.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Panel C: Profile URL Inspection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Profile / Portfolio URL</span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Direct Analysis
                </span>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Provide your LinkedIn, GitHub, X/Twitter, Instagram, TikTok, or personal website link. The AI directly inspects and understands the content on your profile.
              </p>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username or github.com/user"
                    value={profileUrl}
                    onChange={(e) => {
                      setProfileUrl(e.target.value);
                      setUrlVerifyStatus("idle");
                      setUrlMessage(null);
                    }}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleInspectUrl}
                    disabled={isVerifyingUrl || !profileUrl.trim()}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {isVerifyingUrl ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Inspecting...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Status or preview display */}
                {urlVerifyStatus === "verified" && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Profile Detected & Inspected</span>
                    </div>
                    {urlProfileData && (
                      <p className="text-[11px] text-slate-700 dark:text-slate-300">
                        Platform: <strong>{urlProfileData.platform}</strong> · Verified and ready for analysis.
                      </p>
                    )}
                    {urlMessage && (
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 italic pt-0.5">
                        {urlMessage}
                      </p>
                    )}
                  </div>
                )}

                {urlVerifyStatus === "error" && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">{urlMessage}</span>
                  </div>
                )}

                {/* Popular Platform Badges */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Supported Platforms
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {[
                      { name: "LinkedIn", icon: Linkedin },
                      { name: "GitHub", icon: Github },
                      { name: "X / Twitter", icon: Twitter },
                      { name: "Instagram", icon: Instagram },
                      { name: "Facebook", icon: Facebook },
                      { name: "Portfolio / Web", icon: Globe },
                    ].map((p) => {
                      const Icon = p.icon;
                      return (
                        <span
                          key={p.name}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium"
                        >
                          <Icon className="w-3 h-3 text-slate-500" />
                          <span>{p.name}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: GOALS & STRATEGY CONTEXT */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              User Goals & Strategic Positioning
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select your objective. Contextual fields are used exclusively to format and prioritize verified facts.
            </p>
          </div>

          {/* Goal Selector Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Primary Objective
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {[
                "Find a job",
                "Attract clients",
                "Attract investors",
                "Build a personal brand",
                "Grow a business",
                "Grow as a founder",
                "Get freelance opportunities",
                "Promote creative work",
                "Promote a portfolio",
                "Improve professional credibility",
                "Make profiles consistent across platforms",
              ].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoals((prev) => ({ ...prev, primaryGoal: g }))}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition cursor-pointer ${
                    goals.primaryGoal === g
                      ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold"
                      : "border-slate-200 dark:border-slate-750 bg-slate-50/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Context Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Role
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Product Manager"
                value={goals.targetRole || ""}
                onChange={(e) => setGoals((prev) => ({ ...prev, targetRole: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Industry
              </label>
              <input
                type="text"
                placeholder="e.g. Enterprise SaaS, FinTech"
                value={goals.targetIndustry || ""}
                onChange={(e) => setGoals((prev) => ({ ...prev, targetIndustry: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Audience
              </label>
              <input
                type="text"
                placeholder="e.g. CTOs, VP Engineering, Recruiters"
                value={goals.targetAudience || ""}
                onChange={(e) => setGoals((prev) => ({ ...prev, targetAudience: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location
              </label>
              <input
                type="text"
                placeholder="e.g. London, UK / Remote"
                value={goals.location || ""}
                onChange={(e) => setGoals((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preferred Tone
              </label>
              <input
                type="text"
                placeholder="e.g. Executive, Authoritative, Crisp"
                value={goals.preferredTone || ""}
                onChange={(e) => setGoals((prev) => ({ ...prev, preferredTone: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brand or Company Name
              </label>
              <input
                type="text"
                placeholder="e.g. Self / Consulting practice"
                value={goals.brandOrCompany || ""}
                onChange={(e) => setGoals((prev) => ({ ...prev, brandOrCompany: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {totalSourcesCount === 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Please upload a document, paste your profile content, or connect an authorized account before starting the analysis.
              </span>
            ) : (
              <span>
                Ready to analyze <strong>{totalSourcesCount}</strong> verified source(s) in{" "}
                <strong>{activeMode === "analysis_draft" ? "Drafting Mode" : "Update Mode"}</strong>.
              </span>
            )}
          </div>

          <button
            type="submit"
            id="start-audit-submit-btn"
            disabled={isLoading || totalSourcesCount === 0}
            className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/25 transition disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Auditing Verified Sources...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Start Career Portfolio Audit</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
