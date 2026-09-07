/**
 * Système de couleurs Admin Dashboard — accents fonctionnels uniquement.
 * Ne pas utiliser comme grandes surfaces pleines.
 */
export const DASH_TONES = {
  teal: {
    icon: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    dot: "bg-teal-500",
    bar: "bg-teal-500",
    text: "text-teal-700 dark:text-teal-400",
    soft: "bg-teal-500/[0.06] border-teal-500/15",
    ring: "ring-teal-500/20",
  },
  purple: {
    icon: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
    bar: "bg-violet-500",
    text: "text-violet-700 dark:text-violet-400",
    soft: "bg-violet-500/[0.06] border-violet-500/15",
    ring: "ring-violet-500/20",
  },
  blue: {
    icon: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
    bar: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-400",
    soft: "bg-blue-500/[0.06] border-blue-500/15",
    ring: "ring-blue-500/20",
  },
  green: {
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    soft: "bg-emerald-500/[0.06] border-emerald-500/15",
    ring: "ring-emerald-500/20",
  },
  amber: {
    icon: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    soft: "bg-amber-500/[0.07] border-amber-500/20",
    ring: "ring-amber-500/20",
  },
  red: {
    icon: "bg-red-500/10 text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    bar: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
    soft: "bg-red-500/[0.06] border-red-500/20",
    ring: "ring-red-500/25",
  },
  indigo: {
    icon: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    dot: "bg-indigo-500",
    bar: "bg-indigo-500",
    text: "text-indigo-700 dark:text-indigo-400",
    soft: "bg-indigo-500/[0.06] border-indigo-500/15",
    ring: "ring-indigo-500/20",
  },
  neutral: {
    icon: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground/50",
    bar: "bg-foreground/70",
    text: "text-muted-foreground",
    soft: "bg-card border-border",
    ring: "",
  },
};

export function toneOf(key) {
  return DASH_TONES[key] || DASH_TONES.neutral;
}
