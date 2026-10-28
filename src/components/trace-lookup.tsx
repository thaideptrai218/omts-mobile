import { FormEvent, useEffect, useState } from "react";
import { Button, Icon, Input, useSnackbar } from "zmp-ui";

import { SAMPLE_LOT, TraceLot } from "@/data/content";
import { lotCodeFrom as lotCodeInQr } from "@/services/scan-targets";
import { scanQr, ScanUnavailable } from "@/services/zalo";

/** Mã lô từ nội dung QR (deeplink `?lot=` hoặc chính mã lô) hoặc từ ô nhập tay. */
function lotCodeFrom(text: string) {
  return lotCodeInQr(text) ?? text.trim().toUpperCase();
}

/** Ô tra cứu mã lô, nút quét QR và kết quả truy xuất. Không cần đăng nhập. `initialCode`: tra ngay khi mở. */
function TraceLookup({ initialCode }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode ?? "");
  const [lot, setLot] = useState<TraceLot | null>(null);
  const [error, setError] = useState("");
  const { openSnackbar } = useSnackbar();

  const lookup = (raw: string) => {
    const value = lotCodeFrom(raw);
    if (!value) {
      setError("Nhập mã lô in bên dưới mã QR trên bao bì.");
      setLot(null);
      return;
    }
    // Dữ liệu mẫu: khi nối API sẽ gọi OMTS.Api để lấy thông tin công khai của lô.
    if (value === SAMPLE_LOT.code) {
      setLot(SAMPLE_LOT);
      setError("");
    } else {
      setLot(null);
      setError(`Không tìm thấy lô ${value}. Kiểm tra lại mã in bên dưới mã QR.`);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    lookup(code);
  };

  useEffect(() => {
    if (initialCode) lookup(initialCode);
    // Chỉ tra một lần khi mở từ mã QR; mã khác thì trang tạo lại component (key).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScan = async () => {
    try {
      const content = await scanQr();
      setCode(lotCodeFrom(content));
      lookup(content);
    } catch (err) {
      if (err instanceof ScanUnavailable && !err.insideZalo) {
        openSnackbar({ type: "info", text: "Chỉ quét được khi mở trong Zalo. Bạn có thể nhập mã lô." });
      }
    }
  };

  return (
    <div className="trace">
      {/* Quét QR là cách dễ nhất cho người lớn tuổi nên đặt lên đầu, nhập mã là cách dự phòng. */}
      <Button size="large" fullWidth prefixIcon={<Icon icon="zi-qrline" size={28} />} onClick={onScan}>
        Quét mã QR
      </Button>
      <p className="trace__or">hoặc nhập mã lô in bên dưới mã QR</p>
      <form className="trace__form" onSubmit={onSubmit}>
        <Input
          label="Mã lô"
          size="large"
          placeholder="Ví dụ TN-2410-07"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          helperText={error ? undefined : "Thử với mã mẫu TN-2410-07"}
          errorText={error || undefined}
          status={error ? "error" : undefined}
          clearable
        />
        <Button htmlType="submit" size="large" variant="secondary" fullWidth className="trace__submit">
          Tra cứu
        </Button>
      </form>

      {lot && <TraceResult lot={lot} />}
    </div>
  );
}

function TraceResult({ lot }: { lot: TraceLot }) {
  return (
    <section className="lot" aria-live="polite">
      <div className="lot__head">
        <p className="lot__code">Lô {lot.code}</p>
        <h2 className="lot__product">{lot.product}</h2>
        <p className="lot__verified">
          <Icon icon="zi-check-circle-solid" size={20} />
          Thông tin do HTX Thủy sản Trung Nam công bố
        </p>
      </div>
      <dl className="lot__facts">
        <div>
          <dt>Vùng nuôi</dt>
          <dd>{lot.zone}</dd>
        </div>
        <div>
          <dt>Ngày thu hoạch</dt>
          <dd>{lot.harvestDate}</dd>
        </div>
        <div>
          <dt>Khối lượng lô</dt>
          <dd>{lot.weight}</dd>
        </div>
        <div>
          <dt>Môi trường nước</dt>
          <dd>{lot.water}</dd>
        </div>
      </dl>
      <h3 className="lot__journey-title">Hành trình của lô hàu</h3>
      <ol className="journey">
        {lot.steps.map((s) => (
          <li key={s.title} className="journey__step">
            <p className="journey__title">{s.title}</p>
            <p className="journey__date">{s.date}</p>
            <p className="journey__detail">{s.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default TraceLookup;
