import type { WaterChartPeriod, WaterIndicatorStats, WaterRange, WaterThresholds } from "@/features/farming/models/WaterMeasurement";
import type { MouseEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Select } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { useLoad } from "@/hooks/useLoad";
import { waterChart } from "@/features/farming/services/farmService";
import { num } from "@/utils/format";

import "./WaterChart.scss";

const RANGES: [WaterRange, string][] = [
  ["days", "30 ngày"],
  ["months", "12 tháng"],
];

/** Bề rộng dùng tạm khi chưa đo được khung, và cỡ chữ trục so với cỡ chữ gốc (đúng `.water-chart__tick`). */
const FALLBACK_WIDTH = 320;
const TICK_REM = 0.9375;

/** "2026-10-23" thành "23/10", "2026-10" thành "10/2026". */
function periodLabel(period: string) {
  const [y, m, d] = period.split("-");
  return d ? `${d}/${m}` : `${m}/${y}`;
}

function outside(s: WaterIndicatorStats, low: number | null, high: number | null) {
  return s.count > 0 && ((low !== null && s.minimum !== null && s.minimum < low) || (high !== null && s.maximum !== null && s.maximum > high));
}

function thresholdText(low: number | null, high: number | null, unit?: string) {
  if (low === null && high === null) return "Chưa đặt ngưỡng";
  return `Ngưỡng ${num(low)} – ${num(high, unit)}`;
}

function statsText(s: WaterIndicatorStats, unit?: string) {
  if (s.count === 0) return "không có số đo";
  return `trung bình ${num(s.average, unit)}, thấp nhất ${num(s.minimum)}, cao nhất ${num(s.maximum)}, ${s.count} lần đo`;
}

/**
 * Đo bề rộng thật của khung biểu đồ và cỡ chữ gốc. Vẽ SVG đúng bằng bề rộng này thì một đơn vị trong SVG là 1px, chữ
 * trên trục không bị co nhỏ theo `viewBox`, và lề được tính theo lựa chọn "Cỡ chữ".
 */
function useChartBox() {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, rem: 18 });

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const measure = () => setBox({ width: element.clientWidth, rem: parseFloat(getComputedStyle(document.documentElement).fontSize) || 18 });
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width: box.width || FALLBACK_WIDTH, rem: box.rem };
}

