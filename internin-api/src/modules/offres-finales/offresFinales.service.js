// Le point le plus délicat de ce module : la création du Stage ne se
// produit que lorsque les 3 booléens de conventions_stage sont à true
// (règle métier du PRD). On y arrive en 3 étapes indépendantes :
// 1) L'entreprise crée l'offre finale -> accepteeParEntreprise = true d'emblée
// 2) L'admin valide -> approuveeParPlateforme = true
// 3) Le stagiaire accepte -> accepteeParStagiaire = true, et si les 2 autres
//    sont déjà true, on crée le Stage dans la foulée (transaction).

import { eq, and, ne, desc, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { resolveEntrepriseContextOrThrow } from "../equipe/equipe.permissions.js";
import {
  offresFinales,
  conventionsStage,
  stages,
  objectifsStage,
  entretiens,
  candidatures,
  offresStage,
  entreprises,
  stagiaires,
} from "../../db/schema.js";
import { creerNotification, emitNotificationCreated } from "../notifications/notifications.service.js";
import {
  computeInitialStageStatus,
  getStageLifecycleStatus,
  daysUntilStart,
  calculerDateFinPrevueYmd,
} from "../../utils/stageLifecycle.js";
import { enrichWithDelaiTraitement } from "../../utils/delaiTraitement.js";
import {
  isAutoValidationEnabled,
  ELEMENT_OFFRES_FINALES,
  ELEMENT_CONVENTIONS,
} from "../../utils/autoValidation.js";
import {
  validateObjectifsPedagogiques,
  serializeObjectifsList,
  parseObjectifsList,
} from "../../utils/objectifsPedagogiques.js";

export async function createOffreFinale(idUtilisateurEntreprise, payload) {
  // Propriétaire OU membre d'équipe actif (permissions vérifiées en middleware)
  const { entreprise } = await resolveEntrepriseContextOrThrow(
    idUtilisateurEntreprise,
  );

  // Vérifie que l'entretien appartient bien à une offre de cette entreprise
  const [row] = await db
    .select({
      idOffreEntreprise: offresStage.idEntreprise,
      idContactSuperviseur: offresStage.idContactSuperviseur,
    })
    .from(entretiens)
    .innerJoin(
      candidatures,
      eq(entretiens.idCandidature, candidatures.idCandidature),
    )
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .where(eq(entretiens.idEntretien, payload.idEntretien));

  if (!row || row.idOffreEntreprise !== entreprise.idEntreprise) {
    const err = new Error(
      "Vous n'êtes pas autorisé à faire une offre pour cet entretien",
    );
    err.status = 403;
    throw err;
  }

  // On autorise une nouvelle soumission après un rejet, mais pas tant
  // qu'une offre est encore en attente ou déjà approuvée pour cet entretien.
  const [offreActive] = await db
    .select({ idOffreFinale: offresFinales.idOffreFinale })
    .from(offresFinales)
    .where(
      and(
        eq(offresFinales.idEntretien, payload.idEntretien),
        ne(offresFinales.statutValidationPlateforme, "rejete"),
      ),
    );
  if (offreActive) {
    const err = new Error(
      "Une offre finale est déjà en cours pour cet entretien",
    );
    err.status = 409;
    throw err;
  }

  // Objectifs pédagogiques obligatoires (liste ou texte multi-lignes)
  const objectifsList = validateObjectifsPedagogiques(
    payload.objectifs?.length ? payload.objectifs : payload.objectifsApprentissage,
  );
  const objectifsSerialized = serializeObjectifsList(objectifsList);

  const autoOffre = await isAutoValidationEnabled(ELEMENT_OFFRES_FINALES);
  const autoConvention = await isAutoValidationEnabled(ELEMENT_CONVENTIONS);

  return db.transaction(async (tx) => {
    const [offreFinale] = await tx
      .insert(offresFinales)
      .values({
        idEntretien: payload.idEntretien,
        idContactSuperviseur: row.idContactSuperviseur,
        intitulePoste: payload.intitulePoste,
        objectifsApprentissage: objectifsSerialized,
        volumeHoraireHebdo: payload.volumeHoraireHebdo,
        dureeStage: payload.dureeStage,
        modeTravail: payload.modeTravail,
        remunerationType: payload.remunerationType,
        dateDebut: payload.dateDebut,
        statutValidationPlateforme: autoOffre ? "approuve" : "en_attente",
        statutReponseStagiaire: "en_attente",
      })
      .returning();
    // L'entreprise qui propose l'offre est considérée comme ayant accepté d'emblée
    await tx.insert(conventionsStage).values({
      idOffreFinale: offreFinale.idOffreFinale,
      accepteeParEntreprise: true,
      dateAcceptationEntreprise: new Date(),
      accepteeParStagiaire: false,
      approuveeParPlateforme: autoOffre || autoConvention,
    });

    const [candidatureRow] = await tx
      .select({ idCandidature: candidatures.idCandidature })
      .from(entretiens)
      .innerJoin(
        candidatures,
        eq(entretiens.idCandidature, candidatures.idCandidature),
      )
      .where(eq(entretiens.idEntretien, payload.idEntretien));

    if (candidatureRow) {
      await tx
        .update(candidatures)
        .set({ statut: "preselectionnee", dateMajStatut: new Date() })
        .where(eq(candidatures.idCandidature, candidatureRow.idCandidature));
    }

    return offreFinale;
  });
}

// Historique des tentatives d'offre finale rejetées par l'administration
// pour un entretien donné — la carte entreprise se réinitialise sur "Faire
// une offre" après un rejet (pour permettre une nouvelle tentative), mais
// cet historique garde la trace visible des refus précédents.
export async function listHistoriqueRejets(
  idUtilisateurEntreprise,
  idEntretien,
) {
  const { entreprise } = await resolveEntrepriseContextOrThrow(
    idUtilisateurEntreprise,
  );

  const [row] = await db
    .select({ idOffreEntreprise: offresStage.idEntreprise })
    .from(entretiens)
    .innerJoin(
      candidatures,
      eq(entretiens.idCandidature, candidatures.idCandidature),
    )
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .where(eq(entretiens.idEntretien, idEntretien));

  if (!row || row.idOffreEntreprise !== entreprise.idEntreprise) {
    const err = new Error(
      "Vous n'êtes pas autorisé à consulter cet historique",
    );
    err.status = 403;
    throw err;
  }

  return db
    .select({
      idOffreFinale: offresFinales.idOffreFinale,
      intitulePoste: offresFinales.intitulePoste,
      dureeStage: offresFinales.dureeStage,
      volumeHoraireHebdo: offresFinales.volumeHoraireHebdo,
      dateDebut: offresFinales.dateDebut,
      dateCreation: offresFinales.dateCreation,
      dateValidation: offresFinales.dateValidation,
      statutValidationPlateforme: offresFinales.statutValidationPlateforme,
      statutReponseStagiaire: offresFinales.statutReponseStagiaire,
      dateReponseStagiaire: offresFinales.dateReponseStagiaire,
      motifRefusStagiaire: offresFinales.motifRefusStagiaire,
    })
    .from(offresFinales)
    .where(eq(offresFinales.idEntretien, idEntretien))
    .orderBy(desc(offresFinales.dateCreation));
}

export async function listOffresFinalesEnAttente() {
  const rows = await db
    .select({
      idOffreFinale: offresFinales.idOffreFinale,
      intitulePoste: offresFinales.intitulePoste,
      dureeStage: offresFinales.dureeStage,
      dateDebut: offresFinales.dateDebut,
      dateCreation: offresFinales.dateCreation,
      nomEntreprise: entreprises.nomEntreprise,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
    })
    .from(offresFinales)
    .innerJoin(
      entretiens,
      eq(offresFinales.idEntretien, entretiens.idEntretien),
    )
    .innerJoin(
      candidatures,
      eq(entretiens.idCandidature, candidatures.idCandidature),
    )
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .innerJoin(
      entreprises,
      eq(offresStage.idEntreprise, entreprises.idEntreprise),
    )
    .innerJoin(stagiaires, eq(candidatures.idStagiaire, stagiaires.idStagiaire))
    .where(eq(offresFinales.statutValidationPlateforme, "en_attente"));

  return enrichWithDelaiTraitement(
    rows,
    (r) => r.dateCreation,
    () => true,
  );
}

// Liste complète (tous statuts, ou filtrée) pour la page de modération
// admin — distincte de listOffresFinalesEnAttente (utilisée ailleurs,
// notamment le tableau de bord) pour ne rien casser côté existant.
export async function listToutesOffresFinales(statut) {
  const rows = await db
    .select({
      idOffreFinale: offresFinales.idOffreFinale,
      idEntretien: offresFinales.idEntretien,
      numero: offresFinales.numero,
      intitulePoste: offresFinales.intitulePoste,
      objectifsApprentissage: offresFinales.objectifsApprentissage,
      volumeHoraireHebdo: offresFinales.volumeHoraireHebdo,
      dureeStage: offresFinales.dureeStage,
      modeTravail: offresFinales.modeTravail,
      remunerationType: offresFinales.remunerationType,
      dateDebut: offresFinales.dateDebut,
      dateCreation: offresFinales.dateCreation,
      dateValidation: offresFinales.dateValidation,
      statutValidationPlateforme: offresFinales.statutValidationPlateforme,
      nomEntreprise: entreprises.nomEntreprise,
      idEntreprise: entreprises.idEntreprise,
      secteurActivite: offresStage.secteurActivite,
      departement: offresStage.departement,
      prenomStagiaire: stagiaires.prenom,
      nomStagiaire: stagiaires.nom,
    })
    .from(offresFinales)
    .innerJoin(
      entretiens,
      eq(offresFinales.idEntretien, entretiens.idEntretien),
    )
    .innerJoin(
      candidatures,
      eq(entretiens.idCandidature, candidatures.idCandidature),
    )
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .innerJoin(
      entreprises,
      eq(offresStage.idEntreprise, entreprises.idEntreprise),
    )
    .innerJoin(stagiaires, eq(candidatures.idStagiaire, stagiaires.idStagiaire))
    // .where(undefined) est un pattern Drizzle standard : la clause WHERE
    // est simplement omise quand aucun filtre de statut n'est demandé.
    .where(statut ? eq(offresFinales.statutValidationPlateforme, statut) : undefined)
    .orderBy(desc(offresFinales.dateCreation));

  return enrichWithDelaiTraitement(
    rows,
    (r) => r.dateCreation,
    (r) => r.statutValidationPlateforme === "en_attente",
  );
}

export async function validerOffreFinale(
  idUtilisateurAdmin,
  idOffreFinale,
  statutValidationPlateforme,
) {
  const resultatValidation = await db.transaction(async (tx) => {
    const [offreFinale] = await tx
      .update(offresFinales)
      .set({ statutValidationPlateforme, dateValidation: new Date() })
      .where(eq(offresFinales.idOffreFinale, idOffreFinale))
      .returning();

    if (!offreFinale) {
      const err = new Error("Offre finale introuvable");
      err.status = 404;
      throw err;
    }

    if (statutValidationPlateforme === "approuve") {
      await tx
        .update(conventionsStage)
        .set({ approuveeParPlateforme: true })
        .where(eq(conventionsStage.idOffreFinale, idOffreFinale));
    }

    // Contexte nécessaire pour personnaliser la notification envoyée à
    // l'entreprise (nom du candidat concerné).
    const [contexte] = await tx
      .select({
        idUtilisateurEntreprise: entreprises.idUtilisateur,
        prenom: stagiaires.prenom,
        nom: stagiaires.nom,
      })
      .from(offresFinales)
      .innerJoin(
        entretiens,
        eq(offresFinales.idEntretien, entretiens.idEntretien),
      )
      .innerJoin(
        candidatures,
        eq(entretiens.idCandidature, candidatures.idCandidature),
      )
      .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
      .innerJoin(
        entreprises,
        eq(offresStage.idEntreprise, entreprises.idEntreprise),
      )
      .innerJoin(
        stagiaires,
        eq(candidatures.idStagiaire, stagiaires.idStagiaire),
      )
      .where(eq(offresFinales.idOffreFinale, idOffreFinale));

    let notif = null;
    if (contexte) {
      if (statutValidationPlateforme === "approuve") {
        notif = await creerNotification(
          {
            idUtilisateur: contexte.idUtilisateurEntreprise,
            type: "offre_finale_approuvee",
            titre: "Offre finale validée",
            message: `L'administration a validé votre offre pour ${contexte.prenom} ${contexte.nom} (« ${offreFinale.intitulePoste} »). Le candidat peut désormais y répondre.`,
            lien: "/entretiens-entreprise",
          },
          tx,
        );
      } else if (statutValidationPlateforme === "rejete") {
        notif = await creerNotification(
          {
            idUtilisateur: contexte.idUtilisateurEntreprise,
            type: "offre_finale_rejetee",
            titre: "Offre finale rejetée",
            message: `L'administration a rejeté votre offre pour ${contexte.prenom} ${contexte.nom} (« ${offreFinale.intitulePoste} »). Vous pouvez soumettre une nouvelle offre.`,
            lien: "/entretiens-entreprise",
          },
          tx,
        );
      }
    }

    return { offreFinale, contexte, notif };
  });

  if (resultatValidation?.notif) {
    emitNotificationCreated(resultatValidation.notif);
  }

  return resultatValidation.offreFinale;
}

export async function listMesOffresFinales(idUtilisateurStagiaire) {
  const [stagiaire] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateurStagiaire));
  if (!stagiaire) return [];

  return db
    .select({
      idOffreFinale: offresFinales.idOffreFinale,
      idCandidature: candidatures.idCandidature,
      intitulePoste: offresFinales.intitulePoste,
      objectifsApprentissage: offresFinales.objectifsApprentissage,
      volumeHoraireHebdo: offresFinales.volumeHoraireHebdo,
      dureeStage: offresFinales.dureeStage,
      modeTravail: offresFinales.modeTravail,
      dateDebut: offresFinales.dateDebut,
      statutValidationPlateforme: offresFinales.statutValidationPlateforme,
      statutReponseStagiaire: offresFinales.statutReponseStagiaire,
      dateReponseStagiaire: offresFinales.dateReponseStagiaire,
      motifRefusStagiaire: offresFinales.motifRefusStagiaire,
      dateCreation: offresFinales.dateCreation,
      dateValidation: offresFinales.dateValidation,
      nomEntreprise: entreprises.nomEntreprise,
    })
    .from(offresFinales)
    .innerJoin(
      entretiens,
      eq(offresFinales.idEntretien, entretiens.idEntretien),
    )
    .innerJoin(
      candidatures,
      eq(entretiens.idCandidature, candidatures.idCandidature),
    )
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .innerJoin(
      entreprises,
      eq(offresStage.idEntreprise, entreprises.idEntreprise),
    )
    .where(eq(candidatures.idStagiaire, stagiaire.idStagiaire));
}

