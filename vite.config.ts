import { defineConfig } from "vite";
import vinext from "vinext";

export default defineConfig({
  plugins: [vinext()],
  server: {
    // Porta fixa: o túnel do ngrok (ngrok http 3000) e o webhook do Stripe dependem dela.
    port: 3000,
    strictPort: true,
    // Permite túneis (ngrok) apontarem para o servidor de desenvolvimento, p.ex. para webhooks do Stripe.
    allowedHosts: [".ngrok-free.app", ".ngrok-free.dev", ".ngrok.app", ".ngrok.io"],
  },
});
