import { eq, or, and, ne } from "drizzle-orm";
import { resolveEntrepriseContextOrThrow } from "../../utils/entrepriseContext.js";
import {
  parseStrictDateTime,
  assertDateTimeInFuture,
} from "../../utils/dateValidation.js";
import { db } from "../../db/index.js";
import {
  entretiens,
  candidatures,
  offresStage,
  entreprises,
  stagiaires,
  offresFinales,
  disponibilitesStagiaire,
  contactsEntreprise,
} from "../../db/schema.js";
import { creerNotification } from "../notifications/notifications.service.js";
import {
  enregistrerActiviteCandidature,
  getMembreOptionnel,
} from "../candidatures/candidatures.service.js";
import { getUtilisateursAvecPermission } from "../../utils/entrepriseContext.js";
import { publishRealtime, publishRealtimeMany } from "../../utils/realtime.js";

/** Résout l'entreprise pour propriétaire OU membre actif (anti-IDOR). */
async function getEntrepriseForUserOrThrow(idUtilisateur) {
  const ctx = await resolveEntrepriseContextOrThrow(idUtilisateur);
  return ctx.entreprise;
}



// Petits raccourcis utilisés uniquement pour notifier l'autre partie à
// chaque étape du cycle d'un entretien — pas de logique métier ici.
async function getIdUtilisateurEntreprise(idEntreprise) {
  const [e] = await db
    .select({ idUtilisateur: entreprises.idUtilisateur })
    .from(entreprises)
    .where(eq(entreprises.idEntreprise, idEntreprise));
  return e?.idUtilisateur;
}
async function getIdUtilisateurStagiaire(idStagiaire) {
  const [s] = await db
    .select({ idUtilisateur: stagiaires.idUtilisateur })
    .from(stagiaires)
    .where(eq(stagiaires.idStagiaire, idStagiaire));
  return s?.idUtilisateur;
}



function validerLienVisio(modeEntretien, lienGoogleMeet) {
  const valeur = (lienGoogleMeet || "").trim();

  if (modeEntretien === "video") {
    if (!valeur) {
      const err = new Error(
        "Le lien de visioconférence (Google Meet, Zoom, Teams...) est obligatoire",
      );
      err.status = 400;
      throw err;
    }
    let url;
    try {
      url = new URL(valeur);
    } catch {
      const err = new Error("Le lien doit être une URL valide[](https://...)");
      err.status = 400;
      throw err;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      const err = new Error(
        "Seuls les liens http:// ou https:// sont autorisés",
      );
      err.status = 400;
      throw err;
    }
    return;
  }

  if (modeEntretien === "presentiel") {
    if (!valeur || valeur.length < 5) {
      const err = new Error(
        "L'adresse ou la localisation de l'entretien en présentiel est obligatoire",
      );
      err.status = 400;
      throw err;
    }
    return;
  }

  // telephone : pas d'obligation stricte
}

// Vérifie que la candidature appartient bien à une offre de cette entreprise,
// ET qu'elle est au statut "présélectionnée" — seul état autorisant la
// planification d'un entretien (règle demandée explicitement).

function requireDateHeure(input, label = "dateHeure") {
  // Validation calendaire stricte (rejette 31/02, 25:99, formats ambigus)
  const d = parseStrictDateTime(input);
  if (!d) {
    const err = new Error(
      `Date invalide pour ${label}. Utilisez une date/heure réelle (AAAA-MM-JJTHH:mm ou JJ/MM/AAAA HH:mm).`,
    );
    err.status = 400;
    throw err;
  }
  return d;
}

/** Planification / reprogrammation : datetime strictement dans le futur. */
function requireDateHeureFuture(input, label = "dateHeure") {
  return assertDateTimeInFuture(input, label);
}