export async function repondreOffreFinale(
  idUtilisateurStagiaire,
  idOffreFinale,
  statutReponseStagiaire,
  motifRefusStagiaire = null,
) {
  // 1) Identité stagiaire depuis le JWT uniquement (jamais depuis le body)
  const [stagiaire] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateurStagiaire));
  if (!stagiaire) {
    const err = new Error("Profil stagiaire introuvable");
    err.status = 404;
    throw err;
  }

  // 2) Chargement + appartenance en une seule requête (anti-IDOR / BOLA)
  //    Offre finale → entretien → candidature → stagiaire propriétaire
  const [owned] = await db
    .select({
      offreFinale: offresFinales,
      idCandidature: candidatures.idCandidature,
      idStagiaireProprietaire: candidatures.idStagiaire,
      idOffre: offresStage.idOffre,
      idEntreprise: offresStage.idEntreprise,
      idUtilisateurEntreprise: entreprises.idUtilisateur,
      nomEntreprise: entreprises.nomEntreprise,
    })
    .from(offresFinales)
    .innerJoin(
      entretiens,
      eq(offresFinales.idEntretien, entretiens.idEntretien),
    )
    .innerJoin(
      candidatures,
      eq(entretiens.idCandidature, candidatures.idCandidature),
    )
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .innerJoin(
      entreprises,
      eq(offresStage.idEntreprise, entreprises.idEntreprise),
    )
    .where(
      and(
        eq(offresFinales.idOffreFinale, idOffreFinale),
        eq(candidatures.idStagiaire, stagiaire.idStagiaire),
      ),
    )
    .limit(1);

  // 404 volontaire : ne pas révéler qu'une offre d'un autre stagiaire existe
  if (!owned) {
    const err = new Error("Offre finale introuvable");
    err.status = 404;
    throw err;
  }

  const offreFinale = owned.offreFinale;

  // 3) Statuts métier
  if (offreFinale.statutValidationPlateforme !== "approuve") {
    const err = new Error(
      "Cette offre n'a pas encore été validée par la plateforme",
    );
    err.status = 403;
    throw err;
  }

  if (offreFinale.statutReponseStagiaire !== "en_attente") {
    const err = new Error(
      offreFinale.statutReponseStagiaire === "acceptee"
        ? "Cette offre a déjà été acceptée."
        : offreFinale.statutReponseStagiaire === "refusee"
          ? "Cette offre a déjà été refusée."
          : "Cette offre n'est plus en attente de réponse.",
    );
    err.status = 409;
    throw err;
  }

  if (
    statutReponseStagiaire !== "acceptee" &&
    statutReponseStagiaire !== "refusee"
  ) {
    const err = new Error("Réponse invalide");
    err.status = 422;
    throw err;
  }

  const entrepriseInfo = {
    idUtilisateurEntreprise: owned.idUtilisateurEntreprise,
    idEntreprise: owned.idEntreprise,
    nomEntreprise: owned.nomEntreprise,
  };

  const motifNormalise =
    statutReponseStagiaire === "refusee"
      ? String(motifRefusStagiaire ?? "")
          .trim()
          .replace(/\s+/g, " ")
      : null;

  if (statutReponseStagiaire === "refusee") {
    if (!motifNormalise || motifNormalise.length < 10) {
      const err = new Error(
        "Le motif du refus est obligatoire (10 caractères minimum).",
      );
      err.status = 422;
      throw err;
    }
    if (motifNormalise.length > 1000) {
      const err = new Error(
        "Le motif du refus ne peut pas dépasser 1000 caractères.",
      );
      err.status = 422;
      throw err;
    }
  }

  const pendingNotifs = [];
  const resultatReponse = await db.transaction(async (tx) => {
    if (statutReponseStagiaire === "acceptee") {
      // Le nombre de postes est une capacité partagée par toutes les
      // candidatures d'une même offre. Un simple COUNT suivi d'un UPDATE
      // n'est pas suffisant : deux transactions concurrentes pourraient
      // toutes les deux observer une place libre. Le verrou FOR UPDATE sur
      // l'offre parente sérialise donc les acceptations pour cette offre.
      const capacityResult = await tx.execute(sql`
        SELECT id_offre, nombre_postes
        FROM offres_stage
        WHERE id_offre = ${owned.idOffre}
        FOR UPDATE
      `);
      const offreVerrouillee = capacityResult.rows?.[0];

      if (!offreVerrouillee) {
        const err = new Error("Offre de stage introuvable");
        err.status = 404;
        throw err;
      }

      const countResult = await tx.execute(sql`
        SELECT COUNT(*)::int AS nombre_acceptes
        FROM candidatures
        WHERE id_offre = ${owned.idOffre}
          AND statut = 'acceptee'
      `);
      const nombreAcceptes = Number(
        countResult.rows?.[0]?.nombre_acceptes ?? 0,
      );
      const nombrePostes = Number(offreVerrouillee.nombre_postes ?? 1);

      if (nombreAcceptes >= nombrePostes) {
        const err = new Error(
          "Cette offre a atteint son nombre maximal de postes disponibles.",
        );
        err.status = 409;
        err.code = "OFFRE_POSTES_COMPLETS";
        throw err;
      }
    }

    // 5) Mise à jour conditionnelle anti race-condition + anti-IDOR
    const [updated] = await tx
      .update(offresFinales)
      .set({
        statutReponseStagiaire,
        dateReponseStagiaire: new Date(),
        motifRefusStagiaire:
          statutReponseStagiaire === "refusee" ? motifNormalise : null,
      })
      .where(
        and(
          eq(offresFinales.idOffreFinale, idOffreFinale),
          eq(offresFinales.statutReponseStagiaire, "en_attente"),
          eq(offresFinales.statutValidationPlateforme, "approuve"),
        ),
      )
      .returning();

    if (!updated) {
      const err = new Error(
        "Cette offre n'est plus disponible pour une réponse (conflit ou déjà traitée).",
      );
      err.status = 409;
      throw err;
    }

    // Re-vérifier l'appartenance dans la transaction (défense en profondeur)
    const [stillOwned] = await tx
      .select({ idCandidature: candidatures.idCandidature })
      .from(offresFinales)
      .innerJoin(
        entretiens,
        eq(offresFinales.idEntretien, entretiens.idEntretien),
      )
      .innerJoin(
        candidatures,
        eq(entretiens.idCandidature, candidatures.idCandidature),
      )
      .where(
        and(
          eq(offresFinales.idOffreFinale, idOffreFinale),
          eq(candidatures.idStagiaire, stagiaire.idStagiaire),
        ),
      )
      .limit(1);

    if (!stillOwned) {
      const err = new Error("Offre finale introuvable");
      err.status = 404;
      throw err;
    }

    if (statutReponseStagiaire === "refusee") {
      if (entrepriseInfo?.idUtilisateurEntreprise) {
        { const _n = await creerNotification({
          idUtilisateur: entrepriseInfo.idUtilisateurEntreprise,
          type: "offre_finale_refusee",
          idEntreprise: entrepriseInfo.idEntreprise,
          categoriePreference: "candidatures",
          titre: "Offre finale refusée",
          message: `${stagiaire.prenom} ${stagiaire.nom} a refusé votre offre finale pour « ${offreFinale.intitulePoste} ». Motif : ${motifNormalise}`,
          lien: "/entretiens-entreprise",
        }, tx); if (_n) pendingNotifs.push(_n); };
        // Confirmation stagiaire
        { const _n = await creerNotification({
          idUtilisateur: idUtilisateurStagiaire,
          type: "offre_finale_refusee_confirmation",
          titre: "Votre refus a bien été enregistré",
          message: `L'entreprise ${entrepriseInfo.nomEntreprise || ""} a été informée de votre décision concernant « ${offreFinale.intitulePoste} ».`,
          lien: "/candidatures",
        }, tx); if (_n) pendingNotifs.push(_n); };
      }
      return { stageCree: false };
    }

    // Acceptation : signature convention stagiaire
    const [convention] = await tx
      .update(conventionsStage)
      .set({
        accepteeParStagiaire: true,
        dateAcceptationStagiaire: new Date(),
      })
      .where(eq(conventionsStage.idOffreFinale, idOffreFinale))
      .returning();

    if (!convention) {
      const err = new Error("Convention introuvable pour cette offre finale");
      err.status = 404;
      throw err;
    }

    if (entrepriseInfo?.idUtilisateurEntreprise) {
      { const _n = await creerNotification({
        idUtilisateur: entrepriseInfo.idUtilisateurEntreprise,
        type: "offre_finale_acceptee",
          idEntreprise: entrepriseInfo.idEntreprise,
          categoriePreference: "candidatures",
        titre: "Offre finale acceptée 🎉",
        message: `${stagiaire.prenom} ${stagiaire.nom} a accepté votre offre finale pour « ${offreFinale.intitulePoste} ».`,
        lien: "/entretiens-entreprise",
      }, tx); if (_n) pendingNotifs.push(_n); };
    }

    // Les 3 accords sont réunis : on crée le stage
    if (
      convention.accepteeParEntreprise &&
      convention.accepteeParStagiaire &&
      convention.approuveeParPlateforme
    ) {
      const [row] = await tx
        .select({
          idEntreprise: offresStage.idEntreprise,
          idContactSuperviseur: offresFinales.idContactSuperviseur,
          idCandidature: candidatures.idCandidature,
        })
        .from(offresFinales)
        .innerJoin(
          entretiens,
          eq(offresFinales.idEntretien, entretiens.idEntretien),
        )
        .innerJoin(
          candidatures,
          eq(entretiens.idCandidature, candidatures.idCandidature),
        )
        .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
        .where(
          and(
            eq(offresFinales.idOffreFinale, idOffreFinale),
            eq(candidatures.idStagiaire, stagiaire.idStagiaire),
          ),
        )
        .limit(1);

      if (!row) {
        const err = new Error("Données métier incohérentes pour la création du stage");
        err.status = 409;
        throw err;
      }

      // Empêcher un double stage pour la même convention
      const [existingStage] = await tx
        .select({ idStage: stages.idStage })
        .from(stages)
        .where(eq(stages.idConvention, convention.idConvention))
        .limit(1);
      if (existingStage) {
        return { stageCree: false, stage: existingStage, dejaExistant: true };
      }

      const dateFinPrevue = calculerDateFinPrevueYmd(
        offreFinale.dateDebut,
        offreFinale.dureeStage,
      );

      const statutInitial = computeInitialStageStatus(
        offreFinale.dateDebut,
        dateFinPrevue,
      );

      const [stage] = await tx
        .insert(stages)
        .values({
          idConvention: convention.idConvention,
          idStagiaire: stagiaire.idStagiaire,
          idEntreprise: row.idEntreprise,
          idContactSuperviseur: row.idContactSuperviseur,
          idUniversite: stagiaire.idUniversite,
          objectifsApprentissage: offreFinale.objectifsApprentissage,
          dateDebut: offreFinale.dateDebut,
          dateFinPrevue,
          statut: statutInitial,
        })
        .returning();

      // Copie des objectifs pédagogiques (offre finale → objectifs_stage)
      const objectifsPourStage = parseObjectifsList(
        offreFinale.objectifsApprentissage,
      );
      if (objectifsPourStage.length) {
        await tx.insert(objectifsStage).values(
          objectifsPourStage.map((description) => ({
            idStage: stage.idStage,
            description,
            statut: "defini",
          })),
        );
      }

      await tx
        .update(stagiaires)
        .set({ statutStage: "actif" })
        .where(eq(stagiaires.idStagiaire, stagiaire.idStagiaire));
      await tx
        .update(candidatures)
        .set({ statut: "retiree" })
        .where(
          and(
            eq(candidatures.idStagiaire, stagiaire.idStagiaire),
            eq(candidatures.statut, "soumise"),
          ),
        );

      await tx
        .update(candidatures)
        .set({ statut: "acceptee", dateMajStatut: new Date() })
        .where(eq(candidatures.idCandidature, row.idCandidature));

      const debutLabel = new Date(
        String(offreFinale.dateDebut).slice(0, 10) + "T12:00:00Z",
      ).toLocaleDateString("fr-FR", { timeZone: "Africa/Douala" });
      const jours = daysUntilStart({ dateDebut: offreFinale.dateDebut });
      const notifTitre =
        statutInitial === "a_venir"
          ? "Votre stage est programmé"
          : "Votre stage démarre aujourd'hui";
      const notifMessage =
        statutInitial === "a_venir"
          ? `Toutes les signatures sont réunies. Votre stage débutera le ${debutLabel}${jours > 0 ? ` (dans ${jours} jour${jours > 1 ? "s" : ""})` : ""}. Le suivi et la messagerie s'ouvriront à cette date.`
          : `Toutes les signatures sont réunies : votre stage démarre le ${debutLabel}.`;
      { const _n = await creerNotification({
        idUtilisateur: stagiaire.idUtilisateur,
        type: statutInitial === "a_venir" ? "stage_programme" : "stage_demarre",
        titre: notifTitre,
        message: notifMessage,
        lien: "/stage",
      }, tx); if (_n) pendingNotifs.push(_n); };

      return { stageCree: true, stage };
    }

    return { stageCree: false };
  });

  for (const n of pendingNotifs) {
    emitNotificationCreated(n);
  }
  return resultatReponse;
}

