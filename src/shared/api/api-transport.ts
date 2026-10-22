import {
  parseApiProblem,
  type ApiProblem,
} from "@/shared/api/api-problem";
import {
  getRuntimeConfig,
  parseApiBaseUrl,
  type RuntimeConfig,
} from "@/shared/config/runtime-config";
import {
  resolveMessage,
  type ResolvedMessage,
} from "@/shared/messages/message-catalog";

export type HttpMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export type ApiRequest = {
  headers?: Readonly<Record<string, string>>;
  json?: unknown;
  method?: HttpMethod;
  path: string;
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type TransportProblemKind =
  | "cancelled"
  | "invalidResponse"
  | "network"
  | "timeout";

export type TransportProblem = {
  displayMessage: ResolvedMessage;
  kind: TransportProblemKind;
  serverMessageCode: null;
  status: null;
};

export type ApiSuccess = {
  data: unknown;
  ok: true;
  status: number;
};

export type ApiFailure = {
  ok: false;
  problem: ApiProblem | TransportProblem;
};

export type ApiResult = ApiFailure | ApiSuccess;

export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

export type ApiTransportOptions = {
  baseUrl: string;
  defaultTimeoutMs?: number;
  fetchImpl?: FetchLike;
};

export class ApiTransportConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiTransportConfigError";
  }
}

const defaultRequestTimeoutMs = 15_000;

function createTransportProblem(kind: TransportProblemKind): TransportProblem {
  return {
    displayMessage: resolveMessage(null),
    kind,
    serverMessageCode: null,
    status: null,
  };
}

function requirePositiveTimeout(timeoutMs: number): number {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new ApiTransportConfigError(
      "API request timeout phải là số mili-giây dương.",
    );
  }

  return timeoutMs;
}

function hasHeader(headers: Readonly<Record<string, string>>, name: string) {
  return Object.keys(headers).some(
    (headerName) => headerName.toLowerCase() === name.toLowerCase(),
  );
}

function parseJsonText(text: string): unknown {
  return JSON.parse(text) as unknown;
}

function hasUnsafePathSegment(candidate: string): boolean {
  const rawPath = candidate.split(/[?#]/, 1)[0];

  return rawPath.split("/").some((rawSegment) => {
    let decodedSegment = rawSegment;

    try {
      for (let pass = 0; pass < 2; pass += 1) {
        const nextSegment = decodeURIComponent(decodedSegment);

        if (nextSegment === decodedSegment) break;
        decodedSegment = nextSegment;
      }
    } catch {
      return true;
    }

    return (
      decodedSegment === "." ||
      decodedSegment === ".." ||
      decodedSegment.includes("/") ||
      decodedSegment.includes("\\")
    );
  });
}

export class ApiTransport {
  private readonly baseUrl: string;
  private readonly defaultTimeoutMs: number;
  private readonly fetchImpl: FetchLike;

  constructor({
    baseUrl,
    defaultTimeoutMs = defaultRequestTimeoutMs,
    fetchImpl = fetch,
  }: ApiTransportOptions) {
    this.baseUrl = parseApiBaseUrl(baseUrl);
    this.defaultTimeoutMs = requirePositiveTimeout(defaultTimeoutMs);
    this.fetchImpl = fetchImpl;
  }

  async request(request: ApiRequest): Promise<ApiResult> {
    const method = request.method ?? "GET";

    if (method === "GET" && request.json !== undefined) {
      throw new ApiTransportConfigError(
        "GET request không được chứa JSON body; hãy dùng query parameters hoặc method phù hợp.",
      );
    }

    const timeoutMs = requirePositiveTimeout(
      request.timeoutMs ?? this.defaultTimeoutMs,
    );
    const url = this.buildUrl(request.path);
    const controller = new AbortController();
    let didTimeout = false;

    const abortFromCaller = () => controller.abort();
    request.signal?.addEventListener("abort", abortFromCaller, { once: true });

    if (request.signal?.aborted) {
      controller.abort();
    }

    const timeoutId = setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, timeoutMs);

    try {
      const headers = this.createHeaders(request.headers ?? {}, request.json);
      const response = await this.fetchImpl(url, {
        body: request.json === undefined ? undefined : JSON.stringify(request.json),
        headers,
        method,
        signal: controller.signal,
      });

      if (response.status === 204) {
        return { data: null, ok: true, status: response.status };
      }

      const responseText = await response.text();
      const hasBody = responseText.trim().length > 0;

      if (!response.ok) {
        let problemPayload: unknown = null;

        if (hasBody) {
          try {
            problemPayload = parseJsonText(responseText);
          } catch {
            problemPayload = responseText;
          }
        }

        return {
          ok: false,
          problem: parseApiProblem(response.status, problemPayload),
        };
      }

      if (!hasBody) {
        return { data: null, ok: true, status: response.status };
      }

      try {
        return {
          data: parseJsonText(responseText),
          ok: true,
          status: response.status,
        };
      } catch {
        return {
          ok: false,
          problem: createTransportProblem("invalidResponse"),
        };
      }
    } catch {
      if (didTimeout) {
        return { ok: false, problem: createTransportProblem("timeout") };
      }

      if (request.signal?.aborted) {
        return { ok: false, problem: createTransportProblem("cancelled") };
      }

      return { ok: false, problem: createTransportProblem("network") };
    } finally {
      clearTimeout(timeoutId);
      request.signal?.removeEventListener("abort", abortFromCaller);
    }
  }

  private buildUrl(path: string): string {
    const candidate = path.trim();

    if (
      !candidate ||
      candidate.startsWith("/") ||
      candidate.includes("\\") ||
      candidate.includes("#") ||
      hasUnsafePathSegment(candidate)
    ) {
      throw new ApiTransportConfigError(
        "API path phải là đường dẫn tương đối an toàn, ví dụ api/auth/login.",
      );
    }

    let url: URL;

    try {
      url = new URL(candidate, `${this.baseUrl}/`);
    } catch {
      throw new ApiTransportConfigError("API path không tạo được URL hợp lệ.");
    }

    if (url.origin !== new URL(this.baseUrl).origin) {
      throw new ApiTransportConfigError(
        "API path không được chuyển request sang origin khác.",
      );
    }

    return url.toString();
  }

  private createHeaders(
    requestHeaders: Readonly<Record<string, string>>,
    json: unknown,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...requestHeaders,
    };

    if (json !== undefined && !hasHeader(headers, "Content-Type")) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }
}

export function createApiTransport(
  config: RuntimeConfig = getRuntimeConfig(),
): ApiTransport {
  return new ApiTransport({ baseUrl: config.apiBaseUrl });
}
