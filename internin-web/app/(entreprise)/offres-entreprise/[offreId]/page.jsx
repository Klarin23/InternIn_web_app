"use client";

import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiLoader } from "react-icons/fi";
import AppHeader from "@/components/layout/AppHeader";
import OffreForm from "@/components/features/offres-entreprise/OffreForm";
import { useOffreEntreprise } from "@/lib/queries/useCreateOffre";

export default function EditerOffrePage() {
  const router = useRouter();
  const { offreId } = useParams();
  const { data: offre, isLoading, isError } = useOffreEntreprise(offreId);

  return (
    <>
      <AppHeader
        breadcrumb={[
          { label: "Offres de stage" },
          { label: "Modifier l'offre" },
        ]}
      />
      <div className="mx-auto max-w-[700px] p-6">
        <button
          onClick={() => router.push("/offres-entreprise")}
          className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
        >
          <FiArrowLeft className="h-4 w-4" />
          Retour à mes offres
        </button>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
            <FiLoader className="h-5 w-5 animate-spin" />
            Chargement...
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            Cette offre est introuvable.
          </p>
        )}

        {offre && <OffreForm existingOffre={offre} />}
      </div>
    </>
  );
}
