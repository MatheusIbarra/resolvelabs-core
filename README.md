# ResolveLabs

Micro-ferramentas para contadores, lojistas, corretores e desenvolvedores, vendidas por assinatura: plano **PRO** por **R$ 7,99/mês, com 7 dias grátis**. A ferramenta principal converte extratos bancários em PDF para **OFX**, direto no navegador.

## Ferramentas

| Ferramenta | Rota | Acesso |
| --- | --- | --- |
| Conversor de PDF para OFX | `/ferramentas/pdf-para-ofx` | Grátis (3 conversões), depois PRO |
| Reparador de XML Merchant | `/ferramentas/reparador-xml` | PRO |
| Otimizador de Imagens em Lote | `/ferramentas/processador-imagens` | PRO |
| Gerador de Mock Data BR (CPF, CNPJ, CEP, PIX) | `/ferramentas/mock-data-br` | Grátis |
| Inspetor Universal de Arquivos | `/ferramentas/inspetor-arquivos` | Grátis |

O processamento dos arquivos acontece **localmente, no navegador**. O servidor só controla acesso, cota de uso e cobrança: nenhum conteúdo de PDF, XML, planilha ou imagem é enviado. As regras de acesso de cada ferramenta ficam em `src/lib/tools.ts`.

Limites conhecidos:

- O conversor de PDF lê PDFs com **texto selecionável** (extratos baixados do internet banking). PDFs escaneados exigiriam OCR e não são suportados. A leitura é feita por heurísticas de layout, então um banco novo pode precisar de ajuste.
- O Reparador de XML lê feeds por arquivo; a leitura por URL só funciona se o servidor do feed permitir acesso pelo navegador (CORS).
- O CEP gerado pelo Mock Data BR está dentro de uma faixa real da UF, mas não garante que o logradouro exista.

## Funcionalidades da plataforma

- **Autenticação** com e-mail e senha (bcrypt), sessão em JWT num cookie HttpOnly e controle de acesso por role (`free`, `pro`, `admin`) no middleware e nas rotas da API.
- **Assinatura PRO** via Stripe: checkout com teste grátis, portal de cobrança e webhook (`checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`). Em produção, o mesmo cartão em outra conta não ganha um novo teste grátis (no modo teste a checagem só registra).
- **Cupons** de desconto, criados no painel admin.
- **Programa de indicações**: quem indica ganha 15 dias de PRO quando o indicado inicia a assinatura. O link `?ref=CODIGO` leva ao cadastro e guarda o código num cookie.
- **Painel do usuário** (`/dashboard`): ferramentas, plano, tempo restante da assinatura e indicações.
- **Painel admin** (`/admin`): usuários e concessão de PRO, cupons, afiliados e tickets de suporte.
- **Suporte**: widget flutuante com FAQ pesquisável e tickets com chat. Não usa WebSockets: a atualização é por polling (8 s no chat aberto, 15 s na lista, 60 s com o widget fechado), pausado com a aba em segundo plano. Os admins respondem em `/admin/support`.
- **Interface**: barra de progresso a cada troca de página e animações de entrada, respeitando `prefers-reduced-motion`.

## Stack

