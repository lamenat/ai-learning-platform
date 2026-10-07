type Slice = {
  label: string;
  value: number;
  color: string;
};

export default function KnowledgeDonut({
  slices,
  size = 180,
  thickness = 28,
}: {
  slices: Slice[];
  size?: number;
  thickness?: number;
}) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center text-sm text-[var(--muted)]"
      >
        Нет данных
      </div>
    );
  }

  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Фон */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke="var(--border)"
        strokeWidth={thickness}
        opacity={0.3}
      />

      {/* Сегменты */}
      {slices.map((s, i) => {
        if (s.value === 0) return null;
        const percent = s.value / total;
        const dash = percent * circumference;
        const gap = circumference - dash;
        const strokeDasharray = `${dash} ${gap}`;
        const strokeDashoffset = -offset;
        offset += dash;

        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        );
      })}

      {/* Центр */}
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        className="fill-[var(--foreground)]"
        style={{ fontSize: 28, fontWeight: 700 }}
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        className="fill-[var(--muted)]"
        style={{ fontSize: 12 }}
      >
        тем
      </text>
    </svg>
  );
}