import type { CycleDraft, CycleView } from "@/features/farming/models/Cycle";

import DateField from "@/components/DateField/DateField";
import FormError from "@/components/FormError/FormError";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { todayIso } from "@/utils/format";

/** Số thập phân viết kiểu Việt (dấu phẩy), để ô nhập không đọc nhầm dấu chấm là phân cách nghìn. */
const decimalText = (value: number | null) => (value === null ? "" : String(value).replace(".", ","));

/** Phiếu trống để bắt đầu chu kỳ hôm nay, hoặc phiếu có sẵn giá trị của chu kỳ đang sửa. */
export function cycleDraftOf(cycle?: CycleView): CycleDraft {
  return cycle
    ? {
        startDate: cycle.startDate,
        expectedSeedQuantity: decimalText(cycle.expectedSeedQuantity),
        expectedHarvestDate: cycle.expectedHarvestDate ?? "",
        targetYieldKg: decimalText(cycle.targetYieldKg),
      }
    : { startDate: todayIso(), expectedSeedQuantity: "", expectedHarvestDate: "", targetYieldKg: "" };
}

/** Ngày bắt đầu và các ước tính của kế hoạch (CYCLE-01): chỉ ngày bắt đầu là cần, ước tính để trống được. */
export function CycleForm({ draft, error, busy, onChange }: {
  draft: CycleDraft;
  error: string;
  busy: boolean;
  onChange: (draft: CycleDraft) => void;
}) {
  const set = (patch: Partial<CycleDraft>) => onChange({ ...draft, ...patch });
  return (
    <div className="card form">
      <DateField label="Ngày bắt đầu nuôi" value={draft.startDate || null} onChange={(startDate) => set({ startDate })} disabled={busy} />
      <p className="form__intro">Ước tính của kế hoạch (không bắt buộc), để so khi đóng chu kỳ.</p>
      <NumberInput label="Lượng giống dự kiến thả" decimal value={draft.expectedSeedQuantity} disabled={busy}
        onChange={(expectedSeedQuantity) => set({ expectedSeedQuantity })} />
      <DateField label="Ngày dự kiến thu hoạch" value={draft.expectedHarvestDate || null} onChange={(expectedHarvestDate) => set({ expectedHarvestDate })} disabled={busy} />
      <NumberInput label="Sản lượng mục tiêu (kg)" decimal value={draft.targetYieldKg} disabled={busy}
        onChange={(targetYieldKg) => set({ targetYieldKg })} />
      <FormError text={error} />
    </div>
  );
}
