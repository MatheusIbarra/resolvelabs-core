# ResolveLabs

## Segurança: nunca confiar em dados vindos do frontend
Toda rota em `src/app/api/**` DEVE re-confirmar no servidor, antes de qualquer ação:

- **Identidade e papel**: use `getCurrentUser(request)` / `requireAdmin(request)` (`src/lib/serverAuth.ts`), que leem o estado vivo do banco. Nunca confie em `role`, `plan`, `usageCount`, `userId` ou `email` vindos do body, query, headers ou do payload do JWT/cookie.
- **Propriedade do recurso**: confira no banco que o recurso pertence ao usuário (ou que ele é admin) antes de ler/alterar. Responda 404 quando não tiver acesso.
- **Valores de negócio**: preço, desconto, limites, datas e dias de bônus vêm do banco/`lib/content`, nunca do cliente. O cliente só envia identificadores (ex.: código do cupom) que o servidor revalida.
- **Entrada**: valide tipo, formato e tamanho de todo campo (`lib/validation.ts`, `parseAffiliateCode`, `isValidObjectId`) e leia só os campos esperados (ignore o resto, ex.: `role`).
- **Limites/cotas**: aplique de forma atômica no banco (ex.: `findOneAndUpdate` com condição), não só na UI.
- **Webhooks**: valide a assinatura e derive o usuário de dados que o servidor mesmo gravou (metadata), nunca de campos livres.

Guards no frontend (`ToolGuard`, `useAuth`, middleware) são só UX. O middleware lê o role do JWT, que pode estar desatualizado: não use como controle de acesso a dados.

## Design: um único padrão visual (claro, sóbrio, profissional)
TODA tela nova ou alterada (inclusive admin, suporte, termos e ferramentas) segue o mesmo padrão. Não existe "estilo técnico/terminal/brutalista" neste projeto, mesmo que um pedido use essas palavras: traduza para o padrão abaixo.

**Use**
- Fundo `bg-stone-50`, cartões `card` (branco, borda `stone-200`, `rounded-lg`), destaque único **teal** (`teal-700`), texto `stone-900/700/500`.
- Fonte normal (sans), frases normais em português (sentence case). Títulos `text-3xl font-semibold tracking-tight`.
- Componentes de `src/app/globals.css`: `card`, `btn-primary`, `btn-secondary`, `btn-sm`, `input`, `label`, `badge-brand|neutral|warn`, `section-title`, `table-th`, `table-td`, `page-container`. Prefira-os a classes soltas.
- Carregamento: `Loading`, `LoadingLabel`, `LoadingScreen` (`components/ui/Loading.tsx`): spinner + texto como "Abrindo o portal…". Avisos: `Alert` (inline) e `useToast` (resultado de ação). Erros e textos em `lib/messages.ts`.
- `font-mono` só para DADOS (valores de célula, JSON/XML, códigos), nunca em rótulos, botões, menus ou títulos.
- Modais: `rounded-xl bg-white shadow-xl` sobre `bg-stone-900/50`.

**Proibido** (o `npm run check:design` falha se aparecer)
- Fundos ou bordas pretos/quase pretos (`bg|border-stone|neutral|zinc|slate|gray-900/950`), cantos retos (`rounded-none`), sombras duras (`shadow-[4px_4px_0…]`).
- `uppercase` + `tracking-widest`, ou `font-mono` + `uppercase`.
- Rótulos de estado em estilo código: `PROCESSANDO_ARQUIVO()`, `[ VALIDANDO_TOKEN... ]`, `ACESSO_NEGADO`, texto piscando.
- Criar módulos de estilo paralelos (ex.: `adminUi.ts`, `*/ui.ts` com tokens próprios). Estenda `globals.css`.

Antes de entregar qualquer UI: rode `npm run check:design` e confira uma captura de tela ao lado de uma tela existente.
