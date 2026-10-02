// Uso: yarn make-admin voce@empresa.com [admin|pro|free]
// Define o role de um usuário já cadastrado. É a única forma de criar um admin.
import { existsSync, readFileSync } from "node:fs";
import mongoose from "mongoose";

const [email, role = "admin"] = process.argv.slice(2);
if (!email || !["admin", "pro", "free"].includes(role)) {
  console.error("Uso: yarn make-admin <email> [admin|pro|free]");
  process.exit(1);
}

function envFromFile(path) {
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split("\n")
      .map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  );
}

const uri = process.env.MONGODB_URI ?? envFromFile(".env.local").MONGODB_URI ?? "mongodb://127.0.0.1:27018/resolvehub";

await mongoose.connect(uri);
const update = role === "pro" ? { $set: { role } } : { $set: { role }, $unset: { planExpiresAt: "" } };
const result = await mongoose.connection.collection("users").updateOne({ email: email.trim().toLowerCase() }, update);
await mongoose.disconnect();

if (result.matchedCount === 0) {
  console.error(`Nenhum usuário com o e-mail ${email}. Cadastre-se primeiro em /register.`);
  process.exit(1);
}
console.log(`✔ ${email} agora é "${role}". Faça login novamente (ou recarregue o painel) para atualizar a sessão.`);
