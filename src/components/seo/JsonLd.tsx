/** Injeta um bloco JSON-LD. O "<" é escapado para o conteúdo nunca fechar a tag <script>. */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
