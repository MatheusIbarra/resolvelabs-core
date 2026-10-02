import Stripe from "stripe";

export class StripeNotConfiguredError extends Error {
  constructor() {
    super("Stripe não configurado (STRIPE_SECRET_KEY ausente).");
    this.name = "StripeNotConfiguredError";
  }
}

let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new StripeNotConfiguredError();

  if (!client) {
    // STRIPE_MOCK_URL permite apontar para o `stripe-mock` em testes locais.
    const mock = process.env.STRIPE_MOCK_URL ? new URL(process.env.STRIPE_MOCK_URL) : null;
    client = new Stripe(key, {
      maxNetworkRetries: 2,
      appInfo: { name: "ResolveLabs" },
      ...(mock
        ? { host: mock.hostname, port: mock.port, protocol: mock.protocol.replace(":", "") as "http" | "https" }
        : {}),
    });
  }
  return client;
}

/** URL pública do app, usada nos redirecionamentos do Stripe (nunca vem do cliente). */
export function appUrl(fallbackOrigin: string): string {
  return (process.env.APP_URL ?? fallbackOrigin).replace(/\/$/, "");
}
