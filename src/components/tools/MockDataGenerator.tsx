"use client";

import { Fragment, useState } from "react";
import UsageBadge from "./UsageBadge";
import { DATA_TYPES, MAX_MOCK_RECORDS, generateMockRecords, seededRng, toFormattedJson, type DataTypeId } from "@/utils/mockGenerator";
import { downloadBlob } from "@/utils/download";
import { useToast } from "../ui/Toast";
import { MSG, errorMessage } from "@/lib/messages";

const FREE_GENERATIONS = 5;

interface Field {
  id: number;
  key: string;
  type: DataTypeId;
}

const INITIAL_FIELDS: Field[] = [
  { id: 1, key: "documento", type: "cpf" },
  { id: 2, key: "nome_completo", type: "nome" },
  { id: 3, key: "chave_pix", type: "pix" },
];

// Realce de sintaxe simples para JSON indentado.
function highlight(json: string) {
  const re = /("(?:[^"\\]|\\.)*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(json))) {
    if (m.index > last) out.push(json.slice(last, m.index));
    if (m[1] && m[2]) out.push(<span key={m.index} className="font-medium text-teal-800">{m[1]}</span>, m[2]);
    else if (m[1]) out.push(<span key={m.index} className="text-amber-700">{m[1]}</span>);
    else out.push(<span key={m.index} className="text-sky-700">{m[3] ?? m[4]}</span>);
    last = m.index + m[0].length;
  }
  out.push(json.slice(last));
  return out;
}

export default function MockDataGenerator() {
  const toast = useToast();
  const [fields, setFields] = useState<Field[]>(INITIAL_FIELDS);
  const [count, setCount] = useState(5);
  const [json, setJson] = useState(() => toFormattedJson(generateMockRecords(INITIAL_FIELDS, 2, seededRng(2026)))) // semente fixa: servidor e navegador geram o mesmo exemplo;
  const [used, setUsed] = useState(3);
  const [copied, setCopied] = useState(false);

  const updateField = (id: number, patch: Partial<Field>) =>
    setFields((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const addField = () =>
    setFields((fs) => [...fs, { id: Math.max(0, ...fs.map((f) => f.id)) + 1, key: `campo_${fs.length + 1}`, type: "cep" }]);

  const generate = () => {
    if (used >= FREE_GENERATIONS) {
      toast.warning(MSG.mock.limitReached);
      return;
    }
    if (fields.length === 0 || fields.some((f) => !f.key.trim())) {
      toast.error(MSG.mock.emptyKeys);
      return;
    }
    const n = Math.min(Math.max(1, Math.floor(count) || 1), MAX_MOCK_RECORDS);
    setCount(n);
    try {
      setJson(toFormattedJson(generateMockRecords(fields, n)));
      setUsed((u) => u + 1);
      toast.success(MSG.mock.generated(n));
    } catch (err) {
      toast.error(errorMessage(err, MSG.mock.failed));
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      toast.success(MSG.mock.copied);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(MSG.mock.copyFailed);
    }
  };

  const download = () => {
    downloadBlob(new Blob([json], { type: "application/json" }), "mock-data-br.json");
    toast.success(MSG.mock.downloaded);
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Schema builder */}
        <section className="card flex flex-col p-6 lg:col-span-2">
          <h2 className="section-title mb-5">Schema</h2>

          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.id} className="flex items-center gap-2">
                <input
                  aria-label="Nome da chave"
                  value={f.key}
                  onChange={(e) => updateField(f.id, { key: e.target.value })}
                  placeholder="nome_da_chave"
                  className="input min-w-0 flex-1 font-mono"
                />
                <select
                  aria-label="Tipo de dado"
                  value={f.type}
                  onChange={(e) => updateField(f.id, { type: e.target.value as DataTypeId })}
                  className="input min-w-0 flex-1"
                >
                  {DATA_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <button
                  aria-label="Remover campo"
                  onClick={() => setFields((fs) => fs.filter((x) => x.id !== f.id))}
                  className="shrink-0 rounded-md p-2 text-stone-400 hover:bg-stone-100 hover:text-red-700"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button onClick={addField} className="mt-4 self-start text-sm font-medium text-teal-700 hover:underline">
            + Adicionar campo
          </button>

          <label htmlFor="count" className="label mt-6">Número de registros</label>
          <input
            id="count"
            type="number"
            min={1}
            max={MAX_MOCK_RECORDS}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="input"
          />

          <button onClick={generate} className="btn-primary mt-6 w-full py-3">
            Gerar JSON
          </button>
        </section>

        {/* Code preview */}
        <section className="card flex min-h-96 flex-col overflow-hidden lg:col-span-3">
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
            <h2 className="section-title">Resultado em JSON</h2>
            <div className="flex items-center gap-2">
              <button onClick={copy} aria-label="Copiar para a área de transferência" className="btn-secondary !px-3 !py-1.5 text-xs">
                {copied ? "Copiado!" : "Copiar"}
              </button>
              <button onClick={download} className="btn-secondary !px-3 !py-1.5 text-xs">
                Baixar .json
              </button>
            </div>
          </div>
          <pre className="max-h-[32rem] flex-1 overflow-auto bg-stone-50 p-4 font-mono text-xs leading-relaxed text-stone-800">
            <code>{highlight(json).map((n, i) => <Fragment key={i}>{n}</Fragment>)}</code>
          </pre>
        </section>
      </div>

      <UsageBadge>Uso gratuito: {used}/{FREE_GENERATIONS} gerações</UsageBadge>
    </>
  );
}
