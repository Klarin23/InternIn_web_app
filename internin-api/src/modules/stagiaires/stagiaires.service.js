// Toute la création du profil se fait dans UNE SEULE transaction :
// si une étape échoue (ex. contrainte violée), tout est annulé — on ne
// veut jamais un profil stagiaire à moitié créé en base.

import { eq, getTableColumns, and, ilike } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  utilisateurs,
  stagiaires,
  formations,
  stagiaireCompetences,
  stagiaireCentresInteret,
  stagiaireObjectifsDeveloppement,
  disponibilitesStagiaire,
} from "../../db/schema.js";
import {
  competences,
  centresInteret,
  objectifsDeveloppement,
} from "../../db/schema.js";

/** Résout la liste compétences : id existant OU création par nom (custom). */
async function resoudreCompetences(tx, liste = []) {
  const resultat = [];

  for (const c of liste) {
    const niveau = c.niveau || "intermediaire";
    const estCustom =
      c.isCustom ||
      (typeof c.idCompetence === "string" &&
        c.idCompetence.startsWith("custom:")) ||
      (!c.idCompetence && c.nom);

    if (!estCustom && c.idCompetence) {
      resultat.push({ idCompetence: c.idCompetence, niveau });
      continue;
    }

    const nom = (c.nom || "").trim();
    if (!nom) continue;

    const [existante] = await tx
      .select()
      .from(competences)
      .where(ilike(competences.nom, nom))
      .limit(1);

    if (existante) {
      resultat.push({ idCompetence: existante.idCompetence, niveau });
    } else {
      const [creee] = await tx
        .insert(competences)
        .values({
          nom,
          typeCompetence: c.typeCompetence || "technique",
        })
        .returning();
      resultat.push({ idCompetence: creee.idCompetence, niveau });
    }
  }

  // déduplique par idCompetence
  const vus = new Set();
  return resultat.filter((r) => {
    if (vus.has(r.idCompetence)) return false;
    vus.add(r.idCompetence);
    return true;
  });
}

// Calcule un score de complétude simple : base pour les champs obligatoires
// + bonus pour chaque lien professionnel facultatif renseigné.
// Calcule un score de complétude : seuls les champs vraiment nécessaires
// à l'activation du compte sont pris en compte.
// Les liens professionnels (LinkedIn, GitHub, etc.) sont facultatifs
// et n'influencent PAS le statut actif / inactif.
function calculerScoreCompletude(profil) {
  const criteres = [
    Boolean(profil.photoProfilUrl),
    Boolean(profil.titreProfessionnel?.trim()),
    Boolean(profil.presentation?.trim()),
    Array.isArray(profil.formations) && profil.formations.length > 0,
    Array.isArray(profil.competences) && profil.competences.length > 0,
    Boolean(profil.cvUrl),
    Array.isArray(profil.centresInteret) && profil.centresInteret.length > 0,
    Boolean(
      (Array.isArray(profil.secteursRecherches) &&
        profil.secteursRecherches.length > 0) ||
        (Array.isArray(profil.villesRecherchees) &&
          profil.villesRecherchees.length > 0),
    ),
  ];

  const nombreComplets = criteres.filter(Boolean).length;

  return Math.round((nombreComplets / criteres.length) * 100);
}

async function synchroniserStatutCompteStagiaire(tx, idUtilisateur, profil) {
  const score = calculerScoreCompletude(profil);

  const nouveauStatut = score >= 100 ? "actif" : "inactif";

  await tx
    .update(stagiaires)
    .set({
      scoreCompletudeProfil: score,
    })
    .where(eq(stagiaires.idStagiaire, profil.idStagiaire));

  await tx
    .update(utilisateurs)
    .set({
      statutCompte: nouveauStatut,
      dateMaj: new Date(),
    })
    .where(eq(utilisateurs.idUtilisateur, idUtilisateur));

  return {
    score,
    statutCompte: nouveauStatut,
  };
}

export async function completeStagiaireOnboarding(idUtilisateur, payload) {
  return db.transaction(async (tx) => {
    // Vérifie si un profil stagiaire existe déjà pour cet utilisateur
    const [existant] = await tx
      .select()
      .from(stagiaires)
      .where(eq(stagiaires.idUtilisateur, idUtilisateur));

    let stagiaire;
    let idStagiaire;

    const valeursCommunes = {
      prenom: payload.prenom,
      nom: payload.nom,
      telephone: payload.telephone,
      pays: payload.pays,
      ville: payload.ville,
      dateNaissance: payload.dateNaissance || null,
      statutAcademique: payload.statutAcademique,
      cvUrl: payload.cvUrl,
      linkedinUrl: payload.linkedinUrl || null,
      githubUrl: payload.githubUrl || null,
      behanceUrl: payload.behanceUrl || null,
      portfolioUrl: payload.portfolioUrl || null,
      siteWebUrl: payload.siteWebUrl || null,
      dureeStageSouhaitee: payload.dureeStageSouhaitee,
      heuresHebdoSouhaitees: payload.heuresHebdoSouhaitees,
      dateDebutSouhaitee: payload.dateDebutSouhaitee,
      idUniversite:
        payload.idUniversite && payload.idUniversite !== "non-rattache"
          ? payload.idUniversite
          : null,
    };

    if (existant) {
      // === MISE À JOUR (reprise d'onboarding) ===
      [stagiaire] = await tx
        .update(stagiaires)
        .set(valeursCommunes)
        .where(eq(stagiaires.idUtilisateur, idUtilisateur))
        .returning();

      idStagiaire = stagiaire.idStagiaire;

      // On remplace entièrement les relations
      await tx
        .delete(formations)
        .where(eq(formations.idStagiaire, idStagiaire));
      await tx
        .delete(stagiaireCompetences)
        .where(eq(stagiaireCompetences.idStagiaire, idStagiaire));
      await tx
        .delete(stagiaireCentresInteret)
        .where(eq(stagiaireCentresInteret.idStagiaire, idStagiaire));
      await tx
        .delete(stagiaireObjectifsDeveloppement)
        .where(eq(stagiaireObjectifsDeveloppement.idStagiaire, idStagiaire));
      await tx
        .delete(disponibilitesStagiaire)
        .where(eq(disponibilitesStagiaire.idStagiaire, idStagiaire));
    } else {
      // === CRÉATION (premier passage) ===
      [stagiaire] = await tx
        .insert(stagiaires)
        .values({
          idUtilisateur,
          ...valeursCommunes,
          scoreCompletudeProfil: calculerScoreCompletude(payload),
          statutStage: "disponible",
        })
        .returning();

      idStagiaire = stagiaire.idStagiaire;
    }

    // Formations
    if (payload.formations?.length > 0) {
      await tx.insert(formations).values(
        payload.formations.map((f) => ({
          idStagiaire,
          typeFormation: f.typeFormation,
          nomUniversite: f.nomUniversite,
          faculte: f.faculte || null,
          departement: f.departement || null,
          diplome: f.diplome,
          anneeEtude: f.anneeEtude ? Number(f.anneeEtude) : null,
          anneeObtention: f.anneeObtention ? Number(f.anneeObtention) : null,
        })),
      );
    }

    // Compétences
    if (payload.competences?.length > 0) {
      const resolues = await resoudreCompetences(tx, payload.competences);
      if (resolues.length > 0) {
        await tx.insert(stagiaireCompetences).values(
          resolues.map((c) => ({
            idStagiaire,
            idCompetence: c.idCompetence,
            niveau: c.niveau,
          })),
        );
      }
    }

    // Centres d'intérêt
    if (payload.centresInteret?.length > 0) {
      await tx.insert(stagiaireCentresInteret).values(
        payload.centresInteret.map((idCentreInteret) => ({
          idStagiaire,
          idCentreInteret,
        })),
      );
    }

    // Objectifs de développement
    if (payload.objectifsDeveloppement?.length > 0) {
      await tx.insert(stagiaireObjectifsDeveloppement).values(
        payload.objectifsDeveloppement.map((idObjectif) => ({
          idStagiaire,
          idObjectif,
        })),
      );
    }

    // Disponibilités
    if (payload.joursDisponibles?.length > 0) {
      await tx.insert(disponibilitesStagiaire).values(
        payload.joursDisponibles.map((jourSemaine) => ({
          idStagiaire,
          jourSemaine,
          heureDebut: payload.heureDebutDisponible || null,
          heureFin: payload.heureFinDisponible || null,
        })),
      );
    }

    // Recalcul du score et du statut du compte
    const profilPourCalcul = {
      ...stagiaire,
      formations: payload.formations || [],
      competences: payload.competences || [],
      centresInteret: payload.centresInteret || [],
      objectifsDeveloppement: payload.objectifsDeveloppement || [],
      secteursRecherches: payload.secteursRecherches || [],
      villesRecherchees: payload.villesRecherchees || [],
    };

    const { score, statutCompte } = await synchroniserStatutCompteStagiaire(
      tx,
      idUtilisateur,
      profilPourCalcul,
    );

    return {
      ...stagiaire,
      scoreCompletudeProfil: score,
      statutCompte,
    };
  });
}


