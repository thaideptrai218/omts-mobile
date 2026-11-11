import { useAtomValue } from "jotai";
import { useState } from "react";
import { Button, useNavigate, useParams } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { useAction } from "@/hooks/useAction";
import { useLoad } from "@/hooks/useLoad";
import { date, money } from "@/utils/format";
import { canUseFeature } from "@/utils/featureAccess";
import { statusLabel, SUPPLIER_TYPE } from "@/utils/labels";
import { permissionsAtom } from "@/features/auth/state/authAtoms";
import { MetaLines } from "@/features/purchasing/components/MetaLines/MetaLines";
import { SupplierCertificates } from "@/features/purchasing/components/SupplierCertificates/SupplierCertificates";
import { getSupplier, setSupplierInUse, STATUS_IN_USE } from "@/features/purchasing/services/purchasingService";

/** Chi tiết nhà cung cấp: liên hệ, công nợ còn phải trả, chứng nhận, các phiếu nhập. Sửa, ngừng dùng hoặc dùng lại. */
function SupplierDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const permissions = useAtomValue(permissionsAtom);
  const { data, error, reload, setData } = useLoad(() => getSupplier(id), [id]);
  const { busy, run } = useAction();
  const [confirming, setConfirming] = useState(false);

  const toggle = async () => {
    if (!data) return;
    const inUse = data.statusId !== STATUS_IN_USE;
    const saved = await run(() => setSupplierInUse(id, inUse), inUse ? "Đã dùng lại nhà cung cấp." : "Đã ngừng dùng nhà cung cấp.");
    if (saved) setData(saved);
    setConfirming(false);
  };

  return (
    <ManagePage
      title="Nhà cung cấp"
      footer={
        data ? (
          <Button fullWidth size="large" onClick={() => navigate(`/manage/suppliers/${id}/edit`)}>
            Sửa
          </Button>
        ) : undefined
      }
    >
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(s) => {
          const st = statusLabel(s.status);
          const inUse = s.statusId === STATUS_IN_USE;
          return (
            <>
              <Facts
                items={[
                  ["Tên", s.name],
                  ["Trạng thái", <Badge key="st" text={st.text} tone={st.tone} />],
                  ["Còn phải trả", <span key="debt" className={s.debt > 0 ? "text-danger" : undefined}>{money(s.debt)}</span>],
                  ["Loại", SUPPLIER_TYPE[s.supplierType] ?? s.supplierType],
                  ["Số điện thoại", s.phoneNumber],
                  ["Liên hệ khác", s.otherContacts],
                ]}
              />
              <Actions>
                {permissions && canUseFeature(permissions, "supplierPayments") && (
                  <Button variant="secondary" size="large" onClick={() => navigate(`/manage/supplier-debts/${id}`)}>
                    Xem công nợ
                  </Button>
                )}
                <Button variant="secondary" size="large" type={inUse ? "danger" : "highlight"} onClick={() => setConfirming(true)}>
                  {inUse ? "Ngừng dùng nhà cung cấp" : "Dùng lại nhà cung cấp"}
                </Button>
              </Actions>

              <SupplierCertificates supplier={s} onChange={setData} />

              <Section title="Phiếu nhập">
                {s.receipts.length === 0 ? (
                  <Empty icon="zi-file" title="Chưa có phiếu nhập" />
                ) : (
                  <Rows>
                    {s.receipts.map((r) => {
                      const rs = statusLabel(r.status);
                      return (
                        <Row
                          key={r.id}
                          title={r.code}
                          meta={
                            <MetaLines
                              items={[
                                ["Ngày nhập", date(r.receiptDate)],
                                ["Phải trả", money(r.payable)],
                              ]}
                            />
                          }
                          badge={
                            <>
                              <Badge text={rs.text} tone={rs.tone} />
                              {r.outstanding > 0 && <Badge text={`Còn nợ ${money(r.outstanding)}`} tone="danger" />}
                            </>
                          }
                          onClick={() => navigate(`/manage/purchases/${r.id}`)}
                        />
                      );
                    })}
                  </Rows>
                )}
              </Section>

              <ConfirmSheet
                visible={confirming}
                title={inUse ? "Ngừng dùng nhà cung cấp?" : "Dùng lại nhà cung cấp?"}
                message={
                  inUse
                    ? `${s.name} sẽ không chọn được khi lập phiếu nhập mới. Phiếu và công nợ cũ giữ nguyên.`
                    : `${s.name} sẽ chọn được lại khi lập phiếu nhập.`
                }
                confirmText={inUse ? "Ngừng dùng nhà cung cấp" : "Dùng lại nhà cung cấp"}
                danger={inUse}
                busy={busy}
                onClose={() => setConfirming(false)}
                onConfirm={() => void toggle()}
              />
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}

export default SupplierDetailPage;
