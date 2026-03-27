import { describe, it, expect } from "vitest";
import { getActivePath, getSiblings, findSessionForBranchTip } from "../branch.js";
import type { Message, ConversationMeta } from "@claude-copy/shared";

const messages: Message[] = [
  { id: "m1", parentId: null, role: "user", content: [{ type: "text", text: "Hi" }], attachments: [], createdAt: "" },
  { id: "m2", parentId: "m1", role: "assistant", content: [{ type: "text", text: "Hello" }], attachments: [], createdAt: "" },
  { id: "m3", parentId: "m1", role: "assistant", content: [{ type: "text", text: "Hey" }], attachments: [], createdAt: "" },
  { id: "m4", parentId: "m2", role: "user", content: [{ type: "text", text: "How?" }], attachments: [], createdAt: "" },
  { id: "m5", parentId: "m4", role: "assistant", content: [{ type: "text", text: "Like this" }], attachments: [], createdAt: "" },
];

describe("getActivePath", () => {
  it("returns path from root to the given leaf", () => {
    const path = getActivePath(messages, "m5");
    expect(path.map((m) => m.id)).toEqual(["m1", "m2", "m4", "m5"]);
  });

  it("returns path for a branch leaf", () => {
    const path = getActivePath(messages, "m3");
    expect(path.map((m) => m.id)).toEqual(["m1", "m3"]);
  });
});

describe("getSiblings", () => {
  it("returns siblings of a message", () => {
    const sibs = getSiblings(messages, "m2");
    expect(sibs.map((m) => m.id)).toEqual(["m2", "m3"]);
  });

  it("returns single item if no siblings", () => {
    const sibs = getSiblings(messages, "m1");
    expect(sibs.map((m) => m.id)).toEqual(["m1"]);
  });
});

describe("findSessionForBranchTip", () => {
  it("returns session id for a branch tip", () => {
    const meta = {
      sessions: { sess_A: { branchTip: "m5", createdAt: "" }, sess_B: { branchTip: "m3", createdAt: "" } },
    } as unknown as ConversationMeta;
    expect(findSessionForBranchTip(meta, "m5")).toBe("sess_A");
    expect(findSessionForBranchTip(meta, "m3")).toBe("sess_B");
  });

  it("returns null if no session found", () => {
    const meta = { sessions: {} } as unknown as ConversationMeta;
    expect(findSessionForBranchTip(meta, "m1")).toBeNull();
  });
});
