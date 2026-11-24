import { num } from "@/utils/format";

/** "1: 20 kg · 2: 22,5 kg": kg của từng lồng theo thứ tự cân. Còn dùng ở màn lập hóa đơn cũ. */
export const cageList = (kgs: number[]) => kgs.map((kg, i) => `${i + 1}: ${num(kg, "kg")}`).join(" · ");
