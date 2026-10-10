type Landmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

export type SquatPhase = "searching" | "standing" | "down" | "cooldown";

export type SquatResult = {
  phase: SquatPhase;
  counted: boolean;
  reps: number;
  angle?: number;
  message: string;
};

type Side = "left" | "right";

const LANDMARKS = {
  left: { hip: 23, knee: 25, ankle: 27 },
  right: { hip: 24, knee: 26, ankle: 28 },
} as const;

export class SquatDetector {
  private reps = 0;
  private phase: SquatPhase = "searching";
  private downSince = 0;
  private standingSince = 0;
  private lastCountedAt = 0;

  update(landmarks: Landmark[] | undefined, now: number): SquatResult {
    const angle = getBestKneeAngle(landmarks);

    if (!angle) {
      this.phase = "searching";
      this.downSince = 0;
      this.standingSince = 0;
      return {
        phase: this.phase,
        counted: false,
        reps: this.reps,
        message: "Buscando cuerpo completo",
      };
    }

    const isStanding = angle > 155;
    const isDown = angle < 105;
    let counted = false;

    if (this.phase === "searching" && isStanding) {
      this.phase = "standing";
      this.standingSince = now;
    }

    if (this.phase === "standing" && isDown) {
      this.downSince = this.downSince || now;
      if (now - this.downSince > 180) {
        this.phase = "down";
        this.standingSince = 0;
      }
    } else if (this.phase === "standing" && !isDown) {
      this.downSince = 0;
    }

    if (this.phase === "down" && isStanding) {
      this.standingSince = this.standingSince || now;
      if (now - this.standingSince > 180 && now - this.lastCountedAt > 500) {
        this.reps += 1;
        counted = true;
        this.lastCountedAt = now;
        this.phase = "cooldown";
      }
    } else if (this.phase === "down" && !isStanding) {
      this.standingSince = 0;
    }

    if (this.phase === "cooldown" && now - this.lastCountedAt > 500) {
      this.phase = isStanding ? "standing" : "searching";
    }

    return {
      phase: this.phase,
      counted,
      reps: this.reps,
      angle,
      message: counted
        ? "Repetición válida"
        : this.phase === "down"
          ? "Sube con control"
          : this.phase === "standing"
            ? "Baja cuando estés listo"
            : "Listo",
    };
  }

  getReps() {
    return this.reps;
  }

  reset() {
    this.reps = 0;
    this.phase = "searching";
    this.downSince = 0;
    this.standingSince = 0;
    this.lastCountedAt = 0;
  }
}

function getBestKneeAngle(landmarks: Landmark[] | undefined) {
  if (!landmarks?.length) return undefined;

  const angles = (["left", "right"] as Side[])
    .map((side) => getSideAngle(landmarks, side))
    .filter((value): value is number => typeof value === "number");

  if (!angles.length) return undefined;

  return angles.reduce((sum, value) => sum + value, 0) / angles.length;
}

function getSideAngle(landmarks: Landmark[], side: Side) {
  const indexes = LANDMARKS[side];
  const hip = landmarks[indexes.hip];
  const knee = landmarks[indexes.knee];
  const ankle = landmarks[indexes.ankle];

  if (!isVisible(hip) || !isVisible(knee) || !isVisible(ankle)) return undefined;

  const a = { x: hip.x - knee.x, y: hip.y - knee.y };
  const b = { x: ankle.x - knee.x, y: ankle.y - knee.y };
  const dot = a.x * b.x + a.y * b.y;
  const normA = Math.hypot(a.x, a.y);
  const normB = Math.hypot(b.x, b.y);

  if (!normA || !normB) return undefined;

  const cosine = Math.max(-1, Math.min(1, dot / (normA * normB)));
  return (Math.acos(cosine) * 180) / Math.PI;
}

function isVisible(point: Landmark | undefined) {
  return Boolean(point && (point.visibility ?? 1) > 0.55);
}
