import { describe, expect, it } from "vitest";
import { WALK_DURATION_MS, walkPosition } from "./walk.ts";

describe("walkPosition", () => {
  it("moves at a constant speed from start to end over the duration", () => {
    expect(walkPosition(1_000, 51_000, 0)).toBe(1_000);
    expect(walkPosition(1_000, 51_000, WALK_DURATION_MS / 4)).toBe(13_500);
    expect(walkPosition(1_000, 51_000, WALK_DURATION_MS / 2)).toBe(26_000);
    expect(walkPosition(1_000, 51_000, WALK_DURATION_MS)).toBe(51_000);
  });

  it("takes the same time whatever the length", () => {
    expect(walkPosition(0, 300, WALK_DURATION_MS / 2)).toBe(150);
    expect(walkPosition(0, 3_000_000, WALK_DURATION_MS / 2)).toBe(1_500_000);
  });

  it("stays at the ends outside the walk", () => {
    expect(walkPosition(100, 200, -5)).toBe(100);
    expect(walkPosition(100, 200, WALK_DURATION_MS * 2)).toBe(200);
  });
});
