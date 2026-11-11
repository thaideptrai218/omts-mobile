import { Button, useNavigate, useParams } from "zmp-ui";

import { Actions } from "@/components/Actions/Actions";
import { Badge } from "@/components/Badge/Badge";
import { Facts } from "@/components/Facts/Facts";
import { Loadable } from "@/components/Loadable/Loadable";
import { ManagePage } from "@/components/ManagePage/ManagePage";
import { Row } from "@/components/Row/Row";
import { Rows } from "@/components/Rows/Rows";
import { Section } from "@/components/Section/Section";
import { useLoad } from "@/hooks/useLoad";
import { getLicense } from "@/features/farming/services/farmService";
import { absoluteUrl } from "@/services/httpClient";
import { date } from "@/utils/format";
import { DOCUMENT_TYPE, LICENSE_STATE } from "@/utils/labels";

/**
 * Xem một giấy tờ pháp lý của vùng nuôi, sửa hoặc thay bằng giấy tờ mới. Tệp PDF chỉ xem được trên bản web.
 */
function LicenseDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, error, reload } = useLoad(() => getLicense(id), [id]);

  return (
    <ManagePage
      title="Giấy tờ pháp lý"
      footer={
        data && !data.replacedByDocumentId ? (
          <Button fullWidth size="large" onClick={() => navigate(`/manage/licenses/${data.id}/replace`)}>
            Thay giấy tờ mới
          </Button>
        ) : undefined
      }
    >
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(l) => {
          const state = LICENSE_STATE[l.state] ?? { text: l.state, tone: "neutral" as const };
          return (
            <>
              {l.fileUrl && !/\.pdf(\?|$)/i.test(l.fileUrl) && <img className="record-photo" src={absoluteUrl(l.fileUrl) ?? undefined} alt="Ảnh giấy tờ" />}
              <Facts
                items={[
                  ["Loại giấy tờ", DOCUMENT_TYPE[l.documentType ?? ""] ?? l.documentTypeName],
                  ["Số", l.documentNumber],
                  ["Tình trạng", <Badge key="s" text={state.text} tone={state.tone} />],
                  ["Ngày hiệu lực", date(l.effectiveDate)],
                  ["Ngày hết hạn", l.expiryDate ? date(l.expiryDate) : "Không thời hạn"],
                  ["Cơ quan cấp", l.issuingAuthority],
                  ["Người đứng tên", l.holder],
                  ["Phạm vi", l.legalScope],
                ]}
              />
              {l.replacedByDocumentId && (
                <p className="screen__note">Giấy tờ này đã được thay bằng giấy tờ mới.</p>
              )}
              {!l.replacedByDocumentId && (
                <Actions>
                  <Button variant="secondary" size="large" onClick={() => navigate(`/manage/licenses/${l.id}/edit`)}>
                    Sửa giấy tờ
                  </Button>
                </Actions>
              )}
              <Section title="Áp dụng cho vùng">
                <Rows>
                  {l.zones.map((z) => (
                    <Row key={z.id} title={z.name} meta={z.code} onClick={() => navigate(`/manage/zones/${z.id}`)} />
                  ))}
                </Rows>
              </Section>
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}

export default LicenseDetailPage;
