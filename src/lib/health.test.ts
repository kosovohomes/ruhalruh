import { describe, expect, it } from "vitest";
import { evaluateHealth } from "./health";

describe("evaluateHealth", () => {
  it("is ok when the database responds", () => {
    expect(evaluateHealth("healthy", "production")).toBe("ok");
  });

  it("is ok when development has no database configured", () => {
    expect(evaluateHealth("not_configured", "development")).toBe("ok");
  });

  it("is unhealthy when production has no database configured", () => {
    expect(evaluateHealth("not_configured", "production")).toBe("unhealthy");
  });

  it("is unhealthy when the database check fails", () => {
    expect(evaluateHealth("degraded", "development")).toBe("unhealthy");
  });
});
