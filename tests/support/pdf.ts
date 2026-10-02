/**
 * Gera um PDF mínimo e válido (com texto selecionável) para simular um extrato bancário.
 * Evita guardar arquivos binários no repositório. Use apenas texto ASCII.
 */
export function buildStatementPdf(lines: string[]): Buffer {
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const content = `BT /F1 12 Tf 16 TL 50 760 Td ${lines.map((l) => `(${escape(l)}) Tj T*`).join(" ")} ET`;

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefAt = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

export const SAMPLE_STATEMENT = [
  "Extrato de Conta Corrente - Periodo: 01/09/2026 a 30/09/2026",
  "01/09 PIX RECEBIDO JOAO SILVA 150,00",
  "02/09 COMPRA CARTAO SUPERMERCADO -45,90",
  "05/09 SALARIO EMPRESA XYZ 5.200,00",
  "10/09 TARIFA PACOTE SERVICOS -39,90",
];
