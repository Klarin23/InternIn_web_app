import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const h = vi.hoisted(() => ({
  permissions: [],
  profile: { nom: "Awa Ngono", statutVerification: "verifiee" },
  sections: {},
  requests: [],
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
vi.mock("@/lib/i18n/useTranslation", () => ({
  useTranslation: () => ({
    t: (key, values) =>
      values ? `${key} ${Object.values(values).join(" ")}` : key,
    locale: "fr",
  }),
}));
vi.mock("@/lib/queries/useEquipe", () => ({
  useMonProfilEquipe: () => ({ data: h.profile }),
}));
vi.mock("@/lib/queries/useMembrePermissions", () => ({
  useMembrePermissions: () => ({
    has: (permission) => h.permissions.includes(permission),
  }),
}));
vi.mock("@/lib/queries/useRecruitmentDashboard", () => ({
  useRecruitmentDashboardSection: (section, enabled) => {
    h.requests.push({ section, enabled });
    return (
      h.sections[section] ||
      (enabled
        ? {
            data: undefined,
            isLoading: true,
            isError: false,
            refetch: vi.fn(),
          }
        : {
            data: undefined,
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
          })
    );
  },
}));
vi.mock("@/components/layout/AppHeader", () => ({
  default: ({ title, subtitle }) => (
    <header>
      <span>{title}</span>
      <span>{subtitle}</span>
    </header>
  ),
}));

import RecrutementDashboardContent from "@/components/features/dashboard-recrutement/RecrutementDashboardContent";

const loaded = (data) => ({
  data,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
});

describe("RecrutementDashboardContent", () => {
  beforeEach(() => {
    h.permissions = [
      "offres.gerer",
      "candidats.gerer",
      "entretiens.gerer",
    ];
    h.profile = { nom: "Awa Ngono", statutVerification: "verifiee" };
    h.requests = [];
    h.sections = {
      offers: loaded({ total: 3, active: 2 }),
      applications: loaded({
        total: 9,
        statusCounts: { soumise: 2, consultee: 1, preselectionnee: 2 },
        needsReview: 3,
        preselected: 2,
        finalOffersWaiting: 1,
        finalOffersAccepted: 1,
        reviewItems: [
          {
            idCandidature: "application-1",
            idOffre: "offer-1",
            titreOffre: "Développeuse",
            prenom: "Mina",
            nom: "N.",
            statut: "soumise",
            dateCandidature: "2026-10-11T09:00:00.000Z",
          },
        ],
        offerPerformance: [
          {
            idOffre: "offer-1",
            titre: "Développeuse",
            applications: 4,
            preselected: 2,
          },
        ],
        activity: [],
      }),
      interviews: loaded({
        upcoming: 2,
        today: 1,
        needsAction: 0,
        interviewedCandidates: 2,
        todayItems: [
          {
            idEntretien: "interview-1",
            prenom: "Mina",
            nom: "N.",
            titreOffre: "Développeuse",
            dateHeure: "2026-10-12T09:00:00.000Z",
            statut: "confirme",
          },
        ],
        upcomingItems: [],
        interviewsByOffer: [{ idOffre: "offer-1", count: 2 }],
      }),
    };
  });

  it("présente les métriques utiles et les sections du workflow", () => {
    render(<RecrutementDashboardContent />);

    expect(screen.getByText("recrutementDashboard.title")).toBeTruthy();
    expect(screen.getByText("recrutementDashboard.greeting Awa")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "recrutementDashboard.pipeline" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "recrutementDashboard.priorities" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "recrutementDashboard.candidatesToReview" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "recrutementDashboard.agenda" })).toBeTruthy();
    expect(screen.getAllByText(/Mina N\./).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /recrutementDashboard.reviewAction/ }).getAttribute("href"))
      .toBe("/candidats?idOffre=offer-1");
    expect(h.requests).toEqual([
      { section: "offers", enabled: true },
      { section: "applications", enabled: true },
      { section: "interviews", enabled: true },
    ]);
  });

  it("n'active que les sections autorisées par les permissions", () => {
    h.permissions = ["offres.gerer"];
    render(<RecrutementDashboardContent />);

    expect(h.requests).toEqual([
      { section: "offers", enabled: true },
      { section: "applications", enabled: false },
      { section: "interviews", enabled: false },
    ]);
    expect(screen.queryByRole("heading", { name: "recrutementDashboard.pipeline" })).toBeNull();
    expect(screen.getByText("recrutementDashboard.activeOffers")).toBeTruthy();
  });

  it("n'interroge pas les données de recrutement avant la vérification de l'entreprise", () => {
    h.permissions = ["candidats.gerer", "entretiens.gerer"];
    h.profile = { nom: "Awa Ngono", statutVerification: "en_attente" };
    render(<RecrutementDashboardContent />);

    expect(h.requests).toEqual([
      { section: "offers", enabled: false },
      { section: "applications", enabled: false },
      { section: "interviews", enabled: false },
    ]);
    expect(screen.getByText("recrutementDashboard.verificationRequired")).toBeTruthy();
  });

  it("isole l'erreur des candidatures et garde l'agenda disponible", () => {
    h.sections.applications = {
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    };
    render(<RecrutementDashboardContent />);

    expect(screen.getByRole("heading", { name: "recrutementDashboard.agenda" })).toBeTruthy();
    expect(screen.getAllByText("Mina N.").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("recrutementDashboard.sectionError recrutementDashboard.applications").length,
    ).toBeGreaterThan(0);
  });

  it("isole l'erreur de performance sans masquer les candidatures à traiter", () => {
    h.sections.applications = loaded({
      ...h.sections.applications.data,
      offerPerformance: null,
      sectionErrors: { offerPerformance: true },
    });
    render(<RecrutementDashboardContent />);

    expect(
      screen.getByRole("heading", {
        name: "recrutementDashboard.candidatesToReview",
      }),
    ).toBeTruthy();
    expect(screen.getByText(/recrutementDashboard.sectionError recrutementDashboard.offerPerformance/)).toBeTruthy();
    expect(screen.getAllByText("Mina N.").length).toBeGreaterThan(0);
  });

  it("affiche des états vides explicites", () => {
    h.sections.applications = loaded({
      total: 0,
      statusCounts: {},
      needsReview: 0,
      preselected: 0,
      finalOffersWaiting: 0,
      finalOffersAccepted: 0,
      reviewItems: [],
      offerPerformance: [],
      activity: [],
    });
    h.sections.interviews = loaded({
      upcoming: 0,
      today: 0,
      needsAction: 0,
      interviewedCandidates: 0,
      todayItems: [],
      upcomingItems: [],
      interviewsByOffer: [],
    });
    render(<RecrutementDashboardContent />);

    expect(screen.getByText("recrutementDashboard.noApplicationsToReview")).toBeTruthy();
    expect(screen.getByText("recrutementDashboard.noInterviewsToday")).toBeTruthy();
    expect(screen.getByText("recrutementDashboard.noPublishedOffers")).toBeTruthy();
    expect(screen.getByText("recrutementDashboard.noRecentActivity")).toBeTruthy();
  });

  it("explique l'absence de permissions sans lancer les API de section", () => {
    h.permissions = [];
    render(<RecrutementDashboardContent />);

    expect(screen.getByText("recrutementDashboard.noAccessTitle")).toBeTruthy();
    expect(h.requests.every((request) => !request.enabled)).toBe(true);
  });
});
