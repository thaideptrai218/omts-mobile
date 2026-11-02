import { useAtom } from "jotai";
import { Icon, Sheet } from "zmp-ui";

import { TEXT_SIZES, textSizeAtom } from "@/shared/preferences/text-size";

type Props = {
  visible: boolean;
  onClose: () => void;
};

/** Chọn cỡ chữ. Mỗi lựa chọn hiện mẫu chữ đúng cỡ đó để người dùng nhìn thấy trước khi chọn. */
function TextSizeSheet({ visible, onClose }: Props) {
  const [size, setSize] = useAtom(textSizeAtom);
  return (
    <Sheet visible={visible} onClose={onClose} autoHeight mask handler swipeToClose title="Cỡ chữ">
      <ul className="choice-list">
        {TEXT_SIZES.map((s) => {
          const active = s.key === size;
          return (
            <li key={s.key}>
              <button
                type="button"
                className={`choice${active ? " is-active" : ""}`}
                aria-pressed={active}
                onClick={() => {
                  setSize(s.key);
                  onClose();
                }}
              >
                <span className={`choice__sample choice__sample--${s.key}`} aria-hidden>
                  Aa
                </span>
                <span className="choice__text">
                  <span className="choice__name">{s.label}</span>
                  <span className="choice__hint">{s.hint}</span>
                </span>
                {active && <Icon icon="zi-check-circle-solid" className="choice__check" />}
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

export default TextSizeSheet;
