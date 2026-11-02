import { useCallback, useEffect, useState } from "react";

import { errorText } from "@/shared/lib/messages";
import type { Paged } from "@/shared/api/paged";

/**
 * Danh sách có phân trang: tải trang 1 mỗi khi bộ lọc đổi (`fetchPage` đổi), `more` nối trang kế tiếp.
 * `items` null khi đang tải lần đầu.
 */
export function usePaged<T>(fetchPage: (page: number) => Promise<Paged<T>>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (nextPage: number) => {
      setLoading(true);
      setError("");
      try {
        const result = await fetchPage(nextPage);
        setItems((current) => (nextPage === 1 ? result.items : [...(current ?? []), ...result.items]));
        setTotal(result.total);
        setPage(nextPage);
      } catch (err) {
        setError(errorText(err));
      } finally {
        setLoading(false);
      }
    },
    [fetchPage],
  );

  useEffect(() => {
    setItems(null);
    void load(1);
  }, [load]);

  return {
    items,
    total,
    error,
    loading,
    hasMore: items !== null && items.length < total,
    reload: () => void load(1),
    more: () => void load(page + 1),
  };
}
