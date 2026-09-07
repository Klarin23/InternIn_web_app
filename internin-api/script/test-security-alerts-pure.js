/** node script/test-security-alerts-pure.js */
function graviteFromNiveau(niveau) {
  switch (niveau) {
    case "critique":
    case "attaque_probable":
      return "critique";
    case "partage_probable":
    case "automatisation_probable":
    case "suspect":
      return "important";
    case "inhabituel":
      return "attention";
    default:
      return null;
  }
}
function fingerprintForCompte(id) {
  return `compte:${id}:security`;
}
let f=0; const a=(n,c)=>{if(!c){console.error("FAIL",n);f++}else console.log("OK  ",n)};
a("normal", graviteFromNiveau("normal")===null);
a("inhabituel", graviteFromNiveau("inhabituel")==="attention");
a("suspect", graviteFromNiveau("suspect")==="important");
a("partage", graviteFromNiveau("partage_probable")==="important");
a("critique", graviteFromNiveau("critique")==="critique");
a("fp stable", fingerprintForCompte("u1")===fingerprintForCompte("u1"));
a("fp isolé", fingerprintForCompte("u1")!==fingerprintForCompte("u2"));
if(f) process.exit(1);
console.log("\nAll pure security alerts checks passed");
