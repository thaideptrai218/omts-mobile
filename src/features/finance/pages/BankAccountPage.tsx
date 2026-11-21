import type { Bank, BankAccountDraft, ReceivingBankAccountView } from "@/features/finance/models/ReceivingBankAccount";
import { useState } from "react";
import { Button, Input, Select, useSnackbar } from "zmp-ui";

import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import { MESSAGES } from "@/constants/messages";
import { getReceivingBankAccount, listBanks, saveReceivingBankAccount } from "@/features/finance/services/bankAccountService";
import { useLoad } from "@/hooks/useLoad";
import { ApiError, isApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import { dateTime } from "@/utils/format";
import "@/features/finance/styles/finance.scss";

/** Số tài khoản VietQR chấp nhận: 1 đến 19 chữ cái hoặc chữ số, không dấu cách (BR-DEBT-01). */
const ACCOUNT_NUMBER = /^[0-9A-Za-z]{1,19}$/;
const MAX_HOLDER = 200;

/** Câu hỏi MSG-DEBT-01 (DEBT-01 bước 5) viết bằng tiếng Việt từ các tham số máy chủ gửi kèm. */
function accountQuestion(error: ApiError) {
  const d = error.details;
  const old = typeof d.oldCodesCount === "number" && d.oldCodesCount > 0
    ? `${d.oldCodesCount} hóa đơn chưa trả đã gửi mã VietQR của tài khoản cũ; tiền chuyển bằng các mã đó sẽ không được ghi nhận tự động. `
    : "";
  return `${old}Dùng tài khoản ${String(d.accountNumber ?? "")} tại ${String(d.bankName ?? "")} (${String(d.accountHolder ?? "")}) để nhận tiền VietQR của các hóa đơn bán?`;
}

/**
 * Tài khoản ngân hàng nhận tiền của HTX (DEBT-01, `/manage/bank-account`, chỉ Chủ HTX): mã VietQR của hóa đơn bán chuyển
 * tiền vào tài khoản này. Lưu thì máy chủ hỏi dịch vụ báo nhận tiền có chấp nhận tài khoản không (MSG-DEBT-02 khi không),
 * rồi hỏi lại người dùng (MSG-DEBT-01) trước khi đổi. Màn này không hiện mã QR nào.
 */
export default function BankAccountPage() {
  const { data, error, reload, setData } = useLoad(async () => {
    const [view, banks] = await Promise.all([getReceivingBankAccount(), listBanks()]);
    return { view, banks };
  }, []);
  const [editing, setEditing] = useState(false);

  const footer = data && !editing ? (
    <Button fullWidth size="large" onClick={() => setEditing(true)}>
      {data.view.account ? "Đổi tài khoản nhận tiền" : "Đặt tài khoản nhận tiền"}
    </Button>
  ) : undefined;

  return (
    <ManagePage title="Tài khoản nhận tiền" footer={footer} onBack={editing ? () => setEditing(false) : undefined}>
      <Loadable data={data} error={error} reload={() => void reload()}>
        {({ view, banks }) => (
          <>
            <CurrentAccount view={view} banks={banks} />
            {editing && (
              <AccountForm
                view={view}
                banks={banks}
                onCancel={() => setEditing(false)}
                onStale={() => void reload()}
                onSaved={(next) => {
                  setData({ view: next, banks });
                  setEditing(false);
                }}
              />
            )}
          </>
        )}
      </Loadable>
    </ManagePage>
  );
}

function bankLabel(banks: Bank[], bin: string, fallback: string) {
  const bank = banks.find((b) => b.bin === bin);
  return bank ? `${bank.shortName} (${bank.name})` : fallback;
}

function CurrentAccount({ view, banks }: { view: ReceivingBankAccountView; banks: Bank[] }) {
  const account = view.account;
  if (!account) {
    return <Empty icon="zi-info-circle" title="Chưa đặt tài khoản nhận tiền" text="Chưa có tài khoản thì hóa đơn bán chưa tạo được mã VietQR để thương lái chuyển khoản." />;
  }
  return (
    <Section title="Tài khoản đang dùng">
      <Facts
        items={[
          ["Ngân hàng", bankLabel(banks, account.bankBin, account.bankName)],
          ["Số tài khoản", account.accountNumber],
          ["Chủ tài khoản", account.accountHolderName],
          ["Dịch vụ báo nhận tiền chấp nhận lúc", dateTime(account.acceptedAt)],
        ]}
      />
    </Section>
  );
}

function AccountForm({
  view,
  banks,
  onCancel,
  onStale,
  onSaved,
}: {
  view: ReceivingBankAccountView;
  banks: Bank[];
  onCancel: () => void;
  onStale: () => void;
  onSaved: (view: ReceivingBankAccountView) => void;
}) {
  const { openSnackbar } = useSnackbar();
  const [draft, setDraft] = useState<BankAccountDraft>(() => ({
    bankBin: view.account?.bankBin ?? "",
    accountNumber: view.account?.accountNumber ?? "",
    accountHolderName: view.account?.accountHolderName ?? "",
  }));
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const change = (patch: Partial<BankAccountDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError("");
  };

  const check = () => {
    if (!draft.bankBin) return MESSAGES.MSG01("Ngân hàng");
    if (!ACCOUNT_NUMBER.test(draft.accountNumber.trim())) return MESSAGES.MSG01("Số tài khoản (1 đến 19 chữ số hoặc chữ cái, không có dấu cách)");
    if (!draft.accountHolderName.trim()) return MESSAGES.MSG01("Tên chủ tài khoản");
    return "";
  };

  /** Lần đầu gửi không có `confirmAccount` để máy chủ kiểm tra và hỏi lại; trả lời Có thì gửi lại kèm cờ. */
  const send = async (confirmAccount: boolean) => {
    const problem = check();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const saved = await saveReceivingBankAccount({
        bankBin: draft.bankBin,
        accountNumber: draft.accountNumber.trim(),
        accountHolderName: draft.accountHolderName.trim(),
        confirmAccount,
        rowVersion: view.rowVersion,
      });
      setQuestion("");
      openSnackbar({ text: "Đã lưu tài khoản nhận tiền.", type: "success", duration: 4000 });
      onSaved(saved.receivingBankAccount);
    } catch (err) {
      setQuestion("");
      if (err instanceof ApiError && err.status === 409 && err.details.confirmFlag === "confirmAccount") {
        setQuestion(accountQuestion(err));
        return;
      }
      setError(errorText(err));
      // Người khác vừa lưu (MSG06): tải lại để thấy tài khoản mới và lấy phiên bản mới; ô đã nhập được giữ.
      if (isApiError(err, "MSG06")) onStale();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title={view.account ? "Đổi tài khoản" : "Đặt tài khoản"}>
      <div className="form card">
        <Select label="Ngân hàng (bắt buộc)" placeholder="Chọn ngân hàng" value={draft.bankBin || undefined} onChange={(v) => change({ bankBin: String(v ?? "") })} closeOnSelect disabled={busy}>
          {banks.map((b) => (
            <Select.Option key={b.bin} value={b.bin} title={`${b.shortName} (${b.name})`} />
          ))}
        </Select>
        <Input
          label="Số tài khoản (bắt buộc)"
          size="large"
          value={draft.accountNumber}
          onChange={(e) => change({ accountNumber: e.target.value.replace(/\s/g, "") })}
          maxLength={19}
          disabled={busy}
          helperText="Chỉ chữ số hoặc chữ cái, không có dấu cách."
        />
        <Input
          label="Tên chủ tài khoản (bắt buộc)"
          size="large"
          value={draft.accountHolderName}
          onChange={(e) => change({ accountHolderName: e.target.value })}
          maxLength={MAX_HOLDER}
          disabled={busy}
          helperText="Đúng như ngân hàng in, ví dụ HTX THUY SAN TRUNG NAM. Hệ thống tự viết hoa."
        />
        <p className="form__hint">Khi lưu, hệ thống hỏi dịch vụ báo nhận tiền có nhận tài khoản này không. Việc này có thể mất vài giây.</p>
        <FormError text={error} />
        <div className="action-row">
          <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void send(false)}>
            Kiểm tra và lưu
          </Button>
          <Button fullWidth size="large" variant="secondary" disabled={busy} onClick={onCancel}>
            Thôi, không đổi
          </Button>
        </div>
      </div>
      <ConfirmSheet
        visible={question !== ""}
        title="Dùng tài khoản này?"
        message={question}
        confirmText="Có, dùng tài khoản này"
        busy={busy}
        onClose={() => setQuestion("")}
        onConfirm={() => void send(true)}
      />
    </Section>
  );
}
