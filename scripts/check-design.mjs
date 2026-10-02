// Falha se o visual antigo (preto, quadrado, "estilo dev") voltar ao código. Uso: npm run check:design
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("../src", import.meta.url).pathname;
const RULES = [
  [/\b(?:bg|border|from|to|via|divide|ring|outline)-(?:stone|neutral|zinc|slate|gray)-(?:900|950)\b(?!\/)/, "fundo/borda preto ou quase preto"],
  [/\brounded-none\b/, "canto reto (rounded-none)"],
  [/shadow-\[\d+px_\d+px_0/, "sombra dura"],
  [/tracking-widest/, "tracking-widest (rótulo em estilo técnico)"],
  [/font-mono[^"'`]*\buppercase\b|\buppercase\b[^"'`]*font-mono/, "font-mono + uppercase"],
  [/["'`>(\[ ][A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+(?:\(\)|\.\.\.)/, "rótulo de estado em CAIXA_ALTA()"],
  [/\banimate-blink\b|\bBlinkText\b|\bTerminalScreen\b/, "texto piscando / componente de terminal"],
  [/from ["'][^"']*adminUi["']/, "módulo de estilo antigo (adminUi)"],
];
// Fundos escuros só são aceitos como camada translúcida de modal (bg-stone-900/50) e no selo de contraste do app.
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx|ts|css)$/.test(name)) files.push(p);
  }
})(ROOT);

let violations = 0;
for (const file of files) {
  readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    for (const [re, why] of RULES) {
      if (re.test(line)) {
        violations++;
        console.error(`${relative(process.cwd(), file)}:${i + 1}  ${why}\n    ${line.trim().slice(0, 140)}`);
      }
    }
  });
}
if (violations) {
  console.error(`\n✘ ${violations} violação(ões) do padrão visual. Veja a seção "Design" do CLAUDE.md.`);
  process.exit(1);
}
console.log(`✔ Padrão visual ok (${files.length} arquivos verificados).`);
