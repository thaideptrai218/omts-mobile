import { Icon } from "zmp-ui";

import { FEATURES, FeatureKey } from "@/data/features";
import { useOpenFeature } from "@/hooks/use-open-feature";

/** Lưới chức năng: ba ô mỗi hàng để icon và chữ đủ to, tên chức năng được xuống dòng thay vì bị cắt. */
function ActionGrid({ actions, title = "Chức năng" }: { actions: FeatureKey[]; title?: string }) {
  const openFeature = useOpenFeature();
  if (actions.length === 0) return null;
  return (
    <section className="block">
      <h2 className="block__title">{title}</h2>
      <div className="actions">
        {actions.map((key) => {
          const f = FEATURES[key];
          return (
            <button key={key} type="button" className="actions__item" onClick={() => openFeature(key)}>
              <span className="actions__icon">
                <Icon icon={f.icon} size={28} />
              </span>
              <span className="actions__label">{f.title}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default ActionGrid;
