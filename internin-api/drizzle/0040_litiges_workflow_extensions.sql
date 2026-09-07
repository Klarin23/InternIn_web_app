-- Extensions Safety & Reporting workflow (notes, messages, escalade, pièces)
-- Compatible avec statut_litige existant (ouvert|en_cours|resolu|rejete)

ALTER TABLE litiges_reclamations
  ADD COLUMN IF NOT EXISTS escalade boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS motif_escalade text,
  ADD COLUMN IF NOT EXISTS date_escalade timestamp,
  ADD COLUMN IF NOT EXISTS motif_decision text,
  ADD COLUMN IF NOT EXISTS attend_info boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS litiges_notes_internes (
  id_note uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_litige uuid NOT NULL REFERENCES litiges_reclamations(id_litige) ON DELETE CASCADE,
  id_admin uuid NOT NULL REFERENCES administrateurs(id_admin),
  contenu text NOT NULL,
  date_creation timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_litiges_notes_litige ON litiges_notes_internes(id_litige);

CREATE TABLE IF NOT EXISTS litiges_messages (
  id_message uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_litige uuid NOT NULL REFERENCES litiges_reclamations(id_litige) ON DELETE CASCADE,
  id_auteur uuid NOT NULL REFERENCES utilisateurs(id_utilisateur),
  role_auteur varchar(30) NOT NULL, -- admin | stagiaire
  contenu text NOT NULL,
  date_creation timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_litiges_messages_litige ON litiges_messages(id_litige);

CREATE TABLE IF NOT EXISTS litiges_pieces_jointes (
  id_piece uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_litige uuid NOT NULL REFERENCES litiges_reclamations(id_litige) ON DELETE CASCADE,
  id_uploader uuid NOT NULL REFERENCES utilisateurs(id_utilisateur),
  nom_original varchar(255) NOT NULL,
  nom_stockage varchar(255) NOT NULL,
  mime_type varchar(120),
  taille_octets integer,
  date_upload timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_litiges_pieces_litige ON litiges_pieces_jointes(id_litige);
