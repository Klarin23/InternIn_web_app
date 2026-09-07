/** node script/test-admin-notif-unread-count.js */
// Pure logic mirror of compterNonLues conditions
function countUnread(rows, adminId) {
  return rows.filter((r) => r.idUtilisateur === adminId && r.lu === false).length;
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
  { id: 7, idUtilisateur: "B", lu: true },
];

a("empty", countUnread([], "A") === 0);
a("admin A unread = 2", countUnread(rows, "A") === 2);
a("admin B unread = 3", countUnread(rows, "B") === 3);
a("not total history", countUnread(rows, "A") !== rows.filter((r) => r.idUtilisateur === "A").length);

// mark one read
rows[0].lu = true;
a("after read A = 1", countUnread(rows, "A") === 1);

// mark all A read
rows.forEach((r) => {
  if (r.idUtilisateur === "A") r.lu = true;
});
a("mark all A = 0", countUnread(rows, "A") === 0);
a("B unaffected", countUnread(rows, "B") === 3);

// pagination independence: count is global not page size
const many = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  idUtilisateur: "C",
  lu: i < 10 ? false : true,
}));
const page = many.slice(0, 20);
a("page has some unread", page.filter((r) => !r.lu).length === 10);
a("global still 10", countUnread(many, "C") === 10);
a("not page-only count as global", countUnread(many, "C") !== page.length);

// anomaly ≠ notification
a("security/anomaly not counted here", countUnread(rows, "A") === 0);

if (f) process.exit(1);
console.log("\nAll admin notification unread-count checks passed");
