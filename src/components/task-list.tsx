import { Icon } from "zmp-ui";

import type { Task } from "@/data/roles";
import { useOpenFeature } from "@/hooks/use-open-feature";

const TONE_TEXT = {
  neutral: "Thông tin",
  success: "Hoàn tất",
  warning: "Cần chú ý",
  danger: "Gấp",
} as const;

/** Danh sách việc cần làm. Mỗi dòng có vạch màu bên trái theo mức độ gấp. */
function TaskList({ title, tasks }: { title: string; tasks: Task[] }) {
  const openFeature = useOpenFeature();
  if (tasks.length === 0) return null;
  return (
    <section className="block">
      <h2 className="block__title">{title}</h2>
      <ul className="tasks">
        {tasks.map((t) => (
          <li key={t.id}>
            <button type="button" className={`tasks__row tone-bar-${t.tone}`} onClick={() => openFeature(t.feature)}>
              <span className="tasks__text">
                <span className="tasks__title">{t.title}</span>
                <span className="tasks__detail">{t.detail}</span>
              </span>
              <span className="sr-only">{TONE_TEXT[t.tone]}</span>
              <Icon icon="zi-chevron-right" className="tasks__chevron" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TaskList;
