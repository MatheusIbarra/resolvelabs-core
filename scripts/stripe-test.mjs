// Atalhos para testar o ciclo de cobrança SEM esperar o fim do período de teste (só chaves sk_test_).
//   yarn stripe:end-trial <email>   encerra o teste agora -> o Stripe cobra na hora (com o cartão 4000 0000 0000 0341, a cobrança FALHA)
//   yarn stripe:cancel <email>      cancela a assinatura agora -> customer.subscription.deleted
import { existsSync, readFileSync } from "node:fs";
import mongoose from "mongoose";
import Stripe from "stripe";

const [command, rawEmail] = process.argv.slice(2);
if (!["end-trial", "cancel"].includes(command) || !rawEmail) {
  console.error("Uso: yarn stripe:end-trial <email>  |  yarn stripe:cancel <email>");
  process.exit(1);
}

const env = existsSync(".env.local")
  ? Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").map((l) => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)).filter(Boolean).map((m) => [m[1], m[2]]))
  : {};
const get = (k) => process.env[k] ?? env[k];

const key = get("STRIPE_SECRET_KEY");
if (!key?.startsWith("sk_test_")) {
  console.error("Recusado: este script só roda com uma chave de TESTE (sk_test_...).");
  process.exit(1);
}

await mongoose.connect(get("MONGODB_URI") ?? "mongodb://127.0.0.1:27018/resolvehub");
const user = await mongoose.connection.collection("users").findOne({ email: rawEmail.trim().toLowerCase() });
await mongoose.disconnect();

if (!user) { console.error(`Nenhum usuário com o e-mail ${rawEmail}.`); process.exit(1); }
if (!user.stripeSubscriptionId) { console.error(`${rawEmail} não tem assinatura no Stripe (assine primeiro em /checkout).`); process.exit(1); }

const stripe = new Stripe(key);
try {
  if (command === "end-trial") {
    const sub = await stripe.subscriptions.update(user.stripeSubscriptionId, { trial_end: "now", proration_behavior: "none" });
    console.log(`✔ Teste encerrado. Status da assinatura: ${sub.status}. O Stripe vai cobrar e enviar invoice.paid ou invoice.payment_failed.`);
  } else {
    await stripe.subscriptions.cancel(user.stripeSubscriptionId);
    console.log("✔ Assinatura cancelada. O Stripe vai enviar customer.subscription.deleted.");
  }
} catch (err) {
  console.error("Stripe recusou:", err.message);
  process.exit(1);
}
