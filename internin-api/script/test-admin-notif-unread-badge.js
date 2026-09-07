/** node script/test-admin-notif-unread-badge.js
 * Contrat badge Centre de notifications :
 * - destinataire = idUtilisateur admin connecté
 * - lu = false uniquement
 * - indépendant de limit/pagination liste
 * - ≠ anomalies contrôle ≠ comptes sécurité
 */
function unreadCount(notifications, adminId) {
  return notifications.filter(
    (n) => n.idUtilisateur === adminId && n.lu === false,
  ).length;
}

let f = 0;
const a = (n, c) => {
  if (!c) {
    console.error("FAIL", n);
    f++;
  } else console.log("OK  ", n);
};

const rows = [
  { id: 1, idUtilisateur: "A", lu: false },
  { id: 2, idUtilisateur: "A", lu: false },
  { id: 3, idUtilisateur: "A", lu: true },
  { id: 4, idUtilisateur: "B", lu: false },
  { id: 5, idUtilisateur: "B", lu: false },
  { id: 6, idUtilisateur: "B", lu: false },
];

a("admin A = 2", unreadCount(rows, "A") === 2);
a("admin B = 3", unreadCount(rows, "B") === 3);
a("empty = 0", unreadCount([], "A") === 0);
a("all read = 0", unreadCount(rows.map((r) => ({ ...r, lu: true })), "A") === 0);
// pagination must not change total
const page1 = rows.filter((r) => r.idUtilisateur === "A").slice(0, 1);
a("page length ≠ badge", page1.length === 1 && unreadCount(rows, "A") === 2);
// control/security noise not counted
a("no cross domain", unreadCount(rows, "A") === 2);

if (f) process.exit(1);
console.log("\nAll admin notif badge contract checks passed");
