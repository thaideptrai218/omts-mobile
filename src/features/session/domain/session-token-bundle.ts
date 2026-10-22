export type SessionTokenBundle = Readonly<{
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}>;

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function readNonEmptyString(record: UnknownRecord, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function readIsoDate(record: UnknownRecord, key: string): string | null {
  const value = readNonEmptyString(record, key);
  return value && Number.isFinite(Date.parse(value)) ? value : null;
}

export function parseSessionTokenBundle(value: unknown): SessionTokenBundle | null {
  const record = asRecord(value);
  if (!record) return null;

  const accessToken = readNonEmptyString(record, "accessToken");
  const accessTokenExpiresAt = readIsoDate(record, "accessTokenExpiresAt");
  const refreshToken = readNonEmptyString(record, "refreshToken");
  const refreshTokenExpiresAt = readIsoDate(record, "refreshTokenExpiresAt");

  if (
    !accessToken ||
    !accessTokenExpiresAt ||
    !refreshToken ||
    !refreshTokenExpiresAt
  ) {
    return null;
  }

  return {
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    refreshTokenExpiresAt,
  };
}
