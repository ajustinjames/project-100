import { describe, expect, it } from "vitest";
import { decodeShareFragment, encodeShareFragment } from "./share-link.ts";

describe("encodeShareFragment", () => {
  it("writes plain decimals with no grouping or exponent", () => {
    expect(encodeShareFragment(100e6, 240e9, "USD")).toBe(
      "#v=1&gift=100000000&fortune=240000000000&cur=USD",
    );
    expect(encodeShareFragment(1e15, 1e15, "JPY")).toBe(
      "#v=1&gift=1000000000000000&fortune=1000000000000000&cur=JPY",
    );
  });

  it("rounds the gift and fortune to two decimal places when the share stays the same", () => {
    expect(encodeShareFragment(0.4, 1.25, "EUR")).toBe("#v=1&gift=0.4&fortune=1.25&cur=EUR");
    expect(encodeShareFragment(1_000_000.004, 240_000_000_000.006, "GBP")).toBe(
      "#v=1&gift=1000000&fortune=240000000000.01&cur=GBP",
    );
  });

  it("returns null when the gift rounds to zero", () => {
    expect(encodeShareFragment(0.004, 240e9, "USD")).toBeNull();
  });

  it("returns null when rounding would change the share (pre-launch review)", () => {
    // $0.005 of $0.014 is about 36%; rounded to cents it would be 100%.
    expect(encodeShareFragment(0.005, 0.014, "USD")).toBeNull();
    expect(encodeShareFragment(0.4, 1.256, "EUR")).toBeNull();
    expect(encodeShareFragment(12.345_6, 99.999, "GBP")).toBeNull();
  });

  it("returns null when a gift just under the fortune would round to all of it (review round 2)", () => {
    expect(encodeShareFragment(9999.999, 10_000, "USD")).toBeNull();
    expect(encodeShareFragment(10_000, 10_000, "USD")).toBe(
      "#v=1&gift=10000&fortune=10000&cur=USD",
    );
  });
});

describe("decodeShareFragment", () => {
  it.each(["", "#"])('ignores a missing or empty fragment "%s"', (hash) => {
    expect(decodeShareFragment(hash)).toBeNull();
  });

  it.each([
    "#v=1&v=1&gift=100&fortune=200&cur=USD",
    "#v=1&gift=100&gift=100&fortune=200&cur=USD",
    "#v=1&gift=100&fortune=200&fortune=200&cur=USD",
    "#v=1&gift=100&fortune=200&cur=USD&cur=USD",
  ])("ignores a repeated parameter in %s", (hash) => {
    expect(decodeShareFragment(hash)).toBeNull();
  });

  it.each(["#v=2&gift=100&fortune=200&cur=USD", "#gift=100&fortune=200&cur=USD"])(
    "ignores a version other than 1 in %s",
    (hash) => {
      expect(decodeShareFragment(hash)).toBeNull();
    },
  );

  it.each([
    "#v=1&gift=100&fortune=200&cur=XYZ",
    "#v=1&gift=100&fortune=200&cur=usd",
    "#v=1&gift=100&fortune=200",
  ])("ignores a currency not in the list in %s", (hash) => {
    expect(decodeShareFragment(hash)).toBeNull();
  });

  it.each([
    "#v=1&fortune=200&cur=USD",
    "#v=1&gift=100&cur=USD",
    "#v=1&gift=1e8&fortune=200&cur=USD",
    "#v=1&gift=1,000&fortune=2000&cur=USD",
    "#v=1&gift=1.234&fortune=200&cur=USD",
    "#v=1&gift=-5&fortune=200&cur=USD",
    "#v=1&gift=0&fortune=200&cur=USD",
    "#v=1&gift=100M&fortune=200&cur=USD",
    "#v=1&gift=100&fortune=1000000000000001&cur=USD",
    "#v=1&gift=&fortune=200&cur=USD",
    "#v=1&gift=.5&fortune=200&cur=USD",
  ])("ignores a missing or malformed amount in %s", (hash) => {
    expect(decodeShareFragment(hash)).toBeNull();
  });

  it("ignores a gift larger than the fortune", () => {
    expect(decodeShareFragment("#v=1&gift=300&fortune=200&cur=USD")).toBeNull();
  });

  it("reads a valid link, with or without unknown parameters", () => {
    const expected = { gift: 100e6, fortune: 240e9, currency: "USD" };
    expect(decodeShareFragment("#v=1&gift=100000000&fortune=240000000000&cur=USD")).toEqual(
      expected,
    );
    expect(
      decodeShareFragment("#cur=USD&fortune=240000000000&utm=x&gift=100000000&v=1&extra"),
    ).toEqual(expected);
  });

  it("round-trips, including a 0.4 gift", () => {
    for (const [gift, fortune, currency] of [
      [0.4, 0.4, "EUR"],
      [100e6, 240e9, "USD"],
      [7.1e9, 34e9, "INR"],
      [1, 1e15, "JPY"],
    ] as const) {
      const fragment = encodeShareFragment(gift, fortune, currency);
      expect(fragment).not.toBeNull();
      expect(decodeShareFragment(fragment ?? "")).toEqual({ gift, fortune, currency });
    }
  });
});
