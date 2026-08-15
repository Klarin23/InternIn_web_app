"use client";

import RoleAppShell from "@/components/layout/RoleAppShell";
import NotificationsPage from "@/components/features/notifications/NotificationsPage";

/**
 * Route UNIQUE /notifications (pas dans les Route Groups).
 * Corrige : "two parallel pages that resolve to the same path".
 */
export default function NotificationsRoutePage() {
  return (
    <RoleAppShell>
      <NotificationsPage />
    </RoleAppShell>
  );
}