export async function createEntretien(
  idUtilisateurEntreprise,
  { idCandidature, dateHeure, modeEntretien, lienGoogleMeet },
) {
  validerLienVisio(modeEntretien, lienGoogleMeet);

  const entreprise = await getEntrepriseForUserOrThrow(idUtilisateurEntreprise);

  const [row] = await db
    .select({
      idOffreEntreprise: offresStage.idEntreprise,
      statutCandidature: candidatures.statut,
      idStagiaire: candidatures.idStagiaire,
      titreOffre: offresStage.titre,
    })
    .from(candidatures)
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .where(eq(candidatures.idCandidature, idCandidature));

  if (!row || row.idOffreEntreprise !== entreprise.idEntreprise) {
    const err = new Error(
      "Vous n'êtes pas autorisé à planifier un entretien pour cette candidature",
    );
    err.status = 403;
    throw err;
  }

  if (row.statutCandidature !== "preselectionnee") {
    const err = new Error(
      "La candidature doit être présélectionnée avant de planifier un entretien",
    );
    err.status = 400;
    throw err;
  }

  const entretiensExistants = await db
    .select()
    .from(entretiens)
    .where(eq(entretiens.idCandidature, idCandidature));
  const dejaActif = entretiensExistants.some(
    (e) => !["annule", "termine", "absent"].includes(e.statut),
  );
  if (dejaActif) {
    const err = new Error(
      "Un entretien est déjà en cours pour ce candidat sur cette offre.",
    );
    err.status = 409;
    throw err;
  }

  const [entretien] = await db
    .insert(entretiens)
    .values({
      idCandidature,
      dateHeure: requireDateHeureFuture(dateHeure, "La date de l'entretien"),
      modeEntretien,
      lienGoogleMeet: lienGoogleMeet || null,
      statut: "planifie",
    })
    .returning();

  const membre = await getMembreOptionnel(idUtilisateurEntreprise);
  await enregistrerActiviteCandidature(
    entreprise.idEntreprise, // adapte selon le nom de variable déjà présent dans la fonction
    membre?.idMembre,
    idCandidature,
    "entretien_programme",
  );

  const idUtilisateurStagiaire = await getIdUtilisateurStagiaire(
    row.idStagiaire,
  );
  if (idUtilisateurStagiaire) {
    await creerNotification({
      idUtilisateur: idUtilisateurStagiaire,
      type: "entretien_planifie",
      titre: "Nouvel entretien planifié",
      message:
        "Une entreprise vous propose un entretien — vérifiez la date proposée.",
      lien: "/entretiens",
    });
    publishRealtime(idUtilisateurStagiaire, {
      type: "entretien.cree",
      payload: {
        idEntretien: entretien.idEntretien,
        idCandidature,
        statut: "planifie",
        dateHeure: entretien.dateHeure,
      },
    });
  }

  return entretien;
}

export async function listEntretiensForStagiaire(idUtilisateurStagiaire) {
  const [stagiaire] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateurStagiaire));
  if (!stagiaire) return [];

  return db
    .select({
      idEntretien: entretiens.idEntretien,
      idCandidature: entretiens.idCandidature,
      dateHeure: entretiens.dateHeure,
      dateHeureProposee: entretiens.dateHeureProposee,
      modeEntretien: entretiens.modeEntretien,
      lienGoogleMeet: entretiens.lienGoogleMeet,
      statut: entretiens.statut,
      retourEntretien: entretiens.retourEntretien,
      raisonAnnulation: entretiens.raisonAnnulation,
      titreOffre: offresStage.titre,
      nomEntreprise: entreprises.nomEntreprise,
      interviewerNom: contactsEntreprise.nom,
      interviewerFonction: contactsEntreprise.fonction,
    })
    .from(entretiens)
    .innerJoin(
      candidatures,
      eq(entretiens.idCandidature, candidatures.idCandidature),
    )
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .innerJoin(
      entreprises,
      eq(offresStage.idEntreprise, entreprises.idEntreprise),
    )
    .leftJoin(
      contactsEntreprise,
      eq(offresStage.idContactSuperviseur, contactsEntreprise.idContact),
    )
    .where(eq(candidatures.idStagiaire, stagiaire.idStagiaire));
}

