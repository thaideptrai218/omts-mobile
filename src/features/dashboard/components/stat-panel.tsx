import type { Stat } from "@/shared/navigation/roles";

/** Bảng số liệu: mỗi ô một con số lớn, chia ô bằng đường kẻ thay vì nhiều thẻ rời. */
function StatPanel({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return null;
  return (
    <section className="block">
      <h2 className="block__title">Số liệu chính</h2>
      <div className="stats">
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
      </div>
    </section>
  );
}

export default StatPanel;
