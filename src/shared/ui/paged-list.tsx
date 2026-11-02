import { ReactNode } from "react";
import { Button } from "zmp-ui";

import { Empty, Loadable, Rows } from "@/shared/ui/ui";
import type { IconName } from "@/shared/navigation/features";

import type { usePaged } from "@/shared/hooks/use-paged";

/** Phần thân danh sách có phân trang: khung tải, lỗi, rỗng, số bản ghi, các dòng và nút "Tải thêm". */
function PagedList<T>({
  list,
  unit,
  emptyIcon,
  emptyTitle,
  emptyText,
  children,
}: {
  list: ReturnType<typeof usePaged<T>>;
  unit: string;
  emptyIcon: IconName;
  emptyTitle: string;
  emptyText?: string;
  children: (item: T) => ReactNode;
}) {
  return (
    <Loadable data={list.items} error={list.error} reload={list.reload}>
      {(items) =>
        items.length === 0 ? (
          <Empty icon={emptyIcon} title={emptyTitle} text={emptyText} />
        ) : (
          <>
            <p className="form__hint">
              {list.total} {unit}
            </p>
            <Rows>{items.map(children)}</Rows>
            {list.hasMore && (
              <Button className="more" fullWidth variant="secondary" loading={list.loading} disabled={list.loading} onClick={list.more}>
                Tải thêm
              </Button>
            )}
          </>
        )
      }
    </Loadable>
  );
}

export default PagedList;
