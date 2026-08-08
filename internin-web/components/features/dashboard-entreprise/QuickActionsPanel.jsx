"use client";
// Section "Actions rapides" : 4 raccourcis vers les tâches les plus fréquentes
// de l'espace entreprise. RippleButton gère le ripple + press (95%) au clic ;
// whileHover gère la légère élévation au survol.

import { useRouter } from "next/navigation";
import { FiPlusCircle, FiUserPlus, FiSearch, FiUsers } from "react-icons/fi";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import RippleButton from "@/components/motion/RippleButton";

const ACTIONS = [
  {
    key: "publier-offre",
    icon: FiPlusCircle,
    label: "Publier une offre",
    href: "/offres-entreprise?nouvelle=1",
    color: "bg-primary/10 text-primary",
  },
  {
    key: "inviter-membre",
    icon: FiUserPlus,
    label: "Inviter un membre",
    href: "/equipe?inviter=1",
    color: "bg-orange-700/10 text-red-500",
  },
  {
    key: "rechercher-stagiaire",
    icon: FiSearch,
    label: "Rechercher un stagiaire",
    href: "/candidats",
    color: "bg-accent/40 text-amber-700",
  },
  {
    key: "voir-candidatures",
    icon: FiUsers,
    label: "Voir les candidatures",
    href: "/candidats",
    color: "bg-success/10 text-green-700",
  },
];

export default function QuickActionsPanel() {
  const router = useRouter();

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <h5 className="mb-4 text-sm font-semibold text-foreground">
        Actions rapides
      </h5>
      <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ACTIONS.map(({ key, icon: Icon, label, href, color }) => (
          <StaggerItem key={key}>
            <RippleButton
              variant="outline"
              whileHover={{ y: -2, scale: 1.01 }}
              onClick={() => router.push(href)}
              className="h-auto w-full justify-start gap-3 rounded-md border-border bg-background px-4 py-3 text-left hover:border-primary/40 hover:bg-background hover:shadow-sm"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${color}`}
              >
                <Icon className="h-4.5 w-4.5" />
              </span>
              <span className="text-sm font-medium text-foreground">
                {label}
              </span>
            </RippleButton>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
