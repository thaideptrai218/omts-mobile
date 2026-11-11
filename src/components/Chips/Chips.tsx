/** Chip lọc chọn một: bấm lại chip đang chọn không bỏ chọn (luôn có một lựa chọn). Chip tự xuống dòng khi không đủ chỗ. */
export function Chips<K extends string>({ options, value, onChange }: { options: [K, string][]; value: NoInfer<K>; onChange: (v: NoInfer<K>) => void }) {
  return (
    <div className="chips" role="tablist">
      {options.map(([key, label]) => (
        <button key={key} type="button" role="tab" aria-selected={key === value} className={`chip${key === value ? " is-active" : ""}`} onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  );
}
