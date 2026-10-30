import { useAtomValue } from "jotai";
import { useState } from "react";
import { Button, Icon, Modal, Page, Sheet, useNavigate, useSnackbar } from "zmp-ui";

import PageHeader from "@/components/page-header";
import TextSizeSheet from "@/components/text-size-sheet";
import TestRoleSwitcher from "@/components/test-role-switcher";
import { COOPERATIVE } from "@/data/content";
import { describeGrants } from "@/data/feature-access";
import type { IconName } from "@/data/features";
import { useLogout } from "@/hooks/use-logout";
import { unlinkZaloAccount } from "@/services/acs/link";
import { errorText } from "@/services/acs/messages";
import { permissionsAtom, sessionAtom } from "@/state/session";
import { TEXT_SIZES, textSizeAtom } from "@/state/text-size";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.slice(-2).map((p) => p[0]).join("").toUpperCase();
}

function MenuRow({ icon, label, value, danger, onClick }: { icon: IconName; label: string; value?: string; danger?: boolean; onClick: () => void }) {
  return (
    <li>
      <button type="button" className={`menu-row${danger ? " menu-row--danger" : ""}`} onClick={onClick}>
        <span className="menu-row__icon">
          <Icon icon={icon} />
        </span>
        <span className="menu-row__label">{label}</span>
        {value && <span className="menu-row__value">{value}</span>}
        <Icon icon="zi-chevron-right" className="chevron" />
      </button>
    </li>
  );
}

const SUBJECT_LABEL = {
  SystemAdministrator: "Quản trị hệ thống",
  CooperativeOwner: "Chủ HTX",
  Staff: "Nhân viên",
  Trader: "Thương lái",
} as const;