// Récupère le profil complet du stagiaire connecté, avec ses relations
// (compétences, centres d'intérêt, objectifs, disponibilités) en une
// seule requête groupée côté application plutôt que plusieurs allers-retours.


export async function getStagiaireProfile(idUtilisateur) {
    const [stagiaire] = await db
       .select({
         ...getTableColumns(stagiaires),
         email: utilisateurs.email,
         emailVerifie: utilisateurs.emailVerifie,
         statutCompte: utilisateurs.statutCompte,
       })
       .from(stagiaires)
       .innerJoin(
         utilisateurs,
         eq(stagiaires.idUtilisateur, utilisateurs.idUtilisateur),
       )
       .where(eq(stagiaires.idUtilisateur, idUtilisateur));

  if (!stagiaire) {
    const err = new Error("Profil stagiaire introuvable");
    err.status = 404;
    throw err;
  }

  const idStagiaire = stagiaire.idStagiaire;

  const [
    competencesData,
    centresData,
    objectifsData,
    disponibilitesData,
    formationsData,
  ] = await Promise.all([
    db
      .select({
        idCompetence: competences.idCompetence,
        nom: competences.nom,
        niveau: stagiaireCompetences.niveau,
      })
      .from(stagiaireCompetences)
      .innerJoin(
        competences,
        eq(stagiaireCompetences.idCompetence, competences.idCompetence),
      )
      .where(eq(stagiaireCompetences.idStagiaire, idStagiaire)),
    db
      .select({
        idCentreInteret: centresInteret.idCentreInteret,
        nom: centresInteret.nom,
      })
      .from(stagiaireCentresInteret)
      .innerJoin(
        centresInteret,
        eq(
          stagiaireCentresInteret.idCentreInteret,
          centresInteret.idCentreInteret,
        ),
      )
      .where(eq(stagiaireCentresInteret.idStagiaire, idStagiaire)),
    db
      .select({ nom: objectifsDeveloppement.nom })
      .from(stagiaireObjectifsDeveloppement)
      .innerJoin(
        objectifsDeveloppement,
        eq(
          stagiaireObjectifsDeveloppement.idObjectif,
          objectifsDeveloppement.idObjectif,
        ),
      )
      .where(eq(stagiaireObjectifsDeveloppement.idStagiaire, idStagiaire)),
    db
      .select({
        jourSemaine: disponibilitesStagiaire.jourSemaine,
        heureDebut: disponibilitesStagiaire.heureDebut,
        heureFin: disponibilitesStagiaire.heureFin,
      })
      .from(disponibilitesStagiaire)
      .where(eq(disponibilitesStagiaire.idStagiaire, idStagiaire)),
    db.select().from(formations).where(eq(formations.idStagiaire, idStagiaire)),
  ]);

  return {
    ...stagiaire,
    competences: competencesData,
    centresInteret: centresData,
    objectifsDeveloppement: objectifsData.map((o) => o.nom),
    joursDisponibles: disponibilitesData.map((d) => d.jourSemaine),
    heureDebutDisponible: disponibilitesData[0]?.heureDebut || null,
    heureFinDisponible: disponibilitesData[0]?.heureFin || null,
    formations: formationsData,
  };
}

