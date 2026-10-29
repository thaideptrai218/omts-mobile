import { useNavigate, useParams } from "zmp-ui";

import { Badge, Facts, Loadable, ManagePage, Row, Rows, Section } from "@/components/manage/ui";
import { useLoad } from "@/hooks/use-load";
import { getLicense } from "@/services/farm";
import { date } from "@/services/format";
import { DOCUMENT_TYPE, LICENSE_STATE } from "@/services/labels";

/**
 * Xem một giấy tờ pháp lý của vùng nuôi. Thêm, sửa, thay giấy tờ cần tải tệp scan nên làm trên bản web.
 */
function LicenseDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data, error, reload } = useLoad(() => getLicense(id), [id]);

  return (
    <ManagePage title="Giấy tờ pháp lý">
      <Loadable data={data} error={error} reload={() => void reload()}>
        {(l) => {
          const state = LICENSE_STATE[l.state] ?? { text: l.state, tone: "neutral" as const };
          return (
            <>
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
              <Section title="Áp dụng cho vùng">
                <Rows>
                  {l.zones.map((z) => (
                    <Row key={z.id} title={z.name} meta={z.code} onClick={() => navigate(`/manage/zones/${z.id}`)} />
                  ))}
                </Rows>
              </Section>
              <p className="screen__note">Thêm, sửa hoặc thay giấy tờ (kèm bản scan) làm trên bản web.</p>
            </>
          );
        }}
      </Loadable>
    </ManagePage>
  );
}

export default LicenseDetailPage;
