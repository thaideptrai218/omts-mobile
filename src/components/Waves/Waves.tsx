/**
 * Viền sóng nơi biển (đầu trang) gặp bãi cát (nền trang). Khung vẽ rộng gấp đôi màn hình, chu kỳ sóng chia hết cho 720
 * để lớp sóng sau trôi lặp liền mạch. Chỉ trang chủ (`tall`) mới có sóng trôi; trang phụ đứng yên và thấp hơn.
 */
export function Waves({ tall = false }: { tall?: boolean }) {
  return (
    <div className={`waves${tall ? " waves--tall" : ""}`} aria-hidden>
      <svg className="waves__layer waves__layer--back" viewBox="0 0 720 60" preserveAspectRatio="none">
        <path d="M0 26Q60 4 120 26T240 26T360 26T480 26T600 26T720 26V60H0Z" />
      </svg>
      <svg className="waves__layer waves__layer--mid" viewBox="0 0 720 60" preserveAspectRatio="none">
        <path d="M0 36Q45 16 90 36T180 36T270 36T360 36T450 36T540 36T630 36T720 36V60H0Z" />
      </svg>
      <svg className="waves__layer waves__layer--front" viewBox="0 0 720 60" preserveAspectRatio="none">
        <path className="waves__sand" d="M0 44Q60 30 120 44T240 44T360 44T480 44T600 44T720 44V60H0Z" />
        <path className="waves__foam" d="M0 44Q60 30 120 44T240 44T360 44T480 44T600 44T720 44" />
      </svg>
    </div>
  );
}
