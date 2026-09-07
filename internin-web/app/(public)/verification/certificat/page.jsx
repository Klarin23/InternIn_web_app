"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Entrée sans code → écran formulaire (route dynamique avec placeholder). */
export default function VerificationCertificatIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/verification/certificat/-");
  }, [router]);
  return null;
}
