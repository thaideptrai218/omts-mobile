import { useState } from "react";
import { Input } from "zmp-ui";
/** Ô tìm kiếm: tìm khi bấm Enter hoặc nút kính lúp, không gọi API theo từng ký tự. */
export function SearchBox({ placeholder, onSearch }: { placeholder: string; onSearch: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <form
      className="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(text.trim());
      }}
    >
      <Input.Search placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} onSearch={(v) => onSearch(String(v ?? "").trim())} clearable />
    </form>
  );
}
