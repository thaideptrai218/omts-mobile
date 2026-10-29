import { useAtomValue } from "jotai";
import { FormEvent, useState } from "react";
import { Button, Input, Select } from "zmp-ui";

import FormError from "@/components/form-error";
import DateField from "@/components/manage/date-field";
import { Badge, Chips, Empty, Facts, ManagePage, Row, Rows, Section } from "@/components/manage/ui";
import { date, num } from "@/services/format";
import { newPurchasePreview, PREVIEW_PRODUCT, type PurchasePreview, validatePurchasePreview } from "@/services/trader/purchase-preview";
import { permissionsAtom, sessionAtom } from "@/state/session";

/** Bảo vệ cả truy cập trực tiếp; form không tồn tại khi chưa có phiên và quyền Trader. */
export default function TraderPurchasesPage() {
  const session = useAtomValue(sessionAtom);
  const permissions = useAtomValue(permissionsAtom);
  if (!session) return <ManagePage title="Mua hàng của tôi"><Empty title="Vui lòng liên kết tài khoản" /></ManagePage>;
  if (!permissions) return <ManagePage title="Mua hàng của tôi"><div className="skeleton skeleton--form" aria-busy /></ManagePage>;
  if (permissions.accountId !== session.accountId || permissions.subjectType !== "Trader") {
    return <ManagePage title="Mua hàng của tôi"><Empty icon="zi-lock" title="Chức năng dành cho thương lái" /></ManagePage>;
  }
  // Đổi tài khoản sẽ hủy toàn bộ bản nháp đang xem, không chia sẻ dữ liệu giữa các tài khoản.
  return <PurchaseWorkspace key={session.accountId} />;
}

function PurchaseWorkspace() {
  const [tab, setTab] = useState<"requests" | "invoices">("requests");
  const [view, setView] = useState<"list" | "form" | "review">("list");
  const [draft, setDraft] = useState<PurchasePreview>(newPurchasePreview);
  const [preview, setPreview] = useState<PurchasePreview | null>(null);
  const [error, setError] = useState("");
  const change = (patch: Partial<PurchasePreview>) => { setDraft((value) => ({ ...value, ...patch })); setError(""); };
  const review = (event: FormEvent) => {
    event.preventDefault();
    const validation = validatePurchasePreview(draft);
    setError(validation);
    if (validation) return;
    setPreview({ ...draft, note: draft.note.trim() });
    setView("review");
  };
  const edit = () => { if (preview) setDraft(preview); setError(""); setView("form"); };

  return (
    <ManagePage title={view === "form" ? "Tạo yêu cầu mua" : view === "review" ? "Xem trước yêu cầu" : "Mua hàng của tôi"}>
      <div className="card form" role="note">
        <Badge text="Bản xem thử" tone="warning" />
        <p className="form__hint">Sản phẩm mẫu; yêu cầu chưa gửi đến HTX. Bản nháp chỉ giữ khi đang ở màn này, rời màn sẽ mất.</p>
      </div>

      {view === "list" && <>
        <Chips options={[["requests", "Yêu cầu mua"], ["invoices", "Hóa đơn"]]} value={tab} onChange={setTab} />
        {tab === "requests" ? <Section title="Yêu cầu của bạn">
          {preview ? <Rows><Row title={PREVIEW_PRODUCT.name} meta={`${num(Number(preview.kg.replace(",", ".")), "kg")} · nhận ${date(preview.pickupDate)}`} badge={<Badge text="Bản nháp xem thử · chưa gửi" tone="neutral" />} onClick={() => setView("review")} /></Rows>
            : <Empty icon="zi-note" title="Chưa có bản nháp xem thử" text="Nhập sản phẩm, số kg và ngày nhận để xem trước yêu cầu mua." />}
          <Button fullWidth size="large" onClick={() => { setDraft(preview ?? newPurchasePreview()); setError(""); setView("form"); }}>{preview ? "Sửa bản nháp" : "Tạo yêu cầu mua thử"}</Button>
        </Section> : <Empty icon="zi-file" title="Chưa hỗ trợ xem hóa đơn ở bản này" text="Hóa đơn thật sẽ hiển thị tại đây khi chức năng mua hàng được kết nối." />}
      </>}

      {view === "form" && <form className="card form" onSubmit={review} noValidate>
        <p className="form__intro">Yêu cầu mua giúp HTX chuẩn bị hàng. Yêu cầu không chốt giá và không giữ hàng.</p>
        <Select label="Sản phẩm" value={draft.productId} onChange={(value) => change({ productId: String(value) })} closeOnSelect>
          <Select.Option value={PREVIEW_PRODUCT.id} title={PREVIEW_PRODUCT.name} />
        </Select>
        <Input label="Số kg dự kiến" placeholder="Ví dụ: 150 hoặc 150,5" value={draft.kg} inputMode="decimal" onChange={(event) => change({ kg: event.target.value })} />
        <DateField label="Ngày nhận hàng dự kiến" value={draft.pickupDate} onChange={(value) => change({ pickupDate: value })} />
        <Input.TextArea label="Ghi chú (không bắt buộc)" placeholder="Ví dụ: nhận hàng vào buổi sáng" value={draft.note} onChange={(event) => change({ note: event.target.value })} />
        <FormError text={error} />
        <Button htmlType="submit" fullWidth size="large">Xem trước yêu cầu</Button>
        <Button fullWidth size="large" variant="secondary" onClick={() => setView("list")}>Về danh sách</Button>
      </form>}

      {view === "review" && preview && <>
        <Facts items={[
          ["Trạng thái", <Badge key="draft" text="Bản nháp xem thử · chưa gửi" tone="neutral" />],
          ["Sản phẩm", PREVIEW_PRODUCT.name],
          ["Số kg dự kiến", num(Number(preview.kg.replace(",", ".")), "kg")],
          ["Ngày nhận dự kiến", date(preview.pickupDate)],
          ["Ghi chú", preview.note || "Không có"],
        ]} />
        <div className="card form">
          <p className="form__hint">HTX chưa nhận được yêu cầu này. Bản xem thử chưa hỗ trợ gửi yêu cầu.</p>
          <Button fullWidth size="large" onClick={edit}>Sửa thông tin</Button>
          <Button fullWidth size="large" variant="secondary" onClick={() => setView("list")}>Về danh sách</Button>
        </div>
      </>}
    </ManagePage>
  );
}
