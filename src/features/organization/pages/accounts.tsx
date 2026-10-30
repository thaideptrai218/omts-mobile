import { useCallback, useState } from "react";
import { useNavigate } from "zmp-ui";

import { Badge, Chips, ManagePage, Row, SearchBox } from "@/shared/ui/ui";
import { statusLabel } from "@/shared/lib/labels";
import { listAccounts, STATUS_ID } from "@/features/organization/api/organization";

import PagedList from "@/shared/ui/paged-list";
import { usePaged } from "@/shared/hooks/use-paged";

type Filter = "active" | "locked" | "all";

const FILTERS: [Filter, string][] = [
  ["active", "Đang hoạt động"],
  ["locked", "Đã khóa"],
  ["all", "Tất cả"],
];

const STATUS_FOR: Record<Filter, number | null> = { active: STATUS_ID.accountActive, locked: STATUS_ID.accountLocked, all: null };

/**
 * Tài khoản nhân viên của HTX: khóa/mở khóa và cấp quyền theo vùng ở trang chi tiết. Tạo tài khoản mới và đặt lại
 * mật khẩu làm trên bản web (Mini App không dùng mật khẩu).
 */
function AccountsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("active");
  const [search, setSearch] = useState("");
  const fetchPage = useCallback((page: number) => listAccounts({ search, statusId: STATUS_FOR[filter], page }), [search, filter]);
  const list = usePaged(fetchPage);

  return (
    <ManagePage title="Tài khoản">
      <SearchBox placeholder="Tìm theo tên, tên đăng nhập, số điện thoại" onSearch={setSearch} />
      <Chips options={FILTERS} value={filter} onChange={setFilter} />
      <PagedList list={list} unit="tài khoản" emptyIcon="zi-user-settings" emptyTitle="Không có tài khoản nào">
        {(a) => {
          const status = statusLabel(a.status);
          return (
            <Row
              key={a.id}
              title={a.displayName ?? a.username ?? "—"}
              meta={[a.username, a.phoneNumber].filter(Boolean).join(" · ")}
              badge={
                <>
                  <Badge text={status.text} tone={status.tone} />
                  {!a.employeeId && <Badge text="Chưa gắn hồ sơ nhân viên" tone="neutral" />}
                </>
              }
              onClick={() => navigate(`/manage/accounts/${a.id}`)}
            />
          );
        }}
      </PagedList>
      <p className="screen__note">Tạo tài khoản mới và đặt lại mật khẩu thực hiện trên bản web của OMTS.</p>
    </ManagePage>
  );
}

export default AccountsPage;
