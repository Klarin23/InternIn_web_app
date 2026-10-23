import { eq, and, inArray, sql, desc, asc } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  utilisateurs,
  universites,
  stagiaires,
  formations,
  stages,
  entreprises,
  contactsEntreprise,
  evaluationsHebdomadaires,
  conventionsStage,
  partenariatsUniversiteEntreprise,
  offresFinales,
  entretiens,
  candidatures,
  offresStage,
  membresEquipe,
  affectationsSuperviseurStage,
} from "../../db/schema.js";
import fs from "node:fs";
import path from "node:path";
import { genererConventionPdf } from "../../utils/conventionPdf.js";
import {
  buildConventionPdfData,
  getConventionEntrepriseById,
} from "../conventions/conventions.service.js";
import { peutActiverCompte } from "../../utils/emailVerificationGuard.js";
import { STAGE_TZ, todayYmdInAppTz } from "../../utils/dateValidation.js";
import {
  creerNotification,
  emitNotificationCreated,
} from "../notifications/notifications.service.js";
import { isAutoValidationEnabled, ELEMENT_UNIVERSITES } from "../../utils/autoValidation.js"


export async function getUniversiteProfile(idUtilisateur) {
  const [universite] = await db
    .select()
    .from(universites)
    .where(eq(universites.idUtilisateur, idUtilisateur));

  if (!universite) {
    const err = new Error("Profil université introuvable");
    err.status = 404;
    throw err;
  }

  return universite;
}

export async function updateUniversiteProfile(idUtilisateur, payload) {
  const universite = await getUniversiteProfile(idUtilisateur);

  const [maj] = await db
    .update(universites)
    .set({
      siteWeb: payload.siteWeb || null,
      logoUrl: payload.logoUrl || null,
      // Déjà validé et converti en entier par le schéma Zod.
      nombreEtudiants: payload.nombreEtudiants ?? null,
      contactServiceCarriere: payload.contactServiceCarriere || null,
      periodeStageHabituelle: payload.periodeStageHabituelle || null,
      nomCoordinateurStage: payload.nomCoordinateurStage || null,
    })
    .where(eq(universites.idUniversite, universite.idUniversite))
    .returning();

  return maj;
}


const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Nombre de jours calendaires écoulés dans le fuseau métier InternIn.
 * Contrairement à Date.now() - timestamp / 24h, ce calcul respecte le changement
 * de jour civil en Africa/Douala et reste indépendant du fuseau du serveur Node.
 */
function calendarDaysElapsedInAppTz(input, now = new Date()) {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return 0;

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: STAGE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const toUtcDay = (ymd) => {
    const [year, month, day] = ymd.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };

  const createdYmd = formatter.format(date);
  const todayYmd = todayYmdInAppTz(now);
  return Math.max(0, Math.floor((toUtcDay(todayYmd) - toUtcDay(createdYmd)) / DAY_MS));
}

export async function getUniversiteStats(idUtilisateur) {
  const universite = await getUniversiteProfile(idUtilisateur);
  const idUniversite = universite.idUniversite;

  const [{ count: etudiantsInscrits }] = await db
    .select({ count: sql`count(*)::int` })
    .from(stagiaires)
    .where(eq(stagiaires.idUniversite, idUniversite));

  const [{ count: conventionsActives }] = await db
    .select({ count: sql`count(*)::int` })
    .from(stages)
    .where(
      and(eq(stages.idUniversite, idUniversite), eq(stages.statut, "actif")),
    );

 
  const [entreprisesStageRows, entreprisesInviteesRows] = await Promise.all([
    db
      .selectDistinct({ idEntreprise: stages.idEntreprise })
      .from(stages)
      .where(eq(stages.idUniversite, idUniversite)),
    db
      .select({ idEntreprise: partenariatsUniversiteEntreprise.idEntreprise })
      .from(partenariatsUniversiteEntreprise)
      .where(
        and(
          eq(partenariatsUniversiteEntreprise.idUniversite, idUniversite),
          eq(partenariatsUniversiteEntreprise.statut, "acceptee"),
        ),
      ),
  ]);
  const idsEntreprisesPartenaires = new Set([
    ...entreprisesStageRows.map((e) => e.idEntreprise),
    ...entreprisesInviteesRows.map((e) => e.idEntreprise),
  ]);

  const conventionsEnAttenteRows = await db
    .select({ idConvention: conventionsStage.idConvention })
    .from(conventionsStage)
    .innerJoin(stages, eq(stages.idConvention, conventionsStage.idConvention))
    .where(
      and(
        eq(stages.idUniversite, idUniversite),
        eq(conventionsStage.approuveeParPlateforme, false),
      ),
    );

  const repartitionRows = await db
    .select({ statut: stages.statut, count: sql`count(*)::int` })
    .from(stages)
    .where(eq(stages.idUniversite, idUniversite))
    .groupBy(stages.statut);

  const repartitionStatuts = { actif: 0, termine: 0, interrompu: 0 };
  for (const r of repartitionRows) repartitionStatuts[r.statut] = r.count;

 
  const depotsParMois = await db
    .select({
      mois: sql`to_char(${conventionsStage.dateCreation}, 'YYYY-MM')`.as(
        "mois",
      ),
      count: sql`count(*)::int`,
    })
    .from(conventionsStage)
    .innerJoin(stages, eq(stages.idConvention, conventionsStage.idConvention))
    .where(eq(stages.idUniversite, idUniversite))
    .groupBy(sql`to_char(${conventionsStage.dateCreation}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${conventionsStage.dateCreation}, 'YYYY-MM')`);


  const alertesRows = await db
    .select({
      idConvention: conventionsStage.idConvention,
      dateCreation: conventionsStage.dateCreation,
    })
    .from(conventionsStage)
    .innerJoin(stages, eq(stages.idConvention, conventionsStage.idConvention))
    .where(
      and(
        eq(stages.idUniversite, idUniversite),
        eq(conventionsStage.approuveeParPlateforme, false),
      ),
    )
    .orderBy(conventionsStage.dateCreation)
    .limit(5);

  const now = new Date();
  const alertes = alertesRows.map((a) => ({
    idConvention: a.idConvention,
    joursAttente: calendarDaysElapsedInAppTz(a.dateCreation, now),
  }));

  return {
    etudiantsInscrits,
    entreprisesPartenaires: idsEntreprisesPartenaires.size,
    conventionsActives,
    conventionsEnAttente: conventionsEnAttenteRows.length,
    repartitionStatuts,
    depotsParMois,
    alertes,
  };
}


