import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getEntrepriseNotifPrefsRequest,
  updateEntrepriseNotifPrefsRequest,
} from "@/lib/api/notifications";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "@/lib/store/useToastStore";

export const ENTREPRISE_NOTIF_PREFS_KEY = "entrepriseNotifPrefs";

const DEFAULT_PREFS = {
  messages: true,
  candidatures: true,
  evaluations: true,
  equipe: true,
};

const LEGACY_LOCAL_KEY = "internin-entreprise-notif-prefs";

/**
 * Migration one-shot : si des prefs existent encore en localStorage et que le
 * backend n'a pas encore de ligne (tous les flags = défaut true côté client
 * après GET), on pousse les valeurs locales puis on nettoie la clé.
 * La BDD devient ensuite la seule source de vérité.
 */
async function maybeMigrateLocalPrefs(token, serverPrefs) {
  if (typeof window === "undefined") return serverPrefs;
  try {
    const raw = localStorage.getItem(LEGACY_LOCAL_KEY);
    if (!raw) return serverPrefs;
    const local = JSON.parse(raw);
    if (!local || typeof local !== "object") {
      localStorage.removeItem(LEGACY_LOCAL_KEY);
      return serverPrefs;
    }
    // Ne migrer que si au moins une valeur diffère du défaut
    const patch = {};
    for (const key of Object.keys(DEFAULT_PREFS)) {
      if (typeof local[key] === "boolean" && local[key] !== serverPrefs?.[key]) {
        patch[key] = local[key];
      }
    }
    if (Object.keys(patch).length === 0) {
      localStorage.removeItem(LEGACY_LOCAL_KEY);
      return serverPrefs;
    }
    const updated = await updateEntrepriseNotifPrefsRequest(patch, token);
    localStorage.removeItem(LEGACY_LOCAL_KEY);
    return updated;
  } catch {
    // En cas d'échec, on laisse la clé pour un prochain essai
    return serverPrefs;
  }
}

export function useEntrepriseNotifPrefs() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.idUtilisateur);

  return useQuery({
    queryKey: [ENTREPRISE_NOTIF_PREFS_KEY, userId],
    queryFn: async () => {
      const prefs = await getEntrepriseNotifPrefsRequest(token);
      const merged = { ...DEFAULT_PREFS, ...prefs };
      return maybeMigrateLocalPrefs(token, merged);
    },
    enabled: !!token,
    staleTime: 60_000,
  });
}

export function useUpdateEntrepriseNotifPrefs() {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.user?.idUtilisateur);
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (patch) => updateEntrepriseNotifPrefsRequest(patch, token),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: [ENTREPRISE_NOTIF_PREFS_KEY, userId] });
      const previous = qc.getQueryData([ENTREPRISE_NOTIF_PREFS_KEY, userId]);
      qc.setQueryData([ENTREPRISE_NOTIF_PREFS_KEY, userId], (old) => ({
        ...DEFAULT_PREFS,
        ...(old || {}),
        ...patch,
      }));
      return { previous };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData([ENTREPRISE_NOTIF_PREFS_KEY, userId], ctx.previous);
      }
      toast.error("Impossible d'enregistrer votre préférence. Veuillez réessayer.");
    },
    onSuccess: (data) => {
      qc.setQueryData([ENTREPRISE_NOTIF_PREFS_KEY, userId], {
        ...DEFAULT_PREFS,
        ...data,
      });
      // Nettoyage défensif de l'ancienne clé
      try {
        localStorage.removeItem(LEGACY_LOCAL_KEY);
      } catch {
        /* ignore */
      }
      toast.success("Préférences enregistrées");
    },
  });
}
