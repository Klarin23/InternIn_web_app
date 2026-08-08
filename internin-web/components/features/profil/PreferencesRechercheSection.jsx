"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { motion } from "framer-motion";
import { FiTarget } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProfilSectionCard from "./ProfilSectionCard";
import TagInput from "./TagInput";
import { useUpdateStagiaireProfile } from "@/lib/queries/useStagiaireProfile";

const MODALITES = [
  { value: "presentiel", label: "Présentiel" },
  { value: "hybride", label: "Hybride" },
  { value: "distance", label: "Distance" },
];

const REMUNERATION_LABELS = {
  aucune: "Aucune",
  indemnite_transport: "Indemnité de transport",
  indemnite_repas: "Indemnité de repas",
  allocation_mensuelle: "Allocation mensuelle",
  indemnite_internet_appel: "Indemnité internet / appel",
};

function Badge({ children }) {
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.15 }}
      className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground transition-colors duration-150 hover:border-primary/50 hover:bg-primary/5"
    >
      {children}
    </motion.span>
  );
}

export default function PreferencesRechercheSection({ profil }) {
  const [open, setOpen] = useState(false);
  const updateProfile = useUpdateStagiaireProfile();

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm({
    values: {
      secteursRecherches: profil.secteursRecherches || [],
      villesRecherchees: profil.villesRecherchees || [],
      modalitesTravailSouhaitees: profil.modalitesTravailSouhaitees || [],
      remunerationSouhaitee: profil.remunerationSouhaitee || "",
    },
  });

  function onSubmit(values) {
    updateProfile.mutate(values, { onSuccess: () => setOpen(false) });
  }

  const modalitesLabels = (profil.modalitesTravailSouhaitees || [])
    .map((m) => MODALITES.find((x) => x.value === m)?.label)
    .filter(Boolean);

  return (
    <>
      <ProfilSectionCard
        title="Préférences de recherche"
        icon={FiTarget}
        onEdit={() => setOpen(true)}
      >
        <div className="space-y-4">
          <div>
            <dt className="mb-1.5 text-xs text-muted-foreground">
              Secteurs recherchés
            </dt>
            {profil.secteursRecherches?.length ? (
              <div className="flex flex-wrap gap-2">
                {profil.secteursRecherches.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
            ) : (
              <dd className="text-sm text-foreground">—</dd>
            )}
          </div>
          <div>
            <dt className="mb-1.5 text-xs text-muted-foreground">Villes</dt>
            {profil.villesRecherchees?.length ? (
              <div className="flex flex-wrap gap-2">
                {profil.villesRecherchees.map((v) => (
                  <Badge key={v}>{v}</Badge>
                ))}
              </div>
            ) : (
              <dd className="text-sm text-foreground">—</dd>
            )}
          </div>
          <div>
            <dt className="mb-1.5 text-xs text-muted-foreground">Modalité</dt>
            {modalitesLabels.length ? (
              <div className="flex flex-wrap gap-2">
                {modalitesLabels.map((m) => (
                  <Badge key={m}>{m}</Badge>
                ))}
              </div>
            ) : (
              <dd className="text-sm text-foreground">—</dd>
            )}
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">
              Rémunération souhaitée
            </dt>
            <dd className="text-sm text-foreground">
              {REMUNERATION_LABELS[profil.remunerationSouhaitee] || "—"}
            </dd>
          </div>
        </div>
      </ProfilSectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Préférences de recherche</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label>Secteurs recherchés</Label>
              <Controller
                name="secteursRecherches"
                control={control}
                render={({ field }) => (
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Ex. Fintech, E-commerce..."
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Villes</Label>
              <Controller
                name="villesRecherchees"
                control={control}
                render={({ field }) => (
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Ex. Abidjan, Dakar..."
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Modalité de travail</Label>
              <Controller
                name="modalitesTravailSouhaitees"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-4">
                    {MODALITES.map((m) => (
                      <label
                        key={m.value}
                        className="flex items-center gap-2 text-sm text-foreground"
                      >
                        <Checkbox
                          checked={field.value.includes(m.value)}
                          onCheckedChange={(checked) =>
                            field.onChange(
                              checked
                                ? [...field.value, m.value]
                                : field.value.filter((v) => v !== m.value),
                            )
                          }
                        />
                        {m.label}
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Type de rémunération souhaité</Label>
              <Controller
                name="remunerationSouhaitee"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REMUNERATION_LABELS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              Enregistrer
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
