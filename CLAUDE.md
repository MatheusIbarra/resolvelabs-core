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