/** Một chỉ số: đường trung bình theo kỳ, vùng ngưỡng tô nền, kỳ không có số đo để đứt đoạn, kỳ vượt ngưỡng chấm đỏ. */
function IndicatorChart({
  title,
  unit,
  periods,
  pick,
  low,
  high,
  selected,
  onSelect,
}: {
  title: string;
  unit?: string;
  periods: WaterChartPeriod[];
  pick: (p: WaterChartPeriod) => WaterIndicatorStats;
  low: number | null;
  high: number | null;
  selected: number;
  onSelect: (index: number) => void;
}) {
  const stats = periods.map(pick);
  const values = stats.flatMap((s) => (s.average === null ? [] : [s.average]));
  const bounds = [...values, ...(low === null ? [] : [low]), ...(high === null ? [] : [high])];
  const spread = Math.max(...bounds) - Math.min(...bounds) || 1;
  const bottom = Math.min(...bounds) - spread * 0.1;
  const top = Math.max(...bounds) + spread * 0.1;

  const { ref: plotRef, width, rem } = useChartBox();
  const tickSize = rem * TICK_REM;
  const height = Math.round(rem * 10);
  const padLeft = Math.round(rem * 2.75);
  const padRight = Math.round(rem * 0.5);
  const padTop = Math.round(rem * 0.625);
  const padBottom = Math.round(rem * 1.75);

  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const x = (i: number) => padLeft + (periods.length > 1 ? (i / (periods.length - 1)) * plotWidth : plotWidth / 2);
  const y = (v: number) => padTop + (1 - (v - bottom) / (top - bottom)) * plotHeight;
  const ticks = [bottom + spread * 0.1, (bottom + top) / 2, top - spread * 0.1];

  // Kỳ thiếu số đo làm đứt đường để không vẽ như thể có dữ liệu ở giữa.
  const runs: number[][] = [];
  stats.forEach((s, i) => {
    if (s.average === null) return;
    if (i > 0 && stats[i - 1].average !== null) runs[runs.length - 1].push(i);
    else runs.push([i]);
  });

  const flagged = stats.reduce<number[]>((list, s, i) => (outside(s, low, high) ? [...list, i] : list), []);
  const current = stats[selected];

  const choose = (event: MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const at = ((event.clientX - box.left) / box.width) * width;
    const index = Math.round(((at - padLeft) / plotWidth) * (periods.length - 1));
    onSelect(Math.max(0, Math.min(periods.length - 1, index)));
  };

  // Chữ trục lớn nên khung hẹp (360px, chữ rất lớn) có thể chỉ giữ nhãn đầu và cuối, để các nhãn không đè lên nhau.
  const last = periods.length - 1;
  const labelWidth = Math.max(...periods.map((p) => periodLabel(p.period).length)) * tickSize * 0.6;
  const fitsMiddle = plotWidth >= labelWidth * 3 + tickSize * 2;
  const labelled = [0, ...(fitsMiddle ? [Math.floor(last / 2)] : []), last].filter((value, index, all) => all.indexOf(value) === index);

  return (
    <div className="water-chart card">
      <div className="water-chart__head">
        <h3 className="water-chart__title">{title}</h3>
        <span className="water-chart__limit">{thresholdText(low, high, unit)}</span>
      </div>
      <p className="water-chart__readout">
        <strong>{periodLabel(periods[selected].period)}: </strong>
        {statsText(current, unit)}
      </p>
      <div ref={plotRef}>
        {values.length === 0 ? (
          <p className="form__hint">Chưa có số đo của chỉ số này trong khoảng đã chọn.</p>
        ) : (
          <svg
            className="water-chart__plot"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`Biểu đồ ${title}: ${values.length} kỳ có số đo, ${flagged.length} kỳ vượt ngưỡng.`}
            onClick={choose}
            onPointerDown={choose}
            onPointerMove={choose}
          >
            {(low !== null || high !== null) && (
              <rect className="water-chart__band" x={padLeft} width={plotWidth} y={y(high ?? top)} height={Math.max(0, y(low ?? bottom) - y(high ?? top))} />
            )}
            {ticks.map((t) => (
              <g key={t}>
                <line className="water-chart__grid" x1={padLeft} x2={width - padRight} y1={y(t)} y2={y(t)} />
                <text className="water-chart__tick" x={padLeft - 6} y={y(t) + tickSize * 0.35} textAnchor="end">
                  {num(Math.round(t * 10) / 10)}
                </text>
              </g>
            ))}
            {labelled.map((i) => (
              <text key={i} className="water-chart__tick" x={x(i)} y={height - tickSize * 0.3} textAnchor={last > 0 && i === 0 ? "start" : last > 0 && i === last ? "end" : "middle"}>
                {periodLabel(periods[i].period)}
              </text>
            ))}
            <line className="water-chart__cross" x1={x(selected)} x2={x(selected)} y1={padTop} y2={height - padBottom} />
            {runs.map((run) =>
              run.length === 1 ? (
                <circle key={run[0]} className="water-chart__dot" cx={x(run[0])} cy={y(stats[run[0]].average!)} r={4} />
              ) : (
                <polyline key={run[0]} className="water-chart__line" points={run.map((i) => `${x(i)},${y(stats[i].average!)}`).join(" ")} />
              ),
            )}
            {flagged.map((i) =>
              stats[i].average === null ? null : <circle key={i} className="water-chart__dot water-chart__dot--alert" cx={x(i)} cy={y(stats[i].average!)} r={4} />,
            )}
            {current.average !== null && <circle className={`water-chart__dot${flagged.includes(selected) ? " water-chart__dot--alert" : ""}`} cx={x(selected)} cy={y(current.average)} r={5} />}
          </svg>
        )}
      </div>
      {flagged.length > 0 && <Badge text={`${flagged.length} kỳ có số đo vượt ngưỡng`} tone="danger" />}
    </div>
  );
}

