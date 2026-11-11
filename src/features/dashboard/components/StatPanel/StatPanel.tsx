import type { Stat } from "@/features/dashboard/models/Dashboard";
import type { AreaKey } from "@/models/Navigation";

// Màu các ô chỉ để phân biệt ô này với ô kia, ý nghĩa nằm ở nhãn và dòng ghi chú.
const CELL_COLORS: AreaKey[] = ["farm", "buy", "people", "org"];

/** Bảng số liệu: mỗi ô một con số lớn trên nền màu nhạt. */
function StatPanel({ stats }: { stats: Stat[] }) {
  if (stats.length === 0) return null;
  return (
    <section className="block">
      <h2 className="block__title">Số liệu chính</h2>
      <div className="stats">
        {stats.map((s, index) => (
          <div key={s.label} className="stats__cell" data-area={CELL_COLORS[index % CELL_COLORS.length]}>
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
