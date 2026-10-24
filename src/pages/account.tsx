import { useAtomValue } from "jotai";
import { useState } from "react";
import { Button, Icon, Modal, Page, Sheet } from "zmp-ui";

import RoleSheet from "@/components/role-sheet";
import ScreenTitle from "@/components/screen-title";
import { COOPERATIVE } from "@/data/content";
import type { IconName } from "@/data/features";
import { ROLES } from "@/data/roles";
import { roleAtom } from "@/state/role";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.slice(-2).map((p) => p[0]).join("").toUpperCase();
}

function MenuRow({ icon, label, onClick }: { icon: IconName; label: string; onClick: () => void }) {
  return (
    <li>
      <button type="button" className="menu__row" onClick={onClick}>
        <Icon icon={icon} />
        <span className="menu__label">{label}</span>
        <Icon icon="zi-chevron-right" className="menu__chevron" />
      </button>
    </li>
  );
}

function AccountPage() {
  const role = ROLES[useAtomValue(roleAtom)];
  const isPublic = role.key === "viewer";
  const [infoOpen, setInfoOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);

  return (
    <Page className="screen screen--with-nav screen--plain" hideScrollbar>
      <ScreenTitle title="Tài khoản" />
      <div className="screen__body">
        <section className="profile">
          <span className="profile__avatar" aria-hidden>
            {isPublic ? <Icon icon="zi-user" /> : initials(role.person)}
          </span>
          <span>
            <span className="profile__name">{isPublic ? "Bạn chưa liên kết tài khoản" : role.person}</span>
            <span className="profile__role">{isPublic ? "Đang dùng chế độ khách" : `${role.label}, ${role.scope}`}</span>
          </span>
        </section>

        {isPublic ? (
          <div className="link-box">
            <p className="link-box__text">
              Nếu bạn là nhân viên hoặc thương lái của HTX, liên kết tài khoản Zalo để dùng các chức năng của mình. HTX chỉ dùng số điện thoại
              để đối chiếu với hồ sơ đã đăng ký.
            </p>
            <Button fullWidth onClick={() => setRoleOpen(true)}>
              Liên kết tài khoản
            </Button>
          </div>
        ) : (
          <p className="linked">
            <Icon icon="zi-check-circle-solid" size={16} />
            Đã liên kết với tài khoản Zalo
          </p>
        )}

        <ul className="menu">
          <MenuRow icon="zi-switch-users" label="Xem giao diện theo vai trò" onClick={() => setRoleOpen(true)} />
          <MenuRow icon="zi-info-circle" label="Thông tin HTX và hỗ trợ" onClick={() => setInfoOpen(true)} />
          <MenuRow icon="zi-shield-solid" label="Chính sách bảo mật" onClick={() => setPolicyOpen(true)} />
          {!isPublic && <MenuRow icon="zi-delete" label="Xóa dữ liệu của tôi" onClick={() => setPolicyOpen(true)} />}
        </ul>

        <p className="screen__note">Phiên bản {COOPERATIVE.appVersion}</p>
      </div>

      <Sheet visible={infoOpen} onClose={() => setInfoOpen(false)} autoHeight mask handler swipeToClose title="Thông tin HTX">
        <dl className="info">
          <div>
            <dt>Đơn vị</dt>
            <dd>{COOPERATIVE.name}</dd>
          </div>
          <div>
            <dt>Đăng ký</dt>
            <dd>{COOPERATIVE.registrationNo}</dd>
          </div>
          <div>
            <dt>Địa chỉ</dt>
            <dd>{COOPERATIVE.address}</dd>
          </div>
          <div>
            <dt>Điện thoại</dt>
            <dd>{COOPERATIVE.phone}</dd>
          </div>
          <div>
            <dt>Dịch vụ</dt>
            <dd>{COOPERATIVE.service}</dd>
          </div>
          <div>
            <dt>Hỗ trợ và khiếu nại</dt>
            <dd>{COOPERATIVE.support}</dd>
          </div>
          <div>
            <dt>Phiên bản</dt>
            <dd>{COOPERATIVE.appVersion}</dd>
          </div>
        </dl>
      </Sheet>

      <Modal
        visible={policyOpen}
        title="Chính sách bảo mật"
        onClose={() => setPolicyOpen(false)}
        actions={[{ text: "Đã hiểu", close: true, highLight: true }]}
      >
        <div className="policy">
          <p>Đây là chính sách bảo mật của Mini App OTMS do {COOPERATIVE.name} vận hành.</p>
          <p>
            Ứng dụng chỉ dùng tên, ảnh đại diện và số điện thoại Zalo khi bạn liên kết tài khoản, để đối chiếu với hồ sơ đã đăng ký tại HTX. Dữ liệu
            được lưu trên máy chủ đặt tại Việt Nam và không chia sẻ cho bên thứ ba khi chưa có sự đồng ý của bạn.
          </p>
          <p>Bạn có thể yêu cầu xóa dữ liệu của mình bất cứ lúc nào bằng cách liên hệ HTX qua số {COOPERATIVE.phone}.</p>
        </div>
      </Modal>

      <RoleSheet visible={roleOpen} onClose={() => setRoleOpen(false)} />
    </Page>
  );
}

export default AccountPage;
