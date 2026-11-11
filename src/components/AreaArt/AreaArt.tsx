import type { AreaKey } from "@/models/Navigation";
import type { ReactNode } from "react";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 3.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const cut = { fill: "none", stroke: "var(--art-cut, #fff)", strokeWidth: 2.5, strokeLinecap: "round" } as const;
const WATER = "M5 44q4.75-5 9.5 0t9.5 0 9.5 0 9.5 0";

/** Hình vẽ riêng của từng khu vực: nhìn hình là biết đang ở đâu, không phải đọc chữ. */
const ART: Record<AreaKey, ReactNode> = {
  // Bè nuôi nổi trên phao.
  farm: (
    <>
      <path d="M8 8h32v3.5H8zM10 11h3.5v13H10zM22.25 11h3.5v13h-3.5zM34.5 11H38v13h-3.5zM5 22h38v4.5H5z" fill="currentColor" />
      <circle cx="13" cy="31.5" r="5.5" fill="currentColor" />
      <circle cx="24" cy="31.5" r="5.5" fill="currentColor" />
      <circle cx="35" cy="31.5" r="5.5" fill="currentColor" />
      <path d={WATER} {...stroke} />
    </>
  ),
  // Thúng đan chở giống và vật tư.
  buy: (
    <>
      <path d="M14 21c0-9 4.5-14 10-14s10 5 10 14" {...stroke} />
      <path d="M6 20h36l-4.3 20.6A3 3 0 0 1 34.8 43H13.2a3 3 0 0 1-2.9-2.4L6 20Z" fill="currentColor" />
      <path d="M10 28h28M11.5 35h25M18 21l2 21M30 21l-2 21" {...cut} />
    </>
  ),
  // Thuyền chở hàu đi giao.
  sell: (
    <>
      <path d="M22.5 5v22" {...stroke} />
      <path d="M26 7l12 18H26V7ZM19 11 9 25h10V11Z" fill="currentColor" />
      <path d="M5 29h38l-4.6 8.6a3 3 0 0 1-2.6 1.6H12.2a3 3 0 0 1-2.6-1.6L5 29Z" fill="currentColor" />
      <path d={WATER} {...stroke} />
    </>
  ),
  // Người đội nón lá.
  people: (
    <>
      <path d="M24 3 4.5 20.5c-.6.6-.2 1.5.6 1.5h37.8c.8 0 1.2-.9.6-1.5L24 3Z" fill="currentColor" />
      <path d="M15.5 24.5h17a8.5 8.5 0 0 1-17 0Z" fill="currentColor" />
      <path d="M8 45c0-7.5 6.5-11.5 16-11.5S40 37.500 40 45H8Z" fill="currentColor" />
    </>
  ),
  // Trụ sở HTX có cờ.
  org: (
    <>
      <path d="M23 3h2.500v11H23z" fill="currentColor" />
      <path d="M25.500 3.500H37l-3 3.500 3 3.500H25.500z" fill="currentColor" />
      <path d="M24 13 4.500 24.500h39L24 13ZM9 27h6v12H9zM21 27h6v12h-6zM33 27h6v12h-6zM5 40.500h38V45H5z" fill="currentColor" />
    </>
  ),
  // Neo: đang chờ, sắp có.
  stone: (
    <>
      <circle cx="24" cy="9.500" r="4.500" {...stroke} />
      <path d="M24 14v29M15 21h18M7 28c0 9.500 7.500 15 17 15s17-5.500 17-15" {...stroke} />
      <path d="M7 22.500 2.500 31h9L7 22.500ZM41 22.500 36.500 31h9L41 22.500Z" fill="currentColor" />
    </>
  ),
};

export function AreaArt({ area }: { area: AreaKey }) {
  return (
    <svg className="area-art" viewBox="0 0 48 48" aria-hidden>
      {ART[area]}
    </svg>
  );
}
