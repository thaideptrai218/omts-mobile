import { Icon } from "zmp-ui";

import type { Task } from "@/shared/navigation/roles";
import { useOpenFeature } from "@/shared/navigation/use-open-feature";

/** Nhãn mức độ hiện bằng chữ, không chỉ dựa vào màu, để người khó phân biệt màu vẫn đọc được. */
const TONE_TEXT = {
  neutral: "",
  success: "Hoàn tất",
  warning: "Cần chú ý",
  danger: "Gấp",
} as const;

/** Danh sách việc cần làm. Mỗi dòng có vạch màu bên trái và nhãn chữ theo mức độ gấp. */
function TaskList({ title, tasks }: { title: string; tasks: Task[] }) {
  const openFeature = useOpenFeature();
  if (tasks.length === 0) return null;
  return (
    <section className="block">
      <h2 className="block__title">{title}</h2>
      <ul className="list">
        {tasks.map((t) => (
          <li key={t.id}>
            <button type="button" className={`task tone-bar-${t.tone}`} onClick={() => openFeature(t.feature)}>
              <span className="task__text">
                {TONE_TEXT[t.tone] && <span className={`badge badge--${t.tone}`}>{TONE_TEXT[t.tone]}</span>}
                <span className="task__title">{t.title}</span>
                <span className="task__detail">{t.detail}</span>
              </span>
              <Icon icon="zi-chevron-right" className="chevron" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TaskList;
