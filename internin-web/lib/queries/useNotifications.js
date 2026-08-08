import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listNotificationsRequest,
  compterNotificationsNonLuesRequest,
  marquerNotificationLueRequest,
  marquerToutesNotificationsLuesRequest,
  supprimerNotificationRequest,
  supprimerToutesNotificationsRequest,
} from "@/lib/api/notifications";
import { useAuthStore } from "@/lib/store/useAuthStore";

// Les clés de requête incluent l'id utilisateur : deux comptes différents
// (ex. entreprise puis étudiant) connectés l'un après l'autre dans le même
// onglet n'utilisent alors jamais la même entrée de cache, même si le
// nettoyage à la déconnexion (queryClient.clear() dans AppHeader/AppSidebar)
// venait à être oublié quelque part.

// Polling léger (30s) — pas de websocket dans ce projet, c'est le mécanisme
// le plus simple pour donner une impression de "temps réel" sur la cloche.
export function useNotifications() {
  const token = useAuthStore((state) => state.token);
  const idUtilisateur = useAuthStore((state) => state.user?.idUtilisateur);
  return useQuery({
    queryKey: ["notifications", idUtilisateur],
    queryFn: () => listNotificationsRequest(token),
    enabled: !!token && !!idUtilisateur,
    refetchInterval: 30000,
  });
}

export function useNotificationsNonLuesCount() {
  const token = useAuthStore((state) => state.token);
  const idUtilisateur = useAuthStore((state) => state.user?.idUtilisateur);
  return useQuery({
    queryKey: ["notificationsNonLuesCount", idUtilisateur],
    queryFn: () => compterNotificationsNonLuesRequest(token),
    enabled: !!token && !!idUtilisateur,
    refetchInterval: 30000,
  });
}

export function useMarquerNotificationLue() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => marquerNotificationLueRequest(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notificationsNonLuesCount"],
      });
    },
  });
}

export function useMarquerToutesNotificationsLues() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => marquerToutesNotificationsLuesRequest(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notificationsNonLuesCount"],
      });
    },
  });
}

export function useSupprimerNotification() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => supprimerNotificationRequest(id, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notificationsNonLuesCount"],
      });
    },
  });
}

export function useSupprimerToutesNotifications() {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => supprimerToutesNotificationsRequest(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notificationsNonLuesCount"],
      });
    },
  });
}
