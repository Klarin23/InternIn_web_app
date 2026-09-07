/**
 * Générateur PDF Convention de stage — design moderne InternIn (FR / EN).
 * Données métier exclusivement fournies par le backend (jamais inventées).
 * Les deux langues partagent exactement le même contenu métier.
 *
 * Mise en page 100% dynamique : chaque bloc (paragraphe, ligne de tableau,
 * carte, encadré) mesure sa propre hauteur réelle (heightOfString) avant
 * d'être dessiné. Un saut de page est inséré automatiquement dès qu'un
 * bloc ne tient plus dans l'espace restant, ce qui élimine tout risque de
 * superposition de texte ou de débordement hors page. La pagination totale
 * est calculée après coup (bufferPages) pour un "Page X / N" toujours exact.
 */

import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";

const UPLOAD_ROOT = path.resolve("uploads", "conventions");

const COLORS = {
  teal: "#0D9488",
  tealDark: "#0F766E",
  purple: "#5B3DF5",
  purpleSoft: "#7C6CF0",
  yellow: "#F59E0B",
  yellowBg: "#FEF3C7",
  gray900: "#111827",
  gray700: "#374151",
  gray500: "#6B7280",
  gray300: "#D1D5DB",
  gray100: "#F3F4F6",
  gray50: "#F9FAFB",
  white: "#FFFFFF",
  green: "#059669",
  greenBg: "#D1FAE5",
  orange: "#D97706",
  orangeBg: "#FEF3C7",
};

const PAGE_MARGIN = 50;
const CONTENT_WIDTH_A4 = 495; // 595.28 - 100, calculé dynamiquement quand possible
const FOOTER_RESERVE = 46; // espace réservé en bas de page pour le pied de page

