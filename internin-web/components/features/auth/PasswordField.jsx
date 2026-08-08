"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Lock, Check, X } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { useTranslation } from "@/lib/i18n/useTranslation";
import { getPasswordRequirements } from "@/lib/validation/passwordPolicy";

export default function PasswordField({
  id = "password",
  label,
  placeholder = "••••••••",
  value,
  onChange,
  registration,
  error,
  name = "password",
  autoComplete = "new-password",
  disabled = false,
  required = true,
  showRequirements = true,
}) {
  const { t } = useTranslation();

  const [showPassword, setShowPassword] = useState(false);

  // Suivi interne de la saisie : nécessaire quand le champ est branché
  // via `registration` (react-hook-form) plutôt que via `value`/`onChange`
  // contrôlés par le parent — sinon on n'a aucun moyen de savoir si
  // l'utilisateur a commencé à taper quelque chose.
  const [internalValue, setInternalValue] = useState("");

  const currentValue = value !== undefined ? value : internalValue;

  const handleChange = (event) => {
    setInternalValue(event.target.value);
    registration?.onChange?.(event);
    onChange?.(event);
  };

  const requirements = getPasswordRequirements(currentValue || "");

  const rules = [
    {
      key: "minLength",
      label: t("auth.passwordRequirements.minLength"),
    },
    {
      key: "uppercase",
      label: t("auth.passwordRequirements.uppercase"),
    },
    {
      key: "lowercase",
      label: t("auth.passwordRequirements.lowercase"),
    },
    {
      key: "number",
      label: t("auth.passwordRequirements.number"),
    },
    {
      key: "special",
      label: t("auth.passwordRequirements.special"),
    },
  ];

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        <Lock
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />

        <Input
          id={id}
          {...(registration ?? { name })}
          type={showPassword ? "text" : "password"}
          {...(value !== undefined ? { value } : {})}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          className="pl-10 pr-10"
        />

        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          aria-label={
            showPassword ? t("auth.password.hide") : t("auth.password.show")
          }
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <AnimatePresence initial={false}>
        {showRequirements && currentValue.length > 0 && (
          <motion.div
            key="password-requirements"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="rounded-md border border-border/60 bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {t("auth.passwordRequirements.title")}
              </p>

              <div className="grid gap-1.5">
                {rules.map((rule) => {
                  const valid = requirements[rule.key];

                  return (
                    <div
                      key={rule.key}
                      className={
                        valid
                          ? "flex items-center gap-2 rounded-md bg-green-50 px-2 py-1.5 text-xs font-medium text-green-600 transition-all duration-200 dark:bg-green-950/30 dark:text-green-500"
                          : "flex items-center gap-2 rounded-md bg-red-50 px-2 py-1.5 text-xs font-medium text-red-600 transition-all duration-200 dark:bg-red-950/30 dark:text-red-500"
                      }
                    >
                      {valid ? (
                        <Check
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <X
                          className="h-3.5 w-3.5 shrink-0"
                          aria-hidden="true"
                        />
                      )}

                      <span>{rule.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
