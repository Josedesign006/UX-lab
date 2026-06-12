"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconLogout, IconPlus } from "@/components/icons";

export default function Shell({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => setEmail(d.user?.email ?? null))
      .catch(() => {});
  }, [pathname]);

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen">
      <header className="bg-paper/85 backdrop-blur border-b border-ink/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-8 h-8 rounded-full bg-ink text-lime grid place-items-center text-sm font-bold group-hover:rotate-12 transition-transform">
              U
            </span>
            <span className="font-semibold tracking-tight text-ink text-lg">
              UXLab
            </span>
          </Link>
          <nav className="flex items-center gap-5">
            <Link
              href="/"
              className="font-mono text-xs uppercase tracking-[0.14em] text-ink/60 hover:text-ink transition-colors"
            >
              Studies
            </Link>
            <Link href="/studies/new" className="btn-primary !py-2">
              New study <IconPlus className="w-3.5 h-3.5 text-lime" strokeWidth={2.5} />
            </Link>
            {email && (
              <div className="flex items-center gap-2 pl-4 border-l border-ink/10">
                <span
                  className="w-8 h-8 rounded-full bg-lime text-ink grid place-items-center text-xs font-bold uppercase"
                  title={email}
                >
                  {email[0]}
                </span>
                <button
                  onClick={signOut}
                  title={`Sign out (${email})`}
                  className="text-ink/40 hover:text-ink transition-colors"
                >
                  <IconLogout className="w-[18px] h-[18px]" />
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">{children}</main>
      <footer className="max-w-6xl mx-auto px-6 pb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/30">
          UXLab — card sorting · tree testing · first-click · surveys ·
          prototypes · usability
        </p>
      </footer>
    </div>
  );
}
