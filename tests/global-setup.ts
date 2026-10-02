import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { ADMIN, E2E_MONGODB_URI } from "./support/e2e-env";

/** Prepara um banco limpo e cria a conta de admin usada nos testes (o cadastro público nunca cria admin). */
export default async function globalSetup() {
  const dbName = new URL(E2E_MONGODB_URI).pathname.replace("/", "");
  if (!/e2e/i.test(dbName)) {
    throw new Error(`Recusado: o banco de testes precisa conter "e2e" no nome (recebido: "${dbName}"). Esta etapa apaga o banco.`);
  }

  try {
    await mongoose.connect(E2E_MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  } catch {
    throw new Error(`Não foi possível conectar ao MongoDB (${E2E_MONGODB_URI}). Suba o banco com "yarn db:up" ou defina E2E_MONGODB_URI.`);
  }

  await mongoose.connection.dropDatabase();
  const now = new Date();
  await mongoose.connection.collection("users").insertOne({
    email: ADMIN.email,
    password: await bcrypt.hash(ADMIN.password, 10),
    role: "admin",
    usageCount: 0,
    affiliateCode: "E2EADM",
    createdAt: now,
    updatedAt: now,
  });
  await mongoose.disconnect();
}
