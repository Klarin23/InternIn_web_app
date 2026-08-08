// Encapsule bcrypt pour ne jamais manipuler de mot de passe en clair ailleurs dans le code.
import bcrypt from "bcrypt";

// 12 est le standard recommandé aujourd'hui (bon compromis sécurité / performance)
const SALT_ROUNDS = 12;

export async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}
