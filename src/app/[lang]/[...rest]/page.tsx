import { notFound } from "next/navigation";

// Qualquer caminho desconhecido dentro de um idioma cai aqui e mostra o 404 já com o layout e o idioma da página.
export default function CatchAll() {
  notFound();
}