export async function listEntreprisesPartenaires(idUtilisateur, options = {}) {
  const { recherche } = options;
  const universite = await getUniversiteProfile(idUtilisateur);
  const idUniversite = universite.idUniversite;

  const [stagesRows, invitationsAccepteesRows] = await Promise.all([
    db
      .select({
        idStage: stages.idStage,
        idEntreprise: stages.idEntreprise,
        statut: stages.statut,
        idStagiaire: stages.idStagiaire,
      })
      .from(stages)
      .where(eq(stages.idUniversite, idUniversite)),
    // Entreprises devenues partenaires via une invitation acceptée — même
    // si aucun stage n'a encore démarré avec cette université.
    db
      .select({ idEntreprise: partenariatsUniversiteEntreprise.idEntreprise })
      .from(partenariatsUniversiteEntreprise)
      .where(
        and(
          eq(partenariatsUniversiteEntreprise.idUniversite, idUniversite),
          eq(partenariatsUniversiteEntreprise.statut, "acceptee"),
        ),
      ),
  ]);

  if (stagesRows.length === 0 && invitationsAccepteesRows.length === 0) {
    return [];
  }

  const idsEntreprisesInvitees = invitationsAccepteesRows.map(
    (p) => p.idEntreprise,
  );
  const idsEntreprises = [
    ...new Set([
      ...stagesRows.map((s) => s.idEntreprise),
      ...idsEntreprisesInvitees,
    ]),
  ];
  const idsStages = stagesRows.map((s) => s.idStage);

  const [entreprisesRows, contactsRows, evaluationsRows] = await Promise.all([
    db
      .select({
        idEntreprise: entreprises.idEntreprise,
        nomEntreprise: entreprises.nomEntreprise,
        secteurActivite: entreprises.secteurActivite,
        ville: entreprises.ville,
        logoUrl: entreprises.logoUrl,
        statutVerification: entreprises.statutVerification,
      })
      .from(entreprises)
      .where(inArray(entreprises.idEntreprise, idsEntreprises)),
    db
      .select({
        idEntreprise: contactsEntreprise.idEntreprise,
        nom: contactsEntreprise.nom,
        email: contactsEntreprise.email,
      })
      .from(contactsEntreprise)
      .where(
        and(
          inArray(contactsEntreprise.idEntreprise, idsEntreprises),
          eq(contactsEntreprise.estContactPrincipal, true),
        ),
      ),
    db
      .select()
      .from(evaluationsHebdomadaires)
      .where(inArray(evaluationsHebdomadaires.idStage, idsStages)),
  ]);

  const entrepriseParId = new Map(
    entreprisesRows.map((e) => [e.idEntreprise, e]),
  );
  const contactParEntreprise = new Map(
    contactsRows.map((c) => [c.idEntreprise, c]),
  );

 
  const notesParStage = new Map();
  for (const ev of evaluationsRows) {
    const notes = [
      ev.noteAssiduite,
      ev.noteCommunication,
      ev.noteInitiative,
      ev.noteProfessionnalisme,
      ev.noteTravailEquipe,
      ev.notePerformanceTechnique,
    ].filter((n) => n != null);
    if (!notes.length) continue;
    const liste = notesParStage.get(ev.idStage) || [];
    liste.push(...notes);
    notesParStage.set(ev.idStage, liste);
  }

  const parEntreprise = new Map();
 
  for (const idEntreprise of idsEntreprisesInvitees) {
    parEntreprise.set(idEntreprise, {
      idEntreprise,
      idsStagiaires: new Set(),
      stagesActifs: 0,
      totalStages: 0,
      toutesNotes: [],
    });
  }
  for (const s of stagesRows) {
    if (!parEntreprise.has(s.idEntreprise)) {
      parEntreprise.set(s.idEntreprise, {
        idEntreprise: s.idEntreprise,
        idsStagiaires: new Set(),
        stagesActifs: 0,
        totalStages: 0,
        toutesNotes: [],
      });
    }
    const agg = parEntreprise.get(s.idEntreprise);
    agg.idsStagiaires.add(s.idStagiaire);
    agg.totalStages += 1;
    if (s.statut === "actif") agg.stagesActifs += 1;
    const notes = notesParStage.get(s.idStage);
    if (notes) agg.toutesNotes.push(...notes);
  }

  let resultat = Array.from(parEntreprise.values()).map((agg) => {
    const entreprise = entrepriseParId.get(agg.idEntreprise);
    const contact = contactParEntreprise.get(agg.idEntreprise);
    const noteMoyenne = agg.toutesNotes.length
      ? Math.round(
          (agg.toutesNotes.reduce((a, b) => a + b, 0) /
            agg.toutesNotes.length) *
            4 *
            10,
        ) / 10
      : null;

    return {
      idEntreprise: agg.idEntreprise,
      nomEntreprise: entreprise?.nomEntreprise || "—",
      secteurActivite: entreprise?.secteurActivite || null,
      ville: entreprise?.ville || null,
      logoUrl: entreprise?.logoUrl || null,
      statutVerification: entreprise?.statutVerification || null,
      contactPrincipal: contact
        ? { nom: contact.nom, email: contact.email }
        : null,
      nbEtudiants: agg.idsStagiaires.size,
      stagesActifs: agg.stagesActifs,
      totalStages: agg.totalStages,
      noteMoyenne,
     
      origine: agg.totalStages > 0 ? "stage" : "invitation",
    };
  });

  if (recherche) {
    const terme = recherche.toLowerCase();
    resultat = resultat.filter((e) =>
      e.nomEntreprise.toLowerCase().includes(terme),
    );
  }

  resultat.sort((a, b) => b.nbEtudiants - a.nbEtudiants);

  return resultat;
}

