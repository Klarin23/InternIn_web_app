import {
  getMonStage,
  listMesStages,
  terminerStage,
  getCertificatForStage,
  verifierCertificat,
  listMesCertificats,
  getCertificatFilePath,
  listMonJournal,
  ajouterEntreeJournal,
  updateEntreeJournal,
  supprimerEntreeJournal,
  corrigerDatesStageEntreprise,
} from "./stages.service.js";

export async function monStage(req, res, next) {
  try {
    res.json(await getMonStage(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function mesStages(req, res, next) {
  try {
    res.json(await listMesStages(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function terminer(req, res, next) {
  try {
    const result = await terminerStage(req.user.idUtilisateur, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function certificat(req, res, next) {
  try {
    res.json(
      await getCertificatForStage(req.user.idUtilisateur, req.params.idStage),
    );
  } catch (err) {
    next(err);
  }
}

export async function mesCertificats(req, res, next) {
  try {
    res.json(await listMesCertificats(req.user.idUtilisateur));
  } catch (err) {
    next(err);
  }
}

export async function downloadCertificat(req, res, next) {
  try {
    const { filePath, filename } = await getCertificatFilePath(
      req.user.idUtilisateur,
      req.params.idStage,
    );
    res.download(filePath, filename, (err) => {
      if (err) next(err);
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
}

export async function verifier(req, res, next) {
  try {
    const certificat = await verifierCertificat(req.params.code);
    if (!certificat) {
      return res.status(404).json({ error: "Certificat introuvable" });
    }
    res.json(certificat);
  } catch (err) {
    next(err);
  }
}

export async function getJournal(req, res, next) {
  try {
    res.json(await listMonJournal(req.user.idUtilisateur, req.params.idStage));
  } catch (err) {
    next(err);
  }
}

export async function postJournal(req, res, next) {
  try {
    const entree = await ajouterEntreeJournal(
      req.user.idUtilisateur,
      req.params.idStage,
      req.body,
    );
    res.status(201).json({ entree });
  } catch (err) {
    next(err);
  }
}

export async function patchJournal(req, res, next) {
  try {
    const entree = await updateEntreeJournal(
      req.user.idUtilisateur,
      req.params.idStage,
      req.params.idEntree,
      req.body,
    );
    res.json({ entree });
  } catch (err) {
    next(err);
  }
}

export async function deleteJournal(req, res, next) {
  try {
    res.json(
      await supprimerEntreeJournal(
        req.user.idUtilisateur,
        req.params.idStage,
        req.params.idEntree,
      ),
    );
  } catch (err) {
    next(err);
  }
}

export async function corrigerDates(req, res, next) {
  try {
    const result = await corrigerDatesStageEntreprise(
      req.user.idUtilisateur,
      req.params.idStage,
      req.body.dateDebut,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}