const I18N = {
  fr: {
    platformSubtitle: "PLATEFORME DE GESTION DES STAGES",
    docGenerated: "Document généré le",
    refPlatform: "Réf. plateforme",
    docContractuel: "DOCUMENT CONTRACTUEL",
    title: "Convention de stage",
    subtitle:
      "Établie entre le stagiaire, l'entreprise d'accueil et la plateforme InternIn",
    conventionNo: "Convention N°",
    partyS: "STAGIAIRE",
    partyE: "ENTREPRISE D'ACCUEIL",
    partyP: "PLATEFORME / TIERS GARANT",
    partyPDesc: "Validation & suivi administratif du stage",
    overview: "APERÇU DU STAGE",
    jobTitle: "INTITULÉ DU POSTE",
    duration: "DURÉE",
    startDate: "DATE DE DÉBUT",
    weeklyHours: "VOLUME HORAIRE HEBDOMADAIRE",
    workMode: "MODE DE TRAVAIL",
    gratification: "GRATIFICATION",
    footer: "InternIn · Convention de stage",
    page: "Page",
    section1: "Parties à la convention",
    section1Intro:
      "La présente convention est conclue entre les parties suivantes, dans le cadre d'un stage organisé et suivi via la plateforme InternIn :",
    theIntern: "Le / la stagiaire",
    theCompany: "L'entreprise d'accueil",
    thePlatform: "La plateforme InternIn (tiers garant du suivi)",
    platformRole:
      "InternIn agit en qualité de plateforme de mise en relation et de suivi administratif du stage. Elle valide les éléments de l'offre finale, met à disposition les outils de suivi (évaluations, messagerie, alertes) et archive la présente convention pour le compte des trois parties.",
    fullName: "NOM COMPLET",
    email: "EMAIL",
    phone: "TÉLÉPHONE",
    establishment: "ÉTABLISSEMENT",
    formation: "FORMATION / DIPLÔME PRÉPARÉ",
    studyYear: "ANNÉE D'ÉTUDE",
    companyName: "RAISON SOCIALE",
    sector: "SECTEUR D'ACTIVITÉ",
    address: "ADRESSE",
    country: "PAYS",
    supervisor: "MAÎTRE DE STAGE / SUPERVISEUR",
    supervisorContact: "CONTACT SUPERVISEUR",
    section2: "Objet de la convention",
    section2Body:
      "La présente convention a pour objet de définir les conditions dans lesquelles le / la stagiaire effectuera un stage au sein de l'entreprise d'accueil, ainsi que les modalités de suivi pédagogique et administratif assurées par l'intermédiaire de la plateforme InternIn. Elle précise notamment la nature des missions confiées, la durée, les horaires, l'encadrement, ainsi que les droits et obligations respectifs des parties.",
    learningObjectives: "Objectifs pédagogiques du stage",
    section3: "Missions confiées",
    section3Intro:
      "Le / la stagiaire sera intégré(e) à l'équipe et se verra confier les missions suivantes, sous la responsabilité du maître de stage désigné ci-avant :",
    section4: "Modalités du stage",
    renewable: "Renouvelable",
    leave: "CONGÉS / ABSENCES",
    leaveValue: "Selon règlement intérieur de l'entreprise",
    amendmentNote:
      "Toute modification substantielle de ces modalités (durée, missions, rémunération) fait l'objet d'un avenant signé par les trois parties et archivé sur la plateforme InternIn.",
    section5: "Encadrement et suivi",
    section5Body:
      "Le suivi du stage est assuré conjointement par le maître de stage au sein de l'entreprise et par la plateforme InternIn, qui met à disposition des outils d'évaluation périodique, de messagerie sécurisée entre les parties et de signalement en cas de difficulté.",
    disputeNote:
      "En cas de litige ou de difficulté rencontrée durant le stage, chaque partie peut ouvrir un signalement directement depuis son espace InternIn ; celui-ci est traité par l'équipe d'administration de la plateforme dans les meilleurs délais.",
    section6: "Obligations des parties",
    companyCommits: "L'entreprise d'accueil s'engage à :",
    companyObligations: [
      "Confier au / à la stagiaire des missions conformes aux objectifs pédagogiques définis à l'article 2 ;",
      "Désigner un maître de stage garantissant un encadrement effectif ;",
      "Respecter la réglementation applicable en matière de durée, d'hygiène et de sécurité au travail ;",
      "Renseigner les évaluations de fin de stage sur la plateforme InternIn.",
    ],
    internCommits: "Le / la stagiaire s'engage à :",
    internObligations: [
      "Respecter le règlement intérieur et les consignes de l'entreprise d'accueil ;",
      "Exécuter les missions confiées avec sérieux et assiduité ;",
      "Informer sans délai l'entreprise et l'établissement d'enseignement de toute absence ;",
      "Restituer, en fin de stage, tout matériel et document confiés par l'entreprise.",
    ],
    platformCommits: "La plateforme InternIn s'engage à :",
    platformObligations: [
      "Assurer la traçabilité des validations et signatures liées à la présente convention ;",
      "Mettre à disposition des trois parties un accès sécurisé au suivi du stage ;",
      "Archiver la convention et la tenir disponible au téléchargement pendant toute la durée du stage.",
    ],
    section7: "Confidentialité et propriété intellectuelle",
    section7Body:
      "Le / la stagiaire s'engage à observer une stricte confidentialité sur l'ensemble des informations, données et documents auxquels il / elle aura accès durant le stage, et à ne pas les divulguer à des tiers, y compris après la fin du stage. Les travaux, développements et productions réalisés dans le cadre du stage demeurent la propriété de l'entreprise d'accueil, sauf accord contraire formalisé par écrit.",
    section8: "Assurance, résiliation et litiges",
    section8Body:
      "Le / la stagiaire demeure couvert(e), pendant la durée du stage, par le régime de protection sociale de son établissement d'enseignement. L'entreprise d'accueil souscrit, le cas échéant, une assurance responsabilité civile couvrant les dommages pouvant être causés par le / la stagiaire dans l'exercice de ses missions.\n\nLa présente convention peut être résiliée avant son terme, d'un commun accord entre les parties ou en cas de manquement grave de l'une d'elles à ses obligations, après notification via la plateforme InternIn. Tout litige relatif à l'exécution de la présente convention sera, dans la mesure du possible, réglé à l'amiable entre les parties, avec la médiation de la plateforme InternIn.",
    section9: "Accords et signatures",
    section9Intro:
      "Les parties ci-dessous formalisent leur accord avec les termes de la présente convention. Les signatures sont enregistrées de manière traçable sur la plateforme InternIn, avec horodatage de chaque accord.",
    pendingSignature: "En attente de signature",
    agreementRecorded: "Accord enregistré",
    pendingValidation: "En attente de validation",
    adminValidation: "Validation administrative",
    section10: "Historique de la convention",
    created: "CONVENTION CRÉÉE",
    companyAgreement: "ACCORD ENTREPRISE ENREGISTRÉ",
    platformValidation: "VALIDATION PLATEFORME",
    internSignature: "SIGNATURE STAGIAIRE",
    pending: "En attente",
    legalFooter:
      "Document généré automatiquement par la plateforme InternIn à des fins de formalisation et d'archivage administratif de la convention de stage tripartite conclue entre le / la stagiaire, l'entreprise d'accueil et la plateforme. Les accords enregistrés ci-dessus font foi entre les parties conformément aux conditions générales d'utilisation d'InternIn.",
    hours: "heures",
    months: { "1_mois": "1 mois", "2_mois": "2 mois", "3_mois": "3 mois" },
    workModes: {
      presentiel: "Présentiel",
      hybride: "Hybride",
      distance: "À distance",
      remote: "À distance",
    },
    remuneration: {
      non_remunere: "Non rémunéré",
      gratifie: "Oui — selon barème en vigueur",
      selon_bareme: "Selon barème en vigueur",
      remunere: "Rémunéré",
    },
    statusLabels: {
      EN_ATTENTE_SIGNATURE_ENTREPRISE: "En attente de signature de l'entreprise",
      EN_ATTENTE_SIGNATURE_STAGIAIRE: "En attente de signature du stagiaire",
      EN_ATTENTE_VALIDATION: "En attente de validation plateforme",
      VALIDEE: "Convention validée",
      REFUSEE: "Convention refusée",
      BROUILLON: "Brouillon",
      A_CORRIGER: "À corriger",
    },
  },
  en: {
    platformSubtitle: "INTERNSHIP MANAGEMENT PLATFORM",
    docGenerated: "Document generated on",
    refPlatform: "Platform ref.",
    docContractuel: "CONTRACTUAL DOCUMENT",
    title: "Internship agreement",
    subtitle:
      "Entered into between the intern, the host company and the InternIn platform",
    conventionNo: "Agreement No.",
    partyS: "INTERN",
    partyE: "HOST COMPANY",
    partyP: "PLATFORM / GUARANTOR",
    partyPDesc: "Administrative validation & follow-up",
    overview: "INTERNSHIP OVERVIEW",
    jobTitle: "JOB TITLE",
    duration: "DURATION",
    startDate: "START DATE",
    weeklyHours: "WEEKLY HOURS",
    workMode: "WORK MODE",
    gratification: "COMPENSATION",
    footer: "InternIn · Internship agreement",
    page: "Page",
    section1: "Parties to the agreement",
    section1Intro:
      "This agreement is entered into between the following parties, in the context of an internship organized and monitored via the InternIn platform:",
    theIntern: "The intern",
    theCompany: "The host company",
    thePlatform: "The InternIn platform (follow-up guarantor)",
    platformRole:
      "InternIn acts as a matching and administrative follow-up platform for the internship. It validates the final offer details, provides monitoring tools (evaluations, messaging, alerts) and archives this agreement on behalf of the three parties.",
    fullName: "FULL NAME",
    email: "EMAIL",
    phone: "PHONE",
    establishment: "INSTITUTION",
    formation: "PROGRAM / DEGREE",
    studyYear: "YEAR OF STUDY",
    companyName: "COMPANY NAME",
    sector: "SECTOR",
    address: "ADDRESS",
    country: "COUNTRY",
    supervisor: "SUPERVISOR / MENTOR",
    supervisorContact: "SUPERVISOR CONTACT",
    section2: "Purpose of the agreement",
    section2Body:
      "This agreement defines the conditions under which the intern will carry out an internship within the host company, as well as the pedagogical and administrative follow-up provided through the InternIn platform. It specifies the nature of the assigned missions, duration, working hours, supervision, and the respective rights and obligations of the parties.",
    learningObjectives: "Learning objectives",
    section3: "Assigned missions",
    section3Intro:
      "The intern will join the team and be assigned the following missions, under the responsibility of the designated supervisor:",
    section4: "Internship terms",
    renewable: "Renewable",
    leave: "LEAVE / ABSENCES",
    leaveValue: "According to the company's internal rules",
    amendmentNote:
      "Any substantial modification of these terms (duration, missions, compensation) requires an amendment signed by the three parties and archived on the InternIn platform.",
    section5: "Supervision and follow-up",
    section5Body:
      "Internship follow-up is jointly provided by the company supervisor and the InternIn platform, which provides periodic evaluation tools, secure messaging between parties, and issue reporting.",
    disputeNote:
      "In the event of a dispute or difficulty during the internship, any party may open a report directly from their InternIn workspace; it will be handled by the platform administration team as promptly as possible.",
    section6: "Obligations of the parties",
    companyCommits: "The host company undertakes to:",
    companyObligations: [
      "Assign missions consistent with the learning objectives defined in article 2;",
      "Designate a supervisor ensuring effective mentoring;",
      "Comply with applicable rules on working time, health and safety;",
      "Complete end-of-internship evaluations on the InternIn platform.",
    ],
    internCommits: "The intern undertakes to:",
    internObligations: [
      "Comply with the host company's internal rules and instructions;",
      "Carry out assigned missions diligently and seriously;",
      "Promptly inform the company and educational institution of any absence;",
      "Return all equipment and documents provided by the company at the end of the internship.",
    ],
    platformCommits: "The InternIn platform undertakes to:",
    platformObligations: [
      "Ensure traceability of validations and signatures related to this agreement;",
      "Provide the three parties with secure access to internship follow-up;",
      "Archive the agreement and keep it available for download throughout the internship.",
    ],
    section7: "Confidentiality and intellectual property",
    section7Body:
      "The intern undertakes to maintain strict confidentiality regarding all information, data and documents accessed during the internship, and not to disclose them to third parties, including after the end of the internship. Work, developments and deliverables produced during the internship remain the property of the host company, unless otherwise agreed in writing.",
    section8: "Insurance, termination and disputes",
    section8Body:
      "During the internship, the intern remains covered by the social protection scheme of their educational institution. Where applicable, the host company maintains civil liability insurance covering damages that may be caused by the intern in the course of their duties.\n\nThis agreement may be terminated before its term by mutual consent or in the event of a serious breach by one of the parties, after notification via the InternIn platform. Any dispute relating to the performance of this agreement shall, as far as possible, be settled amicably between the parties, with mediation by the InternIn platform.",
    section9: "Agreements and signatures",
    section9Intro:
      "The parties below formalize their agreement with the terms of this internship agreement. Signatures are recorded in a traceable manner on the InternIn platform, with a timestamp for each agreement.",
    pendingSignature: "Awaiting signature",
    agreementRecorded: "Agreement recorded",
    pendingValidation: "Awaiting validation",
    adminValidation: "Administrative validation",
    section10: "Agreement history",
    created: "AGREEMENT CREATED",
    companyAgreement: "COMPANY AGREEMENT RECORDED",
    platformValidation: "PLATFORM VALIDATION",
    internSignature: "INTERN SIGNATURE",
    pending: "Pending",
    legalFooter:
      "Document automatically generated by the InternIn platform for formalization and administrative archiving of the tripartite internship agreement between the intern, the host company and the platform. The agreements recorded above are binding between the parties in accordance with InternIn's terms of use.",
    hours: "hours",
    months: { "1_mois": "1 month", "2_mois": "2 months", "3_mois": "3 months" },
    workModes: {
      presentiel: "On-site",
      hybride: "Hybrid",
      distance: "Remote",
      remote: "Remote",
    },
    remuneration: {
      non_remunere: "Unpaid",
      gratifie: "Yes — according to applicable scale",
      selon_bareme: "According to applicable scale",
      remunere: "Paid",
    },
    statusLabels: {
      EN_ATTENTE_SIGNATURE_ENTREPRISE: "Awaiting company signature",
      EN_ATTENTE_SIGNATURE_STAGIAIRE: "Awaiting intern signature",
      EN_ATTENTE_VALIDATION: "Awaiting platform validation",
      VALIDEE: "Agreement validated",
      REFUSEE: "Agreement refused",
      BROUILLON: "Draft",
      A_CORRIGER: "To be corrected",
    },
  },
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function dash(v) {
  if (v == null || v === "") return "—";
  return String(v);
}

function formatDate(value, lang) {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateShort(value, lang) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function drawHeaderBar(doc) {
  const w = doc.page.width;
  doc.save();
  doc.rect(0, 0, w * 0.55, 6).fill(COLORS.yellow);
  doc.rect(w * 0.55, 0, w * 0.45, 6).fill(COLORS.teal);
  doc.restore();
}

/** Bas de page utile disponible avant la zone réservée au pied de page. */
function contentBottom(doc) {
  return doc.page.height - doc.page.margins.bottom - FOOTER_RESERVE;
}

/** En-tête compact affiché en haut des pages de contenu (hors couverture). */
function drawPageMeta(doc, ctx) {
  const { t, numero, data } = ctx;
  drawHeaderBar(doc);
  doc.fontSize(9).fillColor(COLORS.gray500).text(t.title, 50, 20);
  doc
    .fontSize(8)
    .fillColor(COLORS.gray500)
    .text(numero, 50, 20, { align: "right", width: doc.page.width - 100 });
  doc
    .fontSize(8)
    .fillColor(COLORS.gray500)
    .text(
      `${data.stagiaire?.nomComplet || ""} · ${data.entreprise?.nom || ""}`,
      50,
      32,
      { align: "right", width: doc.page.width - 100 },
    );
  doc.y = 68;
  doc.x = 50;
}

function newContentPage(doc, ctx) {
  doc.addPage();
  drawPageMeta(doc, ctx);
}

/** Insère un saut de page si le bloc à venir (hauteur `needed`) ne tient plus. */
function ensureSpace(doc, ctx, needed) {
  if (doc.y + needed > contentBottom(doc)) {
    newContentPage(doc, ctx);
  }
}

function drawFooterOnPage(doc, t, pageNum, totalPages) {
  const y = doc.page.height - 36;
  doc
    .fontSize(8)
    .fillColor(COLORS.gray500)
    .text(t.footer, 50, y, { continued: false, width: 300 });
  doc
    .fontSize(8)
    .fillColor(COLORS.gray500)
    .text(`${t.page} ${pageNum} / ${totalPages}`, 50, y, {
      align: "right",
      width: doc.page.width - 100,
    });
}

function drawSectionTitle(doc, ctx, number, title) {
  doc.fontSize(13);
  const titleH = doc.heightOfString(title, { width: doc.page.width - 178 });
  ensureSpace(doc, ctx, Math.max(20, titleH) + 18);
  const y = doc.y;
  doc.circle(58, y + 8, 10).fill(COLORS.teal);
  doc
    .fontSize(10)
    .fillColor(COLORS.white)
    .text(String(number), 52, y + 3, { width: 12, align: "center" });
  doc
    .fontSize(13)
    .fillColor(COLORS.gray900)
    .text(title, 78, y + 1, { width: doc.page.width - 128 });
  doc.y = Math.max(doc.y, y + 20) + 8;
  doc.x = 50;
}

function drawParagraph(doc, ctx, text, opts = {}) {
  const width = opts.width ?? doc.page.width - 100;
  const fontSize = opts.fontSize ?? 9;
  const color = opts.color ?? COLORS.gray700;
  doc.fontSize(fontSize);
  const h = doc.heightOfString(text, { width, align: opts.align ?? "justify" });
  ensureSpace(doc, ctx, h + 4);
  doc
    .fontSize(fontSize)
    .fillColor(color)
    .text(text, opts.x ?? 50, doc.y, { width, align: opts.align ?? "justify" });
  doc.moveDown(opts.spacingAfter ?? 0.6);
  doc.x = 50;
}

function drawBulletList(doc, ctx, items, opts = {}) {
  const width = (opts.width ?? doc.page.width - 100) - 14;
  const fontSize = opts.fontSize ?? 9;
  items.forEach((item) => {
    doc.fontSize(fontSize);
    const h = doc.heightOfString(item, { width });
    ensureSpace(doc, ctx, h + 6);
    doc.fontSize(fontSize).fillColor(opts.color ?? COLORS.gray700);
    doc.text("•", 50, doc.y, { width: 12 });
    doc.text(item, 64, doc.y - doc.currentLineHeight(), { width });
    doc.moveDown(0.3);
  });
  doc.x = 50;
}

/** Table clé/valeur en 2 colonnes, hauteur de ligne calculée dynamiquement. */
function drawKeyValueTable(doc, ctx, rows) {
  const leftX = 50;
  const colW = (doc.page.width - 100) / 2;
  const valueWidth = colW - 10;

  for (let i = 0; i < rows.length; i += 2) {
    const left = rows[i];
    const right = rows[i + 1];

    doc.fontSize(10);
    const leftValH = doc.heightOfString(dash(left.value), { width: valueWidth });
    const rightValH = right
      ? doc.heightOfString(dash(right.value), { width: valueWidth })
      : 0;
    const valH = Math.max(leftValH, rightValH);
    const rowH = 12 + valH + 16; // label + valeur + marge/séparateur

    ensureSpace(doc, ctx, rowH + 4);
    const y = doc.y;

    doc.fontSize(8).fillColor(COLORS.gray500).text(left.label, leftX, y, {
      width: valueWidth,
    });
    doc
      .fontSize(10)
      .fillColor(COLORS.gray900)
      .text(dash(left.value), leftX, y + 12, { width: valueWidth });

    if (right) {
      doc.fontSize(8).fillColor(COLORS.gray500).text(right.label, leftX + colW, y, {
        width: valueWidth,
      });
      doc
        .fontSize(10)
        .fillColor(COLORS.gray900)
        .text(dash(right.value), leftX + colW, y + 12, { width: valueWidth });
    }

    const sepY = y + 12 + valH + 8;
    doc
      .moveTo(leftX, sepY)
      .lineTo(doc.page.width - 50, sepY)
      .strokeColor(COLORS.gray100)
      .lineWidth(0.5)
      .stroke();

    doc.y = sepY + 8;
    doc.x = 50;
  }
}

/** Mesure la hauteur de contenu d'une carte partie (S / E / P). */
function measurePartyCardHeight(doc, w, lines) {
  const innerW = w - 28;
  let h = 34; // zone badge + titre
  lines.forEach((line, idx) => {
    doc.fontSize(idx === 0 ? 10 : 8);
    h += doc.heightOfString(line, { width: innerW }) + (idx === 0 ? 4 : 3);
  });
  return h + 10;
}

function drawPartyCard(doc, x, y, w, h, letter, letterColor, title, lines) {
  doc.roundedRect(x, y, w, h, 8).strokeColor(COLORS.gray300).lineWidth(1).stroke();
  doc.circle(x + 22, y + 22, 12).fill(letterColor);
  doc
    .fontSize(11)
    .fillColor(COLORS.white)
    .text(letter, x + 16, y + 16, { width: 12, align: "center" });
  doc.fontSize(8).fillColor(COLORS.gray500).text(title, x + 40, y + 13, {
    width: w - 50,
  });
  let ly = y + 34;
  const innerW = w - 28;
  lines.forEach((line, idx) => {
    doc
      .fontSize(idx === 0 ? 10 : 8)
      .fillColor(idx === 0 ? COLORS.gray900 : COLORS.gray500)
      .text(line, x + 14, ly, { width: innerW });
    ly = doc.y + (idx === 0 ? 4 : 3);
  });
}

/**
 * @param {object} data - Données métier assemblées côté service
 * @param {"fr"|"en"} lang
 * @returns {string} chemin relatif sous uploads/
 */
export function genererConventionPdf(data, lang = "fr") {
  const locale = lang === "en" ? "en" : "fr";
  const t = I18N[locale];

  ensureDir(UPLOAD_ROOT);

  const id = data.idConvention || "draft";
  const filename = `${id}-${locale}.pdf`;
  const filepath = path.join(UPLOAD_ROOT, filename);

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 48, bottom: 48, left: 50, right: 50 },
    bufferPages: true,
    info: {
      Title: `${t.title} ${data.numeroAffiche || ""}`,
      Author: "InternIn",
      Subject: t.title,
    },
  });

  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  const numero =
    data.numeroAffiche ||
    (data.numero != null
      ? `CS-${new Date().getFullYear()}-${String(data.numero).padStart(5, "0")}`
      : id.slice(0, 8));
  const refCourte = (data.idConvention || "").slice(0, 8);

  const ctx = { t, numero, data };

  // ─── PAGE 1 — Couverture ─────────────────────────────────────────────
  drawHeaderBar(doc);

  doc.roundedRect(50, 28, 28, 28, 6).fill(COLORS.teal);
  doc.fontSize(11).fillColor(COLORS.white).text("IN", 54, 35, { width: 20, align: "center" });
  doc.fontSize(12).fillColor(COLORS.gray900).text("InternIn", 86, 30);
  doc.fontSize(7).fillColor(COLORS.gray500).text(t.platformSubtitle, 86, 44);

  doc
    .fontSize(8)
    .fillColor(COLORS.gray500)
    .text(
      `${t.docGenerated} ${formatDate(data.dateGeneration || new Date(), locale)}\n${t.refPlatform} conv-${refCourte}`,
      50,
      30,
      { align: "right", width: doc.page.width - 100 },
    );

  doc.y = 108;
  doc.x = 50;

  // Badge central
  const cx = doc.page.width / 2;
  doc.roundedRect(cx - 22, doc.y, 44, 44, 12).fill(COLORS.purple);
  doc.fontSize(16).fillColor(COLORS.white).text("IN", cx - 22, doc.y + 12, {
    width: 44,
    align: "center",
  });
  doc.y += 44 + 18;
  doc.x = 50;

  doc
    .fontSize(9)
    .fillColor(COLORS.teal)
    .text(t.docContractuel, { align: "center", characterSpacing: 1.5 });
  doc.moveDown(0.4);
  doc.fontSize(26).fillColor(COLORS.gray900).text(t.title, { align: "center" });
  doc.moveDown(0.3);
  doc
    .fontSize(10)
    .fillColor(COLORS.gray500)
    .text(t.subtitle, { align: "center", width: 400, indent: (doc.page.width - 100 - 400) / 2 });
  doc.moveDown(0.8);
  doc.x = 50;

  // Pastille numéro de convention
  const numText = `${t.conventionNo} ${numero}`;
  doc.fontSize(9);
  const numW = doc.widthOfString(numText) + 24;
  doc
    .roundedRect(cx - numW / 2, doc.y, numW, 22, 11)
    .fillOpacity(0.08)
    .fill(COLORS.purple)
    .fillOpacity(1);
  doc
    .fontSize(9)
    .fillColor(COLORS.purple)
    .text(numText, cx - numW / 2, doc.y + 5, { width: numW, align: "center" });
  doc.y += 22 + 26;
  doc.x = 50;

  // Trois cartes des parties — hauteur commune calculée dynamiquement
  const cardW = 150;
  const gap = 14;
  const cardsStartX = (doc.page.width - (cardW * 3 + gap * 2)) / 2;

  const stagiaireLines = [
    data.stagiaire?.nomComplet || "—",
    [data.stagiaire?.formation, data.stagiaire?.diplome].filter(Boolean).join(" · ") || "—",
    data.stagiaire?.etablissement || "—",
  ];
  const entrepriseLines = [
    data.entreprise?.nom || "—",
    [data.entreprise?.ville, data.entreprise?.pays].filter(Boolean).join(", ") || "—",
    data.entreprise?.secteur || "—",
  ];
  const platformLines = ["InternIn", t.partyPDesc];

  const cardH = Math.max(
    88,
    measurePartyCardHeight(doc, cardW, stagiaireLines),
    measurePartyCardHeight(doc, cardW, entrepriseLines),
    measurePartyCardHeight(doc, cardW, platformLines),
  );

  ensureSpace(doc, ctx, cardH + 16);
  const cardY = doc.y;
  drawPartyCard(doc, cardsStartX, cardY, cardW, cardH, "S", COLORS.purple, t.partyS, stagiaireLines);
  drawPartyCard(doc, cardsStartX + cardW + gap, cardY, cardW, cardH, "E", COLORS.teal, t.partyE, entrepriseLines);
  drawPartyCard(doc, cardsStartX + (cardW + gap) * 2, cardY, cardW, cardH, "P", COLORS.yellow, t.partyP, platformLines);

  doc.y = cardY + cardH + 16;
  doc.x = 50;

  // Badge de statut
  const statutKey = data.statut || "BROUILLON";
  const statutLabel = t.statusLabels[statutKey] || statutKey;
  const statusText = `●  ${statutLabel}`;
  doc.fontSize(9);
  const sw = doc.widthOfString(statusText) + 28;
  ensureSpace(doc, ctx, 24 + 20);
  doc.roundedRect(cx - sw / 2, doc.y, sw, 24, 12).fill(COLORS.yellowBg);
  doc
    .fontSize(9)
    .fillColor(COLORS.orange)
    .text(statusText, cx - sw / 2, doc.y + 6, { width: sw, align: "center" });
  doc.y += 24 + 20;
  doc.x = 50;

  // Aperçu du stage
  ensureSpace(doc, ctx, 20);
  doc.fontSize(10).fillColor(COLORS.gray700).text(t.overview, 50, doc.y);
  doc.moveDown(0.6);
  doc.x = 50;

  const dureeLabel = t.months[data.stage?.dureeStage] || data.stage?.dureeStage || "—";
  const modeLabel = t.workModes[data.stage?.modeTravail] || data.stage?.modeTravail || "—";
  const remLabel =
    t.remuneration[data.stage?.remunerationType] ||
    data.stage?.remunerationType ||
    t.remuneration.selon_bareme;

  const overviewRows = [
    { label: t.jobTitle, value: data.stage?.intitulePoste },
    { label: t.duration, value: dureeLabel },
    { label: t.startDate, value: formatDate(data.stage?.dateDebut, locale) },
    {
      label: t.weeklyHours,
      value: data.stage?.volumeHoraireHebdo
        ? `${data.stage.volumeHoraireHebdo} ${t.hours}`
        : null,
    },
    { label: t.workMode, value: modeLabel },
    { label: t.gratification, value: remLabel },
  ];
  drawKeyValueTable(doc, ctx, overviewRows);

  // ─── Parties + Objet ──────────────────────────────────────────────────
  newContentPage(doc, ctx);

  drawSectionTitle(doc, ctx, 1, t.section1);
  drawParagraph(doc, ctx, t.section1Intro);

  ensureSpace(doc, ctx, 20);
  doc.fontSize(11).fillColor(COLORS.gray900).text(t.theIntern, 50, doc.y);
  doc.moveDown(0.3);
  doc.x = 50;
  drawKeyValueTable(doc, ctx, [
    { label: t.fullName, value: data.stagiaire?.nomComplet },
    { label: t.email, value: data.stagiaire?.email },
    { label: t.phone, value: data.stagiaire?.telephone },
    { label: t.establishment, value: data.stagiaire?.etablissement },
    { label: t.formation, value: data.stagiaire?.formationDiplome },
    {
      label: t.studyYear,
      value: data.stagiaire?.anneeEtude
        ? locale === "en"
          ? `Year ${data.stagiaire.anneeEtude}`
          : `${data.stagiaire.anneeEtude}ème année`
        : null,
    },
  ]);

  doc.moveDown(0.2);
  ensureSpace(doc, ctx, 20);
  doc.fontSize(11).fillColor(COLORS.gray900).text(t.theCompany, 50, doc.y);
  doc.moveDown(0.3);
  doc.x = 50;
  drawKeyValueTable(doc, ctx, [
    { label: t.companyName, value: data.entreprise?.nom },
    { label: t.sector, value: data.entreprise?.secteur },
    { label: t.address, value: data.entreprise?.adresseComplete },
    { label: t.country, value: data.entreprise?.pays },
    { label: t.email, value: data.entreprise?.email },
    { label: t.phone, value: data.entreprise?.telephone },
    {
      label: t.supervisor,
      value: data.superviseur
        ? `${data.superviseur.nom}${data.superviseur.fonction ? ` — ${data.superviseur.fonction}` : ""}`
        : null,
    },
    { label: t.supervisorContact, value: data.superviseur?.email || data.superviseur?.telephone },
  ]);

  doc.moveDown(0.2);
  ensureSpace(doc, ctx, 20);
  doc.fontSize(11).fillColor(COLORS.gray900).text(t.thePlatform, 50, doc.y);
  doc.moveDown(0.3);
  doc.x = 50;
  drawParagraph(doc, ctx, t.platformRole, { spacingAfter: 1 });

  drawSectionTitle(doc, ctx, 2, t.section2);
  drawParagraph(doc, ctx, t.section2Body);

  if (data.stage?.objectifsApprentissage) {
    const objLines = String(data.stage.objectifsApprentissage)
      .split(/\r?\n+/)
      .map((l) => l.replace(/^\d+[\.\)\-]\s*/, "").trim())
      .filter(Boolean);
    const objText = objLines.length
      ? objLines.map((l, i) => `${i + 1}. ${l}`).join("\n")
      : String(data.stage.objectifsApprentissage);
    doc.fontSize(9);
    const objW = doc.page.width - 116;
    const objTextH = doc.heightOfString(objText, { width: objW, align: "left" });
    const boxH = 14 + 14 + objTextH + 10;
    ensureSpace(doc, ctx, boxH + 8);
    const boxY = doc.y;
    doc.roundedRect(50, boxY, doc.page.width - 100, boxH, 6).fill(COLORS.gray50);
    doc.roundedRect(50, boxY, 4, boxH, 0).fill(COLORS.teal);
    doc.fontSize(9).fillColor(COLORS.tealDark).text(t.learningObjectives, 58, boxY + 10);
    doc
      .fontSize(9)
      .fillColor(COLORS.gray700)
      .text(objText, 58, boxY + 24, { width: objW, align: "left" });
    doc.y = boxY + boxH + 10;
    doc.x = 50;
  }

  // ─── Missions + Modalités + Encadrement ───────────────────────────────
  newContentPage(doc, ctx);

  drawSectionTitle(doc, ctx, 3, t.section3);
  drawParagraph(doc, ctx, t.section3Intro, { spacingAfter: 0.5 });

  const missions =
    Array.isArray(data.missions) && data.missions.length
      ? data.missions
      : data.stage?.objectifsApprentissage
        ? [data.stage.objectifsApprentissage]
        : [
            locale === "en"
              ? "Missions as defined in the final offer and learning objectives."
              : "Missions définies dans l'offre finale et les objectifs d'apprentissage.",
          ];

  drawBulletList(doc, ctx, missions, { spacingAfter: 0.35 });
  doc.moveDown(0.5);
  doc.x = 50;

  drawSectionTitle(doc, ctx, 4, t.section4);
  drawKeyValueTable(doc, ctx, [
    { label: t.startDate, value: formatDate(data.stage?.dateDebut, locale) },
    { label: t.duration, value: dureeLabel },
    {
      label: t.weeklyHours,
      value: data.stage?.volumeHoraireHebdo
        ? `${data.stage.volumeHoraireHebdo} ${t.hours}`
        : null,
    },
    { label: t.workMode, value: modeLabel },
    { label: t.gratification, value: remLabel },
    { label: t.leave, value: t.leaveValue },
  ]);
  doc.moveDown(0.2);
  drawParagraph(doc, ctx, t.amendmentNote, { fontSize: 8, color: COLORS.gray500, spacingAfter: 0.8 });

  drawSectionTitle(doc, ctx, 5, t.section5);
  drawParagraph(doc, ctx, t.section5Body, { spacingAfter: 0.5 });

  doc.fontSize(8);
  const disputeW = doc.page.width - 116;
  const disputeH = doc.heightOfString(t.disputeNote, { width: disputeW, align: "justify" });
  const noteBoxH = disputeH + 20;
  ensureSpace(doc, ctx, noteBoxH + 6);
  const noteY = doc.y;
  doc.roundedRect(50, noteY, doc.page.width - 100, noteBoxH, 6).fill(COLORS.yellowBg);
  doc
    .fontSize(8)
    .fillColor(COLORS.orange)
    .text(t.disputeNote, 58, noteY + 10, { width: disputeW, align: "justify" });
  doc.y = noteY + noteBoxH + 8;
  doc.x = 50;

  // ─── Obligations + Confidentialité + Assurance ────────────────────────
  newContentPage(doc, ctx);

  drawSectionTitle(doc, ctx, 6, t.section6);

  ensureSpace(doc, ctx, 16);
  doc.fontSize(10).fillColor(COLORS.gray900).text(t.companyCommits, 50, doc.y);
  doc.moveDown(0.3);
  doc.x = 50;
  drawBulletList(doc, ctx, t.companyObligations, { spacingAfter: 0.25 });
  doc.moveDown(0.5);
  doc.x = 50;

  ensureSpace(doc, ctx, 16);
  doc.fontSize(10).fillColor(COLORS.gray900).text(t.internCommits, 50, doc.y);
  doc.moveDown(0.3);
  doc.x = 50;
  drawBulletList(doc, ctx, t.internObligations, { spacingAfter: 0.25 });
  doc.moveDown(0.5);
  doc.x = 50;

  ensureSpace(doc, ctx, 16);
  doc.fontSize(10).fillColor(COLORS.gray900).text(t.platformCommits, 50, doc.y);
  doc.moveDown(0.3);
  doc.x = 50;
  drawBulletList(doc, ctx, t.platformObligations, { spacingAfter: 0.25 });
  doc.moveDown(0.6);
  doc.x = 50;

  drawSectionTitle(doc, ctx, 7, t.section7);
  drawParagraph(doc, ctx, t.section7Body, { spacingAfter: 0.8 });

  drawSectionTitle(doc, ctx, 8, t.section8);
  t.section8Body.split("\n\n").forEach((para) => {
    drawParagraph(doc, ctx, para, { spacingAfter: 0.6 });
  });

  // ─── Signatures + Historique ───────────────────────────────────────────
  newContentPage(doc, ctx);

  drawSectionTitle(doc, ctx, 9, t.section9);
  drawParagraph(doc, ctx, t.section9Intro, { spacingAfter: 1 });

  const sigW = 150;
  const sigGap = 14;
  const sigStart = (doc.page.width - (sigW * 3 + sigGap * 2)) / 2;

  function measureSigHeight(title, name, status, date) {
    let h = 12; // padding top
    doc.fontSize(8);
    h += doc.heightOfString(title, { width: sigW - 24 }) + 4;
    doc.fontSize(10);
    h += doc.heightOfString(name, { width: sigW - 24 }) + 10;
    h += 22 + 6; // badge
    if (date) {
      doc.fontSize(7);
      h += doc.heightOfString(date, { width: sigW - 24 }) + 4;
    }
    return h + 6;
  }

  const sig1 = {
    title: t.partyS,
    name: data.stagiaire?.nomComplet || "—",
    status: data.signatures?.stagiaire ? t.agreementRecorded : t.pendingSignature,
    ok: !!data.signatures?.stagiaire,
    date: formatDateShort(data.signatures?.dateStagiaire, locale),
  };
  const sig2 = {
    title: t.partyE,
    name: data.entreprise?.nom || "—",
    status: data.signatures?.entreprise ? t.agreementRecorded : t.pendingSignature,
    ok: !!data.signatures?.entreprise,
    date: formatDateShort(data.signatures?.dateEntreprise, locale),
  };
  const sig3 = {
    title: t.partyP,
    name: t.adminValidation,
    status: data.signatures?.plateforme ? t.agreementRecorded : t.pendingValidation,
    ok: !!data.signatures?.plateforme,
    date: formatDateShort(data.signatures?.datePlateforme, locale),
  };

  const sigH = Math.max(
    90,
    measureSigHeight(sig1.title, sig1.name, sig1.status, sig1.date),
    measureSigHeight(sig2.title, sig2.name, sig2.status, sig2.date),
    measureSigHeight(sig3.title, sig3.name, sig3.status, sig3.date),
  );

  function drawSigBox(x, box) {
    doc.roundedRect(x, sigY, sigW, sigH, 8).strokeColor(COLORS.gray300).lineWidth(1).stroke();
    doc.fontSize(8).fillColor(COLORS.gray500).text(box.title, x + 12, sigY + 12, {
      width: sigW - 24,
    });
    doc.fontSize(10).fillColor(COLORS.gray900).text(box.name, x + 12, doc.y + 4, {
      width: sigW - 24,
    });
    const badgeColor = box.ok ? COLORS.green : COLORS.orange;
    const badgeBg = box.ok ? COLORS.greenBg : COLORS.orangeBg;
    const badgeY = sigH - (box.date ? 46 : 34) + sigY;
    doc.roundedRect(x + 12, badgeY, sigW - 24, 22, 6).fill(badgeBg);
    doc
      .fontSize(8)
      .fillColor(badgeColor)
      .text(`●  ${box.status}`, x + 12, badgeY + 7, {
        width: sigW - 24,
        align: "center",
      });
    if (box.date) {
      doc
        .fontSize(7)
        .fillColor(COLORS.gray500)
        .text(box.date, x + 12, badgeY + 26, { width: sigW - 24, align: "center" });
    }
  }

  ensureSpace(doc, ctx, sigH + 16);
  const sigY = doc.y;
  drawSigBox(sigStart, sig1);
  drawSigBox(sigStart + sigW + sigGap, sig2);
  drawSigBox(sigStart + (sigW + sigGap) * 2, sig3);

  doc.y = sigY + sigH + 20;
  doc.x = 50;

  drawSectionTitle(doc, ctx, 10, t.section10);
  drawKeyValueTable(doc, ctx, [
    { label: t.created, value: formatDate(data.historique?.dateCreation, locale) },
    {
      label: t.companyAgreement,
      value: data.historique?.dateAcceptationEntreprise
        ? formatDate(data.historique.dateAcceptationEntreprise, locale)
        : t.pending,
    },
    {
      label: t.platformValidation,
      value: data.historique?.dateValidationPlateforme
        ? formatDate(data.historique.dateValidationPlateforme, locale)
        : t.pending,
    },
    {
      label: t.internSignature,
      value: data.historique?.dateAcceptationStagiaire
        ? formatDate(data.historique.dateAcceptationStagiaire, locale)
        : t.pending,
    },
  ]);

  doc.moveDown(1.2);
  drawParagraph(doc, ctx, t.legalFooter, { fontSize: 7, color: COLORS.gray500, spacingAfter: 0.5 });

  doc.fontSize(8);
  ensureSpace(doc, ctx, 16);
  doc
    .fontSize(8)
    .fillColor(COLORS.gray500)
    .text(`InternIn · ${t.title} · ${numero}`, 50, doc.y, {
      align: "center",
      width: doc.page.width - 100,
    });

  // ─── Pieds de page (numérotation exacte, connue une fois tout généré) ──
  const range = doc.bufferedPageRange();
  const totalPages = range.count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(range.start + i);
    drawFooterOnPage(doc, t, i + 1, totalPages);
  }

  doc.end();

  return `conventions/${filename}`;
}