export async function listConventions(idUtilisateur, options = {}) {
  const { recherche, statut } = options;
  const universite = await getUniversiteProfile(idUtilisateur);
  const idUniversite = universite.idUniversite;

  const rows = await db
    .select({
      idConvention: conventionsStage.idConvention,
      accepteeParEntreprise: conventionsStage.accepteeParEntreprise,
      accepteeParStagiaire: conventionsStage.accepteeParStagiaire,
      approuveeParPlateforme: conventionsStage.approuveeParPlateforme,
      valideeParUniversite: conventionsStage.valideeParUniversite,
      dateValidationUniversite: conventionsStage.dateValidationUniversite,
      dateCreation: conventionsStage.dateCreation,
      numero: offresFinales.numero,
      intitulePoste: offresFinales.intitulePoste,
      dateDebut: offresFinales.dateDebut,
      dureeStage: offresFinales.dureeStage,
      statutStage: stages.statut,
      prenomStagiaire: stagiaires.prenom,
      nomStagiaire: stagiaires.nom,
      nomEntreprise: entreprises.nomEntreprise,
    })
    .from(conventionsStage)
    .innerJoin(
      offresFinales,
      eq(offresFinales.idOffreFinale, conventionsStage.idOffreFinale),
    )
    .innerJoin(entretiens, eq(entretiens.idEntretien, offresFinales.idEntretien))
    .innerJoin(
      candidatures,
      eq(candidatures.idCandidature, entretiens.idCandidature),
    )
    .innerJoin(stagiaires, eq(stagiaires.idStagiaire, candidatures.idStagiaire))
    .innerJoin(offresStage, eq(offresStage.idOffre, candidatures.idOffre))
    .innerJoin(entreprises, eq(entreprises.idEntreprise, offresStage.idEntreprise))
    .leftJoin(stages, eq(stages.idConvention, conventionsStage.idConvention))
    .where(eq(stagiaires.idUniversite, idUniversite))
    .orderBy(desc(conventionsStage.dateCreation));

  let conventions = rows.map((r) => {
    const conditionsReunies =
      r.accepteeParEntreprise && r.accepteeParStagiaire && r.approuveeParPlateforme;
    let statutCalcule = "en_attente";
    if (conditionsReunies) {
      if (r.statutStage === "actif") {
        statutCalcule = "active";
      } else if (r.statutStage === "termine") {
        statutCalcule = "terminee";
      } else if (r.statutStage === "interrompu") {
        statutCalcule = "interrompue";
      }
    }

    return {
      idConvention: r.idConvention,
      numero: r.numero,
      intitulePoste: r.intitulePoste,
      nomEtudiant: `${r.prenomStagiaire} ${r.nomStagiaire}`,
      nomEntreprise: r.nomEntreprise,
      dateDebut: r.dateDebut,
      dureeStage: r.dureeStage,
      accepteeParEntreprise: r.accepteeParEntreprise,
      accepteeParStagiaire: r.accepteeParStagiaire,
      approuveeParPlateforme: r.approuveeParPlateforme,
      valideeParUniversite: r.valideeParUniversite,
      dateValidationUniversite: r.dateValidationUniversite,
      statutStage: r.statutStage,
      statut: statutCalcule,
      dateCreation: r.dateCreation,
    };
  });

  if (statut) {
    conventions = conventions.filter((c) => c.statut === statut);
  }
  if (recherche) {
    const terme = recherche.toLowerCase();
    conventions = conventions.filter(
      (c) =>
        c.nomEtudiant.toLowerCase().includes(terme) ||
        c.nomEntreprise.toLowerCase().includes(terme) ||
        (c.intitulePoste || "").toLowerCase().includes(terme),
    );
  }

  return {
    data: conventions,
    stats: {
      total: rows.length,
      enAttente: rows.filter(
        (r) =>
          !(r.accepteeParEntreprise && r.accepteeParStagiaire && r.approuveeParPlateforme),
      ).length,
      actives: rows.filter(
        (r) =>
          r.accepteeParEntreprise &&
          r.accepteeParStagiaire &&
          r.approuveeParPlateforme &&
          r.statutStage === "actif",
      ).length,
      terminees: rows.filter(
        (r) =>
          r.accepteeParEntreprise &&
          r.accepteeParStagiaire &&
          r.approuveeParPlateforme &&
          r.statutStage === "termine",
      ).length,
      interrompues: rows.filter(
        (r) =>
          r.accepteeParEntreprise &&
          r.accepteeParStagiaire &&
          r.approuveeParPlateforme &&
          r.statutStage === "interrompu",
      ).length,
      valideesUniversite: rows.filter((r) => r.valideeParUniversite).length,
    },
  };
}

async function getConventionUniversiteOuThrow(idUniversite, idConvention) {
  const [row] = await db
    .select({
      idConvention: conventionsStage.idConvention,
      accepteeParEntreprise: conventionsStage.accepteeParEntreprise,
      accepteeParStagiaire: conventionsStage.accepteeParStagiaire,
      approuveeParPlateforme: conventionsStage.approuveeParPlateforme,
      valideeParUniversite: conventionsStage.valideeParUniversite,
      numero: offresFinales.numero,
      intitulePoste: offresFinales.intitulePoste,
      dureeStage: offresFinales.dureeStage,
      volumeHoraireHebdo: offresFinales.volumeHoraireHebdo,
      dateDebut: offresFinales.dateDebut,
      prenomStagiaire: stagiaires.prenom,
      nomStagiaire: stagiaires.nom,
      idUtilisateurStagiaire: stagiaires.idUtilisateur,
      idUniversiteStagiaire: stagiaires.idUniversite,
      nomEntreprise: entreprises.nomEntreprise,
      idUtilisateurEntreprise: entreprises.idUtilisateur,
      idEntreprise: entreprises.idEntreprise,
    })
    .from(conventionsStage)
    .innerJoin(
      offresFinales,
      eq(offresFinales.idOffreFinale, conventionsStage.idOffreFinale),
    )
    .innerJoin(
      entretiens,
      eq(entretiens.idEntretien, offresFinales.idEntretien),
    )
    .innerJoin(
      candidatures,
      eq(candidatures.idCandidature, entretiens.idCandidature),
    )
    .innerJoin(stagiaires, eq(stagiaires.idStagiaire, candidatures.idStagiaire))
    .innerJoin(offresStage, eq(offresStage.idOffre, candidatures.idOffre))
    .innerJoin(
      entreprises,
      eq(entreprises.idEntreprise, offresStage.idEntreprise),
    )
    .where(eq(conventionsStage.idConvention, idConvention));

  if (!row || row.idUniversiteStagiaire !== idUniversite) {
    const err = new Error("Convention introuvable");
    err.status = 404;
    throw err;
  }

  return row;
}

