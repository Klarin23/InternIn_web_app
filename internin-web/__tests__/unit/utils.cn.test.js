import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (className merge)", () => {
  it("concatène des classes simples", () => {
    expect(cn("px-2", "py-1")).toContain("px-2");
    expect(cn("px-2", "py-1")).toContain("py-1");
  });

  it("ignore les valeurs falsy", () => {
    expect(cn("a", false && "b", null, undefined, "c")).toBe(
      cn("a", "c"),
    );
  });

  it("résout les conflits Tailwind (dernier gagne)", () => {
    const result = cn("px-2", "px-4");
    expect(result).toContain("px-4");
    expect(result).not.toContain("px-2");
  });
});
