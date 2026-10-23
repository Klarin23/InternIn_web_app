import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const h = vi.hoisted(() => ({
  perms: { permissions: [], isPending: false, isUnresolved: false, refetch: vi.fn() },
  hook: () => ({ data: undefined }),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/lib/i18n/useTranslation", () => ({
  useTranslation: () => ({ t: (k) => k, locale: "fr" }),
}));
vi.mock("@/lib/store/useAuthStore", () => ({
  useAuthStore: () => ({
    user: { typeUtilisateur: "membre_entreprise", email: "rh@acme.com", statutCompte: "actif" },
    token: "jwt",
  }),
}));
vi.mock("@/lib/queries/useMembrePermissions", () => ({
  useMembrePermissions: () => h.perms,
}));
vi.mock("@/lib/queries/useEquipe", () => ({
  useMonProfilEquipe: () => ({ data: { nom: "Awa Ngono", nomEntreprise: "Acme" } }),
}));
vi.mock("@/lib/queries/useEntrepriseProfile", () => ({ useEntrepriseProfile: h.hook }));
vi.mock("@/lib/queries/useAdminProfile", () => ({ useAdminProfile: h.hook }));
vi.mock("@/lib/queries/useUniversiteProfile", () => ({ useUniversiteProfile: h.hook }));
vi.mock("@/lib/navigation/useNavItems", () => ({
  useStagiaireNavItems: () => [],
  useEntrepriseNavItems: () => [],
  useAdminNavItems: () => [],
  useSuperviseurNavItems: () => [],
  useUniversiteNavItems: () => [],
  useRoleAdminLabels: () => ({}),
}));

// Composants lourds remplacés par des marqueurs
vi.mock("@/components/layout/AppSidebar", () => ({
  default: ({ roleLabel }) => <div data-testid="sidebar">{roleLabel}</div>,
}));
vi.mock("@/components/layout/AppHeader", () => ({ default: () => null }));
vi.mock("@/components/layout/PullToRefresh", () => ({
  default: ({ children }) => <div>{children}</div>,
}));
vi.mock("@/components/features/system/MaintenanceGate", () => ({
  default: ({ children }) => <>{children}</>,
}));
vi.mock("@/components/features/system/AdminMaintenanceToast", () => ({ default: () => null }));
vi.mock("@/components/features/account/InactiveAccountGate", () => ({ default: () => null }));
vi.mock("@/components/features/dashboard/StagiaireDashboardContent", () => ({ default: () => null }));
vi.mock("@/components/features/dashboard-entreprise/EntrepriseDashboardContent", () => ({ default: () => null }));
vi.mock("@/components/features/dashboard-admin/AdminDashboardContent", () => ({ default: () => null }));
vi.mock("@/components/features/dashboard-universite/UniversiteDashboardContent", () => ({ default: () => null }));
vi.mock("@/components/features/dashboard-superviseur/SuperviseurDashboardContent", () => ({
  default: () => <div data-testid="dashboard-supervision" />,
}));
vi.mock("@/components/features/dashboard-recrutement/RecrutementDashboardContent", () => ({
  default: () => <div data-testid="dashboard-recrutement" />,
}));

import DashboardRouter from "@/components/features/dashboard/shared/DashboardRouter";

const setPerms = (over) => {
  h.perms = {
    permissions: [],
    isPending: false,
    isUnresolved: false,
    refetch: vi.fn(),
    ...over,
  };
};

describe("DashboardRouter — membre_entreprise", () => {
  beforeEach(() => setPerms({}));

  it("gestionnaire de recrutement → dashboard recrutement (plus d'appel /superviseur/tableau-de-bord)", () => {
    setPerms({ permissions: ["offres.gerer", "candidats.gerer", "entretiens.gerer"] });
    render(<DashboardRouter />);
    expect(screen.getByTestId("dashboard-recrutement")).toBeTruthy();
    expect(screen.queryByTestId("dashboard-supervision")).toBeNull();
    expect(screen.getByTestId("sidebar").textContent).toBe("roles.recruitmentSpace");
  });

  it("superviseur (stagiaires.suivre) → dashboard supervision, inchangé", () => {
    setPerms({ permissions: ["stagiaires.suivre", "stagiaires.evaluer"] });
    render(<DashboardRouter />);
    expect(screen.getByTestId("dashboard-supervision")).toBeTruthy();
    expect(screen.queryByTestId("dashboard-recrutement")).toBeNull();
    expect(screen.getByTestId("sidebar").textContent).toBe("roles.supervisorSpace");
  });

  it("permissions en cours de chargement → aucun dashboard (pas d'appel prématuré)", () => {
    setPerms({ isPending: true });
    render(<DashboardRouter />);
    expect(screen.queryByTestId("dashboard-supervision")).toBeNull();
    expect(screen.queryByTestId("dashboard-recrutement")).toBeNull();
  });

  it("profil injoignable → erreur avec bouton Réessayer (pas un dashboard au hasard)", () => {
    const refetch = vi.fn();
    setPerms({ isUnresolved: true, refetch });
    render(<DashboardRouter />);
    expect(screen.queryByTestId("dashboard-supervision")).toBeNull();
    expect(screen.queryByTestId("dashboard-recrutement")).toBeNull();
    screen.getByText("superviseurDashboard.error.retry").click();
    expect(refetch).toHaveBeenCalled();
  });
});
