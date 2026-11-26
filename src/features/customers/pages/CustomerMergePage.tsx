import type { CustomerMergeParty, CustomerMergePreview } from "@/features/customers/models/Customer";
import { useCallback, useState } from "react";
import { Button, Checkbox, useNavigate, useParams, useSnackbar } from "zmp-ui";

import { Badge } from "@/components/Badge/Badge";
import { ConfirmSheet } from "@/components/ConfirmSheet/ConfirmSheet";
import FormError from "@/components/FormError/FormError";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import PagedList from "@/components/PagedList/PagedList";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { SearchBox } from "@/components/SearchBox/SearchBox";
import { Section } from "@/components/Section/Section";
import { useLoad } from "@/hooks/useLoad";
import { usePaged } from "@/hooks/usePaged";
import { isApiError } from "@/services/errors";
import { errorText } from "@/utils/errorText";
import { money } from "@/utils/format";
import { getCustomer, listCustomers, mergeCustomer, previewMerge } from "@/features/customers/services/customerService";
import { CUSTOMER_STATUS, customerStatus, debtLabel, REFERENCE_TEXT } from "@/features/customers/utils/customerText";
import "@/features/customers/styles/customers.scss";

/**
 * Gộp hồ sơ trùng (SALE-04.3): giữ hồ sơ đang mở, chọn hồ sơ trùng, xem hai hồ sơ và những gì sẽ chuyển sang, rồi gộp.
 * Không hoàn tác được. Hồ sơ có tài khoản thương lái chỉ gộp được vào hồ sơ cũng có tài khoản (MSG-SALE-05); người không phải
 * Chủ HTX xác nhận Chủ HTX đã đồng ý (MSG-SALE-04, BR-SALE-04).
 */
function CustomerMergePage() {
  const { id = "" } = useParams();
  // Đổi chiều gộp mở lại màn này với hồ sơ khác: dựng lại từ đầu để không giữ lỗi và lựa chọn của hồ sơ trước.
  return <MergeFlow key={id} id={id} />;
}

function MergeFlow({ id }: { id: string }) {
  const kept = useLoad(() => getCustomer(id), [id]);
  const [preview, setPreview] = useState<CustomerMergePreview | null>(null);
  const [error, setError] = useState("");
  const [swapId, setSwapId] = useState("");
  const [busy, setBusy] = useState(false);

  const choose = async (mergedId: string) => {
    setBusy(true);
    setError("");
    setSwapId("");
    try {
      setPreview(await previewMerge(id, mergedId));
    } catch (err) {
      setError(errorText(err));
      // Hồ sơ trùng có tài khoản thương lái mà hồ sơ đang mở thì không: phải giữ hồ sơ có tài khoản (SALE-04.3.E1).
      if (isApiError(err) && err.details.canKeepMergedInstead === true) setSwapId(mergedId);
    } finally {
      setBusy(false);
    }
  };

  return kept.data && preview ? (
    <MergeConfirm keptId={id} preview={preview} onBack={() => setPreview(null)} />
  ) : (
    <ManagePage title="Gộp hồ sơ trùng">
      <Loadable data={kept.data} error={kept.error} reload={() => void kept.reload()}>
        {(c) =>
          c.mergedIntoCustomerId ? (
            <p className="card form customer-notice">Hồ sơ này đã được gộp vào hồ sơ khác nên không gộp thêm được.</p>
          ) : (
            <>
              <p className="form__intro">
                Giữ lại hồ sơ <strong>{c.name}</strong> ({c.code}). Chọn hồ sơ trùng của cùng thương lái để gộp vào: hóa đơn, phiếu thu và công nợ của hồ sơ đó sẽ tính ở hồ sơ này.
              </p>
              <FormError text={error} />
              {swapId && <SwapHint mergedId={swapId} />}
              <Candidates keptId={c.id} busy={busy} onChoose={(mergedId) => void choose(mergedId)} />
            </>
          )
        }
      </Loadable>
    </ManagePage>
  );
}

/** Danh sách hồ sơ để chọn hồ sơ trùng, kể cả hồ sơ ngừng dùng; bỏ hồ sơ đang giữ lại. */
function Candidates({ keptId, busy, onChoose }: { keptId: string; busy: boolean; onChoose: (id: string) => void }) {
  const [search, setSearch] = useState("");
  // Bỏ hồ sơ đang giữ lại ngay khi tải, để số hồ sơ và "Tải thêm" đúng, không còn khung trống khi chỉ tìm thấy chính nó.
  const fetchPage = useCallback(
    async (page: number) => {
      const result = await listCustomers({ search, status: "All", page });
      const items = result.items.filter((c) => c.id !== keptId);
      return { ...result, items, total: result.total - (result.items.length - items.length) };
    },
    [search, keptId],
  );
  const list = usePaged(fetchPage);
  return (
    <Section title="Chọn hồ sơ trùng">
      <SearchBox label="Tìm hồ sơ" placeholder="Tên, mã hoặc số điện thoại" onSearch={setSearch} />
      <PagedList list={list} unit="hồ sơ" emptyIcon="zi-user-circle" emptyTitle="Không tìm thấy hồ sơ nào" emptyText="Thử tìm bằng tên hoặc số điện thoại khác.">
        {(c) => {
          const st = customerStatus(c);
          return (
            <Row
              key={c.id}
              title={c.name}
              meta={[c.code, c.phoneNumber].filter(Boolean).join(" · ")}
              badge={
                c.statusId !== CUSTOMER_STATUS.inUse || c.hasTraderAccount ? (
                  <>
                    {c.statusId !== CUSTOMER_STATUS.inUse && <Badge text={st.text} tone={st.tone} />}
                    {c.hasTraderAccount && <Badge text="Có tài khoản thương lái" tone="neutral" />}
                  </>
                ) : undefined
              }
              onClick={busy ? undefined : () => onChoose(c.id)}
            />
          );
        }}
      </PagedList>
    </Section>
  );
}

