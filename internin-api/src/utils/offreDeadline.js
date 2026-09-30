/** Règle serveur unique : une échéance est expirée à l’instant exact où now >= deadline. */
export function isOffreDeadlineExpired(deadline, now = new Date()) {
  if (deadline == null || deadline === "") return false;
  const deadlineMs = new Date(deadline).getTime();
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
  // Fail closed si une valeur persistée est corrompue : elle ne doit pas ouvrir
  // l’accès aux candidatures par erreur.
  return !Number.isFinite(deadlineMs) || !Number.isFinite(nowMs) || deadlineMs <= nowMs;
}
