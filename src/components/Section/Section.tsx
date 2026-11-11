import { ReactNode } from "react";
/** Một mục của trang. `step` đánh số mục trong form dài, hiện thành "1. Tiêu đề". */
export function Section({ title, step, action, children }: { title: string; step?: number; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="block">
      <div className="block__head">
        <h2 className="block__title">{step === undefined ? title : `${step}. ${title}`}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
