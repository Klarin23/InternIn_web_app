import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const h = vi.hoisted(() => ({
  replace: vi.fn(),
  perms: { permissions: [], isPending: false, isUnresolved: false, refetch: vi.fn() },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: h.replace }) }));
vi.mock("@/lib/i18n/useTranslation", () => ({
  useTranslation: () => ({ t: (k) => k, locale: "fr" }),
}));
vi.mock("@/lib/store/useAuthStore", () => ({
  useAuthStore: () => ({
    user: { typeUtilisateur: "membre_entreprise", email: "rh@acme.com" },
    token: "jwt",
  }),
}));
vi.mock("@/lib/auth/useAuthReady", () => ({ useAuthReady: () => true }));
vi.mock("@/lib/queries/useEquipe", () => ({
  useMonProfilEquipe: () => ({ data: { nom: "Awa Ngono" } }),
}));
vi.mock("@/lib/queries/useMembrePermissions", () => ({
  useMembrePermissions: () => h.perms,
}));
vi.mock("@/lib/navigation/useNavItems", () => ({ useSuperviseurNavItems: () => [] }));
vi.mock("@/components/layout/AppSidebar", () => ({ default: () => null }));
vi.mock("@/components/layout/PullToRefresh", () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock("@/components/features/system/MaintenanceGate", () => ({
  default: ({ children }) => <>{children}</>,
}));

import SuperviseurLayout from "@/app/(superviseur)/layout";

const setPerms = (over) => {
  h.perms = { permissions: [], isPending: false, isUnresolved: false, refetch: vi.fn(), ...over };
};

describe("Layout (superviseur) — garde d'accès", () => {
  beforeEach(() => {
    h.replace.mockClear();
    setPerms({});
  });

  it("gestionnaire de recrutement : page non rendue et redirection vers le tableau de bord", () => {
    setPerms({ permissions: ["offres.gerer", "candidats.gerer", "entretiens.gerer"] });
    render(<SuperviseurLayout><div data-testid="page" /></SuperviseurLayout>);
    expect(screen.queryByTestId("page")).toBeNull();
    expect(h.replace).toHaveBeenCalledWith("/tableau-de-bord");
  });

  it("superviseur : page rendue, aucune redirection", () => {
    setPerms({ permissions: ["stagiaires.suivre"] });
    render(<SuperviseurLayout><div data-testid="page" /></SuperviseurLayout>);
    expect(screen.getByTestId("page")).toBeTruthy();
    expect(h.replace).not.toHaveBeenCalled();
  });

  it("permissions en chargement : on attend (pas de page, pas de redirection)", () => {
    setPerms({ isPending: true });
    render(<SuperviseurLayout><div data-testid="page" /></SuperviseurLayout>);
    expect(screen.queryByTestId("page")).toBeNull();
    expect(h.replace).not.toHaveBeenCalled();
  });

  it("profil injoignable : on laisse la page (l'API reste l'arbitre), sans redirection", () => {
    setPerms({ isUnresolved: true });
    render(<SuperviseurLayout><div data-testid="page" /></SuperviseurLayout>);
    expect(screen.getByTestId("page")).toBeTruthy();
    expect(h.replace).not.toHaveBeenCalled();
  });
});
