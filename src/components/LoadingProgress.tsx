import React, { useEffect, useState } from "react";
import { Sparkles, CheckCircle, Search, FileEdit, Award, ShieldAlert } from "lucide-react";

interface LoadingProgressProps {
  onCancel?: () => void;
}

const STAGES = [
  {
    icon: Search,
    title: "Extracting & Validating Profile Content",
    desc: "Scanning roles, dates, achievements, and educational facts without assumptions.",
  },
  {
    icon: ShieldAlert,
    title: "Auditing Positioning & Evidence Quality",
    desc: "Detecting vague buzzwords, missing proof metrics, and audience clarity.",
  },
  {
    icon: FileEdit,
    title: "Drafting Copy-Ready Headlines & About Section",
    desc: "Crafting three tailored headline variations and an active first-person narrative.",
  },
  {
    icon: Award,
    title: "Refining Experience Bullets & Probing Questions",
    desc: "Separating day-to-day duties from measurable impact with targeted follow-ups.",
  },
  {
    icon: Sparkles,
    title: "Generating 30-Day Roadmap & Content Strategy",
    desc: "Assembling recruiter SEO keywords, featured item suggestions, and publishing checklist.",
  },
];

export const LoadingProgress: React.FC<LoadingProgressProps> = () => {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      id="loading-progress-card"
      className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-850 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8"
    >
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
          <Sparkles className="w-7 h-7 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
          Analyzing Your LinkedIn Profile
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Our editorial branding engine is conducting an in-depth audit across 10 strategic dimensions.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-600 h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${((currentStage + 1) / STAGES.length) * 100}%` }}
        />
      </div>

      {/* Stages List */}
      <div className="space-y-4">
        {STAGES.map((stage, idx) => {
          const isDone = idx < currentStage;
          const isCurrent = idx === currentStage;
          const StageIcon = stage.icon;

          return (
            <div
              key={idx}
              className={`flex items-start gap-3.5 p-3 rounded-xl transition-all duration-300 ${
                isCurrent
                  ? "bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80"
                  : isDone
                  ? "opacity-60"
                  : "opacity-35"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  isDone
                    ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400"
                    : isCurrent
                    ? "bg-blue-600 text-white animate-pulse"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                }`}
              >
                {isDone ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <StageIcon className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    isCurrent
                      ? "text-blue-900 dark:text-blue-200"
                      : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {stage.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  {stage.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-2">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Typically completes in 10-15 seconds. Please keep this window open.
        </p>
      </div>
    </div>
  );
};
