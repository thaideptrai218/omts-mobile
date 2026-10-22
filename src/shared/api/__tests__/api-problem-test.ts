import { parseApiProblem } from "@/shared/api/api-problem";

describe("parseApiProblem", () => {
  test("reads the flattened ASP.NET extension code", () => {
    const problem = parseApiProblem(503, {
      code: "MSG07",
      detail: "Technical text must not become the display message.",
      status: 503,
      title: "MSG07",
    });

    expect(problem.serverMessageCode).toBe("MSG07");
    expect(problem.displayMessage.code).toBe("MSG07");
    expect(problem.displayMessage.message).not.toContain("Technical text");
  });

  test("supports an explicit extensions object", () => {
    const problem = parseApiProblem(503, {
      extensions: { code: "msg07" },
      title: "Service unavailable",
    });

    expect(problem.serverMessageCode).toBe("MSG07");
    expect(problem.displayMessage.title).toBe("Không có kết nối");
  });

  test("preserves an unknown MSG code for diagnostics but uses safe copy", () => {
    const problem = parseApiProblem(401, {
      code: "MSG99",
      detail: "Wrong identifier or password.",
    });

    expect(problem.serverMessageCode).toBe("MSG99");
    expect(problem.displayMessage.code).toBeNull();
    expect(problem.displayMessage.message).not.toContain("Wrong identifier");
  });

  test.each([null, [], "gateway error", { code: "DATABASE_TIMEOUT" }])(
    "falls back safely for malformed payload %#",
    (payload) => {
      const problem = parseApiProblem(500, payload);

      expect(problem.serverMessageCode).toBeNull();
      expect(problem.displayMessage.code).toBeNull();
      expect(problem.status).toBe(500);
    },
  );
});
