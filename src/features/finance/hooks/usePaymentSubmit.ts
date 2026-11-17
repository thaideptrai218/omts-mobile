import type { CustomerPaymentSaved, PaymentQuestion, PaymentQuestionFlags, PaymentSavedState } from "@/features/finance/models/CustomerPayment";
import { useState } from "react";
import { useNavigate, useSnackbar } from "zmp-ui";

import { paymentQuestion, paymentTitle } from "@/features/finance/utils/financeText";
import { errorText } from "@/utils/errorText";

/**
 * Gửi phiếu thu hoặc phiếu trả lại tiền. Máy chủ hỏi lại từng câu một (409 MSG-DEBT-04 rồi MSG-DEBT-05): người dùng trả
 * lời Có thì gửi lại đúng nội dung kèm cờ của câu đó và các câu đã trả lời trước. Mỗi lần bấm lưu bắt đầu lại từ đầu,
 * để câu trả lời cũ không dùng cho số tiền đã sửa. Lưu xong mở trang chi tiết của phiếu, thay cho form.
 */
export function usePaymentSubmit(send: (flags: PaymentQuestionFlags) => Promise<CustomerPaymentSaved>) {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState<PaymentQuestion | null>(null);

  const run = async (flags: PaymentQuestionFlags) => {
    setBusy(true);
    setError("");
    try {
      const saved = await send(flags);
      openSnackbar({ text: `Đã lưu ${paymentTitle(saved.payment, true)}.`, type: "success", duration: 4000 });
      const state: PaymentSavedState = { debtAfter: saved.debtAfter };
      navigate(`/manage/customer-payments/${saved.payment.id}`, { replace: true, state });
    } catch (err) {
      const asked = paymentQuestion(err, flags);
      if (asked) setQuestion(asked);
      else setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const answer = (yes: boolean) => {
    const asked = question;
    setQuestion(null);
    if (asked && yes) void run({ ...asked.flags, [asked.field]: true });
  };

  return { busy, error, setError, question, submit: () => void run({}), answer };
}
