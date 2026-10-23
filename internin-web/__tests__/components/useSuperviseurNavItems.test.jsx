import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

const hoisted = vi.hoisted(() => ({
  permissions: [],
  mesStagiaires: vi.fn(() => ({ data: undefined })),
  evaluations: vi.fn(() => ({ data: undefined })),
  // Hook de requête factice : { data: undefined }
  hook: () => ({ data: undefined }),
}));

vi.mock("@/lib/queries/useSuperviseur", () => ({
  useMesStagiaires: hoisted.mesStagiaires,
  useEvaluationsSuperviseur: hoisted.evaluations,
}));
vi.mock("@/lib/queries/useEquipe", () => ({
  useMonProfilEquipe: () => ({
    data: { permissions: hoisted.permissions },
  }),
}));
vi.mock("@/lib/i18n/useTranslation", () => ({
  useTranslation: () => ({ t: (k) => k, locale: "fr" }),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/tableau-de-bord" }));
vi.mock("@/lib/store/useAuthStore", () => ({
  useAuthStore: () => ({}),
}));
vi.mock("@/lib/queries/useMesOffres", () => ({ useMesOffres: hoisted.hook }));
vi.mock("@/lib/queries/useUniversiteStats", () => ({ useUniversiteStats: hoisted.hook }));
vi.mock("@/lib/queries/useCandidaturesEntreprise", () => ({ useCandidaturesEntreprise: hoisted.hook }));
vi.mock("@/lib/queries/useEntretiens", () => ({ useEntretiensEntreprise: hoisted.hook, useEntretiensEnAttente: hoisted.hook, useMesEntretiens: hoisted.hook }));
vi.mock("@/lib/queries/useAdminStats", () => ({ useAdminStats: hoisted.hook }));
vi.mock("@/lib/queries/useSecurityCentre", () => ({ useSecurityOverview: hoisted.hook }));
vi.mock("@/lib/queries/useNotifications", () => ({ useNotificationsNonLuesCount: hoisted.hook }));
vi.mock("@/lib/queries/useAdminProfile", () => ({ useAdminProfile: hoisted.hook }));
vi.mock("@/lib/queries/usePartenariats", () => ({ useInvitationsRecues: hoisted.hook }));
vi.mock("@/lib/queries/useOffres", () => ({ useOffres: hoisted.hook }));
vi.mock("@/lib/queries/useMesCandidatures", () => ({ useMesCandidatures: hoisted.hook }));
vi.mock("@/lib/queries/useStages", () => ({ useMonStage: hoisted.hook }));
vi.mock("@/lib/queries/useFavoris", () => ({ useFavorisCount: hoisted.hook }));
vi.mock("@/lib/queries/useEtatsVue", () => ({ useEtatVue: hoisted.hook, useMarkEtatVue: hoisted.hook }));
vi.mock("@/lib/queries/usePropositionsStagiaire", () => ({
  usePropositionsStagiaire: () => ({ data: undefined }),
  countPropositionsEnAttente: () => 0,
}));

import { useSuperviseurNavItems } from "@/lib/navigation/useNavItems";

const GESTIONNAIRE_RECRUTEMENT = [
  "offres.gerer",
  "candidats.gerer",
  "entretiens.gerer",
  "talents.voir",
  "talents.proposer",
  "conventions.voir",
  "conventions.gerer",
];
const SUPERVISEUR = [
  "stagiaires.suivre",
  "stagiaires.evaluer",
  "entretiens.gerer",
  "conventions.voir",
];

const hrefs = (items) => items.map((i) => i.href);

describe("useSuperviseurNavItems — cohérence avec les permissions de l'API", () => {
  beforeEach(() => {
    hoisted.mesStagiaires.mockClear();
    hoisted.evaluations.mockClear();
  });

  it("gestionnaire de recrutement : pas de Calendrier ni de supervision, et aucun appel /superviseur/*", () => {
    hoisted.permissions = GESTIONNAIRE_RECRUTEMENT;
    const { result } = renderHook(() => useSuperviseurNavItems());
    const links = hrefs(result.current);

    expect(links).not.toContain("/calendrier-supervision");
    expect(links).not.toContain("/mes-stagiaires");
    expect(links).not.toContain("/mes-stagiaires/evaluations");
    // ses vraies fonctionnalités restent accessibles
    expect(links).toEqual(
      expect.arrayContaining([
        "/offres-entreprise",
        "/candidats",
        "/entretiens-entreprise",
      ]),
    );

    // Les requêtes de supervision sont désactivées (sinon 403 en boucle)
    expect(hoisted.mesStagiaires).toHaveBeenCalledWith({ enabled: false });
    expect(hoisted.evaluations).toHaveBeenCalledWith({ enabled: false });
  });

  it("superviseur : Calendrier, stagiaires et évaluations disponibles, requêtes actives", () => {
    hoisted.permissions = SUPERVISEUR;
    const { result } = renderHook(() => useSuperviseurNavItems());
    const links = hrefs(result.current);

    expect(links).toEqual(
      expect.arrayContaining([
        "/calendrier-supervision",
        "/mes-stagiaires",
        "/mes-stagiaires/evaluations",
      ]),
    );
    expect(hoisted.mesStagiaires).toHaveBeenCalledWith({ enabled: true });
    expect(hoisted.evaluations).toHaveBeenCalledWith({ enabled: true });
  });
});
