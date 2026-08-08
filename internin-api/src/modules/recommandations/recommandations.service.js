import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  recommandations,
  stages,
  entreprises,
  contactsEntreprise,
  stagiaires,
} from "../../db/schema.js";
import { creerNotification } from "../notifications/notifications.service.js";

export async function createRecommandation(
  idUtilisateurEntreprise,
  idStage,
  contenu,
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

  const [stage] = await db
    .select()
    .from(stages)
    .where(eq(stages.idStage, idStage));
  if (!stage || stage.idEntreprise !== entreprise.idEntreprise) {
    const err = new Error(
      "Vous n'êtes pas autorisé à rédiger une recommandation pour ce stage",
    );
    err.status = 403;
    throw err;
  }
  if (stage.statut !== "termine") {
    const err = new Error(
      "Le stage doit être terminé avant de rédiger une recommandation",
    );
    err.status = 400;
    throw err;
  }

  const [contact] = await db
    .select()
    .from(contactsEntreprise)
    .where(eq(contactsEntreprise.idEntreprise, entreprise.idEntreprise));

  const [recommandation] = await db
    .insert(recommandations)
    .values({
      idStage,
      idContactAuteur: contact?.idContact || null,
      contenu,
      visibleLinkedin: false,
    })
    .returning();

  const [stagiaire] = await db
    .select({ idUtilisateur: stagiaires.idUtilisateur })
    .from(stagiaires)
    .where(eq(stagiaires.idStagiaire, stage.idStagiaire));

  if (stagiaire) {
    await creerNotification({
      idUtilisateur: stagiaire.idUtilisateur,
      type: "recommandation_recue",
      titre: "Nouvelle recommandation reçue",
      message: `${entreprise.nomEntreprise} vous a rédigé une recommandation suite à votre stage.`,
      lien: "/stage",
    });
  }

  return recommandation;
}

export async function getRecommandationForStage(idUtilisateur, idStage) {
  const [stage] = await db
    .select({ idStagiaire: stages.idStagiaire, idEntreprise: stages.idEntreprise })
    .from(stages)
    .where(eq(stages.idStage, idStage));
  if (!stage) return null;

  const [stagiaire] = await db
    .select({ idUtilisateur: stagiaires.idUtilisateur })
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
    const err = new Error(
      "Vous n'ête pas autorisé à consulter cette recommandation",
    );
    err.status = 403;
    throw err;
  }



  const [recommandation] = await db
    .select()
    .from(recommandations)
    .where(eq(recommandations.idStage, idStage));
  return recommandation || null;
}

export async function toggleVisibilite(
  idUtilisateurStagiaire,
  idStage,
  visibleLinkedin,
) {
  const [stagiaire] = await db
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateurStagiaire));
  const [stage] = await db
    .select()
    .from(stages)
    .where(eq(stages.idStage, idStage));

  if (!stagiaire || !stage || stage.idStagiaire !== stagiaire.idStagiaire) {
    const err = new Error(
      "Vous n'êtes pas autorisé à modifier cette recommandation",
    );
    err.status = 403;
    throw err;
  }

  const [updated] = await db
    .update(recommandations)
    .set({ visibleLinkedin })
    .where(eq(recommandations.idStage, idStage))
    .returning();

  return updated;
}
