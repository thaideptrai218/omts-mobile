import { useAtom } from "jotai";
import { Icon, Sheet } from "zmp-ui";

import { ROLE_ORDER, ROLES } from "@/data/roles";
import { roleAtom } from "@/state/role";

type Props = {
  visible: boolean;
  onClose: () => void;
};

/** Chọn vai trò để xem thử giao diện. Khi có đăng nhập, vai trò lấy từ tài khoản. */
function RoleSheet({ visible, onClose }: Props) {
  const [role, setRole] = useAtom(roleAtom);
  return (
    <Sheet visible={visible} onClose={onClose} autoHeight mask handler swipeToClose title="Xem giao diện theo vai trò">
      <div className="role-sheet">
        <p className="role-sheet__hint">
          Chỉ dùng để xem thử. Khi có đăng nhập, vai trò lấy theo tài khoản đã liên kết.
        </p>
        <ul className="role-sheet__list">
          {ROLE_ORDER.map((key) => {
            const r = ROLES[key];
            const active = key === role;
            return (
              <li key={key}>
                <button
                  type="button"
                  className={`role-sheet__item${active ? " is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => {
                    setRole(key);
                    onClose();
                  }}
                >
                  <span>
                    <span className="role-sheet__name">{r.label}</span>
                    <span className="role-sheet__scope">{r.scope}</span>
                  </span>
                  {active && <Icon icon="zi-check" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Sheet>
  );
}

export default RoleSheet;
