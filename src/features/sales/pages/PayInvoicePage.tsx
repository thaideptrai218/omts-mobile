import type { TraderCheckout } from "@/features/sales/models/TraderCheckout";
import { useEffect, useRef, useState } from "react";
import { Button, useNavigate, useParams, useSnackbar } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { Empty } from "@/components/Empty/Empty";
import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Section } from "@/components/Section/Section";
import { bankName } from "@/constants/banks";
import { getCheckout, linkZaloOrder, startCheckout } from "@/features/sales/services/checkoutService";
import { createCheckoutOrder, onAppResumed, onCustomPaymentSelected, saveImage } from "@/services/zaloService";
import { copyText } from "@/utils/clipboard";
import { errorText } from "@/utils/errorText";
import { dateTime, money } from "@/utils/format";
import "@/features/sales/styles/sales.scss";

/** Màn QR hỏi server mỗi 4 giây (CLAUDE.md mục 10: 3 đến 5 giây). */
const POLL_MS = 4000;

/** Bước của lần thanh toán, đọc từ trạng thái server trả về. */
type Stage = "confirm" | "transfer" | "expired" | "cancelled" | "paid" | "partial";

function stageOf(checkout: TraderCheckout): Stage {
  if (checkout.paidInFull) return "paid";
  if (checkout.paymentStatusCode === "COMPLETED") return "partial";
  if (checkout.paymentStatusCode !== "PENDING_TRANSFER") return "cancelled";
  if (checkout.expired) return "expired";
  return checkout.zaloOrderLinked ? "transfer" : "confirm";
}

const STAGE_BADGE: Record<Stage, JSX.Element> = {
  confirm: <Badge text="Chờ xác nhận trên Zalo" tone="warning" />,
  transfer: <Badge text="Chờ chuyển khoản" tone="warning" />,
  paid: <Badge text="Đã nhận đủ" tone="success" />,
  partial: <Badge text="Đã nhận một phần" tone="warning" />,
  expired: <Badge text="Hết hạn" tone="neutral" />,
  cancelled: <Badge text="Đã hủy" tone="neutral" />,
};

/**
 * Thương lái trả số còn nợ của một hóa đơn (quyết định 21/11/2026): server tạo lần thanh toán và ký đơn, app mở trang
 * thanh toán của Zalo (Checkout SDK). Người dùng chọn "Chuyển khoản bằng mã QR" thì Zalo phát `PAY_BY_CUSTOM_METHOD`,
 * app gửi mã đơn của Zalo lên server rồi tự vẽ mã QR payOS, không mở trang nào bên ngoài. Tiền về thì payOS báo server;
 * app chỉ hỏi lại server và hiện đúng trạng thái server trả về (CLAUDE.md mục 10).
 */
