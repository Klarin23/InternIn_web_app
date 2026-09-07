import "dotenv/config";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const nodeEnv = process.env.NODE_ENV;
const expectedDatabase =
  process.env.EXPECTED_DATABASE_NAME?.trim() ||
  (nodeEnv === "production" ? "neondb" : nodeEnv === "development" ? "internin_dev" : "internin_test");

if (!databaseUrl) throw new Error("DATABASE_URL est absente.");
if (!nodeEnv) throw new Error("NODE_ENV est absent.");

let databaseName;
try {
  databaseName = new URL(databaseUrl).pathname.replace(/^\/+/, "");
} catch {
  throw new Error("DATABASE_URL est invalide.");
}

if (databaseName !== expectedDatabase) {
  throw new Error(
    `SÉCURITÉ : DATABASE_URL pointe vers "${databaseName}", base attendue "${expectedDatabase}".`,
  );
}

const client = new Client({ connectionString: databaseUrl });

const q = (...args) => client.query(...args);

async function columnExists(table, column) {
  const { rows } = await q(
    `SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 AND column_name=$2 LIMIT 1`,
    [table, column],
  );
  return rows.length > 0;
}

async function tableExists(table) {
  const { rows } = await q(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1 LIMIT 1`,
    [table],
  );
  return rows.length > 0;
}

async function addColumnIfMissing(table, column, definition) {
  if (!(await columnExists(table, column))) {
    await q(`ALTER TABLE public."${table}" ADD COLUMN "${column}" ${definition}`);
    console.log(`+ colonne ${table}.${column}`);
  }
}

async function ensureEnum(name, values) {
  const { rows } = await q(
    `SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname=$1 LIMIT 1`,
    [name],
  );
  if (rows.length) return;
  const literals = values.map((v) => `'${v.replaceAll("'", "''")}'`).join(", ");
  await q(`CREATE TYPE public."${name}" AS ENUM (${literals})`);
  console.log(`+ enum ${name}`);
}

async function main() {
  await client.connect();

  // Serialize two concurrent deploy/reconcile runs.
  await q(`SELECT pg_advisory_lock(hashtext('internin-neon-schema-reconcile'))`);

  try {
    await q("BEGIN");

    // ---- Existing tables: columns added by later InternIn migrations ----
    // Entreprises: migration 0030 reintroduced this column after it was removed in 0029.
    // The current application selects it on multiple enterprise/admin endpoints.
    await addColumnIfMissing("entreprises", "motif_rejet_verification", "text");

    await addColumnIfMissing("utilisateurs", "version_jeton", "integer NOT NULL DEFAULT 0");

    await addColumnIfMissing("sessions_utilisateur", "pays_connexion", "varchar(100)");
    await addColumnIfMissing("sessions_utilisateur", "ville_connexion", "varchar(100)");

    await addColumnIfMissing(
      "stagiaires",
      "profil_visible_entreprises",
      "boolean NOT NULL DEFAULT false",
    );

    await addColumnIfMissing("candidatures", "motif_retrait_code", "varchar(80)");
    await addColumnIfMissing("candidatures", "motif_retrait_commentaire", "text");
    await addColumnIfMissing("candidatures", "date_retrait", "timestamp");

    await addColumnIfMissing("parametres_plateforme", "elements_validation_automatique", "jsonb NOT NULL DEFAULT '[]'::jsonb");
    await addColumnIfMissing("parametres_plateforme", "mode_maintenance", "boolean NOT NULL DEFAULT false");
    await addColumnIfMissing("parametres_plateforme", "message_maintenance", "text");
    await addColumnIfMissing("parametres_plateforme", "maintenance_debut", "timestamp");
    await addColumnIfMissing("parametres_plateforme", "maintenance_fin", "timestamp");
    await addColumnIfMissing("parametres_plateforme", "admins_peuvent_acceder", "boolean NOT NULL DEFAULT true");

    await addColumnIfMissing("taches_stage", "id_objectif", "uuid");
    await addColumnIfMissing("offres_finales", "motif_refus_stagiaire", "text");

    // Litiges workflow extensions.
    await addColumnIfMissing("litiges_reclamations", "cible_type", "varchar(30)");
    await addColumnIfMissing("litiges_reclamations", "categorie", "varchar(100)");
    await addColumnIfMissing("litiges_reclamations", "severite", "varchar(20)");
    await addColumnIfMissing("litiges_reclamations", "date_incident", "date");
    await addColumnIfMissing("litiges_reclamations", "reference", "varchar(40)");
    await addColumnIfMissing("litiges_reclamations", "escalade", "boolean NOT NULL DEFAULT false");
    await addColumnIfMissing("litiges_reclamations", "motif_escalade", "text");
    await addColumnIfMissing("litiges_reclamations", "date_escalade", "timestamp");
    await addColumnIfMissing("litiges_reclamations", "motif_decision", "text");
    await addColumnIfMissing("litiges_reclamations", "attend_info", "boolean NOT NULL DEFAULT false");

    // Conversation split: create enum before adding the typed column.
    await ensureEnum("type_conversation", ["entreprise", "superviseur"]);
    await addColumnIfMissing(
      "conversations",
      "type_conversation",
      `public."type_conversation" NOT NULL DEFAULT 'entreprise'`,
    );
    await addColumnIfMissing("conversations", "id_entreprise", "uuid");
    await addColumnIfMissing("conversations", "id_membre_entreprise", "uuid");

    // Historical conversations belong to the stage's company.
    await q(`
      UPDATE public.conversations c
      SET id_entreprise = s.id_entreprise
      FROM public.stages s
      WHERE c.id_stage = s.id_stage
        AND c.id_entreprise IS NULL
    `);

    // ---- Missing tables ----
    await ensureEnum("statut_proposition_stage", [
      "envoyee", "vue", "acceptee", "refusee", "expiree", "annulee",
    ]);

    await q(`
      CREATE TABLE IF NOT EXISTS public.propositions_stage (
        id_proposition uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        id_entreprise uuid NOT NULL,
        id_stagiaire uuid NOT NULL,
        id_offre uuid NOT NULL,
        message text,
        statut public."statut_proposition_stage" NOT NULL DEFAULT 'envoyee',
        date_creation timestamp DEFAULT now(),
        date_vue timestamp,
        date_reponse timestamp,
        commentaire_reponse text
      )
    `);
    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_proposition_entreprise_stagiaire_offre
      ON public.propositions_stage (id_entreprise, id_stagiaire, id_offre)
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS public.favoris_offres (
        id_favori uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        id_stagiaire uuid NOT NULL,
        id_offre uuid NOT NULL,
        date_ajout timestamp DEFAULT now()
      )
    `);
    await q(`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_favori_stagiaire_offre
      ON public.favoris_offres (id_stagiaire, id_offre)
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS public.sse_tickets (
        id_ticket uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        id_utilisateur uuid NOT NULL,
        ticket_hash varchar(64) NOT NULL,
        date_expiration timestamp NOT NULL,
        date_utilisation timestamp,
        date_creation timestamp DEFAULT now(),
        CONSTRAINT sse_tickets_ticket_hash_unique UNIQUE (ticket_hash)
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS public.journal_actions_admin (
        id_journal uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        id_administrateur uuid,
        type_entite varchar(50) NOT NULL,
        id_entite uuid,
        action varchar(100) NOT NULL,
        ancien_statut varchar(50),
        nouveau_statut varchar(50),
        motif text,
        date_creation timestamp DEFAULT now()
      )
    `);

    await q(`
      CREATE TABLE IF NOT EXISTS public.tentatives_connexion (
        id_tentative uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        email varchar(255) NOT NULL,
        id_utilisateur uuid,
        adresse_ip varchar(45),
        motif varchar(80) NOT NULL DEFAULT 'identifiants_invalides',
        date_creation timestamp DEFAULT now()
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS tentatives_connexion_email_date_idx ON public.tentatives_connexion (email, date_creation)`);
    await q(`CREATE INDEX IF NOT EXISTS tentatives_connexion_ip_date_idx ON public.tentatives_connexion (adresse_ip, date_creation)`);

    await q(`
      CREATE TABLE IF NOT EXISTS public.litiges_notes_internes (
        id_note uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        id_litige uuid NOT NULL,
        id_admin uuid NOT NULL,
        contenu text NOT NULL,
        date_creation timestamp DEFAULT now()
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_litiges_notes_litige ON public.litiges_notes_internes (id_litige)`);

    await q(`
      CREATE TABLE IF NOT EXISTS public.litiges_messages (
        id_message uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        id_litige uuid NOT NULL,
        id_auteur uuid NOT NULL,
        role_auteur varchar(30) NOT NULL,
        contenu text NOT NULL,
        date_creation timestamp DEFAULT now()
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_litiges_messages_litige ON public.litiges_messages (id_litige)`);

    await q(`
      CREATE TABLE IF NOT EXISTS public.litiges_pieces_jointes (
        id_piece uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        id_litige uuid NOT NULL,
        id_uploader uuid NOT NULL,
        nom_original varchar(255) NOT NULL,
        nom_stockage varchar(255) NOT NULL,
        mime_type varchar(120),
        taille_octets integer,
        date_upload timestamp DEFAULT now()
      )
    `);
    await q(`CREATE INDEX IF NOT EXISTS idx_litiges_pieces_litige ON public.litiges_pieces_jointes (id_litige)`);

    await q(`
      CREATE TABLE IF NOT EXISTS public.preferences_notifications_entreprise (
        id_preference uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        id_entreprise uuid NOT NULL UNIQUE,
        messages boolean NOT NULL DEFAULT true,
        candidatures boolean NOT NULL DEFAULT true,
        evaluations boolean NOT NULL DEFAULT true,
        equipe boolean NOT NULL DEFAULT true,
        date_creation timestamp DEFAULT now(),
        date_maj timestamp DEFAULT now()
      )
    `);

    await ensureEnum("gravite_alerte_securite", ["information", "attention", "important", "critique"]);
    await ensureEnum("statut_alerte_securite", ["nouvelle", "examinee", "en_cours", "resolue"]);

    await q(`
      CREATE TABLE IF NOT EXISTS public.alertes_securite (
        id_alerte uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        fingerprint varchar(191) NOT NULL,
        type_alerte varchar(80) NOT NULL,
        gravite public."gravite_alerte_securite" NOT NULL DEFAULT 'attention',
        statut public."statut_alerte_securite" NOT NULL DEFAULT 'nouvelle',
        titre varchar(255) NOT NULL,
        description text,
        id_utilisateur_cible uuid,
        email_cible varchar(255),
        nom_cible varchar(255),
        niveau_detection varchar(50),
        score_global integer DEFAULT 0,
        score_partage integer DEFAULT 0,
        score_automatisation integer DEFAULT 0,
        score_authentification integer DEFAULT 0,
        signaux jsonb DEFAULT '[]'::jsonb,
        nb_evenements integer NOT NULL DEFAULT 1,
        metadata jsonb DEFAULT '{}'::jsonb,
        date_creation timestamp DEFAULT now(),
        date_maj timestamp DEFAULT now(),
        date_derniere_detection timestamp DEFAULT now(),
        date_examen timestamp,
        date_resolution timestamp,
        id_admin_resolution uuid,
        notifie boolean NOT NULL DEFAULT false
      )
    `);
    await q(`CREATE UNIQUE INDEX IF NOT EXISTS alertes_securite_fingerprint_uidx ON public.alertes_securite (fingerprint)`);
    await q(`CREATE INDEX IF NOT EXISTS alertes_securite_statut_idx ON public.alertes_securite (statut)`);
    await q(`CREATE INDEX IF NOT EXISTS alertes_securite_gravite_idx ON public.alertes_securite (gravite)`);
    await q(`CREATE INDEX IF NOT EXISTS alertes_securite_date_idx ON public.alertes_securite (date_derniere_detection)`);

    // ---- Constraints / FKs that are safe to add only when absent ----
    // PostgreSQL has no ADD CONSTRAINT IF NOT EXISTS, so test pg_constraint first.
    const constraints = [
      ["taches_stage", "taches_stage_id_objectif_objectifs_stage_id_objectif_fk", `ALTER TABLE public.taches_stage ADD CONSTRAINT taches_stage_id_objectif_objectifs_stage_id_objectif_fk FOREIGN KEY (id_objectif) REFERENCES public.objectifs_stage(id_objectif) ON DELETE SET NULL`],
      ["conversations", "conversations_id_entreprise_entreprises_id_entreprise_fk", `ALTER TABLE public.conversations ADD CONSTRAINT conversations_id_entreprise_entreprises_id_entreprise_fk FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)`],
      ["conversations", "conversations_id_membre_entreprise_membres_equipe_id_membre_fk", `ALTER TABLE public.conversations ADD CONSTRAINT conversations_id_membre_entreprise_membres_equipe_id_membre_fk FOREIGN KEY (id_membre_entreprise) REFERENCES public.membres_equipe(id_membre)`],
      ["propositions_stage", "propositions_stage_id_entreprise_entreprises_id_entreprise_fk", `ALTER TABLE public.propositions_stage ADD CONSTRAINT propositions_stage_id_entreprise_entreprises_id_entreprise_fk FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise)`],
      ["propositions_stage", "propositions_stage_id_stagiaire_stagiaires_id_stagiaire_fk", `ALTER TABLE public.propositions_stage ADD CONSTRAINT propositions_stage_id_stagiaire_stagiaires_id_stagiaire_fk FOREIGN KEY (id_stagiaire) REFERENCES public.stagiaires(id_stagiaire)`],
      ["propositions_stage", "propositions_stage_id_offre_offres_stage_id_offre_fk", `ALTER TABLE public.propositions_stage ADD CONSTRAINT propositions_stage_id_offre_offres_stage_id_offre_fk FOREIGN KEY (id_offre) REFERENCES public.offres_stage(id_offre)`],
      ["favoris_offres", "favoris_offres_id_stagiaire_stagiaires_id_stagiaire_fk", `ALTER TABLE public.favoris_offres ADD CONSTRAINT favoris_offres_id_stagiaire_stagiaires_id_stagiaire_fk FOREIGN KEY (id_stagiaire) REFERENCES public.stagiaires(id_stagiaire) ON DELETE CASCADE`],
      ["favoris_offres", "favoris_offres_id_offre_offres_stage_id_offre_fk", `ALTER TABLE public.favoris_offres ADD CONSTRAINT favoris_offres_id_offre_offres_stage_id_offre_fk FOREIGN KEY (id_offre) REFERENCES public.offres_stage(id_offre) ON DELETE CASCADE`],
      ["sse_tickets", "sse_tickets_id_utilisateur_utilisateurs_id_utilisateur_fk", `ALTER TABLE public.sse_tickets ADD CONSTRAINT sse_tickets_id_utilisateur_utilisateurs_id_utilisateur_fk FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateurs(id_utilisateur) ON DELETE CASCADE`],
      ["journal_actions_admin", "journal_actions_admin_id_administrateur_utilisateurs_id_utilisateur_fk", `ALTER TABLE public.journal_actions_admin ADD CONSTRAINT journal_actions_admin_id_administrateur_utilisateurs_id_utilisateur_fk FOREIGN KEY (id_administrateur) REFERENCES public.utilisateurs(id_utilisateur)`],
      ["tentatives_connexion", "tentatives_connexion_id_utilisateur_utilisateurs_id_utilisateur_fk", `ALTER TABLE public.tentatives_connexion ADD CONSTRAINT tentatives_connexion_id_utilisateur_utilisateurs_id_utilisateur_fk FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateurs(id_utilisateur)`],
      ["litiges_notes_internes", "litiges_notes_internes_id_litige_litiges_reclamations_id_litige_fk", `ALTER TABLE public.litiges_notes_internes ADD CONSTRAINT litiges_notes_internes_id_litige_litiges_reclamations_id_litige_fk FOREIGN KEY (id_litige) REFERENCES public.litiges_reclamations(id_litige) ON DELETE CASCADE`],
      ["litiges_notes_internes", "litiges_notes_internes_id_admin_administrateurs_id_admin_fk", `ALTER TABLE public.litiges_notes_internes ADD CONSTRAINT litiges_notes_internes_id_admin_administrateurs_id_admin_fk FOREIGN KEY (id_admin) REFERENCES public.administrateurs(id_admin)`],
      ["litiges_messages", "litiges_messages_id_litige_litiges_reclamations_id_litige_fk", `ALTER TABLE public.litiges_messages ADD CONSTRAINT litiges_messages_id_litige_litiges_reclamations_id_litige_fk FOREIGN KEY (id_litige) REFERENCES public.litiges_reclamations(id_litige) ON DELETE CASCADE`],
      ["litiges_messages", "litiges_messages_id_auteur_utilisateurs_id_utilisateur_fk", `ALTER TABLE public.litiges_messages ADD CONSTRAINT litiges_messages_id_auteur_utilisateurs_id_utilisateur_fk FOREIGN KEY (id_auteur) REFERENCES public.utilisateurs(id_utilisateur)`],
      ["litiges_pieces_jointes", "litiges_pieces_jointes_id_litige_litiges_reclamations_id_litige_fk", `ALTER TABLE public.litiges_pieces_jointes ADD CONSTRAINT litiges_pieces_jointes_id_litige_litiges_reclamations_id_litige_fk FOREIGN KEY (id_litige) REFERENCES public.litiges_reclamations(id_litige) ON DELETE CASCADE`],
      ["litiges_pieces_jointes", "litiges_pieces_jointes_id_uploader_utilisateurs_id_utilisateur_fk", `ALTER TABLE public.litiges_pieces_jointes ADD CONSTRAINT litiges_pieces_jointes_id_uploader_utilisateurs_id_utilisateur_fk FOREIGN KEY (id_uploader) REFERENCES public.utilisateurs(id_utilisateur)`],
      ["preferences_notifications_entreprise", "preferences_notifications_entreprise_id_entreprise_entreprises_id_entreprise_fk", `ALTER TABLE public.preferences_notifications_entreprise ADD CONSTRAINT preferences_notifications_entreprise_id_entreprise_entreprises_id_entreprise_fk FOREIGN KEY (id_entreprise) REFERENCES public.entreprises(id_entreprise) ON DELETE CASCADE`],
      ["alertes_securite", "alertes_securite_id_utilisateur_cible_utilisateurs_id_utilisateur_fk", `ALTER TABLE public.alertes_securite ADD CONSTRAINT alertes_securite_id_utilisateur_cible_utilisateurs_id_utilisateur_fk FOREIGN KEY (id_utilisateur_cible) REFERENCES public.utilisateurs(id_utilisateur)`],
      ["alertes_securite", "alertes_securite_id_admin_resolution_utilisateurs_id_utilisateur_fk", `ALTER TABLE public.alertes_securite ADD CONSTRAINT alertes_securite_id_admin_resolution_utilisateurs_id_utilisateur_fk FOREIGN KEY (id_admin_resolution) REFERENCES public.utilisateurs(id_utilisateur)`],
    ];

    for (const [table, name, sql] of constraints) {
      if (!(await tableExists(table))) continue;
      const { rows } = await q(
        `SELECT 1 FROM pg_constraint WHERE conname=$1 LIMIT 1`,
        [name],
      );
      if (!rows.length) {
        await q(sql);
        console.log(`+ contrainte ${name}`);
      }
    }

    // Reference numbers: create the sequence/index, but refuse to mutate existing duplicate references.
    await q(`CREATE SEQUENCE IF NOT EXISTS public.litiges_reference_seq`);
    const { rows: dupes } = await q(`
      SELECT reference, COUNT(*)::int AS count
      FROM public.litiges_reclamations
      WHERE reference IS NOT NULL
      GROUP BY reference
      HAVING COUNT(*) > 1
      LIMIT 1
    `);
    if (dupes.length) {
      throw new Error(
        `Références de litiges dupliquées détectées (${dupes[0].reference}). ` +
        `Aucune déduplication automatique n'est effectuée par sécurité.`,
      );
    }
    await q(`CREATE UNIQUE INDEX IF NOT EXISTS litiges_reclamations_reference_unique ON public.litiges_reclamations (reference)`);

    await q("COMMIT");
    console.log("\n✅ Réconciliation Neon terminée sans suppression de données.");
    console.log("ℹ️ Cette opération ne marque volontairement PAS les anciennes migrations Drizzle comme appliquées.");
    console.log("ℹ️ Ne lancez pas npm run db:migrate sur cette base tant que la chaîne de migrations n'a pas été rebaselinée.");
  } catch (error) {
    await q("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await q(`SELECT pg_advisory_unlock(hashtext('internin-neon-schema-reconcile'))`).catch(() => {});
    await client.end();
  }
}

main().catch((error) => {
  console.error("\n❌ Réconciliation Neon échouée :", error.message);
  process.exit(1);
});
