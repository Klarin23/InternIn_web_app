-- Index pour COUNT non lues par destinataire (badge menu Admin / cloche)
CREATE INDEX IF NOT EXISTS idx_notifications_user_lu
  ON notifications (id_utilisateur, lu);
