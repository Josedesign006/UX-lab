/**
 * 2D cluster map (classical MDS / principal coordinates) — cards frequently
 * grouped together sit close to each other.
 */
export default function ClusterMap({
  points,
  labels,
}: {
  points: { x: number; y: number }[];
  labels: string[];
}) {
  const W = 640;
  const H = 420;
  const PAD = 56;
  const px = (x: number) => PAD + x * (W - PAD * 2);
  const py = (y: number) => PAD + y * (H - PAD * 2);

  return (
    <svg width={W} height={H} className="max-w-full" viewBox={`0 0 ${W} ${H}`}>
      <rect width={W} height={H} rx={16} fill="#101010" fillOpacity={0.03} />
      {[0.25, 0.5, 0.75].map((g) => (
        <g key={g} stroke="#101010" strokeOpacity={0.06}>
          <line x1={px(g)} y1={PAD / 2} x2={px(g)} y2={H - PAD / 2} />
          <line x1={PAD / 2} y1={py(g)} x2={W - PAD / 2} y2={py(g)} />
        </g>
      ))}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={px(p.x)} cy={py(p.y)} r={6} fill="#D7F542" stroke="#101010" strokeWidth={1.5} />
          <text
            x={px(p.x)}
            y={py(p.y) - 11}
            fontSize={11}
            fill="#101010"
            textAnchor="middle"
            fontWeight={500}
          >
            {labels[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}
