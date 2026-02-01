import { describe, expect, it } from "vitest";
import { maskName } from "./maskName";

describe("maskName", () => {
  it("masks letters and preserves hyphen", () => {
    expect(maskName("Ada-Lovelace")).toBe("_ _ _ - _ _ _ _ _ _ _ _");
  });

  it("uses triple spaces between words", () => {
    expect(maskName("A B")).toBe("_   _");
  });

  it("keeps digits and punctuation", () => {
    expect(maskName("R2D2!")).toBe("_ 2 _ 2 !");
  });
});
