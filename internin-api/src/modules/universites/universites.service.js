import { eq, and, inArray, sql, desc } from "drizzle-orm";
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
} from "../../db/schema.js";
import { genererConventionPdf } from "../../utils/conventionPdf.js";
import { creerNotification } from "../notifications/notifications.service.js";


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

// Met à jour les champs "opérationnels" du profil (Paramètres). Le nom,
// l'e-mail officiel, le pays et le type d'établissement ne passent pas par
// ici : ce sont des champs d'identité vérifiés par un administrateur, à
// modifier uniquement via le support.
export async function updateUniversiteProfile(idUtilisateur, payload) {
  const universite = await getUniversiteProfile(idUtilisateur);

  const [maj] = await db
    .update(universites)
    .set({
      siteWeb: payload.siteWeb || null,
      logoUrl: payload.logoUrl || null,
      nombreEtudiants: payload.nombreEtudiants
        ? Number(payload.nombreEtudiants)
        : null,
      contactServiceCarriere: payload.contactServiceCarriere || null,
      periodeStageHabituelle: payload.periodeStageHabituelle || null,
      heuresRecommandeesSemaine: payload.heuresRecommandeesSemaine
        ? Number(payload.heuresRecommandeesSemaine)
        : null,
      nomCoordinateurStage: payload.nomCoordinateurStage || null,
    })
    .where(eq(universites.idUniversite, universite.idUniversite))
    .returning();

  return maj;
}