// Validation administrative interne à l'université — voir remarque en tête
// de section : n'affecte pas le circuit qui déclenche la création du stage.
export async function validerConvention(idUtilisateur, idConvention, valider) {
  const universite = await getUniversiteProfile(idUtilisateur);
  const convention = await getConventionUniversiteOuThrow(
    universite.idUniversite,
    idConvention,
  );

  // La mise à jour de la convention et la persistance des notifications
  // forment une seule opération atomique. Si une notification échoue,
  // PostgreSQL annule aussi la validation de la convention.
  //
  // creerNotification accepte le client transactionnel `tx`. Le temps réel
  // est volontairement émis seulement APRÈS le COMMIT afin qu'un client ne
  // reçoive jamais une notification provenant d'une transaction annulée.
  const { maj, notificationsCreees } = await db.transaction(async (tx) => {
    const nouvelleValeur = !!valider;

    // Mise à jour conditionnelle : seule une VRAIE transition d'état est
    // autorisée à modifier la ligne. Cela rend l'opération idempotente et
    // protège également contre deux requêtes concurrentes true -> true.
    // La première gagne ; la seconde ne met aucune ligne à jour et ne crée
    // donc aucune notification en double.
    const [conventionMaj] = await tx
      .update(conventionsStage)
      .set({
        valideeParUniversite: nouvelleValeur,
        dateValidationUniversite: nouvelleValeur ? new Date() : null,
      })
      .where(
        and(
          eq(conventionsStage.idConvention, idConvention),
          eq(conventionsStage.valideeParUniversite, !nouvelleValeur),
        ),
      )
      .returning();

    // Aucune ligne modifiée signifie ici que l'état demandé est déjà celui
    // enregistré (l'ownership a été vérifié juste avant la transaction).
    // On renvoie l'état courant sans effet secondaire : true -> true et
    // false -> false deviennent donc de vrais no-op.
    if (!conventionMaj) {
      const [conventionActuelle] = await tx
        .select()
        .from(conventionsStage)
        .where(eq(conventionsStage.idConvention, idConvention))
        .limit(1);

      if (!conventionActuelle) {
        const err = new Error("Convention introuvable");
        err.status = 404;
        throw err;
      }

      return { maj: conventionActuelle, notificationsCreees: [] };
    }

    const notifications = [];

    // Les notifications ne sont créées que pour la transition false -> true.
    // Une répétition true -> true n'arrive jamais dans ce bloc.
    if (nouvelleValeur) {
      const message = `La convention de stage « ${convention.intitulePoste} » chez ${convention.nomEntreprise} a été validée par votre université.`;

      const notificationStagiaire = await creerNotification(
        {
          idUtilisateur: convention.idUtilisateurStagiaire,
          type: "convention_validee_universite",
          titre: "Convention validée par votre université",
          message,
          lien: "/stage",
        },
        tx,
      );

      const notificationEntreprise = await creerNotification(
        {
          idUtilisateur: convention.idUtilisateurEntreprise,
          type: "convention_validee_universite",
          titre: "Convention validée par l'université",
          message,
          lien: "/suivi-stagiaires",
        },
        tx,
      );

      if (notificationStagiaire) notifications.push(notificationStagiaire);
      if (notificationEntreprise) notifications.push(notificationEntreprise);
    }

    return { maj: conventionMaj, notificationsCreees: notifications };
  });

  // La transaction est commitée à ce stade. On peut maintenant prévenir
  // les clients connectés sans risque d'annoncer une écriture rollbackée.
  for (const notification of notificationsCreees) {
    emitNotificationCreated(notification);
  }

  return maj;
}

export async function genererPdfConvention(idUtilisateur, idConvention, lang = "fr") {
  const universite = await getUniversiteProfile(idUtilisateur);

  // Contrôle d'accès Université en premier : une université ne peut générer
  // que la convention d'un stagiaire qui lui est réellement rattaché.
  const conventionUniversite = await getConventionUniversiteOuThrow(
    universite.idUniversite,
    idConvention,
  );

  // Réutiliser le payload métier canonique des conventions au lieu de
  // reconstruire ici une version partielle remplie de valeurs null.
  // getConventionEntrepriseById effectue en plus son propre contrôle
  // d'ownership côté entreprise.
  const conventionData = await getConventionEntrepriseById(
    conventionUniversite.idEntreprise,
    idConvention,
  );
  const pdfData = buildConventionPdfData(conventionData);

  const cheminRelatif = await genererConventionPdf(
    pdfData,
    lang === "en" ? "en" : "fr",
  );

  // Anti path-traversal : uniquement sous uploads/conventions
  const root = path.resolve("uploads", "conventions");
  const baseName = path.basename(
    String(cheminRelatif).replace(/^conventions[/\\]/, ""),
  );
  if (!baseName || !baseName.toLowerCase().endsWith(".pdf")) {
    const err = new Error("Document invalide");
    err.status = 500;
    throw err;
  }
  const filepath = path.resolve(root, baseName);
  if (filepath !== root && !filepath.startsWith(root + path.sep)) {
    const err = new Error("Document invalide");
    err.status = 500;
    throw err;
  }
  if (!fs.existsSync(filepath)) {
    const err = new Error("Document introuvable");
    err.status = 404;
    throw err;
  }

  const suffix = lang === "en" ? "en" : "fr";
  const fileLabel = numeroAffiche || String(c.idConvention).slice(0, 8);
  return {
    filepath,
    filename: `convention-${fileLabel}-${suffix}.pdf`,
  };
}


export async function getStatistiquesUniversite(idUtilisateur) {
  const universite = await getUniversiteProfile(idUtilisateur);
  const idUniversite = universite.idUniversite;

  const [dashboard, topEntreprises, stagesRows] = await Promise.all([
    getUniversiteStats(idUtilisateur),
    listEntreprisesPartenaires(idUtilisateur).then((liste) => liste.slice(0, 5)),
    db
      .select({ idStage: stages.idStage })
      .from(stages)
      .where(eq(stages.idUniversite, idUniversite)),
  ]);

  const idsStages = stagesRows.map((s) => s.idStage);

  const [evaluationsRows, dureesRows] = await Promise.all([
    idsStages.length
      ? db
          .select()
          .from(evaluationsHebdomadaires)
          .where(inArray(evaluationsHebdomadaires.idStage, idsStages))
      : [],
    db
      .select({ dureeStage: offresFinales.dureeStage })
      .from(conventionsStage)
      .innerJoin(stages, eq(stages.idConvention, conventionsStage.idConvention))
      .innerJoin(
        offresFinales,
        eq(offresFinales.idOffreFinale, conventionsStage.idOffreFinale),
      )
      .where(eq(stages.idUniversite, idUniversite)),
  ]);

  const toutesLesNotes = [];
  for (const ev of evaluationsRows) {
    toutesLesNotes.push(
      ...[
        ev.noteAssiduite,
        ev.noteCommunication,
        ev.noteInitiative,
        ev.noteProfessionnalisme,
        ev.noteTravailEquipe,
        ev.notePerformanceTechnique,
      ].filter((n) => n != null),
    );
  }
  const noteMoyenneGlobale = toutesLesNotes.length
    ? Math.round(
        (toutesLesNotes.reduce((a, b) => a + b, 0) / toutesLesNotes.length) *
          4 *
          10,
      ) / 10
    : null;

  const repartitionDureeStage = {};
  for (const d of dureesRows) {
    const cle = d.dureeStage || "non_renseignee";
    repartitionDureeStage[cle] = (repartitionDureeStage[cle] || 0) + 1;
  }

  return {
    ...dashboard,
    noteMoyenneGlobale,
    repartitionDureeStage,
    topEntreprises,
  };
}

