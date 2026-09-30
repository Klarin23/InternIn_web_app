"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n/useTranslation";

function Dialog({ ...props }) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

/** Cible issue d'un menu/select/popover Radix rendu en portal (hors DialogContent). */
function isPortaledMenuTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      [
        '[data-slot="select-content"]',
        "[data-radix-select-content]",
        "[data-radix-select-viewport]",
        '[data-slot="popover-content"]',
        "[data-radix-popover-content]",
        '[data-slot="dropdown-menu-content"]',
        "[data-radix-dropdown-menu-content]",
        '[role="listbox"]',
      ].join(", "),
    ),
  );
}

// Combien de temps après la fermeture d'un menu imbriqué (Select, Popover…)
// on continue d'ignorer une tentative de fermeture du Dialog. Ce délai n'a
// pas besoin d'être précis au timing exact des événements internes de
// Radix : il doit juste être largement supérieur au temps que prend React
// pour traiter un changement d'état (quelques ms), tout en restant
// imperceptible pour l'utilisateur. 300 ms couvre confortablement les deux.
const PORTALED_MENU_GRACE_MS = 300;

/**
 * Contexte permettant à un menu en portal (Select, futur Popover/DropdownMenu…)
 * imbriqué dans un Dialog de signaler ses changements d'état d'ouverture au
 * Dialog parent, via le callback `onOpenChange` PUBLIC et garanti par Radix —
 * plutôt que de tenter de déduire cet état en relisant le DOM après coup
 * (attribut `data-state`), ce qui s'est révélé être une source de bug :
 * Radix peut avoir déjà fermé/démonté le menu, ou mis à jour son
 * `data-state`, avant que le Dialog n'ait eu l'occasion de vérifier l'état,
 * selon l'ordre — non garanti et non documenté — dans lequel les
 * gestionnaires internes de Radix s'exécutent pour un même clic.
 *
 * En s'appuyant sur `onOpenChange` (toujours appelé, dans un ordre ou dans
 * l'autre, autour du moment où Radix décide de fermer le Dialog) combiné à
 * une courte fenêtre de grâce, le correctif fonctionne quel que soit cet
 * ordre : que le menu se signale "fermé" avant ou après que le Dialog
 * vérifie, le résultat est correct dans les deux cas.
 */
const PortaledMenuActivityContext = React.createContext(null);

function usePortaledMenuActivityReporter() {
  const report = React.useContext(PortaledMenuActivityContext);
  // En dehors d'un Dialog (Select utilisé seul), pas de garde à alimenter.
  return report ?? (() => {});
}

/**
 * Empêche le Dialog de se fermer lorsque l'utilisateur ferme un
 * Select/Popover imbriqué en cliquant « à côté » sans rien choisir.
 * Un second clic réellement hors du Dialog (au-delà de la fenêtre de grâce)
 * conserve le comportement normal de fermeture.
 */
function preventDialogDismissForPortaledMenu(event, activityState) {
  const target = event.target;
  const menuRecemmentActif =
    Boolean(activityState) &&
    (activityState.openCount > 0 ||
      Date.now() - activityState.lastCloseAt < PORTALED_MENU_GRACE_MS);

  if (isPortaledMenuTarget(target) || menuRecemmentActif) {
    event.preventDefault();
    return true;
  }
  return false;
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  onPointerDownOutside,
  onInteractOutside,
  onFocusOutside,
  ...props
}) {
  const { t } = useTranslation();
  // openCount : nombre de menus imbriqués (Select…) actuellement ouverts.
  // lastCloseAt : horodatage de la dernière fermeture d'un tel menu.
  const menuActivityRef = React.useRef({ openCount: 0, lastCloseAt: 0 });
  const reportPortaledMenuOpenChange = React.useCallback((isOpen) => {
    const state = menuActivityRef.current;
    if (isOpen) {
      state.openCount += 1;
    } else {
      state.openCount = Math.max(0, state.openCount - 1);
      state.lastCloseAt = Date.now();
    }
  }, []);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
        onPointerDownOutside={(event) => {
          preventDialogDismissForPortaledMenu(event, menuActivityRef.current);
          onPointerDownOutside?.(event);
        }}
        onInteractOutside={(event) => {
          preventDialogDismissForPortaledMenu(event, menuActivityRef.current);
          onInteractOutside?.(event);
        }}
        onFocusOutside={(event) => {
          preventDialogDismissForPortaledMenu(event, menuActivityRef.current);
          onFocusOutside?.(event);
        }}
      >
        <PortaledMenuActivityContext.Provider value={reportPortaledMenuOpenChange}>
          {children}
        </PortaledMenuActivityContext.Provider>
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button
              variant="ghost"
              className="absolute top-2 right-2"
              size="icon-sm"
            >
              <XIcon />
              <span className="sr-only">{t("auditUi.shared.close")}</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}) {
  const { t } = useTranslation();
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="outline">{t("auditUi.shared.close")}</Button>
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function DialogTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  usePortaledMenuActivityReporter,
};
