"use client";

// Hook logique de refetch au retour de connexion (sans UI legacy).
// L'affichage global est géré par <ConnectionStatus /> dans app/layout.js.

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

function toKeyArray(key) {
  return Array.isArray(key) ? key : [key];
}

export default function RefreshStatus({ queryKeys = [] }) {
  const { isOnline } = useNetworkStatus();
  const queryClient = useQueryClient();
  const wasOffline = useRef(false);
  const keysRef = useRef(queryKeys);
  keysRef.current = queryKeys;

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      keysRef.current.forEach((key) =>
        queryClient.refetchQueries({
          queryKey: toKeyArray(key),
          type: "active",
        }),
      );
    }
  }, [isOnline, queryClient]);

  return null;
}
