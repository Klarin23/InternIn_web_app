"use client";

import { motion } from "framer-motion";

// Carte de section du formulaire d'édition : icône + titre + courte
// description + contenu. `sectionRef` permet au parent de scroller jusqu'à
// la section depuis la navigation latérale.
function EditProfilFormSection({ id, sectionRef, icon: Icon, title, description, children }) {
  return (
    <motion.div
      id={id}
      ref={sectionRef}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
      }}
      className="scroll-mt-3 rounded-md border border-border bg-card p-4 sm:p-5"
    >
      <div className="mb-4 flex items-start gap-2.5">
        {Icon && (
          <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

export default EditProfilFormSection;
