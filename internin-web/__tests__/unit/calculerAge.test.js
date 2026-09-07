import { describe, it, expect, vi, afterEach } from "vitest";
import { calculerAge } from "@/lib/utils/calculerAge";

describe("calculerAge", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("retourne null si date absente", () => {
    expect(calculerAge(null)).toBeNull();
    expect(calculerAge(undefined)).toBeNull();
    expect(calculerAge("")).toBeNull();
  });

  it("calcule l'âge exact quand l'anniversaire est passé", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-24T12:00:00Z"));
    expect(calculerAge("2000-01-01")).toBe(26);
  });

  it("décrémente si l'anniversaire n'est pas encore passé cette année", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
    expect(calculerAge("2000-06-15")).toBe(25);
  });

  it("gère une date ISO complète", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-24T12:00:00Z"));
    expect(calculerAge("1998-08-24T00:00:00.000Z")).toBe(28);
  });
});
