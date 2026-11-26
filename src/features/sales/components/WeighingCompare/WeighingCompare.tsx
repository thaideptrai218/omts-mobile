import { num } from "@/utils/format";

/** Một lồng trên bảng đối chiếu: id để mở sửa, `number` để xếp thứ tự, kg đã cân. */
type CompareCage = { id: string; number: number; kg: number };

/** Bên đang xem được sửa lồng của mình: nhân viên sửa cột HTX, thương lái sửa cột của mình. */
export type CompareSide = "cooperative" | "trader";

/** Số kg tính theo gam để so hai bên, tránh sai số của số thập phân (kg có tối đa 3 chữ số sau dấu phẩy). */
const grams = (kg: number) => Math.round(kg * 1000);

const byNumber = (cages: CompareCage[]) => [...cages].sort((a, b) => a.number - b.number);

/** "lệch 1,5 kg" giữa số HTX và số thương lái; chuỗi rỗng khi khớp. */
export function kgGap(cooperative: number, trader: number): string {
  const diff = grams(cooperative) - grams(trader);
  return diff === 0 ? "" : `lệch ${num(Math.abs(diff) / 1000, "kg")}`;
}

/**
 * Bảng đối chiếu số cân (chốt 24/11/2026, OMTS-227): HTX và thương lái cùng cân từng lồng, lồng thứ i của HTX đặt cạnh lồng thứ i của
 * thương lái (theo thứ tự cân, không theo số lồng đã cấp). Dòng lệch có nhãn chữ "lệch … kg", không chỉ dựa vào màu. Số của HTX là số
 * chính thức. `onPick` mở sửa một lồng của bên `editable`. Đơn vị "kg" nằm ở tiêu đề cột để ô chỉ còn con số, vừa cột ở máy 320px
 * và cỡ chữ rất lớn; hai số tổng có thể dài ("1.234,567 kg") nên mỗi số một dòng trọn chiều ngang.
 */
export function WeighingCompare({ cages, traderCages, cagesKg, traderCagesKg, editable, onPick }: {
  cages: CompareCage[];
  traderCages: CompareCage[];
  cagesKg: number;
  traderCagesKg: number;
  editable?: CompareSide;
  onPick?: (cageId: string, position: number) => void;
}) {
  const ours = byNumber(cages);
  const theirs = byNumber(traderCages);
  const count = Math.max(ours.length, theirs.length);
  const totalGap = kgGap(cagesKg, traderCagesKg);

  if (count === 0) return <p className="form__hint">Hai bên chưa cân lồng nào.</p>;

  return (
    <div className="weighing-compare">
      <div className="weighing-compare__row weighing-compare__row--head">
        <span>Lồng</span>
        <span>HTX (kg)</span>
        <span>Thương lái (kg)</span>
      </div>
      {Array.from({ length: count }, (_, index) => {
        const cooperative = ours[index];
        const trader = theirs[index];
        const position = index + 1;
        const note = !cooperative ? "HTX chưa cân lồng này" : !trader ? "Thương lái chưa cân lồng này" : kgGap(cooperative.kg, trader.kg);
        const own = editable === "cooperative" ? cooperative : editable === "trader" ? trader : undefined;
        const cells = (
          <>
            <span className="weighing-compare__cage">{position}</span>
            <span className="weighing-compare__kg">{cooperative ? num(cooperative.kg) : "—"}</span>
            <span className="weighing-compare__kg">{trader ? num(trader.kg) : "—"}</span>
            {note && <span className="weighing-compare__note">Lồng {position}: {note}</span>}
          </>
        );
        const className = `weighing-compare__row${note ? " weighing-compare__row--gap" : ""}`;
        return own && onPick ? (
          <button key={position} type="button" className={className} onClick={() => onPick(own.id, position)}
            aria-label={`Sửa lồng ${position}: HTX ${cooperative ? num(cooperative.kg, "kg") : "chưa cân"}, thương lái ${trader ? num(trader.kg, "kg") : "chưa cân"}${note ? `, ${note}` : ""}`}>
            {cells}
          </button>
        ) : (
          <div key={position} className={className}>{cells}</div>
        );
      })}
      <div className="weighing-compare__row weighing-compare__row--total">
        <span className="weighing-compare__total">Tổng HTX: <span className="nowrap">{num(cagesKg, "kg")}</span></span>
        <span className="weighing-compare__total">Tổng thương lái: <span className="nowrap">{num(traderCagesKg, "kg")}</span></span>
        <span className={`weighing-compare__note${totalGap ? "" : " weighing-compare__note--ok"}`}>
          {totalGap
            ? `Tổng hai bên ${totalGap} (${num(ours.length, "lồng")} HTX, ${num(theirs.length, "lồng")} thương lái).`
            : ours.length === theirs.length ? "Hai bên khớp nhau." : `Tổng khớp nhưng số lồng khác nhau (${num(ours.length, "lồng")} HTX, ${num(theirs.length, "lồng")} thương lái).`}
        </span>
      </div>
    </div>
  );
}
