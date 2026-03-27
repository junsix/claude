import { describe, it, expect } from "vitest";
import { ProfileWriteQueue } from "../write-queue.js";

describe("ProfileWriteQueue", () => {
  it("serializes writes for the same profile", async () => {
    const queue = new ProfileWriteQueue();
    const order: number[] = [];

    const p1 = queue.enqueue("prof_1", async () => {
      await new Promise((r) => setTimeout(r, 50));
      order.push(1);
    });
    const p2 = queue.enqueue("prof_1", async () => {
      order.push(2);
    });

    await Promise.all([p1, p2]);
    expect(order).toEqual([1, 2]);
  });

  it("allows parallel writes for different profiles", async () => {
    const queue = new ProfileWriteQueue();
    const order: string[] = [];

    const p1 = queue.enqueue("prof_a", async () => {
      await new Promise((r) => setTimeout(r, 50));
      order.push("a");
    });
    const p2 = queue.enqueue("prof_b", async () => {
      order.push("b");
    });

    await Promise.all([p1, p2]);
    expect(order).toEqual(["b", "a"]);
  });
});
