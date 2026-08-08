export function calculerAge(dateNaissance) {
  if (!dateNaissance) return null;
  const naissance = new Date(dateNaissance);
  const aujourdhui = new Date();
  let age = aujourdhui.getFullYear() - naissance.getFullYear();
  const moisEcoule = aujourdhui.getMonth() - naissance.getMonth();
  if (
    moisEcoule < 0 ||
    (moisEcoule === 0 && aujourdhui.getDate() < naissance.getDate())
  ) {
    age--;
  }
  return age;
}
