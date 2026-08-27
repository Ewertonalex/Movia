import { cn } from "@/lib/utils";

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;

type Joint = { x: number; y: number; key: string; label: string; size?: number };

const JOINTS: Joint[] = [
  { key: "head", x: 54, y: 13, label: "Cabeça", size: 30 },
  { key: "shoulder", x: 50, y: 26, label: "Ombro" },
  { key: "elbow", x: 63, y: 38, label: "Cotovelo" },
  { key: "wrist", x: 71, y: 49, label: "Punho", size: 12 },
  { key: "hip", x: 44, y: 50, label: "Quadril" },
  { key: "knee", x: 57, y: 69, label: "Joelho", size: 20 },
  { key: "ankle", x: 42, y: 89, label: "Tornozelo" },
];

const BONES: [string, string][] = [
  ["head", "shoulder"],
  ["shoulder", "elbow"],
  ["elbow", "wrist"],
  ["shoulder", "hip"],
  ["hip", "knee"],
  ["knee", "ankle"],
];

function jointByKey(key: string): Joint {
  const joint = JOINTS.find((item) => item.key === key);
  if (!joint) throw new Error(`Articulação desconhecida: ${key}`);
  return joint;
}

function boneStyle(fromKey: string, toKey: string) {
  const from = jointByKey(fromKey);
  const to = jointByKey(toKey);
  const dx = ((to.x - from.x) / 100) * CANVAS_WIDTH;
  const dy = ((to.y - from.y) / 100) * CANVAS_HEIGHT;
  const lengthPx = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return {
    left: `${from.x}%`,
    top: `${from.y}%`,
    width: `${(lengthPx / CANVAS_WIDTH) * 100}%`,
    transform: `rotate(${angle.toFixed(2)}deg)`,
  };
}

/** Figura corporal abstrata desenhada apenas com CSS, sem foto de banco de imagens. */
export function BodyFigure({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[4/5] w-full overflow-hidden rounded-[26px] border border-line bg-gradient-to-br from-[#EEF6EE] via-surface to-[#E7F6EC]",
        className,
      )}
      aria-hidden="true"
    >
      <div className="movia-lines absolute inset-0 opacity-70" />
      <div className="absolute -top-16 -right-14 size-56 rounded-full bg-vivid/15 blur-2xl" />
      <div className="absolute -bottom-20 -left-12 size-56 rounded-full bg-lime/25 blur-2xl" />

      <div className="absolute inset-0 overflow-hidden">
        {[
          { top: "30%", width: "34%", delay: "0s" },
          { top: "52%", width: "26%", delay: "1.1s" },
          { top: "76%", width: "30%", delay: "2.2s" },
        ].map((line) => (
          <span
            key={line.top}
            style={{
              top: line.top,
              width: line.width,
              animation: `movia-stride 5.5s ${line.delay} ease-in-out infinite`,
            }}
            className="absolute left-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-vivid/55 to-transparent"
          />
        ))}
      </div>

      <div className="absolute inset-0">
        {BONES.map(([from, to]) => (
          <span
            key={`${from}-${to}`}
            style={boneStyle(from, to)}
            className="absolute h-[3px] origin-left rounded-full bg-gradient-to-r from-night/85 to-deep/70"
          />
        ))}

        {JOINTS.map((joint) => (
          <span
            key={joint.key}
            style={{
              left: `${joint.x}%`,
              top: `${joint.y}%`,
              width: joint.size ?? 16,
              height: joint.size ?? 16,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-vivid shadow-[0_0_0_4px_rgba(56,209,120,0.18)]"
          />
        ))}
      </div>

      <div className="absolute top-[62%] left-[64%] rounded-xl border border-line bg-surface/95 px-3 py-2 shadow-[0_10px_24px_-16px_rgba(23,35,29,0.5)]">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
          Joelho
        </p>
        <p className="text-lg leading-none font-[830] tracking-tight text-ink">
          96°
        </p>
      </div>

      <div className="absolute bottom-4 left-4 rounded-full border border-line bg-surface/95 px-3 py-1.5">
        <p className="text-[11px] font-semibold text-muted">
          Repetição 3 · descida
        </p>
      </div>
    </div>
  );
}
