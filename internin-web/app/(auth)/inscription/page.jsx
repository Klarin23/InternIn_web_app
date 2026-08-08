import RoleSelection from "@/components/features/auth/RoleSelection";

export const metadata = {
  title: "InternIn — Créer un compte",
  description: "Créez votre compte étudiant, entreprise ou université.",
};

export default function InscriptionPage() {
  return <RoleSelection />;
}
