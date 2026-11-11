import type { MockAction } from "@/features/mock/models/MockModule";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { Button, useNavigate, useParams, useSnackbar } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { useLoad } from "@/hooks/useLoad";
import { permissionsAtom } from "@/features/auth/state/authAtoms";
import { MockBanner } from "@/features/mock/components/MockBanner/MockBanner";
import { MockForm } from "@/features/mock/components/MockForm/MockForm";
import { canMock } from "@/features/mock/services/mockAccess";
import { getMockModule, getMockRecord, runMockAction } from "@/features/mock/services/mockService";
import { money } from "@/utils/format";

/** Chi tiết một bản ghi mẫu: thông tin, các mục liên quan, lịch sử và thao tác theo trạng thái. Chỉ có ở bản dev. */
function MockDetailPage() {
  const { key = "", id = "" } = useParams();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const permissions = useAtomValue(permissionsAtom);
  const module = getMockModule(key);
  const { data, error, reload, setData } = useLoad(async () => ({ record: await getMockRecord(key, id) }), [key, id]);
  const [form, setForm] = useState<MockAction | null>(null);
  const [confirming, setConfirming] = useState<MockAction | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: MockAction, values: Record<string, string>) => {
    if (!data?.record) return;
    setBusy(true);
    const record = await runMockAction(key, data.record, action, values);
    setData({ record });
    setBusy(false);
    setForm(null);
    setConfirming(null);
    openSnackbar({ text: `${action.done} Dữ liệu mẫu, không lưu lên máy chủ.`, type: "success", duration: 4000 });
  };

  return (
    <ManagePage title={module?.title ?? "Không tìm thấy"} onBack={form ? () => setForm(null) : undefined}>
      <MockBanner />
      <Loadable data={data} error={error} reload={() => void reload()}>
        {({ record }) => {
          if (!module || !record) return <Empty icon="zi-warning-circle" title="Không tìm thấy bản ghi" />;
          const status = record.status ? module.statuses?.[record.status] : undefined;
          const actions = (module.actions ?? []).filter((a) => (!a.from || (record.status && a.from.includes(record.status))) && canMock(permissions, a.who));
          return (
            <>
              <div className="card">
                <p className="request__name">{record.title}</p>
                {record.meta && <p className="form__hint">{record.meta}</p>}
                {status && (
                  <p className="row__badges">
                    <Badge text={status.label} tone={status.tone} />
                  </p>
                )}
                {record.amount !== undefined && <p className="mock-amount">{money(record.amount)}</p>}
              </div>
              {record.facts.length > 0 && (
                <Section title="Thông tin">
                  <Facts items={record.facts} />
                </Section>
              )}
              {record.photos?.map((url) => <img key={url} className="record-photo" src={url} alt={`Ảnh của ${record.title}`} />)}

              {form ? (
                <MockForm fields={form.fields ?? []} submitLabel={form.label} busy={busy} onCancel={() => setForm(null)} onSubmit={(values) => void run(form, values)} />
              ) : (
                actions.length > 0 && (
                  <div className="mock-actions">
                    {actions.map((a) => (
                      <Button
                        key={a.label}
                        fullWidth
                        size="large"
                        variant={a.danger ? "secondary" : "primary"}
                        type={a.danger ? "danger" : "highlight"}
                        onClick={() => (a.fields?.length ? setForm(a) : setConfirming(a))}
                      >
                        {a.label}
                      </Button>
                    ))}
                  </div>
                )
              )}

              {record.sections?.map((section) => (
                <Section key={section.title} title={section.title}>
                  <Rows>
                    {section.rows.map((r) => (
                      <Row
                        key={`${r.title}-${r.meta ?? ""}`}
                        title={r.title}
                        meta={r.meta}
                        value={r.value ? <span className={r.tone === "danger" ? "text-danger" : undefined}>{r.value}</span> : undefined}
                        onClick={r.link ? () => navigate(`/mock/${r.link!.module}/${r.link!.id}`) : undefined}
                      />
                    ))}
                  </Rows>
                </Section>
              ))}

              {record.history && record.history.length > 0 && (
                <Section title="Lịch sử">
                  <Rows>
                    {record.history.map((h) => (
                      <Row key={`${h.at}-${h.text}`} title={h.text} meta={h.at} />
                    ))}
                  </Rows>
                </Section>
              )}

              <ConfirmSheet
                visible={confirming !== null}
                title={confirming?.label ?? ""}
                message={confirming?.confirm ?? ""}
                confirmText={confirming?.label ?? "Đồng ý"}
                danger={confirming?.danger}
                busy={busy}
                onClose={() => setConfirming(null)}
                onConfirm={() => {
                  if (confirming) void run(confirming, {});
                }}
              />
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}

export default MockDetailPage;
