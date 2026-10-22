import { createApiServerLogoutRepository } from "@/features/session/repositories/api-server-logout-repository";
import { ApiTransport } from "@/shared/api/api-transport";

function response(status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(""),
  } as unknown as Response;
}

describe("API server logout repository", () => {
  test.each([
    [204, "revoked"],
    [401, "failed"],
    [503, "failed"],
  ] as const)("maps HTTP %s to %s", async (status, expected) => {
    const fetchImpl = jest.fn().mockResolvedValue(response(status));
    const transport = new ApiTransport({
      baseUrl: "https://qa.omts.test",
      fetchImpl,
    });
    const repository = createApiServerLogoutRepository(transport);

    await expect(repository.revoke("access-token-for-test")).resolves.toBe(
      expected,
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://qa.omts.test/api/auth/logout",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token-for-test",
        }),
        method: "POST",
      }),
    );
  });
});
