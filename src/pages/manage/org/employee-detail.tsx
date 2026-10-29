import { useState } from "react";
import { Button, Modal, Sheet, useNavigate, useParams } from "zmp-ui";

import { Actions, Badge, Facts, Loadable, ManagePage, Section } from "@/components/manage/ui";
import { useAction } from "@/hooks/use-action";
import { useLoad } from "@/hooks/use-load";
import { date, todayIso } from "@/services/format";
import { statusLabel } from "@/services/labels";
import { endEmployment, type EmploymentChanged, getEmployee, reinstateEmployee } from "@/services/organization";

import DateField from "@/components/manage/date-field";

const FOLLOW_UP: Record<string, string> = {
  "review-lock": "Nhân viên đã nghỉ nhưng tài khoản vẫn đang hoạt động. Mở tài khoản để khóa nếu người này không còn dùng app.",
  "review-access": "Nhân viên đã làm lại. Mở tài khoản để kiểm tra mở khóa và quyền theo vùng.",
};

/** Hồ sơ một nhân viên: thông tin, vùng làm việc, tài khoản đã gắn; cho nghỉ việc hoặc nhận lại. */
function EmployeeDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, error, reload, setData } = useLoad(() => getEmployee(id), [id]);
  const { busy, run } = useAction();
  const [ending, setEnding] = useState(false);
  const [endDate, setEndDate] = useState(todayIso());
  const [reinstating, setReinstating] = useState(false);
  const [followUp, setFollowUp] = useState<EmploymentChanged["followUp"]>(null);

  const applyChange = (result: EmploymentChanged | undefined) => {
    if (!result) return false;
    setData(result.employee);
    setFollowUp(result.followUp);
    return true;
  };

  const end = async () => {
    if (!data) return;
    if (applyChange(await run(() => endEmployment(id, endDate, data.rowVersion), `Đã cho ${data.fullName} nghỉ việc.`))) setEnding(false);
  };

  const reinstate = async () => {
    if (!data) return;
    if (applyChange(await run(() => reinstateEmployee(id, data.rowVersion), `Đã nhận lại ${data.fullName}.`))) setReinstating(false);
  };

  return (
    <ManagePage title="Nhân viên">
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(e) => {
          const status = statusLabel(e.status);
          const left = e.status === "Left";
          const bank = e.bankAccount;
          return (
            <>
              <div className="card">
                <p className="request__name">{e.fullName}</p>
                <p className="row__badges">
                  <Badge text={status.text} tone={status.tone} />
                </p>
              </div>
              {followUp && FOLLOW_UP[followUp.action] && (
                <div className="card notice">
                  <p className="form__intro">{FOLLOW_UP[followUp.action]}</p>
                  <Button size="large" variant="secondary" onClick={() => navigate(`/manage/accounts/${followUp.accountId}`)}>
                    Mở tài khoản
                  </Button>
                </div>
              )}
              <Section title="Thông tin">
                <Facts
                  items={[
                    ["Số điện thoại", e.phoneNumber],
                    ["Ngày sinh", e.birthday ? date(e.birthday) : null],
                    ["Địa chỉ", e.address],
                    ["Khu vực", [e.ward, e.area].filter(Boolean).join(", ")],
                    ["Vùng làm việc", e.workingZones.map((z) => z.name ?? z.code).join(", ") || "Chưa gán vùng"],
                    ["Ngày nghỉ việc", e.employmentEndDate ? date(e.employmentEndDate) : null],
                    ["Thông tin khác", e.otherInformation],
                    ["Ghi chú", e.notes],
                  ]}
                />
              </Section>
              {bank && (bank.bankName || bank.accountNumber) && (
                <Section title="Tài khoản ngân hàng">
                  <Facts
                    items={[
                      ["Ngân hàng", bank.bankName],
                      ["Số tài khoản", bank.accountNumber],
                      ["Chủ tài khoản", bank.accountHolderName],
                    ]}
                  />
                </Section>
              )}
              <Section title="Tài khoản OMTS">
                {e.account ? (
                  <button type="button" className="card row" onClick={() => navigate(`/manage/accounts/${e.account!.id}`)}>
                    <span className="row__text">
                      <span className="row__title">{e.account.displayName ?? e.account.username}</span>
                      <span className="row__meta">{e.account.username}</span>
                    </span>
                    <Badge {...statusLabel(e.account.status)} />
                  </button>
                ) : (
                  <p className="form__hint">Chưa có tài khoản. Tạo tài khoản cho nhân viên trên bản web của OMTS.</p>
                )}
              </Section>
              <Actions>
                <Button size="large" variant="secondary" onClick={() => navigate(`/manage/employees/${id}/edit`)}>
                  Sửa
                </Button>
                {left ? (
                  <Button size="large" onClick={() => setReinstating(true)}>
                    Nhận lại
                  </Button>
                ) : (
                  <Button size="large" variant="secondary" type="danger" onClick={() => setEnding(true)}>
                    Cho nghỉ việc
                  </Button>
                )}
              </Actions>
            </>
          );
        }}
      </Loadable>

      <Sheet visible={ending} onClose={() => setEnding(false)} autoHeight mask handler swipeToClose title="Cho nghỉ việc">
        <div className="sheet-form form">
          <p className="form__intro">Nhân viên sẽ chuyển sang “Đã nghỉ”. Tài khoản OMTS (nếu có) không tự khóa; app sẽ nhắc bạn xem lại.</p>
          <DateField label="Ngày nghỉ việc" value={endDate} onChange={setEndDate} disabled={busy} />
          <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void end()}>
            Xác nhận nghỉ việc
          </Button>
        </div>
      </Sheet>

      <Modal
        visible={reinstating}
        title="Nhận lại nhân viên"
        description={data ? `${data.fullName} sẽ chuyển lại sang “Đang làm”.` : ""}
        onClose={() => setReinstating(false)}
        actions={[
          { text: "Để sau", close: true },
          { text: "Nhận lại", highLight: true, disabled: busy, onClick: () => void reinstate() },
        ]}
      />
    </ManagePage>
  );
}

export default EmployeeDetailPage;
