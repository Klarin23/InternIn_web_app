// Store transitoire (pas de persist) pour les notifications éphémères de type
// "toast" — distinct de useNotifications (celles-ci viennent du backend et
// s'accumulent dans la cloche). Un toast, lui, s'affiche puis disparaît seul.

import { create } from "zustand";

let idCounter = 0;

export const useToastStore = create((set, get) => ({
  toasts: [],

  showToast: ({ message, variant = "success", duration = 4000 }) => {
    const id = ++idCounter;
    set((state) => ({
      toasts: [...state.toasts, { id, message, variant }],
    }));
    setTimeout(() => get().dismissToast(id), duration);
    return id;
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

// Helper d'appel direct, sans avoir à importer le hook Zustand partout :
// toast.success("Offre publiée"), toast.error("Une erreur est survenue")
export const toast = {
  success: (message, opts) =>
    useToastStore
      .getState()
      .showToast({ message, variant: "success", ...opts }),
  error: (message, opts) =>
    useToastStore.getState().showToast({ message, variant: "error", ...opts }),
  info: (message, opts) =>
    useToastStore.getState().showToast({ message, variant: "info", ...opts }),
};
