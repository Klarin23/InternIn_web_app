"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Petits composants de champ, mutualisés entre les étapes du wizard, pour
// garder un style et une gestion d'erreur cohérents (reprend le pattern déjà
// utilisé par l'ancien OffreForm.jsx, juste extrait pour être réutilisable).

export function FormTextField({
  id,
  label,
  optional,
  placeholder,
  helper,
  error,
  registration,
  type = "text",
  ...rest
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}{" "}
        {optional && (
          <span className="text-muted-foreground">(facultatif)</span>
        )}
      </Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        className="h-12 rounded-sm"
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...registration}
        {...rest}
      />
      {helper && !error && (
        <p className="text-xs text-muted-foreground">{helper}</p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormTextareaField({
  id,
  label,
  optional,
  placeholder,
  rows = 4,
  helper,
  error,
  registration,
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}{" "}
        {optional && (
          <span className="text-muted-foreground">(facultatif)</span>
        )}
      </Label>
      <textarea
        id={id}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full resize-y rounded-sm border border-border bg-background px-3.5 py-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none"
        {...registration}
      />
      {helper && !error && (
        <p className="text-xs text-muted-foreground">{helper}</p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
