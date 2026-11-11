import type { MockRecord, MockSummary } from "@/features/mock/models/MockModule";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { Button, useNavigate, useParams, useSnackbar } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { Chips } from "@/components/Chips/Chips";
import { Empty } from "@/components/Empty/Empty";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { useLoad } from "@/hooks/useLoad";
import { permissionsAtom } from "@/features/auth/state/authAtoms";
import { MockBanner } from "@/features/mock/components/MockBanner/MockBanner";
import { MockForm } from "@/features/mock/components/MockForm/MockForm";
import { canMock } from "@/features/mock/services/mockAccess";
import { createMockRecord, getMockModule, listMockRecords } from "@/features/mock/services/mockService";
import { money } from "@/utils/format";

const ALL = "__all";

function summaryValue(summary: MockSummary, records: MockRecord[]) {
  const counted = summary.statuses ? records.filter((r) => r.status && summary.statuses!.includes(r.status)) : records;
  return summary.kind === "sum" ? money(counted.reduce((total, r) => total + (r.amount ?? 0), 0)) : String(counted.length);
}

/** Danh sách của một chức năng chưa có API: lọc theo trạng thái, ô tổng, tạo mới. Chỉ có ở bản dev. */
function MockListPage() {
  const { key = "" } = useParams();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const permissions = useAtomValue(permissionsAtom);
  const module = getMockModule(key);
  const [filter, setFilter] = useState(ALL);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const { data, error, reload, setData } = useLoad(() => listMockRecords(key), [key]);

  if (!module) {
    return (
      <ManagePage title="Không tìm thấy">
        <Empty icon="zi-warning-circle" title="Không có chức năng này" />
      </ManagePage>
    );
  }

  const canCreate = module.create && canMock(permissions, module.create.who);
  const save = async (values: Record<string, string>, photos: string[]) => {
    if (!module.create) return;
    setBusy(true);
    const record = await createMockRecord(key, values, photos);
    setData(await listMockRecords(key));
    setBusy(false);
    setCreating(false);
    openSnackbar({ text: `${module.create.done} Dữ liệu mẫu, không lưu lên máy chủ.`, type: "success", duration: 4000 });
    navigate(`/mock/${key}/${record.id}`);
  };

  const filters: [string, string][] = module.statuses ? [[ALL, "Tất cả"], ...Object.entries(module.statuses).map(([k, s]) => [k, s.label] as [string, string])] : [];

  return (
    <ManagePage
      title={module.title}
      onBack={creating ? () => setCreating(false) : undefined}
      footer={
        data && !creating && canCreate ? (
          <Button fullWidth size="large" onClick={() => setCreating(true)}>
            {module.create!.label}
          </Button>
        ) : undefined
      }
    >
      <MockBanner />
      {creating && module.create ? (
        <MockForm fields={module.create.fields} submitLabel="Lưu" busy={busy} onCancel={() => setCreating(false)} onSubmit={(v, p) => void save(v, p)} />
      ) : (
        <Loadable data={data} error={error} reload={() => void reload()}>
          {(records) => {
            const rows = filter === ALL ? records : records.filter((r) => r.status === filter);
            return (
              <>
                {module.summary && (
                  <div className="summary">
                    {module.summary.map((s) => (
                      <div key={s.label} className={`summary__cell${s.tone ? ` tone-${s.tone}` : ""}`}>
                        <span className="summary__label">{s.label}</span>
                        <span className="summary__value">{summaryValue(s, records)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {filters.length > 0 && <Chips options={filters} value={filter} onChange={setFilter} />}
                {rows.length === 0 ? (
                  <Empty icon="zi-file" title={module.emptyText ?? "Chưa có dữ liệu"} />
                ) : (
                  <Rows>
                    {rows.map((r) => {
                      const status = r.status ? module.statuses?.[r.status] : undefined;
                      return (
                        <Row
                          key={r.id}
                          title={r.title}
                          meta={r.meta}
                          badge={status ? <Badge text={status.label} tone={status.tone} /> : undefined}
                          value={r.amount !== undefined ? money(r.amount) : r.value}
                          onClick={() => navigate(`/mock/${key}/${r.id}`)}
                        />
                      );
                    })}
                  </Rows>
                )}
              </>
            );
          }}
        </Loadable>
      )}
    </ManagePage>
  );
}

export default MockListPage;
