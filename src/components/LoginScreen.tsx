"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        // Step 1: Create the account
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Signup failed");
          setLoading(false);
          return;
        }
      }

      // Step 2: Sign in with credentials
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === "CredentialsSignin"
            ? "Invalid email or password"
            : result.error
        );
        setLoading(false);
        return;
      }

      // Success — NextAuth will update the session and re-render
      window.location.reload();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md w-full">
        {/* Mascot */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <img
            src="/images/B4.png"
            alt="Doable mascot"
            className="w-48 h-auto mx-auto mb-4"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-[#1f3a5c] mb-3">
            Welcome to Doable
          </h1>
          <p className="text-[#5a7fa8] mb-8 leading-relaxed">
            Your AI coach that turns overwhelming tasks into doable steps.
            {mode === "login" ? " Sign in to continue." : " Create an account to get started."}
          </p>
        </motion.div>

        {/* Credential Form */}
        <form onSubmit={handleCredentialSubmit} className="space-y-3 mb-4">
          {mode === "signup" && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              className="w-full px-4 py-3 rounded-2xl border border-[#b8d4ed] bg-white text-[#1f3a5c] text-sm placeholder:text-[#5a7fa8] focus:outline-none focus:ring-2 focus:ring-[#4a8fe7]/30"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full px-4 py-3 rounded-2xl border border-[#b8d4ed] bg-white text-[#1f3a5c] text-sm placeholder:text-[#5a7fa8] focus:outline-none focus:ring-2 focus:ring-[#4a8fe7]/30"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "Password (min 8 characters)" : "Password"}
            required
            minLength={mode === "signup" ? 8 : undefined}
            className="w-full px-4 py-3 rounded-2xl border border-[#b8d4ed] bg-white text-[#1f3a5c] text-sm placeholder:text-[#5a7fa8] focus:outline-none focus:ring-2 focus:ring-[#4a8fe7]/30"
          />

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-2xl font-semibold text-white bg-[#4a8fe7] hover:bg-[#3a7dd4] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
          >
            {loading
              ? "Please wait..."
              : mode === "signup"
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

        {/* Toggle mode */}
        <p className="text-sm text-[#5a7fa8] mb-6">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => { setMode("signup"); setError(""); }}
                className="text-[#4a8fe7] font-semibold hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => { setMode("login"); setError(""); }}
                className="text-[#4a8fe7] font-semibold hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </>
          )}
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-[#b8d4ed]" />
          <span className="text-xs text-[#5a7fa8]">or</span>
          <div className="flex-1 h-px bg-[#b8d4ed]" />
        </div>

        {/* Google Sign In */}
        <button
          onClick={() => signIn("google")}
          className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-2xl font-semibold text-[#1f3a5c] bg-white border border-[#b8d4ed] hover:bg-[#f0f6fc] transition-all cursor-pointer shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-xs text-[#5a7fa8] mt-6">
          Your data is synced securely across devices
        </p>
      </div>
    </div>
  );
}
