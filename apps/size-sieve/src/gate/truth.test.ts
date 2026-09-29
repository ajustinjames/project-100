import { describe, expect, it } from "vitest";
import { parseTruthFile } from "./truth.ts";

describe("parseTruthFile", () => {
  it("accepts and preserves inSizeBlock annotations", () => {
    const parsed = parseTruthFile(
      JSON.stringify({
        file: "sample.txt",
        sizeCount: 2,
        sequences: [
          {
            values: ["34", "38"],
            context: "finished chest",
            position: "line 12",
            inSizeBlock: true,
          },
        ],
      }),
    );

    expect(parsed.sequences[0]?.inSizeBlock).toBe(true);
  });

  it("rejects non-boolean inSizeBlock annotations", () => {
    expect(() =>
      parseTruthFile(
        JSON.stringify({
          file: "sample.txt",
          sizeCount: 2,
          sequences: [
            {
              values: ["34", "38"],
              context: "finished chest",
              position: "line 12",
              inSizeBlock: "yes",
            },
          ],
        }),
      ),
    ).toThrow("Truth sequence 1 inSizeBlock must be a boolean.");
  });
});
