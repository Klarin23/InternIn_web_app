import { FiAward, FiDownload, FiShield } from "react-icons/fi";

export default function CertificatCard({ certificat }) {
  if (!certificat) return null;

  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <FiAward className="h-5 w-5 text-primary" />
        <h6 className="font-semibold text-foreground">Certificat de stage</h6>
      </div>
      <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <FiShield className="h-3.5 w-3.5" />
        Code de vérification : {certificat.codeVerification}
          </p>
          <a
      
        href={certificat.urlFichier}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex w-fit items-center gap-1.5 rounded-sm bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
      >
        <FiDownload className="h-4 w-4" />
        Télécharger le certificat
      </a>
    </div>
  );
}