import { notFound } from "next/navigation";
import { ActivityClient } from "@/app/actividad/[slug]/ActivityClient";
import { EXERCISES, getExercise } from "@/lib/exercises";

export function generateStaticParams() {
  return EXERCISES.filter((exercise) => exercise.slug !== "sentadillas").map(
    (exercise) => ({
      slug: exercise.slug,
    }),
  );
}

export default async function ActivityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const exercise = getExercise(slug);

  if (!exercise || exercise.slug === "sentadillas") {
    notFound();
  }

  return (
    <ActivityClient
      exercise={{
        slug: exercise.slug,
        title: exercise.title,
        reps: exercise.reps,
        frames: exercise.frames,
        cueLabels: exercise.cueLabels,
      }}
    />
  );
}
