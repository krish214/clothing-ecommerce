import { SIZE_GUIDE } from "@/lib/catalog";

/** Native <details>, so it opens without JavaScript. */
export default function SizeGuide({ bottoms }: { bottoms: boolean }) {
  const g = bottoms ? SIZE_GUIDE.bottoms : SIZE_GUIDE.tops;
  return (
    <details className="sg">
      <summary>Size guide</summary>
      <div className="sg-table">
        <table>
          <caption>{g.note}</caption>
          <thead>
            <tr>{g.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
          </thead>
          <tbody>
            {g.rows.map((r) => (
              <tr key={String(r[0])}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
