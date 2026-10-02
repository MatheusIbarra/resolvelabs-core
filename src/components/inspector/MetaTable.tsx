/** Tabela chave/valor (metadados). Valores vazios são omitidos. */
export default function MetaTable({ rows }: { rows: [string, React.ReactNode][] }) {
  const visible = rows.filter(([, v]) => v !== undefined && v !== null && v !== "");
  return (
    <dl className="grid grid-cols-[max-content_1fr] text-sm">
      {visible.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="border-b border-stone-100 px-4 py-2.5 text-stone-500">{label}</dt>
          <dd className="break-all border-b border-stone-100 px-4 py-2.5 font-medium text-stone-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
