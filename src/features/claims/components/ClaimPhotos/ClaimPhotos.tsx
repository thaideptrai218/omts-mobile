import type { QualityClaimPhoto } from "@/features/claims/models/QualityClaim";
import { useState } from "react";
import { ImageViewer } from "zmp-ui";

import { absoluteUrl } from "@/services/httpClient";

/**
 * Ảnh của khiếu nại xếp lưới hai cột; bấm một ảnh để xem to, vuốt để xem ảnh khác. Link ảnh chỉ dùng được một giờ
 * (BR-CLAIM-01), mở lại màn là có link mới.
 */
export function ClaimPhotos({ photos }: { photos: QualityClaimPhoto[] }) {
  const [opened, setOpened] = useState<number | null>(null);
  const images = [...photos]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p, i) => ({ key: p.sortOrder, src: absoluteUrl(p.url) ?? "", alt: `Ảnh ${i + 1} của khiếu nại` }));
  if (images.length === 0) return null;
  return (
    <>
      <div className="claim-photos">
        {images.map((image, i) => (
          <button key={image.key} type="button" className="claim-photo-button" onClick={() => setOpened(i)} aria-label={`Xem to ảnh ${i + 1}`}>
            <img className="claim-photo" src={image.src} alt={image.alt} loading="lazy" />
          </button>
        ))}
      </div>
      <ImageViewer
        images={images.map(({ src, alt }) => ({ src, alt }))}
        activeIndex={opened ?? 0}
        visible={opened !== null}
        onClose={() => setOpened(null)}
      />
    </>
  );
}
