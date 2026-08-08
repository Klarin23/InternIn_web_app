"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { motion } from "framer-motion";
import { Loader2, Check } from "lucide-react";
import { FiHeart } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProfilSectionCard from "./ProfilSectionCard";
import { useCentresInteret } from "@/lib/queries/useCentresInteret";
import { useUpdateStagiaireProfile } from "@/lib/queries/useStagiaireProfile";

export default function CentresInteretSection({ profil }) {
  const [open, setOpen] = useState(false);
  const { data: liste, isLoading } = useCentresInteret();
  const updateProfile = useUpdateStagiaireProfile();

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm({
    values: {
      centresInteret: (profil.centresInteret || []).map(
        (c) => c.idCentreInteret,
      ),
    },
  });

  function onSubmit(values) {
    updateProfile.mutate(values, { onSuccess: () => setOpen(false) });
  }

  return (
    <>
      <ProfilSectionCard
        title="Centres d'intérêt"
        icon={FiHeart}
        onEdit={() => setOpen(true)}
      >
        {!profil.centresInteret?.length ? (
          <p className="text-sm text-muted-foreground">
            Aucun centre d&apos;intérêt renseigné.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profil.centresInteret.map((c) => (
              <motion.span
                key={c.idCentreInteret}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.15 }}
                className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-sm text-foreground transition-colors duration-150 hover:border-primary/50 hover:bg-primary/5"
              >
                {c.nom}
              </motion.span>
            ))}
          </div>
        )}
      </ProfilSectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Centres d&apos;intérêt</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Chargement...
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Controller
                name="centresInteret"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {(liste || []).map((c) => {
                      const active = field.value.includes(c.idCentreInteret);
                      return (
                        <button
                          type="button"
                          key={c.idCentreInteret}
                          onClick={() =>
                            field.onChange(
                              active
                                ? field.value.filter(
                                    (id) => id !== c.idCentreInteret,
                                  )
                                : [...field.value, c.idCentreInteret],
                            )
                          }
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-foreground hover:border-primary/50"
                          }`}
                        >
                          {active && <Check className="h-3.5 w-3.5" />}
                          {c.nom}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
              <Button type="submit" disabled={isSubmitting} className="w-full">
                Enregistrer
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
