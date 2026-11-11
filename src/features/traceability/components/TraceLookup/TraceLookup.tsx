import type { TraceLot } from "@/features/traceability/models/TraceLot";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Button, Icon, Input, useSnackbar } from "zmp-ui";

import { publicOrigin, toTraceLots } from "@/features/traceability/services/originService";
import { ApiError } from "@/services/errors";
import { scanQr, ScanUnavailable } from "@/services/zaloService";
import { errorText } from "@/utils/errorText";
import { originTokenFrom } from "@/utils/scanTargets";

/** Ô dán mã truy xuất, nút quét QR và kết quả truy xuất. Không cần đăng nhập. `initialToken`: tra ngay khi mở. */
function TraceLookup({ initialToken }: { initialToken?: string }) {
  const [text, setText] = useState(initialToken ?? "");
  const [lots, setLots] = useState<TraceLot[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const latest = useRef(0);
  const { openSnackbar } = useSnackbar();

  const lookup = async (raw: string) => {
    const token = originTokenFrom(raw);
    if (!token) {
      setError("Mã chưa đúng. Hãy quét mã QR trên bao bì, hoặc dán nguyên đường link truy xuất.");
      setLots(null);
      return;
    }
    const id = ++latest.current;
    setBusy(true);
    setError("");
    try {
      const found = toTraceLots(await publicOrigin(token));
      if (id === latest.current) setLots(found);
    } catch (err) {
      if (id !== latest.current) return;
      setLots(null);
      setError(err instanceof ApiError && err.status === 404
        ? "Không tìm thấy thông tin truy xuất của mã này. Mã có thể chưa được HTX công bố."
        : errorText(err));
    } finally {
      if (id === latest.current) setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void lookup(text);
  };

  useEffect(() => {
    if (initialToken) void lookup(initialToken);
    // Chỉ tra một lần khi mở từ mã QR; mã khác thì trang tạo lại component (key).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScan = async () => {
    try {
      const content = await scanQr();
      setText(originTokenFrom(content) ?? content);
      void lookup(content);
    } catch (err) {
      if (err instanceof ScanUnavailable && !err.insideZalo) {
        openSnackbar({ type: "info", text: "Chỉ quét được khi mở trong Zalo. Bạn có thể dán đường link truy xuất." });
      }
    }
  };

  return (
    <div className="trace">
      {/* Quét QR là cách dễ nhất cho người lớn tuổi nên đặt lên đầu, dán đường link là cách dự phòng. */}
      <Button size="large" fullWidth prefixIcon={<Icon icon="zi-qrline" size={28} />} onClick={onScan}>
        Quét mã QR
      </Button>
      <p className="trace__or">hoặc dán đường link truy xuất</p>
      <form className="trace__form" onSubmit={onSubmit}>
        <Input
          label="Đường link hoặc mã truy xuất"
          size="large"
          placeholder="Dán đường link in kèm mã QR"
          value={text}
          onChange={(e) => setText(e.target.value)}
          errorText={error || undefined}
          status={error ? "error" : undefined}
          clearable
        />
        <Button htmlType="submit" size="large" variant="secondary" fullWidth className="trace__submit" loading={busy} disabled={busy}>
          Tra cứu
        </Button>
      </form>

      {busy && !lots && (
        <div className="loading" role="status" aria-busy>
          <p className="loading__text">Đang tải...</p>
        </div>
      )}
      {lots?.map((lot) => (lot.withdrawn ? <WithdrawnLot key={lot.code} lot={lot} /> : <TraceResult key={lot.code} lot={lot} />))}
    </div>
  );
}

function WithdrawnLot({ lot }: { lot: TraceLot }) {
  return (
    <section className="lot" aria-live="polite">
      <div className="lot__head">
        <p className="lot__code">Lô {lot.code}</p>
        <h2 className="lot__product">Thông tin đã được thu hồi</h2>
        <p className="lot__verified">
          <Icon icon="zi-warning-circle" size={20} />
          {lot.publisher} đã thu hồi thông tin nguồn gốc của lô này ngày {lot.withdrawn}.
        </p>
      </div>
    </section>
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
          Thông tin do {lot.publisher} công bố
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
          <dt>Khối lượng bán ra</dt>
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
