// Le point le plus délicat de ce module : la création du Stage ne se
// produit que lorsque les 3 booléens de conventions_stage sont à true
// (règle métier du PRD). On y arrive en 3 étapes indépendantes :
// 1) L'entreprise crée l'offre finale -> accepteeParEntreprise = true d'emblée
// 2) L'admin valide -> approuveeParPlateforme = true
// 3) Le stagiaire accepte -> accepteeParStagiaire = true, et si les 2 autres
//    sont déjà true, on crée le Stage dans la foulée (transaction).

import { eq, and, ne, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  offresFinales,
  conventionsStage,
  stages,
  entretiens,
  candidatures,
  offresStage,
  entreprises,
  stagiaires,
} from "../../db/schema.js";
import { creerNotification } from "../notifications/notifications.service.js";

function calculerDateFinPrevue(dateDebut, dureeStage) {
  const moisAAjouter = { "1_mois": 1, "2_mois": 2, "3_mois": 3 }[dureeStage];
  const date = new Date(dateDebut);
  date.setMonth(date.getMonth() + moisAAjouter);
  return date;
}

export async function createOffreFinale(idUtilisateurEntreprise, payload) {
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }

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

  return db.transaction(async (tx) => {
    const [offreFinale] = await tx
      .insert(offresFinales)
      .values({
        idEntretien: payload.idEntretien,
        idContactSuperviseur: row.idContactSuperviseur,
        intitulePoste: payload.intitulePoste,
        objectifsApprentissage: payload.objectifsApprentissage || null,
        volumeHoraireHebdo: payload.volumeHoraireHebdo,
        dureeStage: payload.dureeStage,
        modeTravail: payload.modeTravail,
        remunerationType: payload.remunerationType,
        dateDebut: payload.dateDebut,
        statutValidationPlateforme: "en_attente",
        statutReponseStagiaire: "en_attente",
      })
      .returning();
    // L'entreprise qui propose l'offre est considérée comme ayant accepté d'emblée
    await tx.insert(conventionsStage).values({
      idOffreFinale: offreFinale.idOffreFinale,
      accepteeParEntreprise: true,
      dateAcceptationEntreprise: new Date(),
      accepteeParStagiaire: false,
      approuveeParPlateforme: false,
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
  const [entreprise] = await db
    .select()
    .from(entreprises)
    .where(eq(entreprises.idUtilisateur, idUtilisateurEntreprise));
  if (!entreprise) {
    const err = new Error("Profil entreprise introuvable");
    err.status = 404;
    throw err;
  }

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
      dateValidation: offresFinales.dateValidation,
    })
    .from(offresFinales)
    .where(
      and(
        eq(offresFinales.idEntretien, idEntretien),
        eq(offresFinales.statutValidationPlateforme, "rejete"),
      ),
    )
    .orderBy(desc(offresFinales.dateValidation));
}

export async function listOffresFinalesEnAttente() {
  return db
    .select({
      idOffreFinale: offresFinales.idOffreFinale,
      intitulePoste: offresFinales.intitulePoste,
      dureeStage: offresFinales.dureeStage,
      dateDebut: offresFinales.dateDebut,
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
}

// Liste complète (tous statuts, ou filtrée) pour la page de modération
// admin — distincte de listOffresFinalesEnAttente (utilisée ailleurs,
// notamment le tableau de bord) pour ne rien casser côté existant.
export async function listToutesOffresFinales(statut) {
  return db
    .select({
      idOffreFinale: offresFinales.idOffreFinale,
      numero: offresFinales.numero,
      intitulePoste: offresFinales.intitulePoste,
      dureeStage: offresFinales.dureeStage,
      dateCreation: offresFinales.dateCreation,
      statutValidationPlateforme: offresFinales.statutValidationPlateforme,
      nomEntreprise: entreprises.nomEntreprise,
      secteurActivite: offresStage.secteurActivite,
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
    // .where(undefined) est un pattern Drizzle standard : la clause WHERE
    // est simplement omise quand aucun filtre de statut n'est demandé.
    .where(statut ? eq(offresFinales.statutValidationPlateforme, statut) : undefined)
    .orderBy(desc(offresFinales.dateCreation));
}

export async function validerOffreFinale(
  idUtilisateurAdmin,
  idOffreFinale,
  statutValidationPlateforme,
) {
  const { offreFinale, contexte } = await db.transaction(async (tx) => {
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

    return { offreFinale, contexte };
  });

  if (contexte) {
    if (statutValidationPlateforme === "approuve") {
      await creerNotification({
        idUtilisateur: contexte.idUtilisateurEntreprise,
        type: "offre_finale_approuvee",
        titre: "Offre finale validée",
        message: `L'administration a validé votre offre pour ${contexte.prenom} ${contexte.nom} (« ${offreFinale.intitulePoste} »). Le candidat peut désormais y répondre.`,
        lien: "/entretiens-entreprise",
      });
    } else if (statutValidationPlateforme === "rejete") {
      await creerNotification({
        idUtilisateur: contexte.idUtilisateurEntreprise,
        type: "offre_finale_rejetee",
        titre: "Offre finale rejetée",
        message: `L'administration a rejeté votre offre pour ${contexte.prenom} ${contexte.nom} (« ${offreFinale.intitulePoste} »). Vous pouvez soumettre une nouvelle offre.`,
        lien: "/entretiens-entreprise",
      });
    }
  }

  return offreFinale;
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
) {
  const [stagiaire] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateurStagiaire));
  if (!stagiaire) {
    const err = new Error("Profil stagiaire introuvable");
    err.status = 404;
    throw err;
  }

  const [offreFinale] = await db
    .select()
    .from(offresFinales)
    .where(eq(offresFinales.idOffreFinale, idOffreFinale));
  if (!offreFinale) {
    const err = new Error("Offre finale introuvable");
    err.status = 404;
    throw err;
  }

  // Règle métier : le stagiaire ne peut répondre qu'une fois la plateforme
  // ayant approuvé l'offre (cascade décrite dans le Schéma BDD §12)
  if (offreFinale.statutValidationPlateforme !== "approuve") {
    const err = new Error(
      "Cette offre n'a pas encore été validée par la plateforme",
    );
    err.status = 403;
    throw err;
  }

  // Récupéré avant la transaction pour notifier l'entreprise une fois la
  // réponse enregistrée (nom du candidat déjà disponible via `stagiaire`).
  const [entrepriseInfo] = await db
    .select({ idUtilisateurEntreprise: entreprises.idUtilisateur })
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
    .where(eq(offresFinales.idOffreFinale, idOffreFinale));

  return db.transaction(async (tx) => {
    await tx
      .update(offresFinales)
      .set({ statutReponseStagiaire, dateReponseStagiaire: new Date() })
      .where(eq(offresFinales.idOffreFinale, idOffreFinale));

    if (statutReponseStagiaire === "refusee") {
      if (entrepriseInfo) {
        await creerNotification({
          idUtilisateur: entrepriseInfo.idUtilisateurEntreprise,
          type: "offre_finale_refusee",
          titre: "Offre finale déclinée",
          message: `${stagiaire.prenom} ${stagiaire.nom} a décliné votre offre finale pour « ${offreFinale.intitulePoste} ».`,
          lien: "/entretiens-entreprise",
        });
      }
      return { stageCree: false };
    }

    const [convention] = await tx
      .update(conventionsStage)
      .set({ accepteeParStagiaire: true, dateAcceptationStagiaire: new Date() })
      .where(eq(conventionsStage.idOffreFinale, idOffreFinale))
      .returning();
    
    if (entrepriseInfo) {
      await creerNotification({
        idUtilisateur: entrepriseInfo.idUtilisateurEntreprise,
        type: "offre_finale_acceptee",
        titre: "Offre finale acceptée 🎉",
        message: `${stagiaire.prenom} ${stagiaire.nom} a accepté votre offre finale pour « ${offreFinale.intitulePoste} ».`,
        lien: "/entretiens-entreprise",
      });
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
        .where(eq(offresFinales.idOffreFinale, idOffreFinale));

      const dateFinPrevue = calculerDateFinPrevue(
        offreFinale.dateDebut,
        offreFinale.dureeStage,
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
          statut: "actif",
        })
        .returning();

      // Règle métier : stage actif exclusif — le profil passe à "actif" et
      // toutes les autres candidatures en cours sont désactivées
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

      // Fait APRÈS la mise à jour groupée ci-dessus, pour que "acceptee"
      // ne soit jamais écrasé par elle : "acceptee" ne reflète désormais
      // que ce cas précis — un vrai stage créé, pas une simple étiquette
      // manuelle comme avant la correction.
      await tx
        .update(candidatures)
        .set({ statut: "acceptee", dateMajStatut: new Date() })
        .where(eq(candidatures.idCandidature, row.idCandidature));
      
      await creerNotification({
        idUtilisateur: stagiaire.idUtilisateur,
        type: "stage_demarre",
        titre: "Votre stage a démarré 🎉",
        message: `Toutes les signatures sont réunies : votre stage débute le ${new Date(offreFinale.dateDebut).toLocaleDateString("fr-FR")}.`,
        lien: "/stage",
      });

      return { stageCree: true, stage };
    }

    return { stageCree: false };
  });
}