export default function PayInvoicePage() {
  const { id: invoiceId = "" } = useParams();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const [checkout, setCheckout] = useState<TraderCheckout | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  // Sự kiện của Zalo đến lúc nào cũng được, nên mã lần thanh toán hiện tại nằm trong ref.
  const current = useRef<string | null>(null);
  const started = useRef(false);

  const openZalo = (target: TraderCheckout) => {
    setError("");
    // Không chờ kết quả: trang thanh toán của Zalo có thể không trả về nếu người dùng đóng nó giữa chừng.
    void createCheckoutOrder(target.checkout).catch(() =>
      setError("Chưa mở được trang thanh toán của Zalo. Hãy bấm “Mở trang thanh toán của Zalo” để thử lại."),
    );
  };

  const start = async () => {
    setBusy(true);
    setError("");
    setNote("");
    try {
      const created = await startCheckout(invoiceId);
      current.current = created.id;
      setCheckout(created);
      if (stageOf(created) === "confirm") openZalo(created);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const refresh = async () => {
    const id = current.current;
    if (!id) return null;
    try {
      const fresh = await getCheckout(id);
      setCheckout(fresh);
      setError("");
      return fresh;
    } catch (err) {
      setError(errorText(err));
      return null;
    }
  };

  // Thương lái vừa bấm "Thanh toán" ở hóa đơn nên vào màn là tạo lần thanh toán và mở trang của Zalo ngay.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const offSelected = onCustomPaymentSelected(({ orderId }) => {
      const id = current.current;
      if (!id) return;
      void linkZaloOrder(id, { zaloOrderId: orderId })
        .then((linked) => {
          setCheckout(linked);
          setError("");
        })
        .catch((err: unknown) => setError(errorText(err)));
    });
    // Quay lại từ app ngân hàng thì hỏi ngay.
    const offResumed = onAppResumed(() => void refresh());
    return () => {
      offSelected();
      offResumed();
    };
  }, []);

  const stage = checkout ? stageOf(checkout) : null;

  // Chỉ hỏi khi mã QR đang hiện; hết hạn, đã nhận tiền hay rời màn thì dừng.
  useEffect(() => {
    if (stage !== "transfer") return;
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [stage]);

  const qrContent = stage === "transfer" ? checkout?.qr.content : undefined;
  useEffect(() => {
    setQrImage(null);
    if (!qrContent) return;
    let active = true;
    void import("qrcode")
      .then((QRCode) => QRCode.toDataURL(qrContent, { width: 320, margin: 4 }))
      .then((image) => {
        if (active) setQrImage(image);
      })
      .catch(() => {
        if (active) setError("Chưa vẽ được mã QR. Bạn vẫn có thể chép số tài khoản, số tiền và nội dung bên dưới.");
      });
    return () => {
      active = false;
    };
  }, [qrContent]);

  const checkNow = async () => {
    setBusy(true);
    setNote("");
    const fresh = await refresh();
    setBusy(false);
    if (fresh && stageOf(fresh) === "transfer") setNote("Chưa thấy tiền về. Ngân hàng có thể cần vài phút; màn này vẫn tự kiểm tra mỗi vài giây.");
  };

  const copy = async (text: string, what: string) => {
    const done = await copyText(text);
    openSnackbar(
      done
        ? { text: `Đã chép ${what}.`, type: "success", duration: 1500 }
        : { text: `Chưa chép được ${what}. Bạn hãy chép bằng tay.`, type: "error", duration: 4000 },
    );
  };

  const save = async () => {
    if (!qrImage) return;
    try {
      await saveImage(qrImage);
      openSnackbar({ text: "Đã lưu mã QR vào thư viện ảnh.", type: "success", duration: 1500 });
    } catch (err) {
      openSnackbar({ text: err instanceof Error ? err.message : "Chưa lưu được ảnh vào máy.", type: "error", duration: 5000 });
    }
  };

  // Mở lại hóa đơn để thấy số còn nợ mới nhất.
  const openInvoice = () => navigate(`/account/invoices?open=${encodeURIComponent(invoiceId)}`, { replace: true });

  const again = (
    <Actions>
      <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void start()}>
        Tạo mã thanh toán mới
      </Button>
      <Button fullWidth variant="secondary" onClick={openInvoice}>
        Xem hóa đơn
      </Button>
    </Actions>
  );

  const body = (shown: TraderCheckout, now: Stage) => {
    switch (now) {
      case "confirm":
        return (
          <Section title="Xác nhận trên Zalo">
            <p className="form__hint">Trang thanh toán của Zalo sẽ mở ra. Chọn “Chuyển khoản bằng mã QR” để nhận mã QR chuyển khoản.</p>
            <Actions>
              <Button fullWidth size="large" onClick={() => openZalo(shown)}>
                Mở trang thanh toán của Zalo
              </Button>
            </Actions>
          </Section>
        );
      case "transfer":
        return (
          <Section title="Chuyển khoản bằng mã QR">
            <p className="form__hint">
              Quét mã bằng app ngân hàng; số tiền và nội dung đã có sẵn trong mã. Điện thoại này không quét được mã trên chính màn hình của nó: hãy lưu ảnh
              mã rồi chọn ảnh trong app ngân hàng, hoặc chép số tài khoản.
            </p>
            {qrImage ? (
              <img className="checkout-qr" src={qrImage} alt={`Mã QR chuyển khoản hóa đơn ${shown.invoiceCode}`} />
            ) : (
              <div className="skeleton checkout-qr" aria-hidden />
            )}
            <Facts
              items={[
                ["Ngân hàng", bankName(shown.qr.bankBin)],
                ["Số tài khoản", shown.qr.accountNumber],
                ["Chủ tài khoản", shown.qr.accountName],
                ["Số tiền", money(shown.qr.amount)],
                ["Nội dung", shown.qr.transferContent],
                ["Hết hạn lúc", dateTime(shown.expiresAt)],
              ]}
            />
            {note && <p className="form__hint">{note}</p>}
            <Actions>
              <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void checkNow()}>
                Tôi đã chuyển khoản
              </Button>
              <Button fullWidth variant="secondary" disabled={!qrImage} onClick={() => void save()}>
                Lưu ảnh mã QR
              </Button>
              <Button fullWidth variant="secondary" onClick={() => void copy(shown.qr.accountNumber, "số tài khoản")}>
                Chép số tài khoản
              </Button>
              <Button fullWidth variant="secondary" onClick={() => void copy(String(shown.qr.amount), "số tiền")}>
                Chép số tiền
              </Button>
              <Button fullWidth variant="secondary" onClick={() => void copy(shown.qr.transferContent, "nội dung chuyển khoản")}>
                Chép nội dung chuyển khoản
              </Button>
            </Actions>
          </Section>
        );
      case "paid":
        return (
          <Empty
            icon="zi-check-circle"
            title="HTX đã nhận đủ tiền"
            text={`Đã nhận ${money(shown.receivedAmount)} cho hóa đơn ${shown.invoiceCode}.`}
            action={
              <Button fullWidth size="large" onClick={openInvoice}>
                Xem hóa đơn
              </Button>
            }
          />
        );
      case "partial": {
        const received = shown.receivedAmount ?? 0;
        return (
          <Empty
            icon="zi-info-circle"
            title="HTX mới nhận một phần"
            text={`Đã nhận ${money(received)}, còn thiếu ${money(shown.amount - received)}. Số còn nợ đã cập nhật trong hóa đơn; bạn có thể thanh toán tiếp từ hóa đơn.`}
            action={
              <Button fullWidth size="large" onClick={openInvoice}>
                Xem hóa đơn
              </Button>
            }
          />
        );
      }
      case "expired":
        return (
          <Empty
            icon="zi-warning-circle"
            title="Mã QR đã hết hạn"
            text="Nếu bạn đã chuyển khoản, tiền vẫn được ghi vào hóa đơn. Hãy xem lại hóa đơn trước khi tạo mã mới để không trả hai lần."
            action={again}
          />
        );
      case "cancelled":
        return <Empty icon="zi-warning-circle" title="Lần thanh toán này đã hủy" text="Lần thanh toán này đã được thay bằng lần khác. Bạn có thể tạo mã mới." action={again} />;
    }
  };

  return (
    <ManagePage title="Thanh toán hóa đơn">
      <Loadable data={checkout} error={checkout ? "" : error} reload={() => void start()}>
        {(loaded) => {
          const now = stageOf(loaded);
          return (
            <>
              <Facts
                items={[
                  ["Hóa đơn", loaded.invoiceCode],
                  ["Số tiền", money(loaded.amount)],
                  ["Mã khoản trả", loaded.paymentCode],
                  ["Trạng thái", STAGE_BADGE[now]],
                ]}
              />
              <FormError text={error} />
              {body(loaded, now)}
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}
