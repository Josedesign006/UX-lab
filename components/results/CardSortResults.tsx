import DendrogramView from "@/components/charts/DendrogramView";
import ClusterMap from "@/components/charts/ClusterMap";
import SimilarityMatrix from "@/components/charts/SimilarityMatrix";
import { Stat } from "@/components/charts/Bars";
import {
  buildDendrogram,
  buildDendrogramAAM,
  cardStats,
  categorySummaries,
  dendroLeafOrder,
  fmtMs,
  mdsProjection,
  mean,
  median,
  placementMatrix,
  similarityMatrix,
} from "@/lib/analysis";
import { CardSortConfig, CardSortResult, StudyResponse } from "@/lib/types";

export default function CardSortResults({
  config,
  responses,
}: {
  config: CardSortConfig;
  responses: StudyResponse[];
}) {
  const results = responses.map((r) => r.data as CardSortResult);
  const cardIds = config.cards.map((c) => c.id);
  const labels = config.cards.map((c) => c.label);
  const cardLabel = new Map(config.cards.map((c) => [c.id, c.label]));

  const matrix = similarityMatrix(cardIds, results);
  const dendro = buildDendrogram(matrix);
  const dendroAAM = buildDendrogramAAM(cardIds, results);
  const order = dendroLeafOrder(dendro);
  const cats = categorySummaries(results);
  const points = mdsProjection(matrix);
  const perCard = cardStats(cardIds, results);

  if (responses.length === 0) {
    return <p className="text-ink/50 text-sm">No responses yet — share the participant link to start collecting data.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Participants" value={String(responses.length)} />
        <Stat
          label="Median time"
          value={fmtMs(median(responses.map((r) => r.durationMs)))}
        />
        <Stat
          label="Avg groups created"
          value={mean(results.map((r) => r.groups.length)).toFixed(1)}
        />
      </div>

      {results.length >= 2 && dendro && dendroAAM && (
        <section className="card p-6">
          <h2 className="font-semibold tracking-tight text-lg text-ink mb-1">
            Dendrograms
          </h2>
          <p className="text-sm text-ink/50 mb-4">
            Hierarchical clustering of cards. Clusters merging near the left
            edge (high %) are strong groupings. Switch between the two
            standard methods below.
          </p>
          <DendrogramView aam={dendroAAM} bmm={dendro} labels={labels} />
        </section>
      )}

      {results.length >= 2 && points.length > 1 && (
        <section className="card p-6">
          <h2 className="font-semibold tracking-tight text-lg text-ink mb-1">
            2D cluster map
          </h2>
          <p className="text-sm text-ink/50 mb-4">
            Multidimensional scaling of the similarity matrix — cards that
            participants frequently grouped together appear close to each
            other. Spatial clusters suggest candidate categories.
          </p>
          <ClusterMap points={points} labels={labels} />
        </section>
      )}

      <section className="card p-5">
        <h2 className="font-semibold text-ink mb-1">Similarity matrix</h2>
        <p className="text-sm text-ink/50 mb-4">
          Rows/columns ordered by cluster, so strong groupings appear as dark
          blocks along the diagonal.
        </p>
        <SimilarityMatrix matrix={matrix} labels={labels} order={order} />
      </section>

      {config.sortType !== "closed" && cats.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold text-ink mb-1">
            Participant categories ({cats.length})
          </h2>
          <p className="text-sm text-ink/50 mb-4">
            Group names participants created (similar names merged,
            case-insensitive), with the cards most often placed in each.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink/50 border-b border-ink/10">
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Used by</th>
                  <th className="py-2">Top cards (times placed)</th>
                </tr>
              </thead>
              <tbody>
                {cats.map((c, i) => (
                  <tr key={i} className="border-b border-ink/5 align-top">
                    <td className="py-2 pr-4 font-medium text-ink">{c.label}</td>
                    <td className="py-2 pr-4 text-ink/60 whitespace-nowrap">
                      {c.uses} participant{c.uses === 1 ? "" : "s"}
                    </td>
                    <td className="py-2 text-ink/60">
                      {[...c.cardCounts.entries()]
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 8)
                        .map(([cid, n]) => `${cardLabel.get(cid) ?? "?"} (${n})`)
                        .join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card p-6">
        <h2 className="font-semibold tracking-tight text-lg text-ink mb-1">
          Cards analysis
        </h2>
        <p className="text-sm text-ink/50 mb-4">
          How consistently each card was placed. Cards spread across many
          categories are ambiguous — candidates for renaming or splitting.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink/50 border-b border-ink/10">
                <th className="py-2 pr-4">Card</th>
                <th className="py-2 pr-4"># categories</th>
                <th className="py-2 pr-4">Agreement</th>
                <th className="py-2">Most common placements</th>
              </tr>
            </thead>
            <tbody>
              {perCard
                .map((cs, i) => ({ cs, label: labels[i] }))
                .sort((a, b) => b.cs.categoriesUsed - a.cs.categoriesUsed)
                .map(({ cs, label }) => {
                  const agreement = cs.timesSorted
                    ? Math.round((100 * (cs.top[0]?.count ?? 0)) / cs.timesSorted)
                    : 0;
                  return (
                    <tr key={cs.cardId} className="border-b border-ink/5 align-top">
                      <td className="py-2 pr-4 font-medium text-ink whitespace-nowrap">
                        {label}
                      </td>
                      <td className="py-2 pr-4 font-mono tabular-nums text-ink/75">
                        {cs.categoriesUsed}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`font-mono tabular-nums text-xs font-semibold px-2 py-0.5 rounded-full ${
                            agreement >= 70
                              ? "bg-lime text-ink"
                              : agreement >= 40
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {agreement}%
                        </span>
                      </td>
                      <td className="py-2 text-ink/60">
                        {cs.top
                          .map((t) => `${t.label} (${t.count})`)
                          .join(", ") || "—"}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {config.sortType !== "open" && config.categories.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold text-ink mb-1">Placement matrix</h2>
          <p className="text-sm text-ink/50 mb-4">
            How often each card was placed in each of your predefined
            categories (% of participants).
          </p>
          <PlacementTable config={config} results={results} />
        </section>
      )}
    </div>
  );
}

function PlacementTable({
  config,
  results,
}: {
  config: CardSortConfig;
  results: CardSortResult[];
}) {
  const m = placementMatrix(config, results);
  const n = results.length || 1;
  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th />
            {config.categories.map((cat) => (
              <th
                key={cat.id}
                className="px-2 py-1 text-left font-medium text-ink/60 max-w-28"
              >
                {cat.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {config.cards.map((card) => {
            const row = m.get(card.id)!;
            const best = Math.max(0, ...config.categories.map((c) => row.get(c.id) ?? 0));
            return (
              <tr key={card.id}>
                <th className="text-right pr-2 py-0.5 font-normal text-ink/75 whitespace-nowrap">
                  {card.label}
                </th>
                {config.categories.map((cat) => {
                  const count = row.get(cat.id) ?? 0;
                  const pct = Math.round((100 * count) / n);
                  const isBest = count === best && count > 0;
                  return (
                    <td
                      key={cat.id}
                      className={`w-16 h-7 text-center border border-white tabular-nums ${
                        isBest ? "font-bold" : ""
                      }`}
                      style={{
                        backgroundColor: `rgba(16, 16, 16, ${(pct / 100) * 0.92})`,
                        color: pct > 50 ? "#D7F542" : "#101010",
                      }}
                    >
                      {pct > 0 ? `${pct}%` : ""}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
