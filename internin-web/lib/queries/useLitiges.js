import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLitigeRequest,
  listLitigesRequest,
  listMesLitigesRequest,
  getLitigeRequest,
  changerStatutLitigeRequest,
  listNotesLitigeRequest,
  addNoteLitigeRequest,
  listMessagesLitigeRequest,
  addMessageLitigeRequest,
  escaladerLitigeRequest,
  demanderInfoLitigeRequest,
  listPiecesLitigeRequest,
  uploadPieceLitigeRequest,
  listHistoriqueLitigeRequest,
  actionDisciplinaireLitigeRequest,
} from "@/lib/api/litiges";
import { useAuthStore } from "@/lib/store/useAuthStore";

function useToken() {
  return useAuthStore((state) => state.token);
}

export function useCreateLitige() {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createLitigeRequest(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mesLitiges"] });
      queryClient.invalidateQueries({ queryKey: ["litigesAdmin"] });
    },
  });
}

export function useMesLitiges() {
  const token = useToken();
  return useQuery({
    queryKey: ["mesLitiges"],
    queryFn: () => listMesLitigesRequest(token),
    enabled: !!token,
  });
}

export function useLitige(id) {
  const token = useToken();
  return useQuery({
    queryKey: ["litige", id],
    queryFn: () => getLitigeRequest(id, token),
    enabled: !!token && !!id,
  });
}

export function useLitigesAdmin(statut) {
  const token = useToken();
  return useQuery({
    queryKey: ["litigesAdmin", statut || "tous"],
    queryFn: () => listLitigesRequest(token, statut),
    enabled: !!token,
  });
}

export function useChangerStatutLitige() {
  const token = useToken();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut, motif }) =>
      changerStatutLitigeRequest(id, { statut, motif }, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["litigesAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
      queryClient.invalidateQueries({ queryKey: ["mesLitiges"] });
      queryClient.invalidateQueries({ queryKey: ["litige"] });
    },
  });
}

export function useNotesLitige(id, enabled = true) {
  const token = useToken();
  return useQuery({
    queryKey: ["litigeNotes", id],
    queryFn: () => listNotesLitigeRequest(id, token),
    enabled: !!token && !!id && enabled,
  });
}

export function useAddNoteLitige(id) {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contenu) => addNoteLitigeRequest(id, contenu, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["litigeNotes", id] }),
  });
}

export function useMessagesLitige(id, enabled = true) {
  const token = useToken();
  return useQuery({
    queryKey: ["litigeMessages", id],
    queryFn: () => listMessagesLitigeRequest(id, token),
    enabled: !!token && !!id && enabled,
  });
}

export function useAddMessageLitige(id) {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contenu) => addMessageLitigeRequest(id, contenu, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["litigeMessages", id] });
      qc.invalidateQueries({ queryKey: ["litigesAdmin"] });
      qc.invalidateQueries({ queryKey: ["mesLitiges"] });
      qc.invalidateQueries({ queryKey: ["litige", id] });
      qc.invalidateQueries({ queryKey: ["litigePieces", id] });
    },
  });
}

export function useEscaladerLitige() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motif }) => escaladerLitigeRequest(id, motif, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["litigesAdmin"] });
      qc.invalidateQueries({ queryKey: ["litige"] });
    },
  });
}

export function useDemanderInfoLitige() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message }) =>
      demanderInfoLitigeRequest(id, message, token),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["litigeMessages", v.id] });
      qc.invalidateQueries({ queryKey: ["litigesAdmin"] });
      qc.invalidateQueries({ queryKey: ["mesLitiges"] });
      qc.invalidateQueries({ queryKey: ["litige", v.id] });
    },
  });
}

export function usePiecesLitige(id, enabled = true) {
  const token = useToken();
  return useQuery({
    queryKey: ["litigePieces", id],
    queryFn: () => listPiecesLitigeRequest(id, token),
    enabled: !!token && !!id && enabled,
  });
}

export function useUploadPieceLitige(id) {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file) => uploadPieceLitigeRequest(id, file, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["litigePieces", id] });
      qc.invalidateQueries({ queryKey: ["litigesAdmin"] });
      qc.invalidateQueries({ queryKey: ["mesLitiges"] });
    },
  });
}


export function useHistoriqueLitige(id, enabled = true) {
  const token = useToken();
  return useQuery({
    queryKey: ["litigeHistorique", id],
    queryFn: () => listHistoriqueLitigeRequest(id, token),
    enabled: !!token && !!id && enabled,
  });
}

export function useActionDisciplinaireLitige() {
  const token = useToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type, motif }) =>
      actionDisciplinaireLitigeRequest(id, { type, motif }, token),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["litigeHistorique", v.id] });
      qc.invalidateQueries({ queryKey: ["litigeNotes", v.id] });
      qc.invalidateQueries({ queryKey: ["litigesAdmin"] });
    },
  });
}