export async function completeUniversiteOnboarding(idUtilisateur, payload) {
  const autoVerif = await isAutoValidationEnabled(ELEMENT_UNIVERSITES);
  return db.transaction(async (tx) => {
    // Défense en profondeur : le service vérifie lui-même le rôle attendu,
    // même si la route est normalement protégée par requireRole("universite").
    const [utilisateur] = await tx
      .select({
        typeUtilisateur: utilisateurs.typeUtilisateur,
        emailVerifie: utilisateurs.emailVerifie,
      })
      .from(utilisateurs)
      .where(eq(utilisateurs.idUtilisateur, idUtilisateur))
      .limit(1);

    if (!utilisateur || utilisateur.typeUtilisateur !== "universite") {
      const err = new Error(
        "Seuls les comptes université peuvent compléter cet onboarding",
      );
      err.status = 403;
      throw err;
    }

    const [universite] = await tx
      .insert(universites)
      .values({
        idUtilisateur,
        nomUniversite: payload.nomUniversite,
        emailOfficiel: payload.emailOfficiel,
        logoUrl: payload.logoUrl || null,
        siteWeb: payload.siteWeb || null,
        pays: payload.pays,
        typeEtablissement: payload.typeEtablissement,
        // Déjà validé et converti en entier par le schéma Zod.
        nombreEtudiants: payload.nombreEtudiants ?? null,
        contactServiceCarriere: payload.contactServiceCarriere || null,
        periodeStageHabituelle: payload.periodeStageHabituelle || null,
        nomCoordinateurStage: payload.nomCoordinateurStage || null,
        statutVerification: autoVerif ? "verifiee" : "en_attente",
        dateVerification: autoVerif ? new Date() : null,
      })
      .returning();

    // Le compte ne passe à "actif" que si l'email a réellement été vérifié
    // (jamais un simple flag envoyé par le client). Sinon il reste "inactif" :

    await tx
      .update(utilisateurs)
      .set({
        statutCompte: peutActiverCompte(utilisateur.emailVerifie)
          ? "actif"
          : "inactif",
        dateMaj: new Date(),
      })
      .where(eq(utilisateurs.idUtilisateur, idUtilisateur));

    return universite;
  });
}

export async function listEtudiants(idUtilisateur, options = {}) {
  const { recherche, statut, page = 1, parPage = 20 } = options;
  const universite = await getUniversiteProfile(idUtilisateur);
  const idUniversite = universite.idUniversite;

  // La pagination doit être appliquée par PostgreSQL, avant de charger les
  // formations, stages, superviseurs et évaluations. Cela évite de charger
  // tous les étudiants de l'université en mémoire pour n'en retourner qu'une page.
  // Défense en profondeur : l'API valide déjà ces valeurs avec Zod, mais le
  // service peut aussi être appelé directement depuis un autre module. On garde
  // donc ici des valeurs sûres et une limite maximale de 100 lignes par page.
  const pageNumber =
    Number.isFinite(Number(page)) && Number(page) >= 1
      ? Math.floor(Number(page))
      : 1;
  const pageSize =
    Number.isFinite(Number(parPage)) && Number(parPage) >= 1
      ? Math.min(Math.floor(Number(parPage)), 100)
      : 20;

  const conditions = [eq(stagiaires.idUniversite, idUniversite)];
  const rechercheNormalisee = String(recherche ?? "").trim().toLowerCase();

  if (rechercheNormalisee) {
    conditions.push(
      sql`lower(concat_ws(' ', ${stagiaires.prenom}, ${stagiaires.nom})) like ${`%${rechercheNormalisee}%`}`,
    );
  }

  // Le statut affiché par cette page est calculé à partir du stage actif et
  // du statut académique. Le même calcul est reproduit dans la requête SQL
  // afin que le filtre soit appliqué AVANT LIMIT/OFFSET.
  const aUnStageActif = sql`exists (
    select 1
    from ${stages}
    where ${stages.idStagiaire} = ${stagiaires.idStagiaire}
      and ${stages.statut} = 'actif'
  )`;

  if (statut === "en_stage") {
    conditions.push(aUnStageActif);
  } else if (statut === "diplome") {
    conditions.push(
      and(
        sql`not (${aUnStageActif})`,
        eq(stagiaires.statutAcademique, "jeune_diplome"),
      ),
    );
  } else if (statut === "sans_stage") {
    conditions.push(
      and(
        sql`not (${aUnStageActif})`,
        sql`${stagiaires.statutAcademique} is distinct from 'jeune_diplome'`,
      ),
    );
  }

  const whereEtudiants = and(...conditions);

  // Le COUNT filtré permet de calculer la pagination sans charger toutes les lignes.
  const [{ count: total }] = await db
    .select({ count: sql`count(*)::int` })
    .from(stagiaires)
    .where(whereEtudiants);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageBornee = Math.min(pageNumber, totalPages);
  const offset = (pageBornee - 1) * pageSize;

  // Seule la page demandée est chargée en mémoire. L'ordre explicite rend la
  // pagination stable entre deux requêtes lorsque les données ne changent pas.
  const stagiairesRows = await db
    .select({
      idStagiaire: stagiaires.idStagiaire,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
      ville: stagiaires.ville,
      statutAcademique: stagiaires.statutAcademique,
      dateCreation: stagiaires.dateCreation,
    })
    .from(stagiaires)
    .where(whereEtudiants)
    .orderBy(desc(stagiaires.dateCreation), asc(stagiaires.idStagiaire))
    .limit(pageSize)
    .offset(offset);

  const idsStagiaires = stagiairesRows.map((s) => s.idStagiaire);

  const [formationsRows, stagesRows] = idsStagiaires.length
    ? await Promise.all([
        db
          .select()
          .from(formations)
          .where(inArray(formations.idStagiaire, idsStagiaires)),
        db
          .select({
            idStage: stages.idStage,
            idStagiaire: stages.idStagiaire,
            statut: stages.statut,
            idContactSuperviseur: stages.idContactSuperviseur,
            nomEntreprise: entreprises.nomEntreprise,
            villeEntreprise: entreprises.ville,
          })
          .from(stages)
          .innerJoin(
            entreprises,
            eq(stages.idEntreprise, entreprises.idEntreprise),
          )
          .where(inArray(stages.idStagiaire, idsStagiaires)),
      ])
    : [[], []];

  const idsStages = stagesRows.map((s) => s.idStage);
  const idsSuperviseurs = stagesRows
    .map((s) => s.idContactSuperviseur)
    .filter(Boolean);

  const [superviseursRows, evaluationsRows] = await Promise.all([
    idsSuperviseurs.length
      ? db
          .select({
            idContact: contactsEntreprise.idContact,
            nom: contactsEntreprise.nom,
          })
          .from(contactsEntreprise)
          .where(inArray(contactsEntreprise.idContact, idsSuperviseurs))
      : [],
    idsStages.length
      ? db
          .select()
          .from(evaluationsHebdomadaires)
          .where(inArray(evaluationsHebdomadaires.idStage, idsStages))
      : [],
  ]);

  // Un même stagiaire peut avoir plusieurs lignes "formations" (rare) : on
  // garde celle avec l'année d'étude la plus élevée (la plus récente).
  const formationParStagiaire = new Map();
  for (const f of formationsRows) {
    const existante = formationParStagiaire.get(f.idStagiaire);
    if (!existante || (f.anneeEtude || 0) >= (existante.anneeEtude || 0)) {
      formationParStagiaire.set(f.idStagiaire, f);
    }
  }

  const superviseurParId = new Map(
    superviseursRows.map((s) => [s.idContact, s.nom]),
  );

  // Un stagiaire peut avoir plusieurs stages dans le temps : on privilégie
  // le stage actif, sinon on garde le premier rencontré.
  const stageParStagiaire = new Map();
  for (const s of stagesRows) {
    const existant = stageParStagiaire.get(s.idStagiaire);
    if (!existant || (s.statut === "actif" && existant.statut !== "actif")) {
      stageParStagiaire.set(s.idStagiaire, s);
    }
  }

  const notesParStage = new Map();
  for (const ev of evaluationsRows) {
    const notes = [
      ev.noteAssiduite,
      ev.noteCommunication,
      ev.noteInitiative,
      ev.noteProfessionnalisme,
      ev.noteTravailEquipe,
      ev.notePerformanceTechnique,
    ].filter((n) => n != null);
    if (notes.length === 0) continue;
    const liste = notesParStage.get(ev.idStage) || [];
    liste.push(...notes);
    notesParStage.set(ev.idStage, liste);
  }

  const etudiants = stagiairesRows.map((s) => {
    const formation = formationParStagiaire.get(s.idStagiaire);
    const stage = stageParStagiaire.get(s.idStagiaire);
    const notes = stage ? notesParStage.get(stage.idStage) : null;
    const noteSur20 = notes?.length
      ? Math.round(
          ((notes.reduce((a, b) => a + b, 0) / notes.length) * 4) * 10,
        ) / 10
      : null;

    let statutCalcule = "sans_stage";
    if (stage?.statut === "actif") statutCalcule = "en_stage";
    else if (s.statutAcademique === "jeune_diplome") statutCalcule = "diplome";

    return {
      idStagiaire: s.idStagiaire,
      nomComplet: `${s.prenom} ${s.nom}`,
      filiere: formation?.diplome || null,
      anneeEtude: formation?.anneeEtude || null,
      anneeObtention: formation?.anneeObtention || null,
      ville: stage?.villeEntreprise || s.ville,
      entreprise: stage?.nomEntreprise || null,
      superviseur: stage?.idContactSuperviseur
        ? superviseurParId.get(stage.idContactSuperviseur) || null
        : null,
      note: noteSur20,
      statut: statutCalcule,
      dateInscription: s.dateCreation,
    };
  });

  // Les statistiques restent globales à l'université (elles ne dépendent pas
  // de la page courante), mais sont maintenant calculées directement en DB.
  const [[{ count: totalInscrits }], [{ count: enStage }], [{ count: diplomesRecents }]] =
    await Promise.all([
      db
        .select({ count: sql`count(*)::int` })
        .from(stagiaires)
        .where(eq(stagiaires.idUniversite, idUniversite)),
      db
        .select({ count: sql`count(*)::int` })
        .from(stagiaires)
        .where(
          and(
            eq(stagiaires.idUniversite, idUniversite),
            sql`exists (
              select 1
              from ${stages}
              where ${stages.idStagiaire} = ${stagiaires.idStagiaire}
                and ${stages.statut} = 'actif'
            )`,
          ),
        ),
      db
        .select({ count: sql`count(*)::int` })
        .from(stagiaires)
        .where(
          and(
            eq(stagiaires.idUniversite, idUniversite),
            eq(stagiaires.statutAcademique, "jeune_diplome"),
          ),
        ),
    ]);

  const stats = {
    totalInscrits,
    enStage,
    diplomesRecents,
  };
  // Conservation volontaire de la formule historique pour ne pas modifier
  // le contrat fonctionnel du dashboard dans cette correction de performance.
  stats.sansStage = Math.max(
    0,
    stats.totalInscrits - stats.enStage - stats.diplomesRecents,
  );

  return {
    data: etudiants,
    pagination: { page: pageBornee, parPage: pageSize, total, totalPages },
    stats,
  };
}

