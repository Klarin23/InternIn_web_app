"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Globe } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { toast } from "@/lib/store/useToastStore";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  {
    code: "fr",
    flag: "🇫🇷",
    nameKey: "entrepriseSpace.settings.language.french",
    descKey: "entrepriseSpace.settings.language.frenchDesc",
  },
  {
    code: "en",
    flag: "🇬🇧",
    nameKey: "entrepriseSpace.settings.language.english",
    descKey: "entrepriseSpace.settings.language.englishDesc",
  },
];

/**
 * Sélecteur de langue premium — réutilise useI18nStore (persisté).
 * Dropdown en portal pour éviter le clip par overflow des parents.
 */
export default function LanguagePicker({ className }) {
  const { t, locale, setLocale } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listId = useId();

  const current =
    LANGUAGES.find((l) => l.code === locale) || LANGUAGES[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  function updatePosition() {
    const el = buttonRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    function onScrollOrResize() {
      updatePosition();
    }
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        const menu = document.getElementById(listId);
        if (menu && menu.contains(e.target)) return;
        setOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, listId]);

  async function select(code) {
    if (code === locale || pending) {
      setOpen(false);
      return;
    }
    setPending(true);
    try {
      setLocale(code);
      setOpen(false);
      toast.success(t("entrepriseSpace.settings.language.saved"));
    } catch {
      toast.error(t("entrepriseSpace.settings.language.error"));
    } finally {
      setPending(false);
    }
  }

  const menu = open && mounted
    ? createPortal(
        <AnimatePresence>
          <motion.ul
            id={listId}
            role="listbox"
            aria-label={t("entrepriseSpace.settings.language.title")}
            initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              width: menuPos.width,
              zIndex: 80,
            }}
            className="overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-lg"
          >
            {LANGUAGES.map((lang) => {
              const active = locale === lang.code;
              return (
                <li key={lang.code} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => select(lang.code)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted/60",
                    )}
                  >
                    <span className="text-base" aria-hidden>
                      {lang.flag}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {t(lang.nameKey)}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {t(lang.descKey)}
                      </span>
                    </span>
                    {active && <Check className="size-4 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        </AnimatePresence>,
        document.body,
      )
    : null;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!open) updatePosition();
          setOpen((v) => !v);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t("entrepriseSpace.settings.language.title")}
        disabled={pending}
        className={cn(
          "flex w-full items-start gap-3 rounded-xl border border-border/80 bg-background px-4 py-3.5 text-left transition",
          "hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          open && "border-primary/40 ring-2 ring-primary/15",
          pending && "opacity-70",
        )}
      >
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Globe className="size-5" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">
            {t("entrepriseSpace.settings.language.title")}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-sm text-foreground">
            <span aria-hidden>{current.flag}</span>
            {t(current.nameKey)}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {pending
              ? t("entrepriseSpace.settings.language.changing")
              : t(current.descKey)}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {menu}
    </div>
  );
}
