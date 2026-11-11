import type { SandboxLogLine, SandboxOrder } from "@/features/development/models/PaymentSandbox";
import { useEffect, useRef, useState } from "react";
import { Button } from "zmp-ui";

import { Facts } from "@/components/Facts/Facts";
import FormError from "@/components/FormError/FormError";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { NumberInput } from "@/components/NumberInput/NumberInput";
import { Section } from "@/components/Section/Section";
import { createSandboxOrder, getSandboxOrder, linkSandboxOrder } from "@/features/development/services/paymentSandboxService";
import { createCheckoutOrder, onAppResumed, onCustomPaymentSelected } from "@/services/zaloService";
import { dateTime, money, parseNumber } from "@/utils/format";

const POLL_MS = 4000;

/**
 * Màn thử thanh toán, chỉ có ở bản dev: tạo đơn qua Checkout SDK, chọn phương thức riêng thì hiện QR của payOS, hỏi
 * server tới khi có kết quả. Trạng thái "đã thanh toán" luôn lấy từ server. Nhật ký cuối màn để đọc lỗi khi chạy trên điện thoại.
 */
function PaymentSandboxPage() {
  const [amount, setAmount] = useState("2000");
  const [order, setOrder] = useState<SandboxOrder | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lines, setLines] = useState<SandboxLogLine[]>([]);
  const current = useRef<string | null>(null);
  const qrSection = useRef<HTMLDivElement>(null);

  const note = (text: string) => setLines((list) => [{ at: new Date().toLocaleTimeString("vi-VN"), text }, ...list]);

  const refresh = async () => {
    if (!current.current) return;
    try {
      setOrder(await getSandboxOrder(current.current));
    } catch (err) {
      note(err instanceof Error ? err.message : "Lỗi khi hỏi trạng thái đơn.");
    }
  };

  // Sự kiện có thể đến trước khi createOrder trả kết quả nên đơn hiện tại nằm trong ref.
  useEffect(() => {
    const offSelected = onCustomPaymentSelected(({ method, orderId }) => {
      note(`Zalo báo chọn phương thức riêng ${method}, đơn ${orderId}`);
      setShowQr(true);
      if (current.current) void linkSandboxOrder(current.current, orderId, method).then(setOrder).catch((err: Error) => note(err.message));
    });
    const offResumed = onAppResumed(() => {
      note("Quay lại app, kiểm tra đơn");
      void refresh();
    });
    return () => {
      offSelected();
      offResumed();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pending = order?.status === "PENDING";

  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  useEffect(() => {
    if (!showQr || !order) return;
    let active = true;
    void import("qrcode")
      .then((QRCode) => QRCode.toDataURL(order.qr.content, { width: 320, margin: 4 }))
      .then((image) => {
        if (active) setQrImage(image);
        qrSection.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    return () => {
      active = false;
    };
  }, [showQr, order?.qr.content]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    const value = parseNumber(amount);
    if (value === null) {
      setError("Nhập số tiền.");
      return;
    }
    setBusy(true);
    setError("");
    setShowQr(false);
    setQrImage(null);
    setOrder(null);
    try {
      const created = await createSandboxOrder(value);
      current.current = created.order.id;
      setOrder(created.order);
      note(`Server tạo đơn ${created.order.code}, ${created.order.amount} đ`);
      if (!created.checkout) {
        note("Chưa có phương thức riêng: bỏ qua bước thanh toán của Zalo, chỉ thử chuyển khoản");
        setShowQr(true);
        return;
      }
      // Không chờ kết quả ở đây: trang thanh toán của Zalo có thể không trả về nếu người dùng đóng nó giữa chừng.
      void createCheckoutOrder(created.checkout)
        .then((orderId) => {
          note(`Thanh toán của Zalo tạo đơn ${orderId}`);
          return linkSandboxOrder(created.order.id, orderId).then(setOrder);
        })
        .catch((err: unknown) => {
          const text = err instanceof Error ? err.message : JSON.stringify(err);
          note(`Zalo báo lỗi khi tạo đơn: ${text}`);
          setError(`Zalo báo lỗi khi tạo đơn: ${text}`);
        });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chưa tạo được đơn.");
    } finally {
      setBusy(false);
    }
  };

  const statusText = !order ? null : order.status === "PAID" ? "Đã nhận tiền" : order.status === "EXPIRED" ? "Hết hạn" : "Đang chờ chuyển khoản";

  return (
    <ManagePage title="Thử thanh toán">
      <p className="screen__note">Màn thử của bản dev, không gắn với hóa đơn thật. Cổng chuyển khoản không có môi trường thử nên chuyển khoản là tiền thật, chỉ chuyển số nhỏ.</p>
      <div className="form">
        <NumberInput label="Số tiền (đồng)" helperText="Từ 2.000 đến 100.000 đồng" value={amount} onChange={setAmount} disabled={busy} />
        <FormError text={error} />
        <Button fullWidth size="large" loading={busy} disabled={busy} onClick={() => void start()}>
          {order ? "Tạo đơn khác" : "Tạo đơn thử"}
        </Button>
      </div>

      {order && (
        <Section title="Đơn đang thử">
          <Facts
            items={[
              ["Mã đơn", order.code],
              ["Số tiền", money(order.amount)],
              ["Trạng thái", statusText],
              ["Hạn thanh toán", dateTime(order.expiresAt)],
              ["Mã đơn của Zalo", order.zaloOrderId],
              ["Đã báo Zalo", order.zaloReport ? (order.zaloReport.err === 0 ? "Thành công" : `Lỗi ${order.zaloReport.err ?? ""}: ${order.zaloReport.msg ?? ""}`) : null],
            ]}
          />
        </Section>
      )}

      {order && showQr && pending && (
        <div ref={qrSection}>
        <Section title="Chuyển khoản bằng mã QR">
          {qrImage && <img className="record-photo" src={qrImage} alt={`Mã QR đơn ${order.code}`} />}
          <Facts
            items={[
              ["Mã ngân hàng", order.qr.bankBin],
              ["Số tài khoản", order.qr.accountNumber],
              ["Chủ tài khoản", order.qr.accountName],
              ["Số tiền", money(order.amount)],
              ["Nội dung", order.qr.description],
            ]}
          />
          <Button fullWidth variant="secondary" size="large" onClick={() => void refresh()}>
            Tôi đã chuyển khoản
          </Button>
        </Section>
        </div>
      )}

      {lines.length > 0 && (
        <Section title="Nhật ký">
          {lines.map((line, index) => (
            <p key={`${line.at}-${index}`} className="form__hint">
              {line.at} · {line.text}
            </p>
          ))}
        </Section>
      )}
    </ManagePage>
  );
}

export default PaymentSandboxPage;
