import { DendroNode } from "@/lib/analysis";

/**
 * SVG dendrogram. X axis = agreement/similarity % — 100% at the left edge
 * (leaves), 0% at the right (root). Clusters merging near the left are strong.
 */
export default function Dendrogram({
  root,
  labels,
  threshold,
}: {
  root: DendroNode;
  labels: string[];
  /** optional highlight: clusters above this % get emphasized */
  threshold?: number;
}) {
  const leafCount = root.leaves.length;
  const rowH = 28;
  const labelW = 210;
  const plotW = 480;
  const width = labelW + plotW + 56;
  const height = leafCount * rowH + 36;

  const sx = (sim: number) => labelW + ((100 - sim) / 100) * plotW;

  let leafIdx = 0;
  const pos = new Map<DendroNode, { x: number; y: number }>();
  const assign = (n: DendroNode): { x: number; y: number } => {
    if (n.cardIndex !== null) {
      const y = leafIdx * rowH + rowH / 2 + 24;
      leafIdx++;
      const p = { x: labelW, y };
      pos.set(n, p);
      return p;
    }
    const childPos = n.children.map(assign);
    const y = (childPos[0].y + childPos[childPos.length - 1].y) / 2;
    const p = { x: sx(n.height), y };
    pos.set(n, p);
    return p;
  };
  assign(root);

  const strong = threshold ?? 60;
  const lines: React.ReactNode[] = [];
  const dots: React.ReactNode[] = [];
  let k = 0;
  const draw = (n: DendroNode) => {
    if (n.cardIndex !== null) return;
    const p = pos.get(n)!;
    const isStrong = n.height >= strong;
    for (const c of n.children) {
      const cp = pos.get(c)!;
      lines.push(
        <polyline
          key={k++}
          points={`${cp.x},${cp.y} ${p.x},${cp.y} ${p.x},${p.y}`}
          fill="none"
          stroke={isStrong ? "#101010" : "#9b9b93"}
          strokeWidth={isStrong ? 2 : 1.25}
        />
      );
      draw(c);
    }
    dots.push(
      <g key={`d${k++}`}>
        <circle cx={p.x} cy={p.y} r={3.5} fill={isStrong ? "#101010" : "#9b9b93"} />
        <text
          x={p.x + 5}
          y={p.y - 5}
          fontSize={9}
          fill={isStrong ? "#101010" : "#9b9b93"}
          fontFamily="var(--font-geist-mono)"
        >
          {Math.round(n.height)}%
        </text>
      </g>
    );
  };
  draw(root);

  const order: number[] = [];
  const walk = (n: DendroNode) => {
    if (n.cardIndex !== null) order.push(n.cardIndex);
    n.children.forEach(walk);
  };
  walk(root);

  return (
    <svg width={width} height={height} className="max-w-full">
      {[100, 80, 60, 40, 20, 0].map((s) => (
        <g key={s}>
          <line
            x1={sx(s)}
            y1={18}
            x2={sx(s)}
            y2={height - 10}
            stroke="#101010"
            strokeOpacity={0.08}
            strokeDasharray="3 4"
          />
          <text
            x={sx(s)}
            y={12}
            fontSize={9}
            fill="#101010"
            fillOpacity={0.4}
            textAnchor="middle"
            fontFamily="var(--font-geist-mono)"
          >
            {s}%
          </text>
        </g>
      ))}
      {lines}
      {dots}
      {order.map((cardIdx, i) => (
        <text
          key={cardIdx}
          x={labelW - 10}
          y={i * rowH + rowH / 2 + 28}
          fontSize={12}
          fill="#101010"
          textAnchor="end"
        >
          {labels[cardIdx]}
        </text>
      ))}
    </svg>
  );
}
