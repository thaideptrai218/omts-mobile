import { useState } from "react";
import { Button, Modal, useNavigate, useParams } from "zmp-ui";

import { Actions, Badge, Empty, Facts, Loadable, ManagePage, Row, Rows, Section } from "@/components/manage/ui";
import { useAction } from "@/hooks/use-action";
import { useLoad } from "@/hooks/use-load";
import { date, money } from "@/services/format";
import { statusLabel, SUPPLIER_TYPE } from "@/services/labels";
import { getSupplier, setSupplierInUse, STATUS_IN_USE } from "@/services/purchasing";

/** Chi tiết nhà cung cấp: liên hệ, công nợ còn phải trả, các phiếu nhập. Sửa, ngừng dùng hoặc dùng lại. */
function SupplierDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
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
    <ManagePage title="Nhà cung cấp">
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(s) => {
          const st = statusLabel(s.status);
          const inUse = s.statusId === STATUS_IN_USE;
          return (
            <>
              <Facts
                items={[
                  ["Tên", s.name],
                  ["Loại", SUPPLIER_TYPE[s.supplierType] ?? s.supplierType],
                  ["Số điện thoại", s.phoneNumber],
                  ["Liên hệ khác", s.otherContacts],
                  ["Trạng thái", <Badge key="st" text={st.text} tone={st.tone} />],
                  ["Còn phải trả", <span key="debt" className={s.debt > 0 ? "text-danger" : undefined}>{money(s.debt)}</span>],
                  ["Chứng nhận", s.certificates.length > 0 ? `${s.certificates.length} tệp (xem trên bản web)` : null],
                ]}
              />
              <Actions>
                <Button variant="secondary" size="large" onClick={() => navigate(`/manage/suppliers/${id}/edit`)}>
                  Sửa
                </Button>
                <Button variant="secondary" size="large" type={inUse ? "danger" : "highlight"} onClick={() => setConfirming(true)}>
                  {inUse ? "Ngừng dùng" : "Dùng lại"}
                </Button>
              </Actions>

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
                          meta={date(r.receiptDate)}
                          badge={
                            <>
                              <Badge text={rs.text} tone={rs.tone} />
                              {r.outstanding > 0 && <Badge text={`Còn nợ ${money(r.outstanding)}`} tone="danger" />}
                            </>
                          }
                          value={money(r.payable)}
                          onClick={() => navigate(`/manage/purchases/${r.id}`)}
                        />
                      );
                    })}
                  </Rows>
                )}
              </Section>

              <Modal
                visible={confirming}
                title={inUse ? "Ngừng dùng nhà cung cấp?" : "Dùng lại nhà cung cấp?"}
                description={
                  inUse
                    ? `${s.name} sẽ không chọn được khi lập phiếu nhập mới. Phiếu và công nợ cũ giữ nguyên.`
                    : `${s.name} sẽ chọn được lại khi lập phiếu nhập.`
                }
                onClose={() => setConfirming(false)}
                actions={[
                  { text: "Để sau", close: true },
                  { text: inUse ? "Ngừng dùng" : "Dùng lại", highLight: true, disabled: busy, onClick: () => void toggle() },
                ]}
              />
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}

export default SupplierDetailPage;