/** Danh sách số của từng kỳ có số đo, mới nhất trước, để đọc được mà không cần dùng biểu đồ. */
function PeriodList({ periods, thresholds, range }: { periods: WaterChartPeriod[]; thresholds: WaterThresholds; range: WaterRange }) {
  const word = range === "days" ? "ngày" : "tháng";
  return (
    <Section title={`Số liệu từng ${word}`}>
      <p className="form__hint water-chart__spaced">Những {word} không có số đo không hiện ở đây.</p>
      <Rows>
        {periods
          .filter((p) => !p.missing)
          .reverse()
          .map((p) => {
            const phOut = outside(p.ph, thresholds.phMin, thresholds.phMax);
            const salinityOut = outside(p.salinity, thresholds.salinityMin, thresholds.salinityMax);
            return (
              <Row
                key={p.period}
                title={periodLabel(p.period)}
                meta={
                  <>
                    <span className="water-chart__stat">Độ pH: {statsText(p.ph)}</span>
                    <span className="water-chart__stat">Độ mặn: {statsText(p.salinity, "‰")}</span>
                  </>
                }
                badge={
                  phOut || salinityOut ? (
                    <>
                      {phOut && <Badge text="Độ pH vượt ngưỡng" tone="danger" />}
                      {salinityOut && <Badge text="Độ mặn vượt ngưỡng" tone="danger" />}
                    </>
                  ) : undefined
                }
              />
            );
          })}
      </Rows>
    </Section>
  );
}

/**
 * Biểu đồ chỉ số nước của một vùng (WATER-03), chỉ tính số đo đã xác nhận. pH và độ mặn khác thang đo nên mỗi chỉ số
 * một biểu đồ. Chạm vào biểu đồ để xem số của kỳ đó trên cả hai; danh sách số nằm ngay dưới biểu đồ.
 */
export function WaterChart({ zoneId }: { zoneId: string }) {
  const [range, setRange] = useState<WaterRange>("days");
  const { data, error, reload } = useLoad(() => waterChart(zoneId, range), [zoneId, range]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!data) return;
    let last = data.periods.length - 1;
    while (last > 0 && data.periods[last].missing) last -= 1;
    setSelected(Math.max(0, last));
  }, [data]);

  return (
    <>
      <div className="form water-chart__spaced">
        <Select label="Khoảng thời gian" value={range} onChange={(v) => setRange(String(v) as WaterRange)} closeOnSelect>
          {RANGES.map(([key, label]) => (
            <Select.Option key={key} value={key} title={label} />
          ))}
        </Select>
      </div>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(chart) =>
          chart.periods.every((p) => p.missing) ? (
            <Empty icon="zi-poll" title="Chưa có số đo đã xác nhận" text="Biểu đồ chỉ tính các số đo đã xác nhận trong khoảng đã chọn." />
          ) : (
            <>
              <p className="form__hint water-chart__spaced">Chạm vào biểu đồ để xem số của {range === "days" ? "ngày" : "tháng"} đó.</p>
              {/* Vừa đổi khoảng thời gian thì `selected` còn là vị trí của danh sách cũ, nên chặn lại cho khỏi vượt danh sách mới. */}
              <IndicatorChart title="Độ pH" periods={chart.periods} pick={(p) => p.ph} low={chart.thresholds.phMin} high={chart.thresholds.phMax} selected={Math.min(selected, chart.periods.length - 1)} onSelect={setSelected} />
              <IndicatorChart title="Độ mặn" unit="‰" periods={chart.periods} pick={(p) => p.salinity} low={chart.thresholds.salinityMin} high={chart.thresholds.salinityMax} selected={Math.min(selected, chart.periods.length - 1)} onSelect={setSelected} />
              <PeriodList periods={chart.periods} thresholds={chart.thresholds} range={range} />
            </>
          )
        }
      </Loadable>
    </>
  );
}
