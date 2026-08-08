import PageTransition from "@/components/motion/PageTransition";

// template.jsx (contrairement à layout.jsx) est remonté à chaque navigation
// entre pages de ce groupe — c'est ce qui permet à PageTransition de rejouer
// son animation d'entrée à chaque changement de page dans l'espace Entreprise.
export default function EntrepriseTemplate({ children }) {
  return <PageTransition>{children}</PageTransition>;
}