// Chiffres du tableau de bord "Espace Université". Tout est scopé à
// l'université de l'utilisateur connecté via stages.idUniversite (rempli
// dès qu'un stage est créé à partir d'une convention).
//
// Écart assumé vis-à-vis de la maquette : le schéma ne porte ni "filière"
// d'études (table stagiaires) ni date d'approbation distincte sur une
// convention — seulement dateCreation et un booléen approuveeParPlateforme.
// Le graphique "Par filière" n'est donc pas construit (aucune donnée réelle
// à afficher), et "Évolution des conventions" montre une seule courbe
// (dépôts par mois) plutôt que dépôts vs validations.
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

  // Une entreprise est "partenaire" soit parce qu'un stage a déjà démarré
  // avec elle (détection automatique), soit parce qu'elle a accepté une
  // invitation de partenariat envoyée par l'université — même sans aucun
  // stage pour l'instant. Les deux sources doivent être comptées ici.
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

  // Dépôts de conventions des 6 derniers mois (mois calendaires), pour le
  // graphique d'évolution.
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

  // Alertes : les conventions en attente les plus anciennes, avec leur
  // nombre de jours d'attente.
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

  const alertes = alertesRows.map((a) => ({
    idConvention: a.idConvention,
    joursAttente: Math.floor(
      (Date.now() - new Date(a.dateCreation).getTime()) / (1000 * 60 * 60 * 24),
    ),
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

// Page "Entreprises" de l'espace université — liste les entreprises
// partenaires, c'est-à-dire celles ayant accueilli au moins un stagiaire
// de cette université (jointure via stages.idUniversite, seule table qui
// relie entreprise ↔ université dans le schéma). Indicateurs agrégés par
// entreprise : nombre d'étudiants placés, stages actifs, note moyenne.
//
// Écart assumé : "contact principal" vient de contacts_entreprise
// (estContactPrincipal = true) — c'est un contact RH généraliste, pas
// forcément la personne qui a supervisé un stagiaire de cette université
// en particulier.
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

  // Même logique de calcul de note que listEtudiants (moyenne des 6
  // critères, ramenée sur 20) — gardée cohérente entre les deux pages.
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
  // On seed d'abord les partenaires venus uniquement d'une invitation
  // acceptée (zéro stage pour l'instant), pour qu'ils apparaissent même
  // sans stagesRows correspondantes.
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
      // "invitation" = partenaire obtenu via une invitation acceptée, sans
      // (ou pas encore) de stage démarré ; "stage" = détecté automatiquement
      // dès qu'un premier stage a démarré avec cette entreprise.
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

// Page "Conventions" de l'espace université.
//
// Correctif : la version précédente passait par un INNER JOIN sur `stages`,
// or une ligne `stages` n'existe QUE lorsque les 3 accords (entreprise,
// stagiaire, plateforme) sont déjà réunis (cf. offresFinales.service.js,
// bloc de création du stage). Résultat : cet INNER JOIN excluait de fait
// TOUTES les conventions encore en attente — le statut "en_attente" du code
// était écrit mais jamais atteignable en pratique.
//
// Correction : on remonte par la chaîne qui existe dès la création de la
// convention, AVANT tout accord : conventions_stage → offres_finales →
// entretiens → candidatures → stagiaires (+ offres_stage → entreprises pour
// le nom de l'entreprise). On rattache ensuite `stages` en LEFT JOIN
// uniquement pour connaître son statut quand il existe déjà.
//
// Le statut affiché reste calculé à l'identique qu'avant (le schéma ne
// porte toujours pas de statut de refus distinct sur une convention) :
// "en_attente" tant que les 3 accords ne sont pas réunis, sinon calqué sur
// l'état réel du stage (actif ⟶ "active", sinon ⟶ "terminee").
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
      statutCalcule = r.statutStage === "actif" ? "active" : "terminee";
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
          r.statutStage !== "actif",
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

  const [maj] = await db
    .update(conventionsStage)
    .set({
      valideeParUniversite: !!valider,
      dateValidationUniversite: valider ? new Date() : null,
    })
    .where(eq(conventionsStage.idConvention, idConvention))
    .returning();

  if (valider) {
    const message = `La convention de stage « ${convention.intitulePoste} » chez ${convention.nomEntreprise} a été validée par votre université.`;
    await Promise.all([
      creerNotification({
        idUtilisateur: convention.idUtilisateurStagiaire,
        type: "convention_validee_universite",
        titre: "Convention validée par votre université",
        message,
        lien: "/stage",
      }),
      creerNotification({
        idUtilisateur: convention.idUtilisateurEntreprise,
        type: "convention_validee_universite",
        titre: "Convention validée par l'université",
        message,
        lien: "/suivi-stagiaires",
      }),
    ]);
  }

  return maj;
}

// Génère (à chaque appel, pour rester à jour) un PDF récapitulatif de la
// convention et renvoie son URL absolue — même approche que le certificat
// de stage (utils/certificatPdf.js).
export async function genererPdfConvention(idUtilisateur, idConvention) {
  const universite = await getUniversiteProfile(idUtilisateur);
  const c = await getConventionUniversiteOuThrow(
    universite.idUniversite,
    idConvention,
  );

  const cheminRelatif = genererConventionPdf({
    idConvention: c.idConvention,
    numero: c.numero,
    nomStagiaire: `${c.prenomStagiaire} ${c.nomStagiaire}`,
    nomEntreprise: c.nomEntreprise,
    intitulePoste: c.intitulePoste,
    dureeStage: c.dureeStage,
    volumeHoraireHebdo: c.volumeHoraireHebdo,
    dateDebut: c.dateDebut,
    accepteeParEntreprise: c.accepteeParEntreprise,
    accepteeParStagiaire: c.accepteeParStagiaire,
    approuveeParPlateforme: c.approuveeParPlateforme,
    valideeParUniversite: c.valideeParUniversite,
  });

  const base = process.env.API_PUBLIC_URL || "http://localhost:4000";
  return { url: `${base}/uploads/${cheminRelatif}` };
}

// Page "Statistiques" de l'espace université — vue détaillée qui réutilise
// les agrégats déjà calculés pour le tableau de bord (getUniversiteStats) et
// pour la page Entreprises (listEntreprisesPartenaires, déjà triée par
// nombre d'étudiants placés), et y ajoute deux indicateurs propres à cette
// page : la note moyenne globale (mêmes 6 critères d'évaluation que les
// pages Étudiants/Entreprises, ramenée sur 20) et la répartition des stages
// par durée déclarée sur l'offre finale.
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
  return db.transaction(async (tx) => {
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
        nombreEtudiants: payload.nombreEtudiants
          ? Number(payload.nombreEtudiants)
          : null,
        contactServiceCarriere: payload.contactServiceCarriere || null,
        periodeStageHabituelle: payload.periodeStageHabituelle || null,
        heuresRecommandeesSemaine: payload.heuresRecommandeesSemaine
          ? Number(payload.heuresRecommandeesSemaine)
          : null,
        nomCoordinateurStage: payload.nomCoordinateurStage || null,
        // Comme pour les entreprises, un administrateur devra vérifier
        // l'établissement avant qu'il puisse inviter des étudiants
        statutVerification: "en_attente",
      })
      .returning();

    await tx
      .update(utilisateurs)
      .set({ statutCompte: "actif", dateMaj: new Date() })
      .where(eq(utilisateurs.idUtilisateur, idUtilisateur));

    return universite;
  });
}

