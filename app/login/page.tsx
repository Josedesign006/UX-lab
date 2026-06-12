"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconCards,
  IconLock,
  IconTarget,
  IconTree,
} from "@/components/icons";

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}

function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push(params.get("next") || "/");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong. Try again.");
      setBusy(false);
    }
  };

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
          <h2 className="h-display text-3xl mb-1.5">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm text-ink/50 mb-8">
            {mode === "login"
              ? "Sign in to your research workspace."
              : "Free, self-hosted, and private to you."}
          </p>

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
            <div>
              <label className="label">
                Password{" "}
                {mode === "register" && (
                  <span className="text-ink/40 font-normal">(min 8 characters)</span>
                )}
              </label>
              <input
                className="input"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full" onClick={submit} disabled={busy}>
              {busy
                ? "One moment…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </div>

          <p className="text-sm text-ink/50 mt-7">
            {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
            <button
              className="text-ink font-medium underline underline-offset-4 decoration-lime decoration-2"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
              }}
            >
              {mode === "login" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
