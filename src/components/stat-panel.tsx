import type { Stat } from "@/data/roles";

/** Một bảng số liệu chung, chia ô bằng đường kẻ thay vì nhiều thẻ rời. */
function StatPanel({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return null;
  return (
    <section className="stats" aria-label="Số liệu chính">
      {stats.map((s) => (
        <div key={s.label} className="stats__cell">
          <p className="stats__label">{s.label}</p>
          <p className="stats__value">
            {s.value}
            {s.unit && <span className="stats__unit">{s.unit}</span>}
          </p>
          {s.note && <p className={`stats__note tone-${s.tone ?? "neutral"}`}>{s.note}</p>}
        </div>
      ))}
    </section>
  );
}

export default StatPanel;
