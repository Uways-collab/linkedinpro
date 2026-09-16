import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { copyToClipboard } from "../utils/fileUtils";

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  size?: "sm" | "md";
  id?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  textToCopy,
  label = "Copy",
  copiedLabel = "Copied!",
  className = "",
  size = "sm",
  id,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const isSmall = size === "sm";

  return (
    <button
      type="button"
      id={id || `copy-btn-${Math.random().toString(36).substring(2, 8)}`}
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 font-medium transition-all duration-200 cursor-pointer rounded-lg border ${
        copied
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
      } ${isSmall ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm"} ${className}`}
      title={copied ? "Copied to clipboard" : "Copy to clipboard"}
    >
      {copied ? (
        <>
          <Check className={`${isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} text-emerald-500`} />
          <span>{copiedLabel}</span>
        </>
      ) : (
        <>
          <Copy className={`${isSmall ? "w-3.5 h-3.5" : "w-4 h-4"}`} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
