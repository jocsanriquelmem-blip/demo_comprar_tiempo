type Landmark = {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
};

export type PushupPhase = "searching" | "up" | "down" | "cooldown";

export type PushupResult = {
  phase: PushupPhase;
  counted: boolean;
  reps: number;
  angle?: number;
  message: string;
};

type Side = "left" | "right";

const LANDMARKS = {
  left: { shoulder: 11, elbow: 13, wrist: 15 },
  right: { shoulder: 12, elbow: 14, wrist: 16 },
} as const;

const DOWN_ANGLE = 115;
const UP_ANGLE = 150;
const BODY_DROP_DOWN = 0.035;
const BODY_DROP_UP = 0.016;

export class PushupDetector {
  private reps = 0;
  private phase: PushupPhase = "searching";
  private downSince = 0;
  private upSince = 0;
  private lastCountedAt = 0;
  private upBodyY: number | undefined;

  update(landmarks: Landmark[] | undefined, now: number): PushupResult {
    const metrics = getPushupMetrics(landmarks);

    if (!metrics) {
      this.phase = "searching";
      this.downSince = 0;
      this.upSince = 0;
      this.upBodyY = undefined;
      return {
        phase: this.phase,
        counted: false,
        reps: this.reps,
        message: "Busca brazos y hombros",
      };
    }

    if (typeof this.upBodyY !== "number") {
      this.upBodyY = metrics.bodyY;
    }

    const bodyDrop = metrics.bodyY - this.upBodyY;
    const angleSaysDown = typeof metrics.angle === "number" && metrics.angle < DOWN_ANGLE;
    const angleSaysUp = typeof metrics.angle === "number" && metrics.angle > UP_ANGLE;
    const bodySaysDown = bodyDrop > BODY_DROP_DOWN;
    const bodySaysUp = bodyDrop < BODY_DROP_UP;
    const isDown = angleSaysDown || bodySaysDown;
    const isUp = angleSaysUp || bodySaysUp;
    let counted = false;

    if (this.phase === "searching" && isUp) {
      this.phase = "up";
      this.upSince = now;
      this.upBodyY = Math.min(this.upBodyY, metrics.bodyY);
    }

    if (this.phase === "up" && isDown) {
      this.downSince = this.downSince || now;
      if (now - this.downSince > 150) {
        this.phase = "down";
        this.upSince = 0;
      }
    } else if (this.phase === "up" && !isDown) {
      this.downSince = 0;
      if (isUp) {
        this.upBodyY = Math.min(this.upBodyY, metrics.bodyY);
      }
    }

    if (this.phase === "down" && isUp) {
      this.upSince = this.upSince || now;
      if (now - this.upSince > 150 && now - this.lastCountedAt > 450) {
        this.reps += 1;
        counted = true;
        this.lastCountedAt = now;
        this.phase = "cooldown";
        this.upBodyY = metrics.bodyY;
      }
    } else if (this.phase === "down" && !isUp) {
      this.upSince = 0;
    }

    if (this.phase === "cooldown" && now - this.lastCountedAt > 450) {
      this.phase = isUp ? "up" : "searching";
    }

    return {
      phase: this.phase,
      counted,
      reps: this.reps,
      angle: metrics.angle,
      message: counted
        ? "Flexión válida"
        : this.phase === "down"
          ? "Empuja arriba"
          : this.phase === "up"
            ? "Baja con control"
            : "Listo",
    };
  }

  reset() {
    this.reps = 0;
    this.phase = "searching";
    this.downSince = 0;
    this.upSince = 0;
    this.lastCountedAt = 0;
    this.upBodyY = undefined;
  }
}

function getPushupMetrics(landmarks: Landmark[] | undefined) {
  if (!landmarks?.length) return undefined;

  const sideAngles = (["left", "right"] as Side[])
    .map((side) => getSideAngle(landmarks, side))
    .filter((value): value is number => typeof value === "number");
  const bodyY = getUpperBodyY(landmarks);

  if (!sideAngles.length && typeof bodyY !== "number") return undefined;

  return {
    angle: sideAngles.length
      ? sideAngles.reduce((sum, value) => sum + value, 0) / sideAngles.length
      : undefined,
    bodyY: bodyY ?? getShoulderY(landmarks) ?? 0,
  };
}

function getSideAngle(landmarks: Landmark[], side: Side) {
  const indexes = LANDMARKS[side];
  const shoulder = landmarks[indexes.shoulder];
  const elbow = landmarks[indexes.elbow];
  const wrist = landmarks[indexes.wrist];

  if (!isVisible(shoulder) || !isVisible(elbow) || !isVisible(wrist)) {
    return undefined;
  }

  const a = { x: shoulder.x - elbow.x, y: shoulder.y - elbow.y };
  const b = { x: wrist.x - elbow.x, y: wrist.y - elbow.y };
  const dot = a.x * b.x + a.y * b.y;
  const normA = Math.hypot(a.x, a.y);
  const normB = Math.hypot(b.x, b.y);

  if (!normA || !normB) return undefined;

  const cosine = Math.max(-1, Math.min(1, dot / (normA * normB)));
  return (Math.acos(cosine) * 180) / Math.PI;
}

function getUpperBodyY(landmarks: Landmark[]) {
  const points = [0, 11, 12, 13, 14]
    .map((index) => landmarks[index])
    .filter(isVisible);

  if (points.length < 2) return undefined;

  return points.reduce((sum, point) => sum + point.y, 0) / points.length;
}

function getShoulderY(landmarks: Landmark[]) {
  const shoulders = [landmarks[11], landmarks[12]].filter(isVisible);

  if (!shoulders.length) return undefined;

  return shoulders.reduce((sum, point) => sum + point.y, 0) / shoulders.length;
}

function isVisible(point: Landmark | undefined): point is Landmark {
  return Boolean(point && (point.visibility ?? 1) > 0.3);
}
