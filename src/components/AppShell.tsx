import Link from "next/link";
import type { ReactNode } from "react";

export function AppShell({
  children,
  eyebrow,
  title,
  subtitle,
  backHref,
}: {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  backHref?: string;
}) {
  return (
    <main className="min-h-dvh bg-[#f6fbf8] text-slate-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-[max(1.25rem,env(safe-area-inset-left))] pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            {eyebrow ? (
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-3xl font-black leading-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
            ) : null}
          </div>
          {backHref ? (
            <Link
              href={backHref}
              className="flex min-h-12 shrink-0 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm"
            >
              Volver
            </Link>
          ) : null}
        </header>
        {children}
      </div>
    </main>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-950">
      {children}
    </p>
  );
}