export async function listEntretiensForEntreprise(idUtilisateurEntreprise) {
  let entreprise;
  try {
    entreprise = await getEntrepriseForUserOrThrow(idUtilisateurEntreprise);
  } catch {
    return [];
  }

  return db
    .select({
      idEntretien: entretiens.idEntretien,
      idCandidature: entretiens.idCandidature,
      dateHeure: entretiens.dateHeure,
      dateHeureProposee: entretiens.dateHeureProposee,
      modeEntretien: entretiens.modeEntretien,
      lienGoogleMeet: entretiens.lienGoogleMeet,
      statut: entretiens.statut,
      retourEntretien: entretiens.retourEntretien,
      titreOffre: offresStage.titre,
      prenom: stagiaires.prenom,
      nom: stagiaires.nom,
      // Ajouté pour l'avatar affiché sur la carte d'entretien côté
      // entreprise (EntretienCardEntreprise.jsx) — déjà sélectionné ailleurs
      // (candidatures.service.js), on l'expose aussi ici pour éviter un
      // aller-retour réseau supplémentaire.
      photoProfilUrl: stagiaires.photoProfilUrl,

      // Statut de la candidature (permet de savoir si elle a été rejetée
      // après l'entretien, pour ne plus proposer "Faire une offre"/"Rejeter")
      statutCandidature: candidatures.statut,
      // Statut de l'offre finale associée (le cas échéant), pour afficher
      // "en attente de validation par l'administration" puis "Terminé" une
      // fois l'offre approuvée par la plateforme.
      idOffreFinale: offresFinales.idOffreFinale,
      statutValidationPlateforme: offresFinales.statutValidationPlateforme,
      statutReponseStagiaire: offresFinales.statutReponseStagiaire,
      dateReponseStagiaire: offresFinales.dateReponseStagiaire,
      motifRefusStagiaire: offresFinales.motifRefusStagiaire,
    })
    .from(entretiens)
    .innerJoin(
      candidatures,
      eq(entretiens.idCandidature, candidatures.idCandidature),
    )
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .innerJoin(stagiaires, eq(candidatures.idStagiaire, stagiaires.idStagiaire))
    .leftJoin(
      offresFinales,
      and(
        eq(offresFinales.idEntretien, entretiens.idEntretien),
        ne(offresFinales.statutValidationPlateforme, "rejete"),
      ),
    )
    .where(eq(offresStage.idEntreprise, entreprise.idEntreprise));
}

async function getEntretienOwnership(idEntretien) {
  const [row] = await db
    .select({
      idOffreEntreprise: offresStage.idEntreprise,
      idStagiaire: candidatures.idStagiaire,
      statut: entretiens.statut,
        modeEntretien: entretiens.modeEntretien,
        lienGoogleMeet: entretiens.lienGoogleMeet,
      // Noms réels utilisés pour personnaliser les notifications envoyées
      // à l'autre partie (au lieu d'un message générique "une entreprise"/
      // "le candidat").
      titreOffre: offresStage.titre,
      nomEntreprise: entreprises.nomEntreprise,
      prenomStagiaire: stagiaires.prenom,
      nomStagiaire: stagiaires.nom,
    })
    .from(entretiens)
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
    .where(eq(entretiens.idEntretien, idEntretien));

  return row;
}

