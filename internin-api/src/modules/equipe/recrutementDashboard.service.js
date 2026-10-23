import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  sql,
} from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  activitesEquipe,
  candidatures,
  entreprises,
  entretiens,
  offresFinales,
  offresStage,
  stagiaires,
} from "../../db/schema.js";
import {
  resolveEntrepriseContext,
  hasEntreprisePermission,
} from "../../utils/entrepriseContext.js";
import { STAGE_TZ, todayYmdInAppTz } from "../../utils/dateValidation.js";

const PERMISSION_PAR_SECTION = {
  offers: "offres.gerer",
  applications: "candidats.gerer",
  interviews: "entretiens.gerer",
};

const STATUTS_ENTRETIEN_A_VENIR = ["planifie", "valide", "confirme"];
const STATUTS_ENTRETIEN_REALISE = [
  "planifie",
  "valide",
  "confirme",
  "termine",
];

function erreur(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function readSettledDashboardQuery(result, name) {
  if (result.status === "fulfilled") return result.value;
  console.error(`[recrutement-dashboard] ${name} query failed`);
  return null;
}

export function assertRecrutementDashboardAccess(context, section) {
  const permission = PERMISSION_PAR_SECTION[section];
  if (!permission) {
    throw erreur(400, "Section de tableau de bord invalide");
  }
  if (!context) {
    throw erreur(403, "Accès refusé");
  }
  if (!hasEntreprisePermission(context, permission)) {
    throw erreur(403, "Vous n'avez pas la permission nécessaire.");
  }
  if (
    section !== "offers" &&
    context.entreprise.statutVerification !== "verifiee"
  ) {
    const err = erreur(
      403,
      "Votre entreprise doit être vérifiée pour accéder aux candidatures et entretiens.",
    );
    err.code = "ENTREPRISE_NON_VERIFIEE";
    throw err;
  }
  return context;
}

async function getContextWithSectionPermission(idUtilisateur, section) {
  const context = await resolveEntrepriseContext(idUtilisateur);
  assertRecrutementDashboardAccess(context, section);
  return context;
}

async function getOffersSection(idEntreprise) {
  const [row] = await db
    .select({
      total: sql`count(*)::int`.mapWith(Number),
      active: sql`count(*) filter (where ${offresStage.statut} = 'publie')::int`.mapWith(
        Number,
      ),
    })
    .from(offresStage)
    .where(eq(offresStage.idEntreprise, idEntreprise));

  return {
    total: row?.total ?? 0,
    active: row?.active ?? 0,
  };
}

async function getApplicationsSection(idEntreprise) {
  const results = await Promise.allSettled([
      db
        .select({
          statut: candidatures.statut,
          count: sql`count(*)::int`.mapWith(Number),
        })
        .from(candidatures)
        .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
        .where(eq(offresStage.idEntreprise, idEntreprise))
        .groupBy(candidatures.statut),
      db
        .select({
          idCandidature: candidatures.idCandidature,
          statut: candidatures.statut,
          dateCandidature: candidatures.dateCandidature,
          idOffre: offresStage.idOffre,
          titreOffre: offresStage.titre,
          prenom: stagiaires.prenom,
          nom: stagiaires.nom,
        })
        .from(candidatures)
        .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
        .innerJoin(stagiaires, eq(candidatures.idStagiaire, stagiaires.idStagiaire))
        .where(
          and(
            eq(offresStage.idEntreprise, idEntreprise),
            inArray(candidatures.statut, ["soumise", "consultee"]),
          ),
        )
        .orderBy(asc(candidatures.dateCandidature))
        .limit(6),
      db
        .select({
          waiting: sql`count(*) filter (where ${offresFinales.statutReponseStagiaire} = 'en_attente')::int`.mapWith(
            Number,
          ),
          accepted: sql`count(*) filter (where ${offresFinales.statutReponseStagiaire} = 'acceptee')::int`.mapWith(
            Number,
          ),
        })
        .from(offresFinales)
        .innerJoin(entretiens, eq(offresFinales.idEntretien, entretiens.idEntretien))
        .innerJoin(candidatures, eq(entretiens.idCandidature, candidatures.idCandidature))
        .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
        .where(
          and(
            eq(offresStage.idEntreprise, idEntreprise),
            eq(offresFinales.statutValidationPlateforme, "approuve"),
          ),
        ),
      db
        .select({
          idActivite: activitesEquipe.idActivite,
          action: activitesEquipe.action,
          dateAction: activitesEquipe.dateAction,
          idOffre: offresStage.idOffre,
          titreOffre: offresStage.titre,
          prenom: stagiaires.prenom,
          nom: stagiaires.nom,
        })
        .from(activitesEquipe)
        .innerJoin(
          candidatures,
          eq(activitesEquipe.idCandidature, candidatures.idCandidature),
        )
        .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
        .innerJoin(stagiaires, eq(candidatures.idStagiaire, stagiaires.idStagiaire))
        .where(
          and(
            eq(activitesEquipe.idEntreprise, idEntreprise),
            eq(offresStage.idEntreprise, idEntreprise),
          ),
        )
        .orderBy(desc(activitesEquipe.dateAction))
        .limit(5),
      db
        .select({
          idOffre: offresStage.idOffre,
          titre: offresStage.titre,
          datePublication: offresStage.datePublication,
          applications: sql`count(distinct ${candidatures.idCandidature})::int`.mapWith(
            Number,
          ),
          preselected: sql`count(distinct ${candidatures.idCandidature}) filter (where ${candidatures.statut} = 'preselectionnee')::int`.mapWith(
            Number,
          ),
        })
        .from(offresStage)
        .leftJoin(candidatures, eq(candidatures.idOffre, offresStage.idOffre))
        .where(
          and(
            eq(offresStage.idEntreprise, idEntreprise),
            eq(offresStage.statut, "publie"),
          ),
        )
        .groupBy(offresStage.idOffre, offresStage.titre, offresStage.datePublication)
        .orderBy(desc(offresStage.datePublication))
        .limit(5),
    ]);
  const statusRows = readSettledDashboardQuery(results[0], "application_counts");
  const reviewItems = readSettledDashboardQuery(results[1], "review_candidates");
  const finalOfferStats = readSettledDashboardQuery(results[2], "final_offers");
  const activityRows = readSettledDashboardQuery(results[3], "application_activity");
  const performanceRows = readSettledDashboardQuery(results[4], "offer_performance");

  const statusCounts = statusRows
    ? Object.fromEntries(statusRows.map(({ statut, count }) => [statut, count]))
    : null;
  const pending = finalOfferStats?.[0] ?? { waiting: 0, accepted: 0 };

  return {
    total: statusCounts
      ? Object.values(statusCounts).reduce((total, count) => total + count, 0)
      : null,
    statusCounts,
    needsReview: statusCounts
      ? (statusCounts.soumise ?? 0) + (statusCounts.consultee ?? 0)
      : null,
    preselected: statusCounts ? statusCounts.preselectionnee ?? 0 : null,
    finalOffersWaiting: finalOfferStats ? pending.waiting : null,
    finalOffersAccepted: finalOfferStats ? pending.accepted : null,
    reviewItems,
    offerPerformance: performanceRows,
    activity: activityRows,
    sectionErrors: {
      counts: !statusRows,
      reviewItems: !reviewItems,
      finalOffers: !finalOfferStats,
      offerPerformance: !performanceRows,
      activity: !activityRows,
    },
  };
}

async function getInterviewSection(idEntreprise) {
  const now = new Date();
  const today = todayYmdInAppTz(now);
  const todayPredicate = sql`(${entretiens.dateHeure} AT TIME ZONE ${STAGE_TZ})::date = ${today}::date`;
  const scheduledPredicate = inArray(
    entretiens.statut,
    STATUTS_ENTRETIEN_A_VENIR,
  );
  const companyJoin = () =>
    db
      .select({
        idEntretien: entretiens.idEntretien,
        idCandidature: candidatures.idCandidature,
        dateHeure: entretiens.dateHeure,
        statut: entretiens.statut,
        titreOffre: offresStage.titre,
        prenom: stagiaires.prenom,
        nom: stagiaires.nom,
      })
      .from(entretiens)
      .innerJoin(candidatures, eq(entretiens.idCandidature, candidatures.idCandidature))
      .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
      .innerJoin(stagiaires, eq(candidatures.idStagiaire, stagiaires.idStagiaire));

  const results = await Promise.allSettled([
      db
        .select({
          upcoming: sql`count(*) filter (where ${scheduledPredicate} and ${entretiens.dateHeure} >= ${now})::int`.mapWith(
            Number,
          ),
          today: sql`count(*) filter (where ${scheduledPredicate} and (${entretiens.dateHeure} AT TIME ZONE ${STAGE_TZ})::date = ${today}::date)::int`.mapWith(
            Number,
          ),
          needsAction: sql`count(*) filter (where ${entretiens.statut} = 'reprogramme')::int`.mapWith(
            Number,
          ),
          interviewedCandidates: sql`count(distinct ${entretiens.idCandidature}) filter (where ${inArray(entretiens.statut, STATUTS_ENTRETIEN_REALISE)})::int`.mapWith(
            Number,
          ),
        })
        .from(entretiens)
        .innerJoin(candidatures, eq(entretiens.idCandidature, candidatures.idCandidature))
        .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
        .where(eq(offresStage.idEntreprise, idEntreprise)),
      companyJoin()
        .where(
          and(
            eq(offresStage.idEntreprise, idEntreprise),
            scheduledPredicate,
            todayPredicate,
          ),
        )
        .orderBy(asc(entretiens.dateHeure))
        .limit(5),
      companyJoin()
        .where(
          and(
            eq(offresStage.idEntreprise, idEntreprise),
            scheduledPredicate,
            gte(entretiens.dateHeure, now),
            sql`(${entretiens.dateHeure} AT TIME ZONE ${STAGE_TZ})::date > ${today}::date`,
          ),
        )
        .orderBy(asc(entretiens.dateHeure))
        .limit(5),
      db
        .select({
          idOffre: offresStage.idOffre,
          count: sql`count(distinct ${entretiens.idCandidature})::int`.mapWith(
            Number,
          ),
        })
        .from(entretiens)
        .innerJoin(candidatures, eq(entretiens.idCandidature, candidatures.idCandidature))
        .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
        .where(
          and(
            eq(offresStage.idEntreprise, idEntreprise),
            inArray(entretiens.statut, STATUTS_ENTRETIEN_REALISE),
          ),
        )
        .groupBy(offresStage.idOffre),
    ]);
  const summaryRows = readSettledDashboardQuery(results[0], "interview_summary");
  const todayItems = readSettledDashboardQuery(results[1], "today_agenda");
  const upcomingItems = readSettledDashboardQuery(results[2], "upcoming_agenda");
  const interviewsByOffer = readSettledDashboardQuery(results[3], "offer_interviews");

  return {
    upcoming: summaryRows?.[0]?.upcoming ?? null,
    today: summaryRows?.[0]?.today ?? null,
    needsAction: summaryRows?.[0]?.needsAction ?? null,
    interviewedCandidates: summaryRows?.[0]?.interviewedCandidates ?? null,
    todayItems,
    upcomingItems,
    interviewsByOffer,
    sectionErrors: {
      summary: !summaryRows,
      todayItems: !todayItems,
      upcomingItems: !upcomingItems,
      interviewsByOffer: !interviewsByOffer,
    },
  };
}

export async function getRecrutementDashboardSection(
  idUtilisateur,
  section,
) {
  const context = await getContextWithSectionPermission(idUtilisateur, section);
  const idEntreprise = context.entreprise.idEntreprise;

  if (section === "offers") return getOffersSection(idEntreprise);
  if (section === "applications") return getApplicationsSection(idEntreprise);
  return getInterviewSection(idEntreprise);
}