// -----------------------------------------------------------------------
// Annuaire institutionnel des maîtres de stage
// -----------------------------------------------------------------------

const MAITRES_PAGE_MAX = 50;
const MAITRES_DEFAULT_PAGE_SIZE = 20;
const MAITRES_STATUTS = new Set(["invite", "actif", "desactive"]);
const MAITRES_TRI = new Set(["nom", "entreprise", "stagiaires", "stages"]);

function normaliserPaginationMaitres(page, parPage) {
  const pageNumber = Number.isFinite(Number(page)) && Number(page) > 0 ? Math.floor(Number(page)) : 1;
  const size = Number.isFinite(Number(parPage)) && Number(parPage) > 0
    ? Math.min(Math.floor(Number(parPage)), MAITRES_PAGE_MAX)
    : MAITRES_DEFAULT_PAGE_SIZE;
  return { page: pageNumber, parPage: size, offset: (pageNumber - 1) * size };
}

function normaliserRecherche(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed.length > 100 ? trimmed.slice(0, 100) : trimmed;
}

function conditionMaitres(options) {
  const conditions = [];
  if (options.statut && MAITRES_STATUTS.has(options.statut)) {
    conditions.push(eq(membresEquipe.statutMembre, options.statut));
  }
  if (options.encadrement === "actuel") {
    conditions.push(eq(stages.statut, "actif"));
  }
  if (options.encadrement === "aucun") {
    conditions.push(sql`NOT EXISTS (SELECT 1 FROM affectations_superviseur_stage a2 INNER JOIN stages s2 ON s2.id_stage = a2.id_stage WHERE a2.id_membre = ${membresEquipe.idMembre} AND s2.id_universite = ${options.idUniversite} AND s2.statut = 'actif')`);
  }
  const recherche = normaliserRecherche(options.recherche);
  if (recherche) {
    const pattern = `%${recherche}%`;
    conditions.push(
      sql`(${membresEquipe.nom} ILIKE ${pattern} OR ${entreprises.nomEntreprise} ILIKE ${pattern} OR CAST(${membresEquipe.roleEquipe} AS text) ILIKE ${pattern})`,
    );
  }
  if (options.idEntreprise) {
    conditions.push(eq(entreprises.idEntreprise, options.idEntreprise));
  }
  return conditions;
}