- [vinext](https://www.npmjs.com/package/vinext): App Router no estilo Next.js rodando sobre Vite (RSC)
- React 19 e TypeScript
- Tailwind CSS 3
- MongoDB com Mongoose
- Stripe, `jose` (JWT) e `bcryptjs`
- Processamento no cliente: `pdfjs-dist` (PDF), `xlsx` (planilhas), `jszip` (ZIP) e Web Workers
- Playwright para testes e2e (Chromium e WebKit/Safari)

## Pré-requisitos

- Node.js 22 ou superior
- Docker, para o MongoDB local (ou um `MONGODB_URI` próprio)
- Conta Stripe em modo de teste e a [Stripe CLI](https://docs.stripe.com/stripe-cli) (ou o ngrok), só para testar cobrança

## Como rodar

```bash
npm install     # ou yarn
npm run dev     # ou yarn dev
```

> O `xlsx` é instalado pela CDN oficial da SheetJS (`cdn.sheetjs.com`), porque a versão do npm está desatualizada e tem vulnerabilidades conhecidas. O `npm install` precisa de acesso a esse endereço.

O `npm run dev` (`scripts/dev.mjs`) prepara tudo sozinho:

1. cria o `.env.local` com um `JWT_SECRET` novo, se ele não existir;
2. sobe o MongoDB via Docker, se a `MONGODB_URI` apontar para localhost;
3. inicia o servidor em <http://localhost:3000>. A porta é fixa (`strictPort`), porque o ngrok e o webhook do Stripe dependem dela.

Para subir só o banco ou só o servidor: `npm run db:up` / `npm run db:down` e `npm run dev:app`.

### Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

| Variável | Descrição |
| --- | --- |
| `MONGODB_URI` | Conexão com o MongoDB. Padrão local: `mongodb://127.0.0.1:27018/resolvehub` |
| `JWT_SECRET` | Segredo de assinatura das sessões, com no mínimo 32 caracteres (`openssl rand -base64 48`) |
| `STRIPE_SECRET_KEY` | Chave secreta do Stripe. Sem ela, o checkout responde 503 |
| `STRIPE_WEBHOOK_SECRET` | Segredo do endpoint de webhook. Sem ele, o pagamento acontece, mas a conta não vira PRO |
| `APP_URL` | URL pública do app: redirecionamentos do checkout e imagem de compartilhamento (Open Graph). Padrão: origem da requisição |

> O nome do banco (`resolvehub`), o container e o volume do Mongo mantêm o nome antigo do projeto de propósito: renomeá-los faria os dados locais sumirem.

Variáveis só para desenvolvimento e testes (não defina em produção):

| Variável | Para quê |
| --- | --- |
| `ENABLE_DEV_BILLING=true` | Liga `/api/dev/plan`, que troca o plano sem pagamento (usado pelos controles de demonstração). Em produção a rota responde 404 sem esta flag |
| `INSECURE_COOKIES=true` | Remove o atributo `Secure` do cookie, para testar um build de produção por `http` local (o Safari não aceita cookie `Secure` sem https) |
| `STRIPE_MOCK_URL` | Aponta o SDK do Stripe para o [`stripe-mock`](https://github.com/stripe/stripe-mock) |
| `E2E_MONGODB_URI`, `E2E_PORT`, `E2E_JWT_SECRET` | Banco, porta e segredo dos testes e2e |

### Stripe em desenvolvimento

Com a Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copie o `whsec_...` exibido para `STRIPE_WEBHOOK_SECRET`. Com o ngrok, aponte um endpoint do Dashboard para `https://SEU-TUNEL.ngrok-free.app/api/webhooks/stripe` (o servidor já aceita esses hosts) e use o segredo desse endpoint.

Cartões de teste: `4242 4242 4242 4242` (sucesso), `4000 0000 0000 0002` (recusado no checkout) e `4000 0000 0000 0341` (passa na assinatura, mas a primeira cobrança falha).

Para simular o ciclo de cobrança sem esperar os 7 dias (só aceitam chaves `sk_test_`):

```bash
npm run stripe:end-trial -- voce@empresa.com   # encerra o teste agora; com o cartão ...0341 a cobrança falha
npm run stripe:cancel -- voce@empresa.com      # cancela a assinatura agora
```

### Criar um admin

Cadastre-se pelo app e depois promova o usuário. Esta é a única forma de criar um admin (o cadastro e a API nunca atribuem esse role):

```bash
npm run make-admin -- voce@empresa.com           # admin
npm run make-admin -- voce@empresa.com pro       # ou pro / free
```

Depois, faça login de novo (ou recarregue o painel) para a sessão enxergar o novo role.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Prepara o ambiente (env, Mongo) e sobe o servidor de desenvolvimento |
| `npm run dev:app` | Só o servidor de desenvolvimento |
| `npm run build` | Build de produção (`vite build`) |
| `npm start` | Serve o build de produção (`vinext start`) |
| `npm run typecheck` | Checagem de tipos com `tsc --noEmit` |
| `npm run check:design` | Falha se o visual antigo (preto, quadrado, estilo "dev") voltar ao código. As regras estão no `CLAUDE.md` |
| `npm run db:up` / `db:down` | Sobe / derruba o MongoDB do Docker |
| `npm run make-admin` | Define o role de um usuário |
| `npm run stripe:end-trial` / `stripe:cancel` | Simulam eventos de cobrança no Stripe (teste) |
| `npm run test:e2e` | Testes Playwright |
| `npm run test:e2e:ui` | Testes Playwright com interface |

## Testes

Os testes e2e ficam em `tests/` e rodam contra um **build de produção** na porta 3100, com banco e segredos próprios (`tests/support/e2e-env.ts`). Os cenários compartilham o banco e rodam em sequência, com um worker. Cobrem o cadastro, o limite gratuito e o paywall, o painel admin, o Inspetor de Arquivos e a compatibilidade da conversão de PDF no Safari.

```bash
npm run db:up                    # o MongoDB precisa estar no ar
npx playwright install webkit    # uma vez, para o projeto Safari
npm run test:e2e
```

- O banco de testes é `resolvelabs_e2e`, **apagado a cada execução** (a preparação se recusa a apagar qualquer banco cujo nome não contenha "e2e").
- Localmente o projeto `chromium` usa o Google Chrome instalado. No CI (`CI=true`), usa o Chromium do Playwright (`npx playwright install chromium`).
- Se já houver um servidor na porta 3100, o Playwright o reaproveita, mesmo que esteja com código antigo. Pare-o antes de testar mudanças.

## Estrutura

```
src/
  app/                páginas e rotas da API (App Router)
    api/              auth, billing, checkout, cupons, indicações, suporte, webhooks, admin
    admin/            painel administrativo (inclui /admin/support)
    dashboard/        área do usuário
    ferramentas/      as ferramentas
  components/         UI (admin, auth, dashboard, inspector, support, tools, ui)
  hooks/              useAuth, useSubscription, usePolling
  lib/                regras de negócio, sessão, Stripe, cupons, tickets, conteúdo e FAQ
  models/             schemas Mongoose (User, Coupon, Ticket)
  utils/              processamento no cliente (PDF→OFX, XML, imagens, mock data, inspetor de arquivos)
  middleware.ts       proteção de rotas, RBAC e captura de ?ref=
public/               favicon, ícones, manifest, imagem de compartilhamento e logos (public/brand)
docs/BRAND.md         guia da identidade visual (cores, logos, regras de uso)
scripts/              dev, make-admin, stripe-test
tests/                e2e (Playwright)
ResolveHub_Prototipo.html   protótipo estático original (histórico; não faz parte do app)
```

## Segurança

- O RBAC é conferido no middleware **e** de novo no servidor, com o role lido do banco, sem confiar só no token.
- A sessão é um JWT em cookie `resolvelabs_session` (HttpOnly, SameSite=Lax, `Secure` em produção). O token de um PRO temporário expira junto com o plano.
- A cota gratuita é consumida de forma atômica no banco.
- As rotas de tickets só devolvem um ticket ao dono ou a um admin. Para os demais, a resposta é 404.
- `.env*` fica fora do Git. Nunca commite chaves do Stripe nem o `JWT_SECRET`.
- Ainda não há limite de tentativas de login (rate limiting).

## Deploy

### Vercel

O vinext gera, por padrão, só arquivos estáticos (`dist/client`) e um servidor (`dist/server`). A Vercel não sabe executar esse servidor sozinha e, sem ajuda, responde **404 NOT_FOUND** em tudo. Por isso o projeto usa o plugin [Nitro](https://v3.nitro.build/), que empacota o servidor no formato da Vercel (`.vercel/output`: arquivos estáticos + uma função Node 22).

O `vite.config.ts` liga o Nitro automaticamente quando a variável `VERCEL` (ou `NITRO_PRESET`) existe. O `npm run dev`, o `npm run build` local e os testes não mudam.

1. Importe o repositório na Vercel e deixe o **Build Command** padrão (`npm run build`). Não precisa definir o Output Directory.
2. Em **Settings > Environment Variables**, defina:

   | Variável | Valor |
   | --- | --- |
   | `MONGODB_URI` | Conexão do **MongoDB Atlas** (`mongodb+srv://...`). O MongoDB do Docker local não é acessível pela Vercel |
   | `JWT_SECRET` | Segredo com no mínimo 32 caracteres (`openssl rand -base64 48`) |
   | `STRIPE_SECRET_KEY` | Chave secreta do Stripe |
   | `STRIPE_WEBHOOK_SECRET` | Segredo do endpoint de webhook (passo 4) |
   | `APP_URL` | O endereço público, por exemplo `https://seu-projeto.vercel.app` |

   **Não** defina `ENABLE_DEV_BILLING` nem `INSECURE_COOKIES`.
3. No Atlas, em **Network Access**, libere o acesso da Vercel (os IPs variam, então normalmente `0.0.0.0/0`). Prefira a região de São Paulo, a mesma das funções (`gru1`).
4. No Stripe, cadastre o endpoint `https://SEU_DOMINIO/api/webhooks/stripe` com os eventos `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed` e `customer.subscription.deleted`, e copie o segredo dele para `STRIPE_WEBHOOK_SECRET`.
5. Crie o usuário admin apontando o script para o banco de produção: `MONGODB_URI="mongodb+srv://..." npm run make-admin -- voce@empresa.com`.

Atenção:

- **Proteção de deploy:** deploys de *preview* costumam exigir login da Vercel, o que bloqueia o webhook do Stripe. Use o domínio de produção para o webhook.
- **Verificação local:** `NITRO_PRESET=vercel npx vite build` gera o mesmo pacote localmente. Para executá-lo: `cd .vercel/output && npx srvx serve --prod --static="$PWD/static" --entry=./functions/__server.func/index.mjs`.

### Outros servidores Node

```bash
npm run build
npm start
```

Defina as mesmas variáveis de ambiente e cadastre o webhook do Stripe no seu domínio.

### Em qualquer plataforma

- Em produção, o plano só deve mudar pelo webhook do Stripe. A rota `/api/dev/plan` existe apenas para demonstração e deve ser removida quando você não precisar mais dela.
- O servidor registra um aviso dizendo que a convenção `middleware` está obsoleta em favor de `proxy`. É informativo e não afeta o funcionamento.

## Problemas comuns

| Sintoma | Causa e solução |
| --- | --- |
| `Another vinext dev server is already running` | Já há um servidor de desenvolvimento neste projeto. Encerre o processo indicado na mensagem (`kill PID`) e rode de novo. |
| `yarn dev` / `npm run dev` falha ao subir o Mongo | O Docker não está aberto, ou a porta 27018 está ocupada. Abra o Docker ou aponte `MONGODB_URI` para um MongoDB em execução. |
| Pagamento aprovado, mas a conta continua FREE | O webhook não chegou. Confira o `STRIPE_WEBHOOK_SECRET`, o túnel (ngrok ou `stripe listen`) e a aba "Event deliveries" do endpoint no Stripe. |
| Página sem estilo ou estilo antigo no desenvolvimento | CSS em cache. Faça um recarregamento forçado (`Cmd+Shift+R`) ou reinicie o servidor. |
| Vercel responde `404 NOT_FOUND` em todas as páginas | O build não gerou a função do servidor. Confirme que o `nitro` está instalado e que o build roda na Vercel (variável `VERCEL`); veja a seção Deploy. |
| Todos foram deslogados após atualizar | Os cookies foram renomeados na troca de nome do app. É preciso entrar de novo uma vez. |

## Identidade visual

O app se chama **ResolveLabs**. Cores, logos, ícones e regras de uso estão em [`docs/BRAND.md`](docs/BRAND.md); os arquivos ficam em `public/brand/`.
