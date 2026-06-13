"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconCards,
  IconLock,
  IconTarget,
  IconTree,
} from "@/components/icons";

const GOOGLE_ERRORS: Record<string, string> = {
  google_cancelled: "Google sign-in was cancelled.",
  google_state: "Google sign-in expired. Please try again.",
  google_exchange: "Couldn't verify your Google account. Please try again.",
  google_disabled: "Google sign-in isn't available right now.",
};

function GoogleGlyph() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.41 5.41 0 0 1 3.69 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}

type Mode = "login" | "register" | "forgot";

function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    GOOGLE_ERRORS[params.get("error") ?? ""] ?? null
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [providers, setProviders] = useState<{
    google: boolean;
    passwordReset: boolean;
  }>({ google: false, passwordReset: false });

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then(setProviders)
      .catch(() => {});
  }, []);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setNotice(null);
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);

    if (mode === "forgot") {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        setNotice(body.message ?? "Check your inbox for a reset link.");
      } else {
        setError(body.error ?? "Something went wrong. Try again.");
      }
      setBusy(false);
      return;
    }

    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push(next);
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong. Try again.");
      setBusy(false);
    }
  };

  const heading =
    mode === "login"
      ? "Welcome back"
      : mode === "register"
        ? "Create your account"
        : "Reset your password";
  const subheading =
    mode === "login"
      ? "Sign in to your research workspace."
      : mode === "register"
        ? "Free, self-hosted, and private to you."
        : "Enter your email and we'll send you a reset link.";

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex bg-ink text-white flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-full bg-lime text-ink grid place-items-center text-sm font-bold">
            U
          </span>
          <span className="font-semibold tracking-tight text-xl">UXLab</span>
        </div>
        <div className="relative">
          <h1 className="font-semibold tracking-tight text-5xl leading-[1.05] max-w-md">
            Research that tells you <span className="text-lime">why.</span>
          </h1>
          <p className="text-white/55 mt-5 max-w-sm leading-relaxed">
            Card sorting, tree testing, first-click, surveys, prototype and
            usability testing — with the analysis to make sense of it all.
          </p>
          <div className="flex gap-3 mt-9">
            {[IconCards, IconTree, IconTarget].map((I, i) => (
              <span
                key={i}
                className="w-11 h-11 rounded-xl border border-white/15 grid place-items-center text-lime"
              >
                <I className="w-5 h-5" />
              </span>
            ))}
          </div>
        </div>
        <p className="relative font-mono text-[11px] uppercase tracking-[0.16em] text-white/35">
          Your studies stay yours — private by default
        </p>
      </div>

      {/* Form panel */}
      <div className="grid place-items-center p-8 bg-paper">
        <div className="w-full max-w-sm">
          <span className="w-11 h-11 rounded-xl bg-ink text-lime grid place-items-center mb-6">
            <IconLock className="w-5 h-5" />
          </span>
          <h2 className="h-display text-3xl mb-1.5">{heading}</h2>
          <p className="text-sm text-ink/50 mb-8">{subheading}</p>

          {/* Google sign-in (only if configured) */}
          {mode !== "forgot" && providers.google && (
            <>
              <a
                href={`/api/auth/google?next=${encodeURIComponent(next)}`}
                className="w-full flex items-center justify-center gap-3 rounded-full border border-ink/15 bg-white px-4 py-3 text-sm font-medium text-ink hover:border-ink/30 hover:shadow-sm transition-all"
              >
                <GoogleGlyph />
                Continue with Google
              </a>
              <div className="flex items-center gap-3 my-6">
                <span className="h-px flex-1 bg-ink/10" />
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/35">
                  or
                </span>
                <span className="h-px flex-1 bg-ink/10" />
              </div>
            </>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <label className="label flex items-center justify-between">
                  <span>
                    Password{" "}
                    {mode === "register" && (
                      <span className="text-ink/40 font-normal">
                        (min 8 characters)
                      </span>
                    )}
                  </span>
                  {mode === "login" && providers.passwordReset && (
                    <button
                      type="button"
                      className="font-normal normal-case tracking-normal text-ink/50 hover:text-ink underline underline-offset-2"
                      onClick={() => switchMode("forgot")}
                    >
                      Forgot?
                    </button>
                  )}
                </label>
                <input
                  className="input"
                  type="password"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {notice && <p className="text-sm text-emerald-700">{notice}</p>}
            <button
              className="btn-primary w-full"
              onClick={submit}
              disabled={busy}
            >
              {busy
                ? "One moment…"
                : mode === "login"
                  ? "Sign in"
                  : mode === "register"
                    ? "Create account"
                    : "Send reset link"}
            </button>
          </div>

          {mode === "forgot" ? (
            <p className="text-sm text-ink/50 mt-7">
              Remembered it?{" "}
              <button
                className="text-ink font-medium underline underline-offset-4 decoration-lime decoration-2"
                onClick={() => switchMode("login")}
              >
                Back to sign in
              </button>
            </p>
          ) : (
            <p className="text-sm text-ink/50 mt-7">
              {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
              <button
                className="text-ink font-medium underline underline-offset-4 decoration-lime decoration-2"
                onClick={() => switchMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? "Create one" : "Sign in"}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