// Met à jour le profil du stagiaire connecté. Ne touche qu'aux champs
// présents dans le payload (mise à jour partielle, section par section
// depuis la page "Mon profil"). Compétences / centres d'intérêt / dispos
// sont des relations : quand elles sont fournies, on remplace entièrement
// la liste existante (delete + insert) dans la même transaction.
export async function updateStagiaireProfile(idUtilisateur, payload) {
  return db.transaction(async (tx) => {
    const [stagiaireExistant] = await tx
      .select()
      .from(stagiaires)
      .where(eq(stagiaires.idUtilisateur, idUtilisateur));

    if (!stagiaireExistant) {
      const err = new Error("Profil stagiaire introuvable");
      err.status = 404;
      throw err;
    }

    const idStagiaire = stagiaireExistant.idStagiaire;

    // Champs simples de la table stagiaires (on isole les champs relationnels)
    const {
      competences: nouvellesCompetences,
      centresInteret: nouveauxCentresInteret,
      joursDisponibles,
      heureDebutDisponible,
      heureFinDisponible,
      ...champsDirects
    } = payload;

    let stagiaireMaj = stagiaireExistant;
    if (Object.keys(champsDirects).length > 0) {
      const [maj] = await tx
        .update(stagiaires)
        .set(champsDirects)
        .where(eq(stagiaires.idStagiaire, idStagiaire))
        .returning();
      stagiaireMaj = maj;
    }

        if (nouvellesCompetences) {
          await tx
            .delete(stagiaireCompetences)
            .where(eq(stagiaireCompetences.idStagiaire, idStagiaire));

          if (nouvellesCompetences.length > 0) {
            const resolues = await resoudreCompetences(
              tx,
              nouvellesCompetences,
            );
            if (resolues.length > 0) {
              await tx.insert(stagiaireCompetences).values(
                resolues.map((c) => ({
                  idStagiaire,
                  idCompetence: c.idCompetence,
                  niveau: c.niveau || null,
                })),
              );
            }
          }
          // si nouvellesCompetences === [] → delete déjà fait = aucune compétence
        }

    if (nouveauxCentresInteret) {
      await tx
        .delete(stagiaireCentresInteret)
        .where(eq(stagiaireCentresInteret.idStagiaire, idStagiaire));
      if (nouveauxCentresInteret.length > 0) {
        await tx.insert(stagiaireCentresInteret).values(
          nouveauxCentresInteret.map((idCentreInteret) => ({
            idStagiaire,
            idCentreInteret,
          })),
        );
      }
    }

    if (joursDisponibles) {
      await tx
        .delete(disponibilitesStagiaire)
        .where(eq(disponibilitesStagiaire.idStagiaire, idStagiaire));
      if (joursDisponibles.length > 0) {
        await tx.insert(disponibilitesStagiaire).values(
          joursDisponibles.map((jourSemaine) => ({
            idStagiaire,
            jourSemaine,
            heureDebut: heureDebutDisponible || null,
            heureFin: heureFinDisponible || null,
          })),
        );
      }
    }

    // Recharger le profil complet après toutes les modifications.
    // Le statut du compte dépend maintenant réellement de son niveau
    // de complétude.

    const [profilFinal] = await tx
      .select()
      .from(stagiaires)
      .where(eq(stagiaires.idStagiaire, idStagiaire));

    const [formationsFinales] = await Promise.all([
      tx
        .select()
        .from(formations)
        .where(eq(formations.idStagiaire, idStagiaire)),
    ]);

    const competencesFinales = await tx
      .select()
      .from(stagiaireCompetences)
      .where(eq(stagiaireCompetences.idStagiaire, idStagiaire));

    const centresInteretFinales = await tx
      .select()
      .from(stagiaireCentresInteret)
      .where(eq(stagiaireCentresInteret.idStagiaire, idStagiaire));

    const profilPourCalcul = {
      ...profilFinal,

      formations: formationsFinales,

      competences: competencesFinales,

      centresInteret: centresInteretFinales,

      secteursRecherches: profilFinal.secteursRecherches || [],

      villesRecherchees: profilFinal.villesRecherchees || [],
    };

    const { score, statutCompte } = await synchroniserStatutCompteStagiaire(
      tx,
      idUtilisateur,
      profilPourCalcul,
    );

    return {
      ...profilFinal,
      scoreCompletudeProfil: score,
      statutCompte,
    };
  });
}

// Met à jour uniquement la photo de profil (upload séparé, hors formulaire).
export async function updateStagiairePhoto(idUtilisateur, photoProfilUrl) {
  return db.transaction(async (tx) => {
    const [stagiaire] = await tx
      .update(stagiaires)
      .set({ photoProfilUrl })
      .where(eq(stagiaires.idUtilisateur, idUtilisateur))
      .returning();

    if (!stagiaire) {
      const err = new Error("Profil stagiaire introuvable");
      err.status = 404;
      throw err;
    }

    const formationsFinales = await tx
      .select()
      .from(formations)
      .where(eq(formations.idStagiaire, stagiaire.idStagiaire));

    const competencesFinales = await tx
      .select()
      .from(stagiaireCompetences)
      .where(eq(stagiaireCompetences.idStagiaire, stagiaire.idStagiaire));

    const centresInteretFinales = await tx
      .select()
      .from(stagiaireCentresInteret)
      .where(eq(stagiaireCentresInteret.idStagiaire, stagiaire.idStagiaire));

    const profilPourCalcul = {
      ...stagiaire,

      formations: formationsFinales,

      competences: competencesFinales,

      centresInteret: centresInteretFinales,

      secteursRecherches: stagiaire.secteursRecherches || [],

      villesRecherchees: stagiaire.villesRecherchees || [],
    };

    const { score, statutCompte } = await synchroniserStatutCompteStagiaire(
      tx,
      idUtilisateur,
      profilPourCalcul,
    );

    return {
      ...stagiaire,
      scoreCompletudeProfil: score,
      statutCompte,
    };
  });
}
