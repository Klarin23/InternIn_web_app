-- Empêche les invitations / membres actifs en double pour une même entreprise + email.
-- Les membres désactivés ne sont pas concernés (ré-invitation possible).
-- À exécuter manuellement ou via votre outil de migration.

CREATE UNIQUE INDEX IF NOT EXISTS uq_membres_equipe_entreprise_email_actifs
ON membres_equipe (id_entreprise, lower(email))
WHERE statut_membre IN ('invite', 'actif');
