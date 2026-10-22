import {
  resolveMessage,
  type ResolvedMessage,
} from "@/shared/messages/message-catalog";

export type ApiProblem = {
  displayMessage: ResolvedMessage;
  kind: "http";
  serverMessageCode: string | null;
  status: number;
};

type UnknownRecord = Record<string, unknown>;

const serverMessageCodePattern = /^MSG\d{2,3}$/;

function asRecord(value: unknown): UnknownRecord | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function asServerMessageCode(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const candidate = value.trim().toUpperCase();
  return serverMessageCodePattern.test(candidate) ? candidate : null;
}

function readServerMessageCode(payload: unknown): string | null {
  const problem = asRecord(payload);

  if (!problem) {
    return null;
  }

  const directCode = asServerMessageCode(problem.code);

  if (directCode) {
    return directCode;
  }

  const extensions = asRecord(problem.extensions);
  const extensionCode = asServerMessageCode(extensions?.code);

  if (extensionCode) {
    return extensionCode;
  }

  return asServerMessageCode(problem.title);
}

export function parseApiProblem(status: number, payload: unknown): ApiProblem {
  const serverMessageCode = readServerMessageCode(payload);

  return {
    displayMessage: resolveMessage(serverMessageCode),
    kind: "http",
    serverMessageCode,
    status,
  };
}
