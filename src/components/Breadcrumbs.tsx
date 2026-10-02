import Link from "next/link";

// Home leva à página inicial, categorias à lista de ferramentas e o último item é a página atual.
function hrefFor(index: number, total: number): string | null {
  if (index === total - 1) return null;
  return index === 0 ? "/" : "/ferramentas";
}

export default function Breadcrumbs({ items }: { items: string[] }) {
  return (
    <nav aria-label="Breadcrumb" className="page-container flex flex-wrap items-center gap-2 py-5 text-sm text-stone-500">
      {items.map((item, i) => {
        const href = hrefFor(i, items.length);
        return (
          <span key={item} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden>/</span>}
            {href ? (
              <Link href={href} className="hover:text-stone-900 hover:underline">
                {item}
              </Link>
            ) : (
              <span className="font-medium text-stone-900" aria-current="page">
                {item}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
