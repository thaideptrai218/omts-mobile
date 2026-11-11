import { useId } from "react";

/** Con hàu mở vỏ có viên ngọc: hình của HTX ở trang chủ và ở các màn trống. Chỉ để trang trí nên ẩn với trình đọc màn hình. */
export function OysterArt({ className }: { className?: string }) {
  // Một trang có thể có nhiều hình hàu: mỗi hình một mã gradient riêng.
  const id = useId().replace(/:/g, "");
  return (
    <svg className={className} viewBox="0 0 200 150" aria-hidden>
      <defs>
        <radialGradient id={`nacre${id}`} cx="58%" cy="46%" r="64%">
          <stop offset="0" stopColor="#fffaf0" />
          <stop offset="0.5" stopColor="#f3e3ec" />
          <stop offset="0.8" stopColor="#c5d6ee" />
          <stop offset="1" stopColor="#8fa9cf" />
        </radialGradient>
        <radialGradient id={`pearl${id}`} cx="36%" cy="30%" r="74%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#f5eff4" />
          <stop offset="1" stopColor="#b6b9d4" />
        </radialGradient>
      </defs>
      {/* Vỏ ngoài mép gợn, bản lề ở góc dưới bên trái */}
      <path
        fill="#574a58"
        d="M22 130C12 112 14 92 22 76 20 62 30 52 40 46 42 32 56 26 68 26 76 14 94 12 106 18 118 8 138 12 148 22 162 20 176 30 180 44 192 52 194 70 186 82 192 96 182 112 170 116 164 130 146 134 134 128 122 140 102 138 92 130 78 138 60 134 52 126 42 134 28 138 22 130Z"
      />
      {/* Các đường vân tỏa ra từ bản lề */}
      <g fill="none" stroke="#927f8d" strokeWidth="3.5" strokeLinecap="round">
        <path d="M30 104C26 92 28 82 32 74" />
        <path d="M48 58C54 46 62 40 72 36" />
        <path d="M86 24C94 20 102 22 108 26" />
        <path d="M124 18C134 16 142 20 148 28" />
        <path d="M168 40C176 48 182 58 180 68" />
        <path d="M176 96C172 106 166 110 160 112" />
        <path d="M138 124C130 130 118 132 108 128" />
        <path d="M78 128C68 130 60 128 54 122" />
      </g>
      {/* Lòng vỏ xà cừ */}
      <path
        fill={`url(#nacre${id})`}
        d="M38.600 119.600C30.600 105.200 32.200 89.200 38.600 76.400 37 65.200 45 57.200 53 52.400 54.600 41.200 65.800 36.400 75.400 36.400 81.800 26.800 96.200 25.200 105.800 30 115.400 22 131.400 25.200 139.400 33.200 150.600 31.600 161.800 39.600 165 50.800 174.600 57.200 176.200 71.600 169.800 81.200 174.600 92.400 166.600 105.200 157 108.400 152.200 119.600 137.800 122.800 128.200 118 118.600 127.600 102.600 126 94.600 119.600 83.400 126 69 122.800 62.600 116.400 54.600 122.800 43.400 126 38.600 119.600Z"
      />
      {/* Thịt hàu viền diềm sẫm, viên ngọc nằm giữa */}
      <path
        fill="#e4d3bb"
        stroke="#7d6f62"
        strokeWidth="3"
        strokeLinejoin="round"
        d="M66 92C60 80 68 66 82 62 88 52 104 50 114 54 126 48 144 54 150 66 160 74 158 92 148 98 142 108 124 112 112 108 100 114 84 112 78 104 72 104 68 98 66 92Z"
      />
      <circle cx="113" cy="80" r="19" fill={`url(#pearl${id})`} stroke="#a6a6c4" strokeWidth="1.5" />
      <ellipse cx="106" cy="73" rx="6" ry="3.800" fill="#ffffff" transform="rotate(-28 106 73)" />
    </svg>
  );
}
