import { sessionDestination } from "./session-destination";
import { mockSessionFixtures } from "../adapters/mock-session-fixtures";

test("only a ready session can enter the app", () => {
  expect(sessionDestination({ status: "loading" })).toBeNull();
  expect(
    sessionDestination({
      status: "error",
      operation: "bootstrap",
      reason: "offline",
    }),
  ).toBeNull();
  expect(sessionDestination({ status: "signedOut" })).toBe("/login");
  for (const nextAction of ["changePassword", "verifyContact"] as const) {
    expect(
      sessionDestination({
        status: "active",
        session: { ...mockSessionFixtures[0], nextAction },
      }),
    ).toBe("/onboarding");
  }
  expect(
    sessionDestination({ status: "active", session: mockSessionFixtures[1] }),
  ).toBe("/account");
});
