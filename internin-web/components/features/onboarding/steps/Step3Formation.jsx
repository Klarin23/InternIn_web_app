"use client";
// Étape 3 : cursus académique. useFieldArray gère la liste dynamique
// de formations (relation 1-n avec la table `formations`), permettant
// d'ajouter/retirer des entrées sans re-render manuel de tableau.

import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { step3Schema } from "@/lib/schemas/onboarding.schema";
import { useOnboardingStore } from "@/lib/store/useOnboardingStore";

const EMPTY_FORMATION = {
  typeFormation: undefined,
  nomUniversite: "",
  faculte: "",
  departement: "",
  diplome: "",
  anneeEtude: "",
  anneeObtention: "",
};

export default function Step3Formation() {
  const router = useRouter();
  const { data, saveStepData } = useOnboardingStore();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      formations: data.formations?.length ? data.formations : [EMPTY_FORMATION],
    },
  });

  // Gère l'ajout/suppression dynamique d'entrées dans le tableau "formations"
  const { fields, append, remove } = useFieldArray({ control, name: "formations" });

  const onSubmit = (values) => {
    saveStepData(values);
    router.push("/onboarding/3");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h1 className="mb-1.5 text-2xl font-bold text-foreground">
          Votre parcours académique
        </h1>
        <p className="text-sm text-muted-foreground">
          Ajoutez votre formation actuelle, et toute autre formation déjà
          obtenue si pertinent.
        </p>
      </div>

      {fields.map((field, index) => {
        // Lit en temps réel le type sélectionné pour cette entrée précise,
        // afin d'afficher le bon champ d'année (étude en cours vs obtenue)
        // eslint-disable-next-line react-hooks/incompatible-library
        const typeFormation = watch(`formations.${index}.typeFormation`);

        return (
          <div
            key={field.id}
            className="space-y-4 rounded-md border border-border bg-card p-5"
          >
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-semibold text-foreground">
                Formation {index + 1}
              </h5>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Supprimer cette formation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Statut</Label>
              <Controller
                name={`formations.${index}.typeFormation`}
                control={control}
                render={({ field: selectField }) => (
                  <Select
                    value={selectField.value}
                    onValueChange={selectField.onChange}
                  >
                    <SelectTrigger className="h-12 w-full rounded-sm">
                      <SelectValue placeholder="En cours ou déjà obtenue ?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_cours">
                        Formation en cours
                      </SelectItem>
                      <SelectItem value="obtenue">Formation obtenue</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.formations?.[index]?.typeFormation && (
                <p className="text-xs text-destructive">
                  {errors.formations[index].typeFormation.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Établissement</Label>
              <Input
                className="h-12 rounded-sm"
                placeholder="Nom de l'université / école"
                {...register(`formations.${index}.nomUniversite`)}
              />
              {errors.formations?.[index]?.nomUniversite && (
                <p className="text-xs text-destructive">
                  {errors.formations[index].nomUniversite.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>
                  Faculté{" "}
                  <span className="text-muted-foreground">(facultatif)</span>
                </Label>
                <Input
                  className="h-12 rounded-sm"
                  {...register(`formations.${index}.faculte`)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Département{" "}
                  <span className="text-muted-foreground">(facultatif)</span>
                </Label>
                <Input
                  className="h-12 rounded-sm"
                  {...register(`formations.${index}.departement`)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Diplôme</Label>
              <Input
                className="h-12 rounded-sm"
                placeholder="Ex : Licence en Génie Logiciel"
                {...register(`formations.${index}.diplome`)}
              />
              {errors.formations?.[index]?.diplome && (
                <p className="text-xs text-destructive">
                  {errors.formations[index].diplome.message}
                </p>
              )}
            </div>

            {/* Champ d'année conditionnel selon le statut sélectionné */}
            {typeFormation === "en_cours" && (
              <div className="space-y-1.5">
                <Label>Année d&apos;étude actuelle</Label>
                <Input
                  type="number"
                  className="h-12 rounded-sm"
                  placeholder="Ex : 3"
                  {...register(`formations.${index}.anneeEtude`)}
                />
              </div>
            )}
            {typeFormation === "obtenue" && (
              <div className="space-y-1.5">
                <Label>Année d&apos;obtention</Label>
                <Input
                  type="number"
                  className="h-12 rounded-sm"
                  placeholder="Ex : 2024"
                  {...register(`formations.${index}.anneeObtention`)}
                />
              </div>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-sm"
        onClick={() => append(EMPTY_FORMATION)}
      >
        <Plus className="h-4 w-4" />
        Ajouter une formation
      </Button>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-12 rounded-sm"
          onClick={() => router.push("/onboarding/1")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-12 flex-1 rounded-sm"
        >
          Continuer
        </Button>
      </div>
    </form>
  );
}