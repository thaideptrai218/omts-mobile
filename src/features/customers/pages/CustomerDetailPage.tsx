import { useState } from "react";
import { Button, useNavigate, useParams } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { useAction } from "@/hooks/useAction";
import { useBusinessPermission } from "@/hooks/useBusinessPermission";
import { useLoad } from "@/hooks/useLoad";
import { date, money } from "@/utils/format";
import { CustomerPhoto } from "@/features/customers/components/CustomerPhoto/CustomerPhoto";
import { getCustomer, setCustomerInUse } from "@/features/customers/services/customerService";
import { CUSTOMER_STATUS, CUSTOMER_TYPE_TEXT, customerStatus, debtLabel, GENDER_TEXT } from "@/features/customers/utils/customerText";
import "@/features/customers/styles/customers.scss";

/**
 * Chi tiết hồ sơ khách hàng (SALE-04): liên hệ, số nợ hiện tại, ảnh. Sửa, gộp hồ sơ trùng (SALE-04.3), ngừng dùng hoặc
 * dùng lại. Hồ sơ đã gộp chỉ còn để xem; hồ sơ ngừng dùng phải dùng lại trước khi sửa (MSG-GEN-09).
 */
function CustomerDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const allowed = useBusinessPermission();
  const { data, error, reload, setData } = useLoad(() => getCustomer(id), [id]);
  const { busy, run } = useAction();
  const [confirming, setConfirming] = useState(false);

  const canEdit = allowed("CUSTOMERS", "Edit");
  // API chi tiết trả số nợ cho mọi người xem (để màn hóa đơn dùng), còn danh sách chỉ trả cho người có quyền xem công nợ
  // (BR-FARM-07); màn hồ sơ theo quy tắc của danh sách.
  const canSeeDebt = allowed("CUSTOMER_DEBTS", "View");
  const editable = !!data && canEdit && data.statusId === CUSTOMER_STATUS.inUse && !data.mergedIntoCustomerId;

  const toggle = async () => {
    if (!data) return;
    const resume = data.statusId !== CUSTOMER_STATUS.inUse;
    const saved = await run(() => setCustomerInUse(id, resume), resume ? "Đã dùng lại khách hàng." : "Đã ngừng dùng khách hàng.");
    if (saved) setData(saved);
    setConfirming(false);
  };

  return (
    <ManagePage
      title="Khách hàng"
      footer={
        editable ? (
          <Button fullWidth size="large" onClick={() => navigate(`/manage/customers/${id}/edit`)}>
            Sửa thông tin
          </Button>
        ) : undefined
      }
    >
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(c) => {
          const st = customerStatus(c);
          const inUse = c.statusId === CUSTOMER_STATUS.inUse;
          const merged = !!c.mergedIntoCustomerId;
          const debt = debtLabel(c.currentDebt);
          return (
            <>
              {merged && (
                <div className="card form customer-notice">
                  <p>Hồ sơ này đã được gộp vào hồ sơ khác. Hóa đơn, phiếu thu và công nợ của nó nay tính ở hồ sơ giữ lại.</p>
                  <Button fullWidth variant="secondary" size="large" onClick={() => navigate(`/manage/customers/${c.mergedIntoCustomerId}`)}>
                    Mở hồ sơ giữ lại
                  </Button>
                </div>
              )}
              {!merged && !inUse && <p className="card form customer-notice">Khách hàng đang ngừng dùng: không chọn được khi lập hóa đơn mới. Dùng lại để sửa thông tin.</p>}

              {canSeeDebt && (
                <div className="summary customer-summary">
                  <div className={`summary__cell tone-${debt.tone}`}>
                    <span className="summary__label">{debt.text}</span>
                    <span className="summary__value">{money(Math.abs(c.currentDebt))}</span>
                  </div>
                </div>
              )}

              <Facts
                items={[
                  ["Tên", c.name],
                  ["Mã khách hàng", c.code],
                  ["Trạng thái", <Badge key="st" text={st.text} tone={st.tone} />],
                  ["Loại", CUSTOMER_TYPE_TEXT[c.customerType] ?? c.customerType],
                  ["Số điện thoại", c.phoneNumber ? `${c.phoneNumber}${c.phoneLocked ? " (theo tài khoản thương lái)" : ""}` : null],
                  ["Số điện thoại thứ hai", c.phoneNumber2],
                  ["Email", c.email],
                  ["Facebook", c.facebook],
                  ["Địa chỉ", [c.address, c.ward, c.province].filter(Boolean).join(", ")],
                  ["Giới tính", c.gender ? GENDER_TEXT[c.gender] : null],
                  ["Ngày sinh", c.birthDate ? date(c.birthDate) : null],
                  ["Số CCCD", c.identityNumber],
                  ["Tên công ty", c.companyName],
                  ["Mã số thuế", c.taxCode],
                  ["Tài khoản nhận tiền trả lại", c.bankAccountNumber ? `${c.bankName ?? c.bankBin ?? ""} · ${c.bankAccountNumber}` : null],
                  ["Tài khoản thương lái", c.traderAccount ? `${c.traderAccount.displayName}${c.traderAccount.username ? ` (${c.traderAccount.username})` : ""}` : null],
                  ["Ghi chú", c.note],
                  ["Người tạo", c.createdBy],
                  ["Ngày tạo", date(c.createdAt)],
                ]}
              />

              <Actions>
                {canSeeDebt && (
                  <Button variant="secondary" size="large" onClick={() => navigate(`/manage/customer-debts/${c.id}`)}>
                    Xem công nợ và sao kê
                  </Button>
                )}
                {canEdit && !merged && (
                  <Button variant="secondary" size="large" onClick={() => navigate(`/manage/customers/${c.id}/merge`)}>
                    Gộp hồ sơ trùng vào hồ sơ này
                  </Button>
                )}
                {canEdit && !merged && (
                  <Button variant="secondary" size="large" type={inUse ? "danger" : "highlight"} onClick={() => setConfirming(true)}>
                    {inUse ? "Ngừng dùng khách hàng" : "Dùng lại khách hàng"}
                  </Button>
                )}
              </Actions>

              <CustomerPhoto customer={c} editable={editable} onChange={setData} />

              <ConfirmSheet
                visible={confirming}
                title={inUse ? "Ngừng dùng khách hàng?" : "Dùng lại khách hàng?"}
                message={
                  inUse
                    ? `${c.name} sẽ không chọn được khi lập hóa đơn mới. Hóa đơn, phiếu thu và công nợ cũ giữ nguyên.`
                    : `${c.name} sẽ chọn được lại khi lập hóa đơn.`
                }
                confirmText={inUse ? "Ngừng dùng khách hàng" : "Dùng lại khách hàng"}
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

export default CustomerDetailPage;
