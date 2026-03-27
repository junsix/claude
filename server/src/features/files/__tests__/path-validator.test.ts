import { describe, it, expect } from "vitest";
import { validatePath } from "../path-validator.js";

describe("validatePath", () => {
  const allowedPaths = ["/home/user/projects/my-app", "/home/user/docs"];

  it("allows paths within registered directories", () => {
    expect(validatePath("/home/user/projects/my-app/src/index.ts", allowedPaths)).toBe(true);
  });

  it("rejects paths outside registered directories", () => {
    expect(validatePath("/etc/passwd", allowedPaths)).toBe(false);
  });

  it("rejects path traversal attempts", () => {
    expect(validatePath("/home/user/projects/my-app/../../secret", allowedPaths)).toBe(false);
  });

  it("allows the root of a registered path", () => {
    expect(validatePath("/home/user/docs", allowedPaths)).toBe(true);
  });
});