// Permet à l'entreprise de consulter uniquement les disponibilités du candidat
// nécessaires à la préparation de l'offre finale. Les préférences de recherche
// personnelles ne sont pas exposées dans ce flux.
export async function getDisponibilitesCandidat(
  idUtilisateurEntreprise,
  idEntretien,
) {
  const entreprise = await getEntrepriseForUserOrThrow(idUtilisateurEntreprise);

  const [row] = await db
    .select({
      idOffreEntreprise: offresStage.idEntreprise,
      idStagiaire: candidatures.idStagiaire,
    })
    .from(entretiens)
    .innerJoin(
      candidatures,
      eq(entretiens.idCandidature, candidatures.idCandidature),
    )
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .where(eq(entretiens.idEntretien, idEntretien));

  if (!row || row.idOffreEntreprise !== entreprise.idEntreprise) {
    const err = new Error("Vous n'êtes pas autorisé à consulter ce candidat");
    err.status = 403;
    throw err;
  }

  const disponibilites = await db
    .select({
      jourSemaine: disponibilitesStagiaire.jourSemaine,
      heureDebut: disponibilitesStagiaire.heureDebut,
      heureFin: disponibilitesStagiaire.heureFin,
    })
    .from(disponibilitesStagiaire)
    .where(eq(disponibilitesStagiaire.idStagiaire, row.idStagiaire));

  return { disponibilites };
}

// Étape 3a côté stagiaire : accepte la date proposée par l'entreprise telle quelle
export async function validerEntretien(idUtilisateurStagiaire, idEntretien) {
  const [stagiaire] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateurStagiaire));
  const ownership = await getEntretienOwnership(idEntretien);

  if (
    !stagiaire ||
    !ownership ||
    ownership.idStagiaire !== stagiaire.idStagiaire
  ) {
    const err = new Error("Vous n'êtes pas autorisé à modifier cet entretien");
    err.status = 403;
    throw err;
  }
  if (ownership.statut !== "planifie") {
    const err = new Error(
      "Cet entretien ne peut plus être validé dans son état actuel",
    );
    err.status = 400;
    throw err;
  }

  const [updated] = await db
    .update(entretiens)
    .set({ statut: "confirme" })
    .where(eq(entretiens.idEntretien, idEntretien))
    .returning();

  const destinataires = await getUtilisateursAvecPermission(
    ownership.idOffreEntreprise,
    "entretiens.gerer",
  );
  await Promise.all(
    destinataires.map((idDest) =>
      creerNotification({
        idUtilisateur: idDest,
        type: "entretien_confirme",
        titre: "Entretien confirmé par le candidat",
        message:
          "Le candidat a confirmé la date — l'entretien est désormais confirmé.",
        lien: "/entretiens-entreprise",
      }),
    ),
  );
  publishRealtimeMany(destinataires, {
    type: "entretien.valide",
    payload: {
      idEntretien,
      statut: "confirme",
    },
  });

  return updated;
}

// Le candidat annule un entretien qu'il a déjà validé (statut "valide" =
// "en attente de confirmation" côté entreprise). Une raison est obligatoire
// et sera visible par le candidat lui-même dans l'historique. Une fois
// annulé (statut "annule"), l'entreprise peut re-planifier un nouvel
// entretien pour la même candidature (cf. règle "dejaActif" dans
// creaeEntretien, qui exclut déjà "annule").
export async function annulerEntretien(
  idUtilisateurStagiaire,
  idEntretien,
  { raisonAnnulation },
) {
  const [stagiaire] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateurStagiaire));
  const ownership = await getEntretienOwnership(idEntretien);

  if (
    !stagiaire ||
    !ownership ||
    ownership.idStagiaire !== stagiaire.idStagiaire
  ) {
    const err = new Error("Vous n'êtes pas autorisé à modifier cet entretien");
    err.status = 403;
    throw err;
  }
  if (ownership.statut !== "confirme") {
    const err = new Error("Seul un entretien confirmé peut être annulé");
    err.status = 400;
    throw err;
  }

  const [updated] = await db
    .update(entretiens)
    .set({ statut: "annule", raisonAnnulation })
    .where(eq(entretiens.idEntretien, idEntretien))
    .returning();

  const destinataires = await getUtilisateursAvecPermission(
    ownership.idOffreEntreprise,
    "entretiens.gerer",
  );
  await Promise.all(
    destinataires.map((idDest) =>
      creerNotification({
        idUtilisateur: idDest,
        type: "entretien_annule",
        titre: "Entretien annulé par le candidat",
        message: raisonAnnulation,
        lien: "/entretiens-entreprise",
      }),
    ),
  );
  publishRealtimeMany(destinataires, {
    type: "entretien.annule",
    payload: { idEntretien, statut: "annule" },
  });

  return updated;
}

