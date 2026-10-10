"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { AppShell, Notice } from "@/components/AppShell";
import { useWallet } from "@/hooks/useWallet";
import { DAILY_CAP_OPTIONS } from "@/lib/constants";

export default function SettingsPage() {
  const { wallet, setDailyCap } = useWallet();

  return (
    <AppShell
      eyebrow="Adulto"
      title="Ajustes locales"
      subtitle="Configura el límite diario de recompensas."
      backHref="/"
    >
      <div className="space-y-4">
        <Notice>
          Esto no impide que un niño cambie los ajustes ni controla otras
          aplicaciones. El tope limita nuevas acreditaciones del día.
        </Notice>

        <section className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-black">Tope diario adicional</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Minutos virtuales máximos que se pueden ganar por día.
          </p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {DAILY_CAP_OPTIONS.map((option) => {
              const selected = wallet.dailyBonusCapMinutes === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setDailyCap(option)}
                  className={`relative min-h-12 rounded-2xl border text-sm font-black ${
                    selected
                      ? "border-emerald-500 bg-emerald-50 text-emerald-950"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {selected ? (
                    <Check
                      aria-hidden
                      size={14}
                      className="absolute right-1 top-1 text-emerald-700"
                    />
                  ) : null}
                  {option}
                </button>
              );
            })}
          </div>
        </section>

        <Link
          href="/"
          className="flex min-h-14 items-center justify-center rounded-2xl bg-slate-950 px-5 py-4 text-base font-black text-white"
        >
          Guardar y volver
        </Link>
      </div>
    </AppShell>
  );
}
