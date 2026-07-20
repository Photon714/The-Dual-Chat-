"use client";

import { useState } from "react";

type View = "login" | "signup" | "forgot" | "otp" | "reset";  // view a datatype to manage the different views of the authentication screen ie wont require multiple compenents to view

interface AuthScreenProps { //saying tha anything from auth props must contain onAuth function
  onAuth: () => void;
}

export default function AuthScreen({ onAuth }: AuthScreenProps) { //using props i sent the auth action(ie in page.tsx) into onAuth ie onAuth will fire the action in page.tsx when the user is authenticated
  const [view, setView] = useState<View>("login"); //sets the view to login on first render and also <View> makes sure thgat the view can only be one of the five options defined in the View type
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const inputClass =
    "w-full p-3 mb-3 outline-none rounded-xl bg-transparent text-gray-900 placeholder-gray-400 border border-gray-300 dark:border-[#2A2F38] dark:text-[#E6EDF3] dark:placeholder-[#8B949E] focus:ring-2 focus:ring-emerald-400 dark:focus:ring-[#5EEAD4]";
  //A single const which contains tailwind css ie can use where needed instead of repeating

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); //to stop realoading on submission
    setError("");
    setLoading(true); //now shows loading on the UI

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      onAuth();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      onAuth();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setResetEmail(email);
      setView("otp"); //onces the user enters the email we set the view to otp screen
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setResetToken(data.resetToken); //giving a reset token to the user to reset the password ie its time limited
      setView("reset");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setView("login");
      setEmail("");
      setUsername("");
      setPassword("");
      setOtpCode("");
      setNewPassword("");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-r from-taupe-700 to-zinc-900 dark:from-[#171717] dark:to-[#0D0D0F] transition-colors duration-300">
      <div className="w-full max-w-sm p-8 rounded-xl shadow-xl bg-white dark:bg-[#161B22] border border-gray-300 dark:border-[#2A2F38]">
        <h2 className="text-xl font-bold text-gray-900 dark:text-[#E6EDF3] mb-2 text-center">
          {view === "login" && "Welcome Back"}
          {view === "signup" && "Create Account"}
          {view === "forgot" && "Forgot Password"}
          {view === "otp" && "Enter OTP"}
          {view === "reset" && "New Password"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-[#8B949E] mb-6 text-center">
          {view === "login" && "Log in to Dual Chat"}
          {view === "signup" && "Sign up to start chatting"}
          {view === "forgot" && "Enter your email to receive an OTP"}
          {view === "otp" && `OTP sent to ${resetEmail}`}
          {view === "reset" && "Enter your new password"}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {view === "login" && (
          <form onSubmit={handleLogin}>
            <input
              className={inputClass}
              value={username}
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className={inputClass}
              type="password"
              value={password}
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 rounded-xl font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
            <div className="mt-4 text-center text-sm text-gray-500 dark:text-[#8B949E]">
              <button
                type="button"
                onClick={() => { setView("forgot"); setError(""); }}
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="mt-2 text-center text-sm text-gray-500 dark:text-[#8B949E]">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => { setView("signup"); setError(""); }}
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        {view === "signup" && (
          <form onSubmit={handleSignup}>
            <input
              className={inputClass}
              type="email"
              value={email}
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className={inputClass}
              value={username}
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className={inputClass}
              type="password"
              value={password}
              placeholder="Password (min 6 chars)"
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 rounded-xl font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
            <div className="mt-4 text-center text-sm text-gray-500 dark:text-[#8B949E]">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setView("login"); setError(""); }}
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Log in
              </button>
            </div>
          </form>
        )}

        {view === "forgot" && (
          <form onSubmit={handleForgotPassword}>
            <input
              className={inputClass}
              type="email"
              value={email}
              placeholder="Email address"
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 rounded-xl font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
            <div className="mt-4 text-center text-sm text-gray-500 dark:text-[#8B949E]">
              <button
                type="button"
                onClick={() => { setView("login"); setError(""); }}
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Back to login
              </button>
            </div>
          </form>
        )}

        {view === "otp" && (
          <form onSubmit={handleVerifyOtp}>
            <input
              className={inputClass}
              value={otpCode}
              placeholder="6-digit OTP"
              onChange={(e) => setOtpCode(e.target.value)}
              maxLength={6}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 rounded-xl font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <div className="mt-4 text-center text-sm text-gray-500 dark:text-[#8B949E]">
              <button
                type="button"
                onClick={() => { setView("forgot"); setError(""); }}
                className="text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {view === "reset" && (
          <form onSubmit={handleResetPassword}>
            <input
              className={inputClass}
              type="password"
              value={newPassword}
              placeholder="New password (min 6 chars)"
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full p-3 rounded-xl font-medium text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
