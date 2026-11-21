export type CooperativeProfile = {
  id: string;
  fullName: string | null;
  /** Tên viết tắt (tối đa 20 ký tự), đứng đầu mọi tin nhắn SMS và trên trang truy xuất. */
  shortName: string | null;
  taxCode: string | null;
  yearEstablished: number | null;
  officeAddress: string | null;
  phoneNumber: string | null;
  email: string | null;
  website: string | null;
  socialLink: string | null;
  introductionVi: string | null;
  introductionEn: string | null;
  legalRepresentative: string | null;
  businessLines: string[];
  logoUrl: string | null;
  coverPhotoUrl: string | null;
  rowVersion: string | null;
};

/**
 * Lưu hồ sơ HTX (FARM-01). Backend thay toàn bộ hồ sơ: bắt buộc tên, tên viết tắt, mã số thuế, địa chỉ, điện thoại; trường
 * mobile không có ô nhập (năm thành lập, mạng xã hội, giới thiệu) phải gửi lại giá trị cũ để không bị xóa.
 */
export type SaveCooperativeProfile = {
  fullName: string;
  shortName: string;
  taxCode: string;
  yearEstablished: number | null;
  officeAddress: string;
  phoneNumber: string;
  email: string | null;
  website: string | null;
  socialLink: string | null;
  introductionVi: string | null;
  introductionEn: string | null;
  legalRepresentative: string | null;
  businessLines: string[];
  rowVersion: string | null;
};

export type CooperativeForm = {
  fullName: string;
  shortName: string;
  taxCode: string;
  officeAddress: string;
  phoneNumber: string;
  email: string;
  website: string;
  legalRepresentative: string;
  businessLines: string;
};

export type CooperativeProfileSaved = {
  profile: CooperativeProfile;
  message: string | null;
};