/** Tài khoản: liên kết Zalo, hồ sơ, thông báo, đăng xuất và các mục Zalo bắt buộc hiển thị. Không có mật khẩu. */
function AccountPage() {
  const navigate = useNavigate();
  const session = useAtomValue(sessionAtom);
  const permissions = useAtomValue(permissionsAtom);
  const textSize = useAtomValue(textSizeAtom);
  const { logout, busy: loggingOut } = useLogout();
  const [infoOpen, setInfoOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const { openSnackbar } = useSnackbar();

  // Gỡ Zalo ID khỏi tài khoản (quy định Zalo: người dùng tự xóa được dữ liệu của mình) rồi rời phiên.
  const unlink = async () => {
    setUnlinking(true);
    try {
      await unlinkZaloAccount();
      setUnlinkOpen(false);
      navigate("/", { replace: true });
      openSnackbar({ text: "Đã hủy liên kết Zalo. Muốn dùng lại, bấm Liên kết tài khoản.", type: "success", duration: 5000 });
    } catch (err) {
      openSnackbar({ text: errorText(err), type: "error", duration: 6000 });
    } finally {
      setUnlinking(false);
    }
  };
  const textSizeLabel = TEXT_SIZES.find((s) => s.key === textSize)?.label;

  return (
    <Page className="screen screen--with-nav" hideScrollbar>
      <PageHeader title="Tài khoản" bell />
      <div className="screen__body">
        <section className="card profile">
          <span className="profile__avatar" aria-hidden>
            {session ? initials(session.displayName) : <Icon icon="zi-user" size={28} />}
          </span>
          <span className="profile__text">
            <span className="profile__name">{session ? session.displayName : "Bạn chưa liên kết tài khoản"}</span>
            <span className="profile__role">
              {session ? (permissions ? describeGrants(permissions) : SUBJECT_LABEL[session.subjectType]) : "Chưa liên kết tài khoản Zalo"}
            </span>
          </span>
        </section>

        {session ? (
          <section className="block">
            <h2 className="block__title">Tài khoản của tôi</h2>
            <ul className="list">
              <MenuRow icon="zi-user" label="Hồ sơ cá nhân" onClick={() => navigate("/account/profile")} />
              {permissions?.isCooperativeOwner && (
                <MenuRow icon="zi-user-check" label="Duyệt thương lái" onClick={() => navigate("/account/trader-requests")} />
              )}
              <MenuRow icon="zi-notif" label="Tùy chọn thông báo" onClick={() => navigate("/account/notifications")} />
              <MenuRow icon="zi-leave" label="Đăng xuất" danger onClick={() => setLogoutOpen(true)} />
              <MenuRow icon="zi-link" label="Hủy liên kết Zalo" danger onClick={() => setUnlinkOpen(true)} />
            </ul>
          </section>
        ) : (
          <div className="card link-box">
            <p className="link-box__text">
              Nếu bạn là nhân viên hoặc thương lái của HTX, liên kết tài khoản Zalo để dùng các chức năng của mình. HTX chỉ dùng số điện
              thoại để đối chiếu với hồ sơ đã đăng ký. Phần tra cứu truy xuất không cần liên kết.
            </p>
            <Button fullWidth size="large" onClick={() => navigate("/link")}>
              Liên kết tài khoản
            </Button>
          </div>
        )}

        {session && import.meta.env.DEV && <TestRoleSwitcher key={session.accountId} />}

        <section className="block">
          <h2 className="block__title">Cài đặt</h2>
          <ul className="list">
            <MenuRow icon="zi-tune" label="Cỡ chữ" value={textSizeLabel} onClick={() => setSizeOpen(true)} />
          </ul>
        </section>

        <section className="block">
          <h2 className="block__title">Thông tin và hỗ trợ</h2>
          <ul className="list">
            <MenuRow icon="zi-info-circle" label="Thông tin HTX và hỗ trợ" onClick={() => setInfoOpen(true)} />
            <MenuRow icon="zi-shield-solid" label="Chính sách bảo mật" onClick={() => setPolicyOpen(true)} />
            <MenuRow icon="zi-note" label="Điều khoản sử dụng" onClick={() => setTermsOpen(true)} />
            {session && <MenuRow icon="zi-delete" label="Xóa dữ liệu của tôi" onClick={() => setPolicyOpen(true)} />}
          </ul>
        </section>

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
            Ứng dụng chỉ dùng tên hiển thị, email và số điện thoại bạn đăng ký với HTX để liên kết tài khoản Zalo và gửi thông báo về công
            việc, đơn hàng. Dữ liệu được lưu trên máy chủ đặt tại Việt Nam và không chia sẻ cho bên thứ ba khi chưa có sự đồng ý của bạn.
          </p>
          <p>Bạn có thể yêu cầu xóa dữ liệu của mình bất cứ lúc nào bằng cách liên hệ HTX qua số {COOPERATIVE.phone}.</p>
        </div>
      </Modal>

      {/* Bản nháp: HTX cần đọc lại và duyệt nội dung điều khoản trước khi gửi Zalo duyệt. */}
      <Modal
        visible={termsOpen}
        title="Điều khoản sử dụng"
        onClose={() => setTermsOpen(false)}
        actions={[{ text: "Đã hiểu", close: true, highLight: true }]}
      >
        <div className="policy">
          <p>Đây là điều khoản sử dụng của Mini App OTMS do {COOPERATIVE.name} vận hành.</p>
          <p>Ai cũng có thể tra cứu nguồn gốc hàu bằng mã QR hoặc mã lô mà không cần đăng nhập. Thông tin truy xuất do HTX công bố và chịu trách nhiệm.</p>
          <p>
            Các chức năng quản lý chỉ dành cho nhân viên và thương lái đã được HTX cấp tài khoản và đã liên kết với Zalo của mình. Bạn chịu trách
            nhiệm về các thông tin mình nhập vào ứng dụng.
          </p>
          <p>Mọi thắc mắc và khiếu nại, vui lòng liên hệ: {COOPERATIVE.support}</p>
        </div>
      </Modal>

      <Modal
        visible={logoutOpen}
        title="Đăng xuất"
        description="Đăng xuất khỏi OMTS trên máy này? Dữ liệu bảo vệ đang hiện sẽ bị xóa khỏi máy."
        onClose={() => setLogoutOpen(false)}
        actions={[
          { text: "Ở lại", close: true },
          {
            text: "Đăng xuất",
            highLight: true,
            disabled: loggingOut,
            onClick: () => {
              setLogoutOpen(false);
              void logout();
            },
          },
        ]}
      />

      <Modal
        visible={unlinkOpen}
        title="Hủy liên kết Zalo"
        description="Tài khoản OMTS của bạn vẫn còn, chỉ không còn gắn với Zalo này. Bạn sẽ phải liên kết lại để dùng app."
        onClose={() => setUnlinkOpen(false)}
        actions={[
          { text: "Giữ liên kết", close: true },
          { text: "Hủy liên kết", highLight: true, disabled: unlinking, onClick: () => void unlink() },
        ]}
      />

      <TextSizeSheet visible={sizeOpen} onClose={() => setSizeOpen(false)} />
    </Page>
  );
}

export default AccountPage;
