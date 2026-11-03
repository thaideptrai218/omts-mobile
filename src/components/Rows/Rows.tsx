import { ReactNode } from "react";
export function Rows({ children }: { children: ReactNode }) {
  return <ul className="rows">{children}</ul>;
}