// Page "Étudiants" de l'espace université.
//
// Écarts assumés vis-à-vis de la maquette (aucune donnée inventée) :
// - Pas de colonne "Tuteur académique" dans le schéma : la colonne
//   "Superviseur" ci-dessous montre le contact CÔTÉ ENTREPRISE
//   (stages.idContactSuperviseur), pas un tuteur académique interne —
//   cette fonctionnalité n'existe pas encore.
// - Pas de "promotion" (cohorte 2024-2025) en base : on affiche l'année
//   d'obtention si elle est connue, sinon l'année d'étude déclarée.
// - "Note" = moyenne des 6 critères des évaluations hebdomadaires du stage
//   (échelle 1-5), ramenée sur 20. "—" si aucune évaluation n'existe encore.
export async function listEtudiants(idUtilisateur, options = {}) {
  const { recherche, statut, page = 1, parPage = 20 } = options;
  const universite = await getUniversiteProfile(idUtilisateur);
  const idUniversite = universite.idUniversite;

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
    .where(eq(stagiaires.idUniversite, idUniversite));

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

  let etudiants = stagiairesRows.map((s) => {
    const formation = formationParStagiaire.get(s.idStagiaire);
    const stage = stageParStagiaire.get(s.idStagiaire);
    const notes = stage ? notesParStage.get(stage.idStage) : null;
    const noteSur20 = notes?.length
      ? Math.round(((notes.reduce((a, b) => a + b, 0) / notes.length) * 4) * 10) / 10
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

  if (statut) {
    etudiants = etudiants.filter((e) => e.statut === statut);
  }
  if (recherche) {
    const terme = recherche.toLowerCase();
    etudiants = etudiants.filter((e) =>
      e.nomComplet.toLowerCase().includes(terme),
    );
  }

  const stats = {
    totalInscrits: stagiairesRows.length,
    enStage: stagiairesRows.filter(
      (s) => stageParStagiaire.get(s.idStagiaire)?.statut === "actif",
    ).length,
    diplomesRecents: stagiairesRows.filter(
      (s) => s.statutAcademique === "jeune_diplome",
    ).length,
  };
  stats.sansStage = Math.max(
    0,
    stats.totalInscrits - stats.enStage - stats.diplomesRecents,
  );

  const total = etudiants.length;
  const totalPages = Math.max(1, Math.ceil(total / parPage));
  const pageBornee = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const debut = (pageBornee - 1) * parPage;
  const donneesPage = etudiants.slice(debut, debut + Number(parPage));

  return {
    data: donneesPage,
    pagination: { page: pageBornee, parPage: Number(parPage), total, totalPages },
    stats,
  };
}
