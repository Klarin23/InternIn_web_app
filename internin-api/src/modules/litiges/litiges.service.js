import { eq, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  litigesReclamations,
  utilisateurs,
  administrateurs,
  stages,
  stagiaires,
  entreprises,
} from "../../db/schema.js";
import {
  creerNotification,
  notifierAdmins,
} from "../notifications/notifications.service.js";

async function verifierAccesStage(idUtilisateur, idStage) {
  const [stage] = await db
    .select({
      idStagiaire: stages.idStagiaire,
      idEntreprise: stages.idEntreprise,
    })
    .from(stages)
    .where(eq(stages.idStage, idStage));

  if (!stage) {
    const err = new Error("Stage introuvable");
    err.status = 404;
    throw err;
  }

  const [stagiaire] = await db
    .select({
      idUtilisateur: stagiaires.idUtilisateur,
    })
    .from(stagiaires)
    .where(eq(stagiaires.idStagiaire, stage.idStagiaire));

  const [entreprise] = await db
    .select({ idUtilisateur: entreprises.idUtilisateur })
    .from(entreprises)
    .where(eq(entreprises.idEntreprise, stage.idEntreprise));

  const estAutorise =
    (stagiaire && stagiaire.idUtilisateur === idUtilisateur) ||
    (entreprise && entreprise.idUtilisateur === idUtilisateur);

  if (!estAutorise) {
    const err = new Error("Vous n'êtes pas autorisé à signaler ce stage");
    err.status = 403;
    throw err;
  }
}

export async function createLitige(idUtilisateur, payload) {
  await verifierAccesStage(idUtilisateur, payload.idStage);

  const [litige] = await db
    .insert(litigesReclamations)
    .values({
      idStage: payload.idStage,
      idUtilisateurPlaignant: idUtilisateur,
      typeLitige: payload.typeLitige,
      description: payload.description,
      statut: "ouvert",
    })
    .returning();

  await notifierAdmins({
    type: "signalement_cree",
    titre: "Nouveau signalement à traiter",
    message: `Un signalement (${payload.typeLitige}) vient d'être déposé sur un stage.`,
    lien: "/signalements",
  });

  return litige;
}

// Réservé à l'espace Administrateur — file de traitement des signalements.
// Enrichi avec l'email du plaignant et, si un administrateur a pris le
// signalement en charge, son nom.
export async function listLitiges(statut) {
  return db
    .select({
      idLitige: litigesReclamations.idLitige,
      idStage: litigesReclamations.idStage,
      typeLitige: litigesReclamations.typeLitige,
      description: litigesReclamations.description,
      statut: litigesReclamations.statut,
      dateCreation: litigesReclamations.dateCreation,
      dateResolution: litigesReclamations.dateResolution,
      emailPlaignant: utilisateurs.email,
      adminAssigne: administrateurs.nom,
    })
    .from(litigesReclamations)
    .innerJoin(
      utilisateurs,
      eq(
        litigesReclamations.idUtilisateurPlaignant,
        utilisateurs.idUtilisateur,
      ),
    )
    .leftJoin(
      administrateurs,
      eq(litigesReclamations.idAdminAssigne, administrateurs.idAdmin),
    )
    .where(statut ? eq(litigesReclamations.statut, statut) : undefined)
    .orderBy(desc(litigesReclamations.dateCreation));
}

// Change le statut d'un signalement (ouvert → en_cours → résolu/rejeté).
// Assigne aussi l'administrateur courant dès qu'il prend l'affaire en main
// (idAdminAssigne), et horodate la résolution quand le statut devient final.
export async function changerStatutLitige(
  idUtilisateurAdmin,
  idLitige,
  statut,
) {
  const [admin] = await db
    .select()
    .from(administrateurs)
    .where(eq(administrateurs.idUtilisateur, idUtilisateurAdmin));

  const estFinal = statut === "resolu" || statut === "rejete";

  const [litige] = await db
    .update(litigesReclamations)
    .set({
      statut,
      idAdminAssigne: admin?.idAdmin,
      dateResolution: estFinal ? new Date() : null,
    })
    .where(eq(litigesReclamations.idLitige, idLitige))
    .returning();

  if (!litige) {
    const err = new Error("Signalement introuvable");
    err.status = 404;
    throw err;
  }

  const MESSAGES_STATUT = {
    en_cours: {
      titre: "Signalement en cours de traitement",
      message:
        "Votre signalement est désormais pris en charge par un administrateur.",
    },
    resolu: {
      titre: "Signalement résolu",
      message: "Votre signalement a été traité et marqué comme résolu.",
    },
    rejete: {
      titre: "Signalement rejeté",
      message:
        "Votre signalement a été examiné et rejeté par l'administration.",
    },
  };

  const infoNotif = MESSAGES_STATUT[statut];
  if (infoNotif) {
    const [plaignant] = await db
      .select({ typeUtilisateur: utilisateurs.typeUtilisateur })
      .from(utilisateurs)
      .where(eq(utilisateurs.idUtilisateur, litige.idUtilisateurPlaignant));

    await creerNotification({
      idUtilisateur: litige.idUtilisateurPlaignant,
      type: `signalement_${statut}`,
      titre: infoNotif.titre,
      message: infoNotif.message,
      lien:
        plaignant?.typeUtilisateur === "entreprise"
          ? "/suivi-stagiaires"
          : "/stage",
    });
  }

  return litige;
}
