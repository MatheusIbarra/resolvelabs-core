// Falha se o código voltar a usar navegação sem idioma. Uso: npm run check:i18n
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../src", import.meta.url).pathname;
// Só estes arquivos podem importar next/link e next/navigation direto (o resto usa @/i18n/navigation).
const ALLOWED = new Set(["i18n/navigation.tsx", "i18n/LanguageSwitcher.tsx", "i18n/server.ts", "components/ui/RouteProgress.tsx", "app/[lang]/layout.tsx"]);
const RULES = [
  [/from ["']next\/link["']/, 'use `Link` de "@/i18n/navigation"'],
  [/\b(?:useRouter|usePathname)\b[^;\n]*from ["']next\/navigation["']/, 'use `useRouter`/`usePathname` de "@/i18n/navigation"'],
  [/\bredirect\b[^;\n]*from ["']next\/navigation["']/, 'use `redirect(locale, path)` de "@/i18n/server"'],
];

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(name)) files.push(p);
  }
})(ROOT);

let violations = 0;
for (const file of files) {
  const rel = relative(ROOT, file);
  if (ALLOWED.has(rel) || rel.startsWith("app/api/")) continue;
  readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    for (const [re, why] of RULES) {
      if (re.test(line)) {
        violations++;
        console.error(`src/${rel}:${i + 1}  ${why}\n    ${line.trim()}`);
      }
    }
  });
}
if (violations) {
  console.error(`\n✘ ${violations} uso(s) de navegação sem idioma.`);
  process.exit(1);
}
console.log(`✔ Navegação com idioma ok (${files.length} arquivos verificados).`);
