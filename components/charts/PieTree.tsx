import { TreeNode } from "@/lib/types";

/**
 * Pietree-style path visualization for one tree-test task: every node of the
 * IA drawn with traffic volume (circle size), landings, and correctness
 * coloring, so you can see at a glance where participants went.
 */
export default function PieTree({
  tree,
  visits,
  destinations,
  correctIds,
  total,
}: {
  tree: TreeNode[];
  visits: Map<string, number>;
  destinations: Map<string, number>;
  correctIds: string[];
  total: number;
}) {
  interface Row {
    node: TreeNode | null; // null = virtual start
    depth: number;
    parentRow: number | null;
  }
  const rows: Row[] = [{ node: null, depth: 0, parentRow: null }];
  const walk = (nodes: TreeNode[], depth: number, parentRow: number) => {
    for (const n of nodes) {
      rows.push({ node: n, depth, parentRow });
      walk(n.children, depth + 1, rows.length - 1);
    }
  };
  walk(tree, 1, 0);

  const rowH = 34;
  const indent = 30;
  const maxDepth = Math.max(...rows.map((r) => r.depth));
  const width = Math.max(560, maxDepth * indent + 380);
  const height = rows.length * rowH + 16;

  const cx = (r: Row) => 16 + r.depth * indent;
  const cy = (i: number) => i * rowH + rowH / 2 + 8;

  const radius = (v: number) =>
    v > 0 && total > 0 ? 5 + 9 * Math.sqrt(v / total) : 3.5;

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height}>
        {/* connectors */}
        {rows.map((r, i) => {
          if (r.parentRow === null) return null;
          const p = rows[r.parentRow];
          const x1 = cx(p);
          const y1 = cy(r.parentRow);
          const x2 = cx(r);
          const y2 = cy(i);
          const v = r.node ? (visits.get(r.node.id) ?? 0) : 0;
          return (
            <polyline
              key={`l${i}`}
              points={`${x1},${y1} ${x1},${y2} ${x2},${y2}`}
              fill="none"
              stroke="#101010"
              strokeOpacity={v > 0 ? 0.45 : 0.12}
              strokeWidth={v > 0 ? Math.max(1.5, (4 * v) / Math.max(total, 1)) : 1}
            />
          );
        })}
        {/* nodes */}
        {rows.map((r, i) => {
          const x = cx(r);
          const y = cy(i);
          if (!r.node) {
            return (
              <g key="start">
                <circle cx={x} cy={y} r={radius(total)} fill="#101010" />
                <text x={x + 16} y={y + 4} fontSize={12} fontWeight={600} fill="#101010">
                  Start
                </text>
                <text
                  x={x + 60}
                  y={y + 4}
                  fontSize={10}
                  fill="#101010"
                  fillOpacity={0.45}
                  fontFamily="var(--font-geist-mono)"
                >
                  {total} participant{total === 1 ? "" : "s"}
                </text>
              </g>
            );
          }
          const v = visits.get(r.node.id) ?? 0;
          const landed = destinations.get(r.node.id) ?? 0;
          const correct = correctIds.includes(r.node.id);
          const fill = correct
            ? "#16a34a"
            : landed > 0
              ? "#ef4444"
              : v > 0
                ? "#101010"
                : "#101010";
          const opacity = correct || landed > 0 ? 1 : v > 0 ? 0.55 : 0.12;
          return (
            <g key={r.node.id}>
              <circle cx={x} cy={y} r={radius(v)} fill={fill} fillOpacity={opacity} />
              {correct && (
                <circle
                  cx={x}
                  cy={y}
                  r={radius(v) + 3.5}
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth={1.5}
                  strokeDasharray="2 3"
                />
              )}
              <text
                x={x + radius(v) + 9}
                y={y + 4}
                fontSize={12}
                fill="#101010"
                fillOpacity={v > 0 || correct ? 1 : 0.4}
                fontWeight={correct || landed > 0 ? 600 : 400}
              >
                {r.node.label}
              </text>
              <text
                x={x + radius(v) + 9 + r.node.label.length * 6.6 + 10}
                y={y + 4}
                fontSize={10}
                fill="#101010"
                fillOpacity={0.45}
                fontFamily="var(--font-geist-mono)"
              >
                {v > 0 ? `${v} visited` : ""}
                {landed > 0 ? ` · ${landed} landed` : ""}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs text-ink/50">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" /> correct destination
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> wrong destination
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-ink/50 inline-block" /> visited (size = traffic)
        </span>
      </div>
    </div>
  );
}