// Le candidat enregistre ses notes de préparation personnelles (privées,
// visibles de lui seul). Autorisé quel que soit le statut de l'entretien —
// utile de le préparer en avance comme de garder une trace après coup.
export async function enregistrerNotesPreparation(
  idUtilisateurStagiaire,
  idEntretien,
  notesPreparation,
) {
  const [stagiaire] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateurStagiaire));
  const ownership = await getEntretienOwnership(idEntretien);

  if (
    !stagiaire ||
    !ownership ||
    ownership.idStagiaire !== stagiaire.idStagiaire
  ) {
    const err = new Error("Vous n'êtes pas autorisé à modifier cet entretien");
    err.status = 403;
    throw err;
  }

  const [updated] = await db
    .update(entretiens)
    .set({ notesPreparation })
    .where(eq(entretiens.idEntretien, idEntretien))
    .returning();

  return updated;
}

// Étape 3b côté stagiaire : propose une autre date/heure avec un message
export async function demanderReprogrammation(
  idUtilisateurStagiaire,
  idEntretien,
  { dateHeureProposee, retourEntretien },
) {
  const [stagiaire] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateurStagiaire));
  const ownership = await getEntretienOwnership(idEntretien);

  if (
    !stagiaire ||
    !ownership ||
    ownership.idStagiaire !== stagiaire.idStagiaire
  ) {
    const err = new Error("Vous n'êtes pas autorisé à modifier cet entretien");
    err.status = 403;
    throw err;
  }
  if (ownership.statut !== "planifie") {
    const err = new Error(
      "Cet entretien ne peut plus être reprogrammé dans son état actuel",
    );
    err.status = 400;
    throw err;
  }

  const [updated] = await db
    .update(entretiens)
    .set({
      statut: "reprogramme",
      dateHeureProposee: requireDateHeureFuture(dateHeureProposee, "La nouvelle date proposée"),
      retourEntretien,
    })
    .where(eq(entretiens.idEntretien, idEntretien))
    .returning();

  const destinataires = await getUtilisateursAvecPermission(
    ownership.idOffreEntreprise,
    "entretiens.gerer",
  );
  await Promise.all(
    destinataires.map((idDest) =>
      creerNotification({
        idUtilisateur: idDest,
        type: "entretien_reprogrammation_demandee",
        titre: "Demande de reprogrammation",
        message: "Le candidat propose une nouvelle date pour l'entretien.",
        lien: "/entretiens-entreprise",
      }),
    ),
  );
  publishRealtimeMany(destinataires, {
    type: "entretien.reprogrammation_demandee",
    payload: {
      idEntretien,
      statut: "reprogramme",
      dateHeureProposee: updated.dateHeureProposee,
    },
  });

  return updated;
}