export async function listMaitresDeStage(idUtilisateur, options = {}) {
  const universite = await getUniversiteProfile(idUtilisateur);
  const idUniversite = universite.idUniversite;
  const { page, parPage, offset } = normaliserPaginationMaitres(options.page, options.parPage);
  const recherche = normaliserRecherche(options.recherche);
  const tri = MAITRES_TRI.has(options.tri) ? options.tri : "nom";
  const ordre = options.ordre === "desc" ? "desc" : "asc";

  const conditions = [eq(stages.idUniversite, idUniversite), ...conditionMaitres({ ...options, recherche, idUniversite })];

  const orderBy = {
    nom: ordre === "desc" ? desc(membresEquipe.nom) : asc(membresEquipe.nom),
    entreprise: ordre === "desc" ? desc(entreprises.nomEntreprise) : asc(entreprises.nomEntreprise),
    stagiaires: ordre === "desc"
      ? desc(sql`count(distinct ${stages.idStagiaire})`)
      : asc(sql`count(distinct ${stages.idStagiaire})`),
    stages: ordre === "desc"
      ? desc(sql`count(distinct ${stages.idStage})`)
      : asc(sql`count(distinct ${stages.idStage})`),
  }[tri];

  const groupBy = [
    membresEquipe.idMembre,
    membresEquipe.nom,
    membresEquipe.roleEquipe,
    membresEquipe.statutMembre,
    membresEquipe.dateActivation,
    membresEquipe.dateCreation,
    entreprises.idEntreprise,
    entreprises.nomEntreprise,
    entreprises.logoUrl,
    entreprises.ville,
  ];

  const [rows, countRows, kpiRows, entreprisesRows] = await Promise.all([
    db
      .select({
        idMembre: membresEquipe.idMembre,
        nom: membresEquipe.nom,
        roleEquipe: membresEquipe.roleEquipe,
        statutMembre: membresEquipe.statutMembre,
        dateActivation: membresEquipe.dateActivation,
        dateCreation: membresEquipe.dateCreation,
        idEntreprise: entreprises.idEntreprise,
        nomEntreprise: entreprises.nomEntreprise,
        logoEntrepriseUrl: entreprises.logoUrl,
        villeEntreprise: entreprises.ville,
        stagiairesActuels: sql`count(distinct ${stages.idStagiaire}) filter (where ${stages.statut} = 'actif')::int`,
        totalStagiaires: sql`count(distinct ${stages.idStagiaire})::int`,
        totalStages: sql`count(distinct ${stages.idStage})::int`,
        evaluationsEnRetard: sql`count(distinct ${evaluationsHebdomadaires.idEvaluation}) filter (where ${evaluationsHebdomadaires.statut} = 'en_retard')::int`,
      })
      .from(membresEquipe)
      .innerJoin(affectationsSuperviseurStage, eq(affectationsSuperviseurStage.idMembre, membresEquipe.idMembre))
      .innerJoin(stages, eq(stages.idStage, affectationsSuperviseurStage.idStage))
      .innerJoin(stagiaires, eq(stagiaires.idStagiaire, stages.idStagiaire))
      .innerJoin(entreprises, eq(entreprises.idEntreprise, membresEquipe.idEntreprise))
      .leftJoin(evaluationsHebdomadaires, eq(evaluationsHebdomadaires.idStage, stages.idStage))
      .where(and(...conditions))
      .groupBy(...groupBy)
      .orderBy(orderBy, asc(membresEquipe.idMembre))
      .limit(parPage)
      .offset(offset),
    db
      .select({ count: sql`count(distinct ${membresEquipe.idMembre})::int` })
      .from(membresEquipe)
      .innerJoin(affectationsSuperviseurStage, eq(affectationsSuperviseurStage.idMembre, membresEquipe.idMembre))
      .innerJoin(stages, eq(stages.idStage, affectationsSuperviseurStage.idStage))
      .innerJoin(stagiaires, eq(stagiaires.idStagiaire, stages.idStagiaire))
      .innerJoin(entreprises, eq(entreprises.idEntreprise, membresEquipe.idEntreprise))
      .where(and(...conditions)),
    db
      .select({
        maitresActifs: sql`count(distinct ${membresEquipe.idMembre}) filter (where ${membresEquipe.statutMembre} = 'actif' and ${stages.statut} = 'actif')::int`,
        stagiairesActuellementEncadres: sql`count(distinct ${stages.idStagiaire}) filter (where ${stages.statut} = 'actif')::int`,
        entreprisesConcernees: sql`count(distinct ${entreprises.idEntreprise})::int`,
        evaluationsASurveiller: sql`count(distinct ${evaluationsHebdomadaires.idEvaluation}) filter (where ${evaluationsHebdomadaires.statut} = 'en_retard')::int`,
      })
      .from(membresEquipe)
      .innerJoin(affectationsSuperviseurStage, eq(affectationsSuperviseurStage.idMembre, membresEquipe.idMembre))
      .innerJoin(stages, eq(stages.idStage, affectationsSuperviseurStage.idStage))
      .innerJoin(stagiaires, eq(stagiaires.idStagiaire, stages.idStagiaire))
      .innerJoin(entreprises, eq(entreprises.idEntreprise, membresEquipe.idEntreprise))
      .leftJoin(evaluationsHebdomadaires, eq(evaluationsHebdomadaires.idStage, stages.idStage))
      .where(eq(stages.idUniversite, idUniversite)),
    db
      .selectDistinct({
        idEntreprise: entreprises.idEntreprise,
        nomEntreprise: entreprises.nomEntreprise,
      })
      .from(membresEquipe)
      .innerJoin(affectationsSuperviseurStage, eq(affectationsSuperviseurStage.idMembre, membresEquipe.idMembre))
      .innerJoin(stages, eq(stages.idStage, affectationsSuperviseurStage.idStage))
      .innerJoin(entreprises, eq(entreprises.idEntreprise, membresEquipe.idEntreprise))
      .where(eq(stages.idUniversite, idUniversite))
      .orderBy(asc(entreprises.nomEntreprise)),
  ]);

  const total = Number(countRows[0]?.count ?? 0);
  const totalPages = total > 0 ? Math.ceil(total / parPage) : 0;

  return {
    data: rows.map((row) => ({
      idMembre: row.idMembre,
      nom: row.nom,
      roleEquipe: row.roleEquipe,
      statutMembre: row.statutMembre,
      dateActivation: row.dateActivation,
      dateCreation: row.dateCreation,
      entreprise: {
        idEntreprise: row.idEntreprise,
        nomEntreprise: row.nomEntreprise,
        logoUrl: row.logoEntrepriseUrl,
        ville: row.villeEntreprise,
      },
      stagiairesActuels: Number(row.stagiairesActuels ?? 0),
      totalStagiaires: Number(row.totalStagiaires ?? 0),
      totalStages: Number(row.totalStages ?? 0),
      evaluationsEnRetard: Number(row.evaluationsEnRetard ?? 0),
    })),
    pagination: { page, parPage, total, totalPages },
    kpis: {
      maitresActifs: Number(kpiRows[0]?.maitresActifs ?? 0),
      stagiairesActuellementEncadres: Number(kpiRows[0]?.stagiairesActuellementEncadres ?? 0),
      entreprisesConcernees: Number(kpiRows[0]?.entreprisesConcernees ?? 0),
      evaluationsASurveiller: Number(kpiRows[0]?.evaluationsASurveiller ?? 0),
    },
    filtres: {
      entreprises: entreprisesRows.map((entreprise) => ({
        idEntreprise: entreprise.idEntreprise,
        nomEntreprise: entreprise.nomEntreprise,
      })),
    },
  };
}

