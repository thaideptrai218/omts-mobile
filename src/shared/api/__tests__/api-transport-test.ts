import {
  ApiTransport,
  ApiTransportConfigError,
  type FetchLike,
} from "@/shared/api/api-transport";

function createResponse(status: number, body = ""): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(body),
  } as unknown as Response;
}

function createTransport(fetchImpl: FetchLike, defaultTimeoutMs = 500) {
  return new ApiTransport({
    baseUrl: "https://qa.omts.test",
    defaultTimeoutMs,
    fetchImpl,
  });
}

describe("ApiTransport", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test("sends JSON and returns untrusted success data", async () => {
    const fetchImpl = jest
      .fn<ReturnType<FetchLike>, Parameters<FetchLike>>()
      .mockResolvedValue(createResponse(200, '{"accountId":"acc-1"}'));
    const transport = createTransport(fetchImpl);

    const result = await transport.request({
      json: { identifier: "nguyen.an" },
      method: "POST",
      path: "api/auth/login",
    });

    expect(result).toEqual({
      data: { accountId: "acc-1" },
      ok: true,
      status: 200,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://qa.omts.test/api/auth/login",
      expect.objectContaining({
        body: '{"identifier":"nguyen.an"}',
        headers: expect.objectContaining({
          Accept: "application/json",
          "Content-Type": "application/json",
        }),
        method: "POST",
      }),
    );
  });

  test("returns null for a no-content response", async () => {
    const transport = createTransport(
      jest.fn().mockResolvedValue(createResponse(204)),
    );

    await expect(
      transport.request({ method: "POST", path: "api/auth/logout" }),
    ).resolves.toEqual({ data: null, ok: true, status: 204 });
  });

  test("normalizes a coded HTTP failure", async () => {
    const transport = createTransport(
      jest
        .fn()
        .mockResolvedValue(
          createResponse(503, '{"code":"MSG07","detail":"internal"}'),
        ),
    );

    const result = await transport.request({ path: "api/me" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.kind).toBe("http");
      expect(result.problem.serverMessageCode).toBe("MSG07");
      expect(result.problem.displayMessage.message).not.toContain("internal");
    }
  });

  test("rejects malformed JSON on a successful response", async () => {
    const transport = createTransport(
      jest.fn().mockResolvedValue(createResponse(200, "not-json")),
    );

    const result = await transport.request({ path: "api/me" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.kind).toBe("invalidResponse");
    }
  });

  test("normalizes a rejected fetch as a network problem", async () => {
    const transport = createTransport(
      jest.fn().mockRejectedValue(new Error("socket unavailable")),
    );

    const result = await transport.request({ path: "api/me" });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.kind).toBe("network");
      expect(result.problem.displayMessage.message).not.toContain("socket");
    }
  });

  test("aborts and classifies requests that exceed their timeout", async () => {
    jest.useFakeTimers();

    const fetchImpl: FetchLike = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("abort")));
      });
    const transport = createTransport(fetchImpl, 50);

    const resultPromise = transport.request({ path: "api/me" });
    await jest.advanceTimersByTimeAsync(50);
    const result = await resultPromise;

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.kind).toBe("timeout");
    }

  });

  test("keeps caller cancellation distinct from timeout", async () => {
    const controller = new AbortController();
    const fetchImpl: FetchLike = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("abort")));
      });
    const transport = createTransport(fetchImpl);

    const resultPromise = transport.request({
      path: "api/me",
      signal: controller.signal,
    });
    controller.abort();
    const result = await resultPromise;

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.problem.kind).toBe("cancelled");
    }
  });

  test.each([
    { json: undefined, path: "/api/me" },
    { json: undefined, path: "../admin" },
    { json: undefined, path: "api/%2e%2e/admin" },
    { json: undefined, path: "api/%252e%252e/admin" },
    { json: undefined, path: "api%2fadmin" },
    { json: undefined, path: "api/me#private" },
    { json: undefined, path: "https://other.test/api/me" },
    { json: { unsafe: true }, path: "api/me" },
  ])(
    "rejects unsafe request $path before fetch",
    async ({ json, path }) => {
      const transport = createTransport(jest.fn());

      await expect(transport.request({ json, path })).rejects.toBeInstanceOf(
        ApiTransportConfigError,
      );
    },
  );
});
