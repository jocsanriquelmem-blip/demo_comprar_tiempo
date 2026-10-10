"use client";

import Link from "next/link";
import { Clock, Settings, Trash2 } from "lucide-react";
import { AppShell, Notice } from "@/components/AppShell";
import { WalletCard } from "@/components/WalletCard";
import { useWallet } from "@/hooks/useWallet";
import { getExerciseLabel } from "@/lib/exercises";
import { formatDateTime } from "@/lib/wallet";

export default function Home() {
  const { wallet, isLoaded, isPersistent, stats, resetProgress } = useWallet();

  const handleReset = () => {
    if (window.confirm("¿Reiniciar el progreso y borrar el historial local?")) {
      resetProgress();
    }
  };

  return (
    <AppShell
      eyebrow="Tu billetera"
      title="Tiempo Activo"
      subtitle="Muévete y gana minutos"
    >
      <div className="flex flex-1 flex-col gap-4">
        <WalletCard wallet={wallet} earnedToday={stats.earnedToday} />

        {!isPersistent ? (
          <Notice>
            El navegador no permitió guardar datos. El progreso se mantendrá solo
            durante esta sesión.
          </Notice>
        ) : null}

        <Link
          href="/actividades"
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-base font-black text-white shadow-sm"
        >
          <Clock aria-hidden size={20} />
          Ganar más tiempo
        </Link>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Desafíos hoy</p>
            <p className="mt-1 text-3xl font-black">{stats.completedToday}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Disponible hoy</p>
            <p className="mt-1 text-3xl font-black">{stats.availableReward} min</p>
          </div>
        </section>

        <Notice>
          El movimiento se comprueba con cámara; las recompensas son claras,
          virtuales y limitadas.
        </Notice>

        <section className="rounded-[24px] border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">Historial local</h2>
            <span className="text-xs font-bold text-slate-500">
              {wallet.history.length} registros
            </span>
          </div>
          {isLoaded && wallet.history.length ? (
            <div className="space-y-3">
              {wallet.history.slice(0, 6).map((item) => (
                <article
                  key={item.challengeId}
                  className="rounded-2xl bg-slate-50 p-3 text-sm"
                >
                  <div className="flex justify-between gap-3 font-bold">
                    <span>
                      {getExerciseLabel(item.exercise)} ·{" "}
                      {item.reps === 1 ? "reto" : `${item.reps} reps`}
                    </span>
                    <span>+{item.minutesAwarded} min</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {formatDateTime(item.completedAt)} ·{" "}
                    {item.mode === "camera"
                      ? "detectado por cámara"
                      : "registrado sin cámara"}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Todavía no hay desafíos completados.
            </p>
          )}
        </section>

        <div className="grid grid-cols-2 gap-3 pb-4">
          <Link
            href="/ajustes"
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black"
          >
            <Settings aria-hidden size={18} />
            Ajustes
          </Link>
          <button
            type="button"
            onClick={handleReset}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-black text-rose-950"
          >
            <Trash2 aria-hidden size={18} />
            Reiniciar
          </button>
        </div>
      </div>
    </AppShell>
  );
}
