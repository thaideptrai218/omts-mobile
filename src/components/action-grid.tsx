import { Icon } from "zmp-ui";

import { FEATURES, FeatureKey } from "@/data/features";
import { useOpenFeature } from "@/hooks/use-open-feature";

/** Lưới chức năng dạng icon, bốn ô mỗi hàng như các Mini App khác của Zalo. */
function ActionGrid({ actions }: { actions: FeatureKey[] }) {
  const openFeature = useOpenFeature();
  if (actions.length === 0) return null;
  return (
    <section className="block">
      <h2 className="block__title">Chức năng</h2>
      <div className="actions">
        {actions.map((key) => {
          const f = FEATURES[key];
          return (
            <button key={key} type="button" className="actions__item" onClick={() => openFeature(key)}>
              <span className="actions__icon">
                <Icon icon={f.icon} />
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
