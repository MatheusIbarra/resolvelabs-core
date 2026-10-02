"use client";

import { useMemo, useState } from "react";
import type { TreeNode } from "@/utils/fileInspector/tree";
import { BAR, BTN, DIM, TABLIST, tabClass } from "./ui";

const CHUNK = 100;
const TYPE_COLOR: Record<TreeNode["type"], string> = {
  object: "text-stone-500", array: "text-stone-500", element: "text-stone-500",
  string: "text-amber-700", text: "text-amber-700", attribute: "text-sky-700",
  number: "text-teal-700", boolean: "text-fuchsia-700", null: "text-stone-400",
};

interface RowProps {
  node: TreeNode;
  depth: number;
  openDepth: number;
  onCopy: (text: string, label: string) => void;
}

function TreeRow({ node, depth, openDepth, onCopy }: RowProps) {
  const [open, setOpen] = useState(depth < openDepth);
  const [shown, setShown] = useState(CHUNK);
  const expandable = node.childCount > 0 && (node.type === "object" || node.type === "array" || node.type === "element");
  const children = useMemo(() => (open && expandable ? node.children() : []), [open, expandable, node]);

  return (
    <div role="treeitem" aria-expanded={expandable ? open : undefined}>
      <div className="group flex items-baseline gap-2 py-[3px] hover:bg-stone-50" style={{ paddingLeft: depth * 18 + 12 }}>
        {expandable ? (
          <button onClick={() => setOpen((o) => !o)} aria-label={open ? "Recolher" : "Expandir"} className="w-3 shrink-0 text-stone-400 hover:text-stone-800">
            {open ? "▾" : "▸"}
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <span className="font-medium text-teal-800">{node.label}</span>
        <span className={`min-w-0 truncate ${TYPE_COLOR[node.type]}`} title={node.summary}>{node.summary}</span>
        {expandable && node.type === "element" && <span className={DIM}>{node.childCount} {node.childCount === 1 ? "item" : "itens"}</span>}
        <button
          onClick={() => onCopy(node.copy(), "Nó copiado")}
          className="ml-auto shrink-0 px-2 font-sans text-xs text-stone-400 opacity-0 hover:text-teal-700 focus:opacity-100 group-hover:opacity-100"
        >
          Copiar
        </button>
      </div>
      {open && expandable && (
        <div role="group">
          {children.slice(0, shown).map((child) => (
            <TreeRow key={child.id} node={child} depth={depth + 1} openDepth={openDepth} onCopy={onCopy} />
          ))}
          {children.length > shown && (
            <div style={{ paddingLeft: (depth + 1) * 18 + 30 }} className="py-1.5">
              <button className={BTN} onClick={() => setShown((n) => n + CHUNK)}>Mostrar mais {CHUNK} (restam {children.length - shown})</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const MAX_TEXT_CHARS = 300_000;

interface Props {
  root: TreeNode;
  /** Texto formatado (com indentação) para a aba Texto e para copiar tudo. */
  getText: () => string;
  onCopy: (text: string, label: string) => void;
}

export default function TreeViewer({ root, getText, onCopy }: Props) {
  const [tab, setTab] = useState<"arvore" | "texto">("arvore");
  const [openDepth, setOpenDepth] = useState(2);
  const [treeKey, setTreeKey] = useState(0);
  const text = useMemo(() => (tab === "texto" ? getText() : ""), [tab, getText]);

  const expand = (depth: number) => {
    setOpenDepth(depth);
    setTreeKey((k) => k + 1); // remonta a árvore com a nova profundidade
  };

  return (
    <div>
      <div role="tablist" className={TABLIST}>
        <button role="tab" aria-selected={tab === "arvore"} onClick={() => setTab("arvore")} className={tabClass(tab === "arvore")}>Árvore</button>
        <button role="tab" aria-selected={tab === "texto"} onClick={() => setTab("texto")} className={tabClass(tab === "texto")}>Texto formatado</button>
      </div>
      <div className={BAR}>
        {tab === "arvore" && (
          <>
            <span className={DIM}>Expandir</span>
            {[1, 2, 3].map((d) => <button key={d} className={BTN} onClick={() => expand(d)}>Nível {d}</button>)}
            <button className={BTN} onClick={() => expand(0)}>Recolher tudo</button>
          </>
        )}
        <button className={`${BTN} ml-auto`} onClick={() => onCopy(getText(), "Conteúdo copiado")}>Copiar tudo</button>
      </div>
      {tab === "arvore" ? (
        <div role="tree" className="max-h-[32rem] overflow-auto py-2 font-mono text-xs text-stone-800" data-testid="tree">
          <TreeRow key={treeKey} node={root} depth={0} openDepth={openDepth} onCopy={onCopy} />
        </div>
      ) : (
        <div>
          <pre className="max-h-[32rem] overflow-auto whitespace-pre bg-stone-50 p-4 font-mono text-xs leading-5 text-stone-800" data-testid="formatted-text">
            {text.length > MAX_TEXT_CHARS ? text.slice(0, MAX_TEXT_CHARS) : text}
          </pre>
          {text.length > MAX_TEXT_CHARS && (
            <p className={`border-t border-stone-200 px-4 py-2 text-xs ${DIM}`}>Exibição truncada em {MAX_TEXT_CHARS.toLocaleString("pt-BR")} caracteres. Use “Copiar tudo” para o conteúdo completo.</p>
          )}
        </div>
      )}
    </div>
  );
}
