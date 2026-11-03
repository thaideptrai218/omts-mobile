import { ReactNode } from "react";
export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="block">
      <div className="block__head">
        <h2 className="block__title">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
