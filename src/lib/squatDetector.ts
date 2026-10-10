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

type SquatMetrics = {
  angle?: number;
  bodyY: number;
  visibleSides: number;
  hasBodyMotion: boolean;
};

const LANDMARKS = {
  left: { hip: 23, knee: 25, ankle: 27 },
  right: { hip: 24, knee: 26, ankle: 28 },
} as const;

const MIN_VISIBLE_SIDE_COUNT = 1;
const DOWN_ANGLE = 125;
const STANDING_ANGLE = 145;
const BODY_DROP_DOWN = 0.035;
const BODY_DROP_STANDING = 0.016;

export class SquatDetector {
  private reps = 0;
  private phase: SquatPhase = "searching";
  private downSince = 0;
  private standingSince = 0;
  private lastCountedAt = 0;
  private standingBodyY: number | undefined;

  update(landmarks: Landmark[] | undefined, now: number): SquatResult {
    const metrics = getSquatMetrics(landmarks);

    if (
      !metrics ||
      (metrics.visibleSides < MIN_VISIBLE_SIDE_COUNT && !metrics.hasBodyMotion)
    ) {
      this.phase = "searching";
      this.downSince = 0;
      this.standingSince = 0;
      this.standingBodyY = undefined;
      return {
        phase: this.phase,
        counted: false,
        reps: this.reps,
        message: "Buscando cuerpo completo",
      };
    }

    if (typeof this.standingBodyY !== "number") {
      this.standingBodyY = metrics.bodyY;
    }

    const bodyDrop = metrics.bodyY - this.standingBodyY;
    const angleSaysDown = typeof metrics.angle === "number" && metrics.angle < DOWN_ANGLE;
    const angleSaysStanding =
      typeof metrics.angle === "number" && metrics.angle > STANDING_ANGLE;
    const bodySaysDown = bodyDrop > BODY_DROP_DOWN;
    const bodySaysStanding = bodyDrop < BODY_DROP_STANDING;
    const isDown = angleSaysDown || bodySaysDown;
    const isStanding = angleSaysStanding || bodySaysStanding;
    let counted = false;

    if (this.phase === "searching" && isStanding) {
      this.phase = "standing";
      this.standingSince = now;
      this.standingBodyY = Math.min(this.standingBodyY, metrics.bodyY);
    }

    if (this.phase === "standing" && isDown) {
      this.downSince = this.downSince || now;
      if (now - this.downSince > 180) {
        this.phase = "down";
        this.standingSince = 0;
      }
    } else if (this.phase === "standing" && !isDown) {
      this.downSince = 0;
      if (isStanding) {
        this.standingBodyY = Math.min(this.standingBodyY, metrics.bodyY);
      }
    }

    if (this.phase === "down" && isStanding) {
      this.standingSince = this.standingSince || now;
      if (now - this.standingSince > 180 && now - this.lastCountedAt > 500) {
        this.reps += 1;
        counted = true;
        this.lastCountedAt = now;
        this.phase = "cooldown";
        this.standingBodyY = metrics.bodyY;
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
      angle: metrics.angle,
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
    this.standingBodyY = undefined;
  }
}

function getSquatMetrics(landmarks: Landmark[] | undefined): SquatMetrics | undefined {
  if (!landmarks?.length) return undefined;

  const visibleSides = (["left", "right"] as Side[])
    .map((side) => getSideMetrics(landmarks, side))
    .filter((value): value is { angle: number; bodyY: number } => Boolean(value));

  const bodyMotionY = getBodyMotionY(landmarks);

  if (!visibleSides.length && typeof bodyMotionY !== "number") return undefined;

  const angles = visibleSides.map((side) => side.angle);
  const legBodyY = visibleSides.length
    ? visibleSides.reduce((sum, side) => sum + side.bodyY, 0) / visibleSides.length
    : undefined;

  return {
    angle: angles.length
      ? angles.reduce((sum, value) => sum + value, 0) / angles.length
      : undefined,
    bodyY: legBodyY ?? bodyMotionY ?? 0,
    visibleSides: visibleSides.length,
    hasBodyMotion: typeof bodyMotionY === "number",
  };
}

function getSideMetrics(landmarks: Landmark[], side: Side) {
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
  return {
    angle: (Math.acos(cosine) * 180) / Math.PI,
    bodyY: hip.y,
  };
}

function isVisible(point: Landmark | undefined): point is Landmark {
  return Boolean(point && (point.visibility ?? 1) > 0.35);
}

function getBodyMotionY(landmarks: Landmark[]) {
  const visiblePoints = [0, 11, 12, 23, 24]
    .map((index) => landmarks[index])
    .filter(isVisible);
  const upperBodyPoints = [landmarks[0], landmarks[11], landmarks[12]].filter(
    isVisible,
  );

  if (visiblePoints.length < 2 || !upperBodyPoints.length) return undefined;

  return (
    visiblePoints.reduce((sum, point) => sum + point.y, 0) / visiblePoints.length
  );
}