export async function getMaitreDeStageDetail(idUtilisateur, idMembre) {
  const universite = await getUniversiteProfile(idUtilisateur);

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(idMembre))) {
    const err = new Error("Maître de stage introuvable");
    err.status = 404;
    throw err;
  }

  const [membre] = await db
    .select({
      idMembre: membresEquipe.idMembre,
      nom: membresEquipe.nom,
      roleEquipe: membresEquipe.roleEquipe,
      statutMembre: membresEquipe.statutMembre,
      dateActivation: membresEquipe.dateActivation,
      dateCreation: membresEquipe.dateCreation,
      idEntreprise: entreprises.idEntreprise,
      nomEntreprise: entreprises.nomEntreprise,
      logoEntrepriseUrl: entreprises.logoUrl,
      villeEntreprise: entreprises.ville,
    })
    .from(membresEquipe)
    .innerJoin(affectationsSuperviseurStage, eq(affectationsSuperviseurStage.idMembre, membresEquipe.idMembre))
    .innerJoin(stages, eq(stages.idStage, affectationsSuperviseurStage.idStage))
    .innerJoin(entreprises, eq(entreprises.idEntreprise, membresEquipe.idEntreprise))
    .where(and(eq(membresEquipe.idMembre, idMembre), eq(stages.idUniversite, universite.idUniversite)))
    .limit(1);

  if (!membre) {
    const err = new Error("Maître de stage introuvable");
    err.status = 404;
    throw err;
  }

  const stagesRows = await db
    .select({
      idStage: stages.idStage,
      idStagiaire: stagiaires.idStagiaire,
      prenomStagiaire: stagiaires.prenom,
      nomStagiaire: stagiaires.nom,
      photoProfilUrl: stagiaires.photoProfilUrl,
      statutStage: stages.statut,
      dateDebut: stages.dateDebut,
      dateFinPrevue: stages.dateFinPrevue,
      dateFinReelle: stages.dateFinReelle,
      progressionPourcentage: stages.progressionPourcentage,
      idEntreprise: entreprises.idEntreprise,
      nomEntreprise: entreprises.nomEntreprise,
      villeEntreprise: entreprises.ville,
    })
    .from(affectationsSuperviseurStage)
    .innerJoin(stages, eq(stages.idStage, affectationsSuperviseurStage.idStage))
    .innerJoin(stagiaires, eq(stagiaires.idStagiaire, stages.idStagiaire))
    .innerJoin(entreprises, eq(entreprises.idEntreprise, stages.idEntreprise))
    .where(and(eq(affectationsSuperviseurStage.idMembre, idMembre), eq(stages.idUniversite, universite.idUniversite)))
    .orderBy(desc(stages.dateDebut));

  const idsStages = stagesRows.map((s) => s.idStage);
  const [formationsRows, evaluationsRows] = idsStages.length
    ? await Promise.all([
        db
          .select({
            idStagiaire: formations.idStagiaire,
            diplome: formations.diplome,
            anneeEtude: formations.anneeEtude,
            anneeObtention: formations.anneeObtention,
          })
          .from(formations)
          .where(inArray(formations.idStagiaire, stagesRows.map((s) => s.idStagiaire))),
        db
          .select({
            idEvaluation: evaluationsHebdomadaires.idEvaluation,
            idStage: evaluationsHebdomadaires.idStage,
            numeroSemaine: evaluationsHebdomadaires.numeroSemaine,
            statut: evaluationsHebdomadaires.statut,
            dateSoumission: evaluationsHebdomadaires.dateSoumission,
          })
          .from(evaluationsHebdomadaires)
          .where(inArray(evaluationsHebdomadaires.idStage, idsStages))
          .orderBy(desc(evaluationsHebdomadaires.dateSoumission)),
      ])
    : [[], []];

  const formationParStagiaire = new Map();
  for (const formation of formationsRows) {
    const current = formationParStagiaire.get(formation.idStagiaire);
    if (!current || Number(formation.anneeObtention ?? formation.anneeEtude ?? 0) > Number(current.anneeObtention ?? current.anneeEtude ?? 0)) {
      formationParStagiaire.set(formation.idStagiaire, formation);
    }
  }

  const evaluationsParStage = new Map();
  for (const evaluation of evaluationsRows) {
    const list = evaluationsParStage.get(evaluation.idStage) || [];
    list.push(evaluation);
    evaluationsParStage.set(evaluation.idStage, list);
  }

  const encadrementActuel = stagesRows.filter((s) => s.statut === "actif");
  const historique = stagesRows.filter((s) => s.statut !== "actif");

  const enrichStage = (stage) => {
    const evaluationList = evaluationsParStage.get(stage.idStage) || [];
    const derniereEvaluation = evaluationList.find((e) => e.dateSoumission) || null;
    return {
      idStage: stage.idStage,
      stagiaire: {
        idStagiaire: stage.idStagiaire,
        prenom: stage.prenomStagiaire,
        nom: stage.nomStagiaire,
        photoProfilUrl: stage.photoProfilUrl,
        formation: formationParStagiaire.get(stage.idStagiaire)?.diplome || null,
      },
      entreprise: {
        idEntreprise: stage.idEntreprise,
        nomEntreprise: stage.nomEntreprise,
        ville: stage.villeEntreprise,
      },
      statutStage: stage.statutStage,
      dateDebut: stage.dateDebut,
      dateFinPrevue: stage.dateFinPrevue,
      dateFinReelle: stage.dateFinReelle,
      progressionPourcentage: stage.progressionPourcentage,
      evaluation: {
        total: evaluationList.length,
        enRetard: evaluationList.filter((e) => e.statut === "en_retard").length,
        derniere: derniereEvaluation
          ? {
              idEvaluation: derniereEvaluation.idEvaluation,
              numeroSemaine: derniereEvaluation.numeroSemaine,
              statut: derniereEvaluation.statut,
              dateSoumission: derniereEvaluation.dateSoumission,
            }
          : null,
      },
    };
  };

  return {
    maitre: {
      idMembre: membre.idMembre,
      nom: membre.nom,
      roleEquipe: membre.roleEquipe,
      statutMembre: membre.statutMembre,
      dateActivation: membre.dateActivation,
      dateCreation: membre.dateCreation,
      entreprise: {
        idEntreprise: membre.idEntreprise,
        nomEntreprise: membre.nomEntreprise,
        logoUrl: membre.logoEntrepriseUrl,
        ville: membre.villeEntreprise,
      },
    },
    encadrementActuel: encadrementActuel.map(enrichStage),
    historique: historique.map(enrichStage),
    resumeEvaluations: {
      realisees: evaluationsRows.filter((e) => e.statut === "soumise").length,
      enRetard: evaluationsRows.filter((e) => e.statut === "en_retard").length,
      enAttente: evaluationsRows.filter((e) => e.statut === "en_attente").length,
      derniere: evaluationsRows.find((e) => e.dateSoumission)
        ? {
            dateSoumission: evaluationsRows.find((e) => e.dateSoumission).dateSoumission,
            numeroSemaine: evaluationsRows.find((e) => e.dateSoumission).numeroSemaine,
          }
        : null,
    },
  };
}