/** Gợi ý đổi chiều gộp: mở hồ sơ có tài khoản thương lái để giữ nó lại. */
function SwapHint({ mergedId }: { mergedId: string }) {
  const navigate = useNavigate();
  return (
    <Button fullWidth variant="secondary" size="large" className="more" onClick={() => navigate(`/manage/customers/${mergedId}/merge`, { replace: true })}>
      Giữ hồ sơ có tài khoản thương lái
    </Button>
  );
}

function Party({ role, party }: { role: string; party: CustomerMergeParty }) {
  const debt = debtLabel(party.currentDebt);
  return (
    <div className="card form customer-party">
      <span className="customer-party__role">{role}</span>
      <span className="customer-party__name">{party.name}</span>
      <span>{[party.code, party.phoneNumber].filter(Boolean).join(" · ")}</span>
      <span>
        {debt.text}: <strong>{money(Math.abs(party.currentDebt))}</strong>
      </span>
      {party.hasTraderAccount && <Badge text="Có tài khoản thương lái" tone="neutral" />}
    </div>
  );
}

/** SALE-04.3 bước 3 đến 5: hai hồ sơ, những gì chuyển sang, xác nhận rồi gộp. */
function MergeConfirm({ keptId, preview, onBack }: { keptId: string; preview: CustomerMergePreview; onBack: () => void }) {
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();
  const [approved, setApproved] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const moved = preview.countedWithKept.filter((r) => r.count > 0);
  const ready = !preview.requiresOwnerApproval || approved;

  const merge = async () => {
    setBusy(true);
    setError("");
    try {
      await mergeCustomer(keptId, {
        mergedCustomerId: preview.merged.id,
        keptRowVersion: preview.kept.rowVersion,
        mergedRowVersion: preview.merged.rowVersion,
        ownerApproved: preview.requiresOwnerApproval && approved,
      });
      openSnackbar({ text: "Đã gộp hồ sơ.", type: "success", duration: 4000 });
      navigate(`/manage/customers/${keptId}`, { replace: true });
    } catch (err) {
      setError(errorText(err));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ManagePage
      title="Gộp hồ sơ trùng"
      onBack={onBack}
      footer={
        <Button fullWidth size="large" type="danger" disabled={!ready || busy} onClick={() => setConfirming(true)}>
          Gộp hồ sơ
        </Button>
      }
    >
      <Party role="Hồ sơ giữ lại" party={preview.kept} />
      <Party role="Hồ sơ gộp vào" party={preview.merged} />

      <Section title="Sẽ chuyển sang hồ sơ giữ lại">
        {moved.length === 0 ? (
          <p className="form__hint">Hồ sơ gộp vào chưa có hóa đơn, phiếu thu hay yêu cầu mua nào.</p>
        ) : (
          <Rows>
            {moved.map((r) => (
              <Row key={r.name} title={REFERENCE_TEXT[r.name] ?? r.name} value={r.count} />
            ))}
          </Rows>
        )}
      </Section>

      <div className="card form customer-notice">
        <p>Gộp xong không hoàn tác được. Hồ sơ {preview.merged.name} chỉ còn để xem và không chọn được khi lập hóa đơn.</p>
        {preview.locksMergedAccount && <p>Tài khoản thương lái của hồ sơ {preview.merged.name} sẽ bị khóa, không đăng nhập được nữa. Hồ sơ giữ lại giữ tài khoản của nó.</p>}
        {preview.requiresOwnerApproval && (
          <Checkbox className="customer-option" value="owner-approved" checked={approved} disabled={busy} onChange={(e) => { setApproved(e.target.checked); setError(""); }}>
            Chủ HTX đã đồng ý gộp {preview.merged.name} vào {preview.kept.name}
          </Checkbox>
        )}
        <FormError text={error} />
      </div>

      <Button fullWidth variant="secondary" size="large" disabled={busy} onClick={onBack}>
        Chọn hồ sơ khác
      </Button>

      <ConfirmSheet
        visible={confirming}
        title="Gộp hai hồ sơ?"
        message={`Gộp ${preview.merged.name} vào ${preview.kept.name}. Thao tác này không hoàn tác được và được ghi vào nhật ký hệ thống.`}
        confirmText="Gộp hồ sơ"
        danger
        busy={busy}
        onClose={() => setConfirming(false)}
        onConfirm={() => void merge()}
      />
    </ManagePage>
  );
}

export default CustomerMergePage;
