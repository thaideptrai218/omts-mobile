import { useCallback, useEffect, useRef, useState } from "react";

import { errorText } from "@/services/acs/messages";

/**
 * Tải dữ liệu cho một màn: `data` null khi đang tải lần đầu, `error` là chữ tiếng Việt khi lỗi, `reload` tải lại
 * (giữ dữ liệu cũ trên màn trong lúc chờ), `setData` để cập nhật ngay sau một thao tác thành công.
 */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const latest = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);

  const reload = useCallback(async () => {
    const id = ++latest.current;
    setError("");
    try {
      const result = await run();
      if (id === latest.current) setData(result);
    } catch (err) {
      if (id === latest.current) setError(errorText(err));
    }
  }, [run]);

  useEffect(() => {
    setData(null);
    void reload();
  }, [reload]);

  return { data, error, reload, setData };
}
