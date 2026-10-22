import { describe, it, expect } from "vitest";
import { resolveInviteUrl } from "../AssessmentInvitePage";

describe("resolveInviteUrl helper", () => {
  it("resolves invite URL using current window.origin when token is given", () => {
    const token = "f9e8742111ff031cc5ee89479cc2fdac36b2f9d3955804fa386caa192070d7a4";
    const result = resolveInviteUrl("http://localhost:3001/interview/" + token, token);

    expect(result).toBe(`${window.location.origin}/interview/${token}`);
    expect(result).not.toContain(":3001");
  });

  it("replaces port 3001 with window.origin if only backend URL is provided", () => {
    const token = "abc123xyz";
    const rawUrl = `http://localhost:3001/interview/${token}`;
    const result = resolveInviteUrl(rawUrl);

    expect(result).toBe(`${window.location.origin}/interview/${token}`);
  });

  it("preserves external or correct frontend URL if already correct", () => {
    const rawUrl = "https://interview.example.com/interview/secure-token";
    const result = resolveInviteUrl(rawUrl);

    expect(result).toBe("https://interview.example.com/interview/secure-token");
  });

  it("handles undefined or empty inviteUrl gracefully", () => {
    expect(resolveInviteUrl(undefined)).toBe("");
    expect(resolveInviteUrl("")).toBe("");
  });
});
