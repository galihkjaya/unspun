import type { TrendDirection } from "@/app/lib/types";

const COLOR: Record<TrendDirection, string> = {
  up: "var(--positive)",
  down: "var(--negative)",
  flat: "var(--text-secondary)",
};

const W = 80;
const H = 24;
const PAD = 2;

/**
 * Hand-rolled sparkline. Values are relative interest (0-100) but the line is
 * scaled to its own min/max so low-volume products still show shape.
 */
export default function Sparkline({
  data,
  direction,
  label,
}: {
  data: number[];
  direction: TrendDirection;
  label: string;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = (W - PAD * 2) / (data.length - 1);

  const points = data
    .map((value, i) => {
      const x = PAD + i * stepX;
      const y = PAD + (1 - (value - min) / span) * (H - PAD * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      role="img"
      aria-label={label}
      className="shrink-0 overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        stroke={COLOR[direction]}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
