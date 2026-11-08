export type CooperativeProfile = {
  id: string;
  fullName: string | null;
  taxCode: string | null;
  officeAddress: string | null;
  phoneNumber: string | null;
  email: string | null;
  website: string | null;
  legalRepresentative: string | null;
  businessLines: string[];
  logoUrl: string | null;
  status: string | null;
  rowVersion: string | null;
};

export type SaveCooperativeProfile = Omit<CooperativeProfile, "id" | "logoUrl" | "status">;

export type CooperativeForm = {
  fullName: string;
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
