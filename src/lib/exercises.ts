import {
  Bot,
  Dumbbell,
  Flame,
  Footprints,
  Rocket,
  Shield,
  Sparkles,
  Star,
} from "lucide-react";

export const EXERCISES = [
  {
    slug: "sentadillas",
    title: "Sentadillas",
    shortTitle: "Sentadillas",
    subtitle: "Cámara activa · 10 reps",
    reps: 10,
    cueLabels: ["Pies firmes", "Baja suave", "Sube fuerte"],
    frames: [
      "/exercises/squat/frame-1.png",
      "/exercises/squat/frame-2.png",
      "/exercises/squat/frame-3.png",
      "/exercises/squat/frame-2.png",
    ],
    icon: Dumbbell,
    cameraEnabled: true,
  },
  {
    slug: "saltos-estrella",
    title: "Saltos estrella",
    shortTitle: "Estrellas",
    subtitle: "Abre brazos y piernas",
    reps: 12,
    cueLabels: ["Abre", "Cierra", "Respira"],
    frames: [
      "/exercises/star-jumps/frame-1.png",
      "/exercises/star-jumps/frame-2.png",
      "/exercises/star-jumps/frame-3.png",
      "/exercises/star-jumps/frame-2.png",
    ],
    icon: Star,
    cameraEnabled: false,
  },
  {
    slug: "salto-cohete",
    title: "Salto cohete",
    shortTitle: "Cohete",
    subtitle: "Carga energía y despega",
    reps: 8,
    cueLabels: ["Carga", "Despega", "Aterriza"],
    frames: [
      "/exercises/rocket-jumps/frame-1.png",
      "/exercises/rocket-jumps/frame-2.png",
      "/exercises/rocket-jumps/frame-3.png",
      "/exercises/rocket-jumps/frame-2.png",
    ],
    icon: Rocket,
    cameraEnabled: false,
  },
  {
    slug: "estatua-ninja",
    title: "Estatua ninja",
    shortTitle: "Ninja",
    subtitle: "Quédate firme unos segundos",
    reps: 1,
    cueLabels: ["Quieto", "Firme", "Foco"],
    frames: [
      "/exercises/ninja-statue/frame-1.png",
      "/exercises/ninja-statue/frame-2.png",
      "/exercises/ninja-statue/frame-3.png",
      "/exercises/ninja-statue/frame-2.png",
    ],
    icon: Shield,
    cameraEnabled: false,
  },
  {
    slug: "pasos-robot",
    title: "Pasos de robot",
    shortTitle: "Robot",
    subtitle: "Marcha con rodillas arriba",
    reps: 16,
    cueLabels: ["Paso", "Rodilla", "Ritmo"],
    frames: [
      "/exercises/robot-steps/frame-1.png",
      "/exercises/robot-steps/frame-2.png",
      "/exercises/robot-steps/frame-3.png",
      "/exercises/robot-steps/frame-2.png",
    ],
    icon: Bot,
    cameraEnabled: false,
  },
  {
    slug: "patadas-superheroe",
    title: "Patadas de superhéroe",
    shortTitle: "Patadas",
    subtitle: "Alterna lados con control",
    reps: 10,
    cueLabels: ["Lado", "Patea", "Vuelve"],
    frames: [
      "/exercises/superhero-kicks/frame-1.png",
      "/exercises/superhero-kicks/frame-2.png",
      "/exercises/superhero-kicks/frame-3.png",
      "/exercises/superhero-kicks/frame-2.png",
    ],
    icon: Flame,
    cameraEnabled: false,
  },
  {
    slug: "baile-relampago",
    title: "Baile relámpago",
    shortTitle: "Baile",
    subtitle: "Muévete rápido 20 segundos",
    reps: 1,
    cueLabels: ["Ritmo", "Libre", "Energía"],
    frames: [
      "/exercises/lightning-dance/frame-1.png",
      "/exercises/lightning-dance/frame-2.png",
      "/exercises/lightning-dance/frame-3.png",
      "/exercises/lightning-dance/frame-2.png",
    ],
    icon: Sparkles,
    cameraEnabled: false,
  },
  {
    slug: "equilibrio-flamenco",
    title: "Equilibrio flamenco",
    shortTitle: "Equilibrio",
    subtitle: "Mantén una pierna arriba",
    reps: 1,
    cueLabels: ["Mira", "Equilibra", "Sostén"],
    frames: [
      "/exercises/flamingo-balance/frame-1.png",
      "/exercises/flamingo-balance/frame-2.png",
      "/exercises/flamingo-balance/frame-3.png",
      "/exercises/flamingo-balance/frame-2.png",
    ],
    icon: Footprints,
    cameraEnabled: false,
  },
] as const;

export type ExerciseSlug = (typeof EXERCISES)[number]["slug"];
export type ExerciseDefinition = (typeof EXERCISES)[number];

export function getExercise(slug: string) {
  return EXERCISES.find((exercise) => exercise.slug === slug);
}

export function getExerciseLabel(slug: string) {
  return getExercise(slug)?.title ?? "Desafío";
}
