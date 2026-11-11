import { useEffect, useId, useRef, useState } from "react";
import { Input } from "zmp-ui";
/** Ô tìm kiếm: tìm khi bấm Enter hoặc nút kính lúp, không gọi API theo từng ký tự. `label` hiện nhãn phía trên ô. */
export function SearchBox({ placeholder, onSearch, label }: { placeholder: string; onSearch: (text: string) => void; label?: string }) {
  const [text, setText] = useState("");
  const inputId = useId();
  const formRef = useRef<HTMLFormElement>(null);

  // Input.Search không cho truyền thuộc tính vào nút kính lúp, nên đặt tên đọc được cho nút này trên DOM.
  useEffect(() => {
    formRef.current?.querySelector(".zaui-input-search-button")?.setAttribute("aria-label", "Tìm kiếm");
  }, []);

  return (
    <form
      ref={formRef}
      className="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(text.trim());
      }}
    >
      {label && (
        <label className="search__label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <Input.Search id={inputId} size="large" placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} onSearch={(v) => onSearch(String(v ?? "").trim())} clearable />
    </form>
  );
}
