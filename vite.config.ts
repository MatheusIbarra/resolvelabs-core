import { defineConfig } from "vite";
import vinext from "vinext";
import { nitro } from "nitro/vite";

// O Nitro empacota o servidor para plataformas como a Vercel (sem ele, o build gera só arquivos estáticos
// e a Vercel responde 404). Fica ligado apenas nesses builds, para não alterar o `yarn dev` nem os testes.
const useNitro = Boolean(process.env.VERCEL || process.env.NITRO_PRESET);

export default defineConfig({
  plugins: [vinext(), ...(useNitro ? [nitro()] : [])],
  server: {
    // Porta fixa: o túnel do ngrok (ngrok http 3000) e o webhook do Stripe dependem dela.
    port: 3000,
    strictPort: true,
    // Permite túneis (ngrok) apontarem para o servidor de desenvolvimento, p.ex. para webhooks do Stripe.
    allowedHosts: [".ngrok-free.app", ".ngrok-free.dev", ".ngrok.app", ".ngrok.io"],
  },
});
