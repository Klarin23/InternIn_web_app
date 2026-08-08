import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStagiaireProfileRequest,
  updateStagiaireProfileRequest,
  uploadPhotoProfilRequest,
} from "@/lib/api/stagiaires";
import { useAuthStore } from "@/lib/store/useAuthStore";

export function useStagiaireProfile() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["stagiaireProfile"],
    queryFn: () => getStagiaireProfileRequest(token),
    enabled: !!token,
  });
}

// Mutation générique de mise à jour — utilisée par chaque section (infos
// perso, profil pro, compétences, liens, centres d'intérêt, préférences...)
// avec juste le sous-ensemble de champs concerné dans le payload.
export function useUpdateStagiaireProfile() {
  const token = useAuthStore((state) => state.token);

  const setSession = useAuthStore((state) => state.setSession);

  const currentUser = useAuthStore((state) => state.user);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateStagiaireProfileRequest(payload, token),

    onSuccess: (profile) => {
      queryClient.invalidateQueries({
        queryKey: ["stagiaireProfile"],
      });

      if (profile?.statutCompte && currentUser && token) {
        setSession(
          {
            ...currentUser,
            statutCompte: profile.statutCompte,
          },
          token,
        );
      }
    },
  });
}

export function useUploadPhotoProfil() {
  const token = useAuthStore((state) => state.token);

  const currentUser = useAuthStore((state) => state.user);

  const setSession = useAuthStore((state) => state.setSession);

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file) => uploadPhotoProfilRequest(file, token),

    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["stagiaireProfile"],
      });

      const nouveauStatut =
        result?.stagiaire?.statutCompte || result?.statutCompte;

      if (nouveauStatut && currentUser && token) {
        setSession(
          {
            ...currentUser,
            statutCompte: nouveauStatut,
          },
          token,
        );
      }
    },
  });
}
