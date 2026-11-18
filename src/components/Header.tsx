import React, { useState } from "react";
import { User, LogIn, LogOut, CheckCircle2, Cloud, CloudOff } from "lucide-react";
import type { UserAccount } from "../data/types";

interface HeaderProps {
  user: UserAccount | null;
  googleClientId: string;
  cloudSyncEnabled: boolean;
  isSyncing: boolean;
  onUserChange: (user: UserAccount | null) => void;
  onBackToHome?: () => void;
  currentTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  googleClientId,
  cloudSyncEnabled,
  isSyncing,
  onUserChange,
  onBackToHome,
  currentTitle,
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <header className="w-full bg-[#0B0E14] border-b border-[#1A2232] px-4 py-2.5 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-2 group text-left transition"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#FF6B00]/10 border border-[#FF6B00]/40 group-hover:border-[#FF6B00] transition">
            <span className="font-mono font-black text-[#FF6B00] text-sm">|</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#8E9AA8]">
              <span className="text-[#FF6B00] font-semibold">admin@splunk</span>
              <span>:~|</span>
              <span className="inline-block w-1.5 h-3 bg-[#FF6B00] animate-blink" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight">SplunkDeck</span>
              {currentTitle && (
                <>
                  <span className="text-[#333E4F] text-xs">/</span>
                  <span className="text-xs text-[#00B4D8] font-medium">{currentTitle}</span>
                </>
              )}
            </div>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {user ? (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#1A2232] border border-[#2A3446] hover:border-[#FF6B00]/50 transition text-xs"
            title="Signed in with Google"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-300 font-medium max-w-[100px] truncate">{user.displayName || "User"}</span>
            {isSyncing ? (
              <Cloud className="w-3.5 h-3.5 text-[#00B4D8] animate-spin" />
            ) : cloudSyncEnabled ? (
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <CloudOff className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141A26] border border-[#2A3446] hover:border-[#FF6B00] hover:text-[#FF6B00] transition text-xs font-semibold text-slate-300"
          >
            <LogIn className="w-3.5 h-3.5 text-[#FF6B00]" />
            <span>Sign In</span>
          </button>
        )}
      </div>

      {showAuthModal && (
        <AuthModal
          user={user}
          googleClientId={googleClientId}
          cloudSyncEnabled={cloudSyncEnabled}
          onClose={() => setShowAuthModal(false)}
          onUserChange={onUserChange}
        />
      )}
    </header>
  );
};

interface AuthModalProps {
  user: UserAccount | null;
  googleClientId: string;
  cloudSyncEnabled: boolean;
  onClose: () => void;
  onUserChange: (user: UserAccount | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  user,
  googleClientId,
  cloudSyncEnabled,
  onClose,
  onUserChange,
}) => {
  const [manualId, setManualId] = useState("");
  const [manualName, setManualName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");

  // Initialize Google Identity Services if available
  React.useEffect(() => {
    if (typeof window === "undefined" || user) return;
    const clientId = googleClientId || "878162796773-a8mdqnl3d5mco0dor0j1v93ftd9fjspi.apps.googleusercontent.com";
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (win.google && win.google.accounts && win.google.accounts.id) {
      try {
        win.google.accounts.id.initialize({
          client_id: clientId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: async (response: any) => {
            if (response.credential) {
              await handleCredentialLogin(response.credential);
            }
          },
        });
        const container = document.getElementById("google-signin-btn-container");
        if (container) {
          win.google.accounts.id.renderButton(container, {
            theme: "filled_black",
            size: "large",
            shape: "pill",
            width: "100%",
            text: "signin_with",
          });
        }
      } catch (err) {
        console.warn("Google button init error:", err);
      }
    }
  }, [googleClientId, user]);

  const handleCredentialLogin = async (credential: string) => {
    setIsSubmitting(true);
    setAuthError("");
    try {
      const res = await fetch("/splunk_deck/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.account) {
          onUserChange({
            googleId: data.account.googleId,
            displayName: data.account.displayName || "Google User",
            email: data.account.email || "",
            avatarUrl: data.account.avatarUrl || "",
            cloudSyncEnabled: true,
          });
          onClose();
          return;
        }
      }
      throw new Error("Login failed");
    } catch {
      // Decode credential JWT locally if server route not reachable
      try {
        const parts = credential.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          onUserChange({
            googleId: payload.sub || "google-user",
            displayName: payload.name || payload.given_name || "User",
            email: payload.email || "",
            avatarUrl: payload.picture || "",
            cloudSyncEnabled: true,
          });
          onClose();
          return;
        }
      } catch {
        setAuthError("Failed to authenticate with Google. Try manual sign in.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    setIsSubmitting(true);
    setAuthError("");
    const gid = manualId.trim();
    const dname = manualName.trim() || gid.split("@")[0] || "User";

    try {
      const res = await fetch("/splunk_deck/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          googleId: gid,
          displayName: dname,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.account) {
          onUserChange({
            googleId: data.account.googleId,
            displayName: data.account.displayName,
            email: data.account.email,
            cloudSyncEnabled: true,
          });
          onClose();
          return;
        }
      }
    } catch {
      // Offline fallback
    }

    onUserChange({
      googleId: gid,
      displayName: dname,
      cloudSyncEnabled: true,
    });
    setIsSubmitting(false);
    onClose();
  };

  const handleSignOut = () => {
    onUserChange(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#121722] border border-[#2A3446] rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#FF6B00]" />
            <h3 className="font-bold text-white text-base">
              {user ? "Cloud Account" : "Sign In with Google"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 text-sm font-mono"
          >
            ✕
          </button>
        </div>

        {user ? (
          <div className="flex flex-col gap-4">
            <div className="bg-[#1A2232] rounded-xl p-3 border border-[#2A3446]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FF6B00]/20 border border-[#FF6B00] flex items-center justify-center font-bold text-[#FF6B00]">
                  {user.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{user.displayName}</div>
                  <div className="text-xs text-slate-400 truncate font-mono">{user.googleId}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#2A3446] flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Cloud Mastery Synced (D1)
                </span>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/40 text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out (Switch to Guest Mode)
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Splunk Deck works fully in <strong className="text-white">Guest Mode</strong> with local progress. Sign in with Google to sync your mastery across all your devices via Cloudflare D1.
            </p>

            <div id="google-signin-btn-container" className="min-h-[44px] flex items-center justify-center" />

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#2A3446]"></div>
              <span className="flex-shrink mx-3 text-[11px] font-mono text-slate-500 uppercase">Or Google ID</span>
              <div className="flex-grow border-t border-[#2A3446]"></div>
            </div>

            <form onSubmit={handleManualLogin} className="flex flex-col gap-2.5">
              <input
                type="text"
                placeholder="Google email or ID"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0E14] border border-[#2A3446] focus:border-[#FF6B00] outline-none text-xs text-white placeholder-slate-500 font-mono"
              />
              <input
                type="text"
                placeholder="Display Name (optional)"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B0E14] border border-[#2A3446] focus:border-[#FF6B00] outline-none text-xs text-white placeholder-slate-500"
              />
              {authError && <p className="text-red-400 text-[11px]">{authError}</p>}
              <button
                type="submit"
                disabled={isSubmitting || !manualId.trim()}
                className="w-full py-2.5 rounded-xl bg-[#FF6B00] hover:bg-[#FF7A00] disabled:opacity-50 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-[#FF6B00]/20"
              >
                {isSubmitting ? "Signing in..." : "Continue to Account"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
