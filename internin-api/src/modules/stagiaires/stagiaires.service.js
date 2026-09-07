// Toute la création du profil se fait dans UNE SEULE transaction :
// si une étape échoue (ex. contrainte violée), tout est annulé — on ne
// veut jamais un profil stagiaire à moitié créé en base.

import { eq, getTableColumns, and, ilike, sql } from "drizzle-orm";
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

  // Prend tous les verrous de noms dans un ordre déterministe pour
  // éviter les deadlocks lorsque deux requêtes créent plusieurs
  // compétences personnalisées dans des ordres différents.
  const nomsPersonnalises = [
    ...new Set(
      liste
        .filter(
          (c) =>
            c?.isCustom ||
            (typeof c?.idCompetence === "string" &&
              c.idCompetence.startsWith("custom:")) ||
            (!c?.idCompetence && c?.nom),
        )
        .map((c) => (c?.nom || "").trim().toLowerCase())
        .filter(Boolean),
    ),
  ].sort();

  for (const nomNormalise of nomsPersonnalises) {
    await tx.execute(sql`
      SELECT pg_advisory_xact_lock(
        hashtextextended(${nomNormalise}, 0)
      )
    `);
  }

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
      .where(sql`lower(trim(${competences.nom})) = lower(trim(${nom}))`)
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
  // Doit rester aligné avec internin-web/lib/utils/profilCompletion.js
  const criteres = [
    Boolean(profil.photoProfilUrl),
    Boolean(
      typeof profil.titreProfessionnel === "string"
        ? profil.titreProfessionnel.trim()
        : profil.titreProfessionnel,
    ),
    Boolean(
      typeof profil.presentation === "string"
        ? profil.presentation.trim()
        : profil.presentation,
    ),
    Array.isArray(profil.formations) && profil.formations.length > 0,
    Array.isArray(profil.competences) && profil.competences.length > 0,
    Boolean(profil.cvUrl),
    Array.isArray(profil.centresInteret) && profil.centresInteret.length > 0,
    (Array.isArray(profil.secteursRecherches) &&
      profil.secteursRecherches.length > 0) ||
      (Array.isArray(profil.villesRecherchees) &&
        profil.villesRecherchees.length > 0),
  ];

  const nombreComplets = criteres.filter(Boolean).length;
  return Math.round((nombreComplets / criteres.length) * 100);
}

