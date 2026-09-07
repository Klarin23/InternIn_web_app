/**
 * node script/test-security-alerts.js
 */
import {
  graviteFromNiveau,
  typeFromNiveau,
  fingerprintForCompte,
} from "../src/modules/administrateurs/securityAlerts.service.js";

let f = 0;
const a = (n, c) => {
  if (!c) { console.error("FAIL", n); f++; }
  else console.log("OK  ", n);
};

a("normal → no alert", graviteFromNiveau("normal") === null);
a("inhabituel → attention", graviteFromNiveau("inhabituel") === "attention");
a("suspect → important", graviteFromNiveau("suspect") === "important");
a("partage → important", graviteFromNiveau("partage_probable") === "important");
a("critique → critique", graviteFromNiveau("critique") === "critique");
a("fingerprint stable", fingerprintForCompte("u1") === fingerprintForCompte("u1"));
a("fingerprint isolé", fingerprintForCompte("u1") !== fingerprintForCompte("u2"));
a("type partage", typeFromNiveau("partage_probable") === "partage_compte");

if (f) process.exit(1);
console.log("\nAll security alerts unit checks passed");
