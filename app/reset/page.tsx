"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { IconLock } from "@/components/icons";

export default function ResetPage() {
  return (
    <Suspense>
      <Reset />
    </Suspense>
  );
}

function Reset() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-8 bg-paper">
      <div className="w-full max-w-sm">
        <span className="w-11 h-11 rounded-xl bg-ink text-lime grid place-items-center mb-6">
          <IconLock className="w-5 h-5" />
        </span>
        <h2 className="h-display text-3xl mb-1.5">Set a new password</h2>
        <p className="text-sm text-ink/50 mb-8">
          Choose a new password for your account.
        </p>

        {!token ? (
          <p className="text-sm text-red-600">
            This reset link is missing its token. Request a new one from the{" "}
            <Link href="/login" className="underline">
              login page
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="label">
                New password{" "}
                <span className="text-ink/40 font-normal">(min 8 characters)</span>
              </label>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              className="btn-primary w-full"
              onClick={submit}
              disabled={busy}
            >
              {busy ? "Saving…" : "Save new password"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
