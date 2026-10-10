"use client";

import { ActivityCard } from "@/components/ActivityCard";
import { AppShell, Notice } from "@/components/AppShell";
import { useWallet } from "@/hooks/useWallet";
import { EXERCISES } from "@/lib/exercises";

export default function ActivitiesPage() {
  const { stats } = useWallet();
  const reachedCap = stats.availableReward <= 0;

  return (
    <AppShell
      eyebrow="Actividades"
      title="Elige un desafío"
      subtitle="Elige tu movimiento y gana minutos."
      backHref="/"
    >
      <div className="space-y-4">
        {reachedCap ? (
          <Notice>
            Ya alcanzaste el límite diario de minutos virtuales adicionales.
            Puedes volver mañana o cambiar el tope en ajustes.
          </Notice>
        ) : (
          <Notice>
            Recompensa prevista: hasta +{stats.availableReward} minutos virtuales
            al completar el desafío.
          </Notice>
        )}

        <div className="grid gap-3">
          {EXERCISES.map((exercise) => {
            const Icon = exercise.icon;
            return (
              <ActivityCard
                key={exercise.slug}
                title={exercise.title}
                subtitle={
                  reachedCap
                    ? "Límite diario alcanzado"
                    : `${exercise.subtitle} · ${exercise.reps === 1 ? "1 reto" : `${exercise.reps} reps`}`
                }
                icon={<Icon aria-hidden size={26} />}
                href={`/actividad/${exercise.slug}`}
                disabled={reachedCap}
              />
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
