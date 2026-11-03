import { useEffect, useRef } from "react";
/** Chip lọc chọn một: bấm lại chip đang chọn không bỏ chọn (luôn có một lựa chọn). */
export function Chips<K extends string>({ options, value, onChange }: { options: [K, string][]; value: NoInfer<K>; onChange: (v: NoInfer<K>) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  // Chip đang chọn có thể nằm ngoài màn (ví dụ mở danh sách nước của vùng thứ tư): cuộn ngang tới nó.
  useEffect(() => {
    ref.current?.querySelector(".chip.is-active")?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [value, options.length]);
  return (
    <div className="chips" role="tablist" ref={ref}>
      {options.map(([key, label]) => (
        <button key={key} type="button" role="tab" aria-selected={key === value} className={`chip${key === value ? " is-active" : ""}`} onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  );
}
