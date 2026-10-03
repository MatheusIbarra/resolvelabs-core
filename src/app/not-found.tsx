// Último recurso: caminhos fora de qualquer idioma que o middleware não trata (ex.: /algo.php). Não há provedor de idioma aqui.
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1.5rem", textAlign: "center", color: "#44403c" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 600 }}>404</h1>
        <p>
          Page not found. <a href="/">ResolveLabs</a>
        </p>
      </body>
    </html>
  );
}
