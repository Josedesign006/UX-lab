/** Heat-colored half-matrix of card pairing similarity (0..100). */
export default function SimilarityMatrix({
  matrix,
  labels,
  order,
}: {
  matrix: number[][];
  labels: string[];
  order: number[]; // leaf order from dendrogram
}) {
  const cell = (v: number) => {
    // paper -> ink heat scale
    const alpha = v / 100;
    return {
      backgroundColor: `rgba(16, 16, 16, ${alpha * 0.92})`,
      color: alpha > 0.5 ? "#D7F542" : "#101010",
    };
  };

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-[11px]">
        <tbody>
          {order.map((ri, rowIdx) => (
            <tr key={ri}>
              <th className="text-right pr-2 font-normal text-ink/60 whitespace-nowrap max-w-52 truncate">
                {labels[ri]}
              </th>
              {order.slice(0, rowIdx + 1).map((ci) => (
                <td
                  key={ci}
                  className="w-8 h-8 text-center border border-white tabular-nums"
                  style={cell(matrix[ri][ci])}
                  title={`${labels[ri]} + ${labels[ci]}: ${matrix[ri][ci]}%`}
                >
                  {ri === ci ? "" : matrix[ri][ci]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-ink/40 mt-2">
        % of participants who grouped each pair of cards together. Darker = more
        often paired.
      </p>
    </div>
  );
}