async function synchroniserStatutCompteStagiaire(tx, idUtilisateur, profilHint = null) {
  // Toujours recalculer à partir des données RÉELLES en base (pas du payload partiel).
  // C'est la cause principale du statut qui restait "inactif" alors que le
  // frontend affichait 100 % : le calcul utilisait un objet incomplet.
  const [stagiaire] = await tx
    .select()
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateur));

  if (!stagiaire) {
    return { score: 0, statutCompte: "inactif" };
  }

  const idStagiaire = stagiaire.idStagiaire;

  const [formationsData, competencesData, centresData] = await Promise.all([
    tx.select().from(formations).where(eq(formations.idStagiaire, idStagiaire)),
    tx
      .select()
      .from(stagiaireCompetences)
      .where(eq(stagiaireCompetences.idStagiaire, idStagiaire)),
    tx
      .select()
      .from(stagiaireCentresInteret)
      .where(eq(stagiaireCentresInteret.idStagiaire, idStagiaire)),
  ]);

  const profilComplet = {
    ...stagiaire,
    // si un hint vient d'être écrit dans la même transaction, on le privilégie
    ...(profilHint || {}),
    formations:
      (profilHint && Array.isArray(profilHint.formations) && profilHint.formations.length > 0
        ? profilHint.formations
        : formationsData) || [],
    competences:
      (profilHint && Array.isArray(profilHint.competences) && profilHint.competences.length > 0
        ? profilHint.competences
        : competencesData) || [],
    centresInteret:
      (profilHint && Array.isArray(profilHint.centresInteret) && profilHint.centresInteret.length > 0
        ? profilHint.centresInteret
        : centresData) || [],
    secteursRecherches: stagiaire.secteursRecherches || [],
    villesRecherchees: stagiaire.villesRecherchees || [],
    photoProfilUrl: stagiaire.photoProfilUrl,
    titreProfessionnel: stagiaire.titreProfessionnel,
    presentation: stagiaire.presentation,
    cvUrl: stagiaire.cvUrl,
  };

  const score = calculerScoreCompletude(profilComplet);
  const nouveauStatut = score >= 100 ? "actif" : "inactif";

  await tx
    .update(stagiaires)
    .set({
      scoreCompletudeProfil: score,
    })
    .where(eq(stagiaires.idStagiaire, idStagiaire));

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
          ...payload,
          formations: payload.formations || [],
          competences: payload.competences || [],
          centresInteret: payload.centresInteret || [],
          joursDisponibles: payload.joursDisponibles || [],
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

  const profilPourScore = {
    ...stagiaire,
    competences: competencesData,
    centresInteret: centresData,
    formations: formationsData,
    secteursRecherches: stagiaire.secteursRecherches || [],
    villesRecherchees: stagiaire.villesRecherchees || [],
  };

  const scoreCalcule = calculerScoreCompletude(profilPourScore);

  // Auto-réparation : si le profil est complet mais le statut en base est
  // encore "inactif" (bug ancien calcul), on synchronise immédiatement.
  let statutCompte = stagiaire.statutCompte;
  if (scoreCalcule >= 100 && statutCompte !== "actif" && statutCompte !== "suspendu") {
    await db
      .update(stagiaires)
      .set({ scoreCompletudeProfil: scoreCalcule })
      .where(eq(stagiaires.idStagiaire, idStagiaire));
    await db
      .update(utilisateurs)
      .set({ statutCompte: "actif", dateMaj: new Date() })
      .where(eq(utilisateurs.idUtilisateur, idUtilisateur));
    statutCompte = "actif";
  } else if (stagiaire.scoreCompletudeProfil !== scoreCalcule) {
    // garder le score affiché cohérent
    await db
      .update(stagiaires)
      .set({ scoreCompletudeProfil: scoreCalcule })
      .where(eq(stagiaires.idStagiaire, idStagiaire));
  }

  return {
    ...stagiaire,
    scoreCompletudeProfil: scoreCalcule,
    statutCompte,
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
    // formations est une table séparée : ne pas la passer à .set()
    const {
      competences: nouvellesCompetences,
      centresInteret: nouveauxCentresInteret,
      formations: nouvellesFormations,
      joursDisponibles,
      heureDebutDisponible,
      heureFinDisponible,
      // Confidentialité : uniquement via PATCH /stagiaires/me/privacy
      profilVisibleEntreprises: _ignorePrivacy,
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

    // Formations : remplacement complet si fourni
    if (nouvellesFormations) {
      await tx
        .delete(formations)
        .where(eq(formations.idStagiaire, idStagiaire));
      if (nouvellesFormations.length > 0) {
        await tx.insert(formations).values(
          nouvellesFormations.map((f) => ({
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

    // Recalcul du score / statut à partir des données réellement en base
    const [profilFinal] = await tx
      .select()
      .from(stagiaires)
      .where(eq(stagiaires.idStagiaire, idStagiaire));

    const { score, statutCompte } = await synchroniserStatutCompteStagiaire(
      tx,
      idUtilisateur,
      null, // force lecture DB (évite le payload partiel)
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

    const { score, statutCompte } = await synchroniserStatutCompteStagiaire(
      tx,
      idUtilisateur,
      null,
    );

    return {
      ...stagiaire,
      scoreCompletudeProfil: score,
      statutCompte,
    };
  });
}

/**
 * Met à jour uniquement la visibilité professionnelle du stagiaire connecté.
 * L'identité est dérivée de idUtilisateur (JWT) — jamais d'un id fourni par le client.
 */
export async function updateStagiairePrivacy(idUtilisateur, { profilVisibleEntreprises }) {
  const [stagiaire] = await db
    .select({ idStagiaire: stagiaires.idStagiaire })
    .from(stagiaires)
    .where(eq(stagiaires.idUtilisateur, idUtilisateur))
    .limit(1);

  if (!stagiaire) {
    const err = new Error("Profil stagiaire introuvable");
    err.status = 404;
    throw err;
  }

  const [maj] = await db
    .update(stagiaires)
    .set({ profilVisibleEntreprises: Boolean(profilVisibleEntreprises) })
    .where(eq(stagiaires.idStagiaire, stagiaire.idStagiaire))
    .returning({
      profilVisibleEntreprises: stagiaires.profilVisibleEntreprises,
      idStagiaire: stagiaires.idStagiaire,
    });

  return {
    profilVisibleEntreprises: maj.profilVisibleEntreprises,
  };
}