// Étape 4b côté entreprise : replanifie après une demande de reprogrammation
// (ou modifie librement date/mode), et clôture (terminé/absent) une fois passé.
export async function updateEntretienByEntreprise(
  idUtilisateurEntreprise,
  idEntretien,
  payload,
) {
  const entreprise = await getEntrepriseForUserOrThrow(idUtilisateurEntreprise);
  const ownership = await getEntretienOwnership(idEntretien);

  if (
    !ownership ||
    ownership.idOffreEntreprise !== entreprise.idEntreprise
  ) {
    const err = new Error("Vous n'êtes pas autorisé à modifier cet entretien");
    err.status = 403;
    throw err;
  }

    const modeResolu = payload.modeEntretien || ownership.modeEntretien;
    // Si le mode ou le lien change, on revalide avec le mode final et le lien final
    // (lien existant si non renvoyé dans le payload).
    const lienResolu =
      payload.lienGoogleMeet !== undefined
        ? payload.lienGoogleMeet
        : ownership.lienGoogleMeet;
    if (
      payload.modeEntretien !== undefined ||
      payload.lienGoogleMeet !== undefined
    ) {
      validerLienVisio(modeResolu, lienResolu);
    }

  const updateValues = {};
  if (payload.dateHeure) {
    updateValues.dateHeure = requireDateHeureFuture(payload.dateHeure, "La date de l'entretien");
    // Toute nouvelle date fixée par l'entreprise relance le cycle : le
    // stagiaire doit à nouveau valider ou reprogrammer cette nouvelle date.
    updateValues.statut = "planifie";
    updateValues.dateHeureProposee = null;
    updateValues.retourEntretien = null;
  }
  if (payload.modeEntretien) updateValues.modeEntretien = payload.modeEntretien;
  if (payload.lienGoogleMeet !== undefined)
    updateValues.lienGoogleMeet = payload.lienGoogleMeet;
  if (payload.statut && !payload.dateHeure)
    updateValues.statut = payload.statut; // clôture (termine/absent), jamais combinée à un changement de date

  const [updated] = await db
    .update(entretiens)
    .set(updateValues)
    .where(eq(entretiens.idEntretien, idEntretien))
    .returning();

  if (payload.dateHeure) {
    const idUtilisateurStagiaire = await getIdUtilisateurStagiaire(
      ownership.idStagiaire,
    );
    if (idUtilisateurStagiaire) {
      await creerNotification({
        idUtilisateur: idUtilisateurStagiaire,
        type: "entretien_replanifie",
        titre: "Nouvelle date d'entretien proposée",
        message: "L'entreprise a fixé une nouvelle date — merci de la valider.",
        lien: "/entretiens",
      });
      publishRealtime(idUtilisateurStagiaire, {
        type: "entretien.reprogramme",
        payload: {
          idEntretien,
          statut: "planifie",
          dateHeure: updated.dateHeure,
        },
      });
    }
  }

  // Clôture / annulation côté entreprise
  if (payload.statut && !payload.dateHeure) {
    const idUtilisateurStagiaire = await getIdUtilisateurStagiaire(
      ownership.idStagiaire,
    );
    if (idUtilisateurStagiaire) {
      publishRealtime(idUtilisateurStagiaire, {
        type: "entretien.maj",
        payload: {
          idEntretien,
          statut: payload.statut,
        },
      });
    }
  }

  return updated;
}

// Compte séparément les entretiens nécessitant une action de l'entreprise :
// - reprogrammation : demande de reprogrammation du candidat à traiter
//   (fait clignoter en orange le compteur du menu "Candidatures")
// - validation : entretien validé par le candidat, en attente de
//   confirmation entreprise (fait apparaître le point clignotant sur le
//   menu "Candidatures")
export async function countEntretiensEnAttenteEntreprise(
  idUtilisateurEntreprise,
) {
  let entreprise;
  try {
    entreprise = await getEntrepriseForUserOrThrow(idUtilisateurEntreprise);
  } catch {
    return { reprogrammation: 0 };
  }

  const rows = await db
    .select({ statut: entretiens.statut })
    .from(entretiens)
    .innerJoin(
      candidatures,
      eq(entretiens.idCandidature, candidatures.idCandidature),
    )
    .innerJoin(offresStage, eq(candidatures.idOffre, offresStage.idOffre))
    .where(eq(offresStage.idEntreprise, entreprise.idEntreprise));

  // "validation" (entretien validé, en attente de confirmation entreprise)
  // n'existe plus : validerEntretien passe désormais directement au statut
  // "confirme", sans étape de confirmation séparée côté entreprise.
  return {
    reprogrammation: rows.filter((r) => r.statut === "reprogramme").length,
  };
}