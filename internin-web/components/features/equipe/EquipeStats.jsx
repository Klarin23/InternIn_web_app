"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiUsers, FiUserCheck, FiClock, FiShield } from "react-icons/fi";

function AnimatedCounter({ value }) {
  const [affiche, setAffiche] = useState(0);

  useEffect(() => {
    let frame;
    const duree = 700;
    const debut = performance.now();
    function tick(maintenant) {
      const progres = Math.min((maintenant - debut) / duree, 1);
      const ease = 1 - Math.pow(1 - progres, 3);
      setAffiche(Math.round(ease * value));
      if (progres < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <>{affiche}</>;
}

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.07, ease: "easeOut" },
  }),
};

function StatCard({ index, icon: Icon, value, label, iconBg }) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2 }}
      className="rounded-md border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-full ${iconBg}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xl font-bold tabular-nums text-foreground">
        <AnimatedCounter value={value} />
      </div>
      <div className="mt-0.5 text-xs font-medium text-muted-foreground">
        {label}
      </div>
    </motion.div>
  );
}

export default function EquipeStats({ membres = [] }) {
  const total = membres.length;
  const actifs = membres.filter((m) => m.statutMembre === "actif").length;
  const enAttente = membres.filter((m) => m.statutMembre === "invite").length;
  const admins = membres.filter(
    (m) =>
      m.roleEquipe === "administrateur_principal" ||
      m.estAdminPrincipal,
  ).length;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        index={0}
        icon={FiUsers}
        value={total}
        label="Total membres"
        iconBg="bg-[#14b8a6] text-white"
      />
      <StatCard
        index={1}
        icon={FiUserCheck}
        value={actifs}
        label="Membres actifs"
        iconBg="bg-emerald-500 text-white"
      />
      <StatCard
        index={2}
        icon={FiClock}
        value={enAttente}
        label="Invitations en attente"
        iconBg="bg-amber-500 text-white"
      />
      <StatCard
        index={3}
        icon={FiShield}
        value={admins}
        label="Administrateurs"
        iconBg="bg-violet-500 text-white"
      />
    </div>
  );
}
