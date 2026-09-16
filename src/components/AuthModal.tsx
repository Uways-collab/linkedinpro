import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Mail, Lock, User, AlertCircle, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: "login" | "signup";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = "login",
}) => {
  const [isLogin, setIsLogin] = useState(defaultMode === "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        if (!password || password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        await signup(email.trim(), password, name.trim());
      }
      onClose();
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = err.message || "Failed to authenticate. Please try again.";
      if (msg.includes("auth/user-not-found") || msg.includes("auth/wrong-password") || msg.includes("auth/invalid-credential")) {
        msg = "Invalid email address or password.";
      } else if (msg.includes("auth/email-already-in-use")) {
        msg = "An account with this email already exists. Try logging in.";
      } else if (msg.includes("auth/weak-password")) {
        msg = "Password should be at least 6 characters.";
      } else if (msg.includes("auth/invalid-email")) {
        msg = "Please enter a valid email address.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header decoration */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white relative">
          <button
            type="button"
            id="close-auth-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">
              LinkedIn Profile Pro
            </span>
          </div>
          <h3 className="text-xl font-bold">
            {isLogin ? "Sign In to Your Account" : "Create Your Account"}
          </h3>
          <p className="text-xs text-blue-100 mt-1">
            {isLogin
              ? "Access your saved profile audits, track score improvements, and compare rewrites."
              : "Save your executive audits securely and unlock side-by-side profile comparisons."}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="m-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="auth-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="auth-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="auth-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                required
                minLength={6}
              />
            </div>
            {!isLogin && (
              <p className="text-[11px] text-slate-400 mt-1">Must be at least 6 characters</p>
            )}
          </div>

          <button
            type="submit"
            id="auth-submit-btn"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-semibold transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isLogin ? "Sign In" : "Create Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch between login/signup */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400">
          {isLogin ? (
            <p>
              Don&apos;t have an account yet?{" "}
              <button
                type="button"
                id="switch-to-signup-btn"
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                }}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Sign up free
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                id="switch-to-login-btn"
                onClick={() => {
                  setIsLogin(true);
                  setError(null);
                }}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
