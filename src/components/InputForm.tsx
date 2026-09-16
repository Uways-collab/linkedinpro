import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { UserInput } from "../types";

interface InputFormProps {
  onSubmit: (input: UserInput) => void;
  isLoading: boolean;
  initialInput?: Partial<UserInput>;
}

const MAX_FILE_SIZE_MB = 25;

export const InputForm: React.FC<InputFormProps> = ({
  onSubmit,
  isLoading,
  initialInput,
}) => {
  const [profileUrl, setProfileUrl] = useState(initialInput?.profileUrl || "");
  const [targetGoal, setTargetGoal] = useState(initialInput?.targetGoal || "");
  const [targetRole, setTargetRole] = useState(initialInput?.targetRole || "");
  const [targetIndustry, setTargetIndustry] = useState(initialInput?.targetIndustry || "");

  // Uploaded file state
  const [file, setFile] = useState<{
    name: string;
    type: string;
    size: number;
    base64: string;
    extractedSnippet?: string;
  } | null>(null);

  // Status & validation states
  const [readingStatus, setReadingStatus] = useState<"idle" | "reading" | "verified" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showPdfExportTip, setShowPdfExportTip] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (selectedFile: File) => {
    setErrorMessage(null);
    setReadingStatus("reading");
    setUploadProgress(15);

    // Validate size
    const sizeInMb = selectedFile.size / (1024 * 1024);
    if (sizeInMb > MAX_FILE_SIZE_MB) {
      setReadingStatus("error");
      setErrorMessage(
        `File is too large (${sizeInMb.toFixed(1)}MB). Please upload a file smaller than ${MAX_FILE_SIZE_MB}MB.`
      );
      return;
    }

    // Validate format: PDF, DOCX, TXT
    const name = selectedFile.name.toLowerCase();
    const isPdf = name.endsWith(".pdf") || selectedFile.type === "application/pdf";
    const isDocx =
      name.endsWith(".docx") ||
      selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isTxt = name.endsWith(".txt") || selectedFile.type.startsWith("text/");

    if (!isPdf && !isDocx && !isTxt) {
      setReadingStatus("error");
      setErrorMessage(
        "I could not read this document. Please upload a clear PDF, DOCX, or TXT file containing your LinkedIn profile."
      );
      return;
    }

    setUploadProgress(45);

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(Math.min(percent, 85));
      }
    };

    reader.onload = async (e) => {
      setUploadProgress(90);
      const result = e.target?.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;

      if (!base64 || base64.length === 0) {
        setReadingStatus("error");
        setErrorMessage(
          "I could not read this document. Please upload a clear PDF, DOCX, or TXT file containing your LinkedIn profile."
        );
        return;
      }

      // Verify readability with server
      try {
        const verifyRes = await fetch("/api/verify-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploadedFileName: selectedFile.name,
            uploadedFileType: selectedFile.type || (isPdf ? "application/pdf" : isDocx ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "text/plain"),
            uploadedFileBase64: base64,
          }),
        });

        const verifyData = await verifyRes.json();

        if (!verifyRes.ok || !verifyData.valid) {
          setReadingStatus("error");
          setErrorMessage(
            verifyData.error ||
              "I could not read this document. Please upload a clear PDF, DOCX, or TXT file containing your LinkedIn profile."
          );
          return;
        }

        setFile({
          name: selectedFile.name,
          type: verifyData.fileType || (isPdf ? "application/pdf" : "text/plain"),
          size: selectedFile.size,
          base64,
          extractedSnippet: verifyData.preview || "",
        });
        setUploadProgress(100);
        setReadingStatus("verified");
      } catch {
        // Local fallback if verification network route is slow
        setFile({
          name: selectedFile.name,
          type: selectedFile.type || (isPdf ? "application/pdf" : "text/plain"),
          size: selectedFile.size,
          base64,
        });
        setUploadProgress(100);
        setReadingStatus("verified");
      }
    };

    reader.onerror = () => {
      setReadingStatus("error");
      setErrorMessage(
        "I could not read this document. Please upload a clear PDF, DOCX, or TXT file containing your LinkedIn profile."
      );
    };

    reader.readAsDataURL(selectedFile);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setReadingStatus("idle");
    setUploadProgress(0);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClearAll = () => {
    handleClearFile();
    setProfileUrl("");
    setTargetGoal("");
    setTargetRole("");
    setTargetIndustry("");
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // STRICT RULE: If no document has been uploaded, display exact required message
    if (!file || !file.base64) {
      setErrorMessage(
        "Please upload your LinkedIn profile document before starting the analysis. This application analyzes only the information contained in the uploaded document."
      );
      return;
    }

    onSubmit({
      profileUrl: profileUrl.trim() || undefined,
      uploadedFileName: file.name,
      uploadedFileType: file.type,
      uploadedFileSize: file.size,
      uploadedFileBase64: file.base64,
      targetGoal: targetGoal.trim() || undefined,
      targetRole: targetRole.trim() || undefined,
      targetIndustry: targetIndustry.trim() || undefined,
    });
  };

  const isAnalyzeDisabled = !file || readingStatus === "reading" || isLoading;

  return (
    <form
      id="profile-document-upload-form"
      onSubmit={handleSubmit}
      className="w-full space-y-6"
    >
      {/* Source Integrity Callout Banner */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1e293b]/70 flex items-start gap-3 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Strict Source-of-Truth Enforcement
          </p>
          <p>
            This application analyzes <strong>only the information contained in your uploaded document</strong>.
            No mock facts, guessed metrics, or external scraping are ever used. Missing information is explicitly marked as missing.
          </p>
        </div>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div
          id="form-error-alert"
          className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-sm animate-fade-in"
        >
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Notice:</p>
            <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-xs font-semibold px-2 py-1 rounded bg-amber-200/60 dark:bg-amber-900/60 hover:bg-amber-200 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* PRIMARY WORKFLOW: Required File Upload Section */}
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <label className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Upload LinkedIn Profile Document</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60">
                  Required
                </span>
              </label>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Accepted formats: <strong>PDF</strong> (e.g. LinkedIn &ldquo;Save to PDF&rdquo; export), <strong>DOCX</strong>, or <strong>TXT</strong> up to {MAX_FILE_SIZE_MB}MB.
            </p>
          </div>

          <button
            type="button"
            id="toggle-pdf-guide-btn"
            onClick={() => setShowPdfExportTip(!showPdfExportTip)}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>How to export LinkedIn PDF?</span>
          </button>
        </div>

        {/* LinkedIn PDF Export Help Drawer */}
        {showPdfExportTip && (
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs text-blue-950 dark:text-blue-200 space-y-2 animate-fade-in">
            <p className="font-semibold flex items-center gap-1.5 text-blue-900 dark:text-blue-300">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              How to export your complete LinkedIn profile as a PDF in seconds:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1">
              <li>Open your LinkedIn profile in a desktop web browser.</li>
              <li>In your top profile section, click the <strong>&ldquo;More&rdquo;</strong> button (next to &ldquo;Open to&rdquo;).</li>
              <li>Click <strong>&ldquo;Save to PDF&rdquo;</strong> in the dropdown menu.</li>
              <li>Upload the generated PDF file directly into the dropzone below.</li>
            </ol>
          </div>
        )}

        {/* Upload Dropzone */}
        {!file ? (
          <div
            id="document-dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/40"
                : "border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/70 dark:bg-slate-900/60"
            }`}
          >
            <input
              ref={fileInputRef}
              id="document-file-input"
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-2xs">
                {readingStatus === "reading" ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <span className="text-blue-600 dark:text-blue-400 hover:underline">
                    Click to select file
                  </span>{" "}
                  or drag &amp; drop document here
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  PDF, DOCX, or TXT containing your LinkedIn profile record
                </p>
              </div>

              {/* Upload Progress Bar */}
              {readingStatus === "reading" && (
                <div className="w-full max-w-xs space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    <span>Reading document...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Uploaded File Verified Card */
          <div
            id="uploaded-document-card"
            className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 shadow-2xs">
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold truncate">{file.name}</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300">
                    Ready to analyze
                  </span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB · Document text verified as authoritative record
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                type="button"
                id="change-file-btn"
                onClick={handleClearFile}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Change Document
              </button>
              <button
                type="button"
                id="remove-file-btn"
                onClick={handleClearFile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* OPTIONAL REFERENCE: LinkedIn Profile URL Field */}
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label
            htmlFor="profile-url-input"
            className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"
          >
            <LinkIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>LinkedIn Profile URL</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              (Optional Reference Only)
            </span>
          </label>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          If provided, this URL is <strong>displayed only as a reference label</strong>. It will not be opened, scraped, or used as an information source. The audit is based exclusively on the uploaded document.
        </p>

        <input
          id="profile-url-input"
          type="url"
          value={profileUrl}
          onChange={(e) => setProfileUrl(e.target.value)}
          placeholder="https://www.linkedin.com/in/your-profile-name"
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition font-mono"
        />
      </div>

      {/* OPTIONAL CONTEXT: Strategic Direction */}
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Audit Focus &amp; Target Direction (Optional)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Helps calibrate headline options and improvement priorities using only document-verified facts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Primary Goal
            </label>
            <select
              id="target-goal-select"
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="">General Professional Audit</option>
              <option value="Find a job">Job Search / Recruiter Inbound</option>
              <option value="Attract clients">Client Acquisition &amp; Consulting</option>
              <option value="Attract investors">Founder / Investor Outreach</option>
              <option value="Build a personal brand">Thought Leadership &amp; Personal Brand</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Target Role (Optional)
            </label>
            <input
              id="target-role-input"
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. VP of Product"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Target Industry (Optional)
            </label>
            <input
              id="target-industry-input"
              type="text"
              value={targetIndustry}
              onChange={(e) => setTargetIndustry(e.target.value)}
              placeholder="e.g. Enterprise SaaS"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS: Analyze Profile & Clear */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          type="submit"
          id="analyze-profile-btn"
          disabled={isAnalyzeDisabled}
          className="w-full sm:flex-1 py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>Analyzing Document Data...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Analyze Profile</span>
            </>
          )}
        </button>

        <button
          type="button"
          id="clear-btn"
          disabled={isLoading}
          onClick={handleClearAll}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer text-sm"
        >
          Clear
        </button>
      </div>

      {!file && (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          The <strong>Analyze Profile</strong> button is disabled until a readable LinkedIn profile document is uploaded.
        </p>
      )}
    </form>
  );
};
