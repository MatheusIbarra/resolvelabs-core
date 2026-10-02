import * as XLSX from "xlsx";

export const file = (name: string, mimeType: string, content: string | Buffer) => ({
  name,
  mimeType,
  buffer: typeof content === "string" ? Buffer.from(content, "utf8") : content,
});

export function xlsxFile() {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ["Produto", "Quantidade", "Preço"],
      ["Caneta azul", 10, 2.5],
      ["Lápis HB", 5, 1.2],
      ["Borracha", 3, 0.99],
    ]),
    "Vendas",
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Cliente"], ["Ana"], ["Bruno"]]), "Clientes");
  return file("vendas.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer);
}

export function bigCsv(rows: number) {
  const lines = ["id;cliente;valor"];
  for (let i = 1; i <= rows; i++) lines.push(`${i};Cliente ${i};${(i * 1.37).toFixed(2).replace(".", ",")}`);
  return file("grande.csv", "text/csv", lines.join("\n"));
}

export const OFX_SAMPLE = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX><SIGNONMSGSRSV1><SONRS><STATUS><CODE>0<SEVERITY>INFO</STATUS><DTSERVER>20261002120000<LANGUAGE>POR<FI><ORG>Banco Exemplo<FID>001</FI></SONRS></SIGNONMSGSRSV1>
<BANKMSGSRSV1><STMTTRNRS><TRNUID>1<STATUS><CODE>0<SEVERITY>INFO</STATUS><STMTRS><CURDEF>BRL<BANKACCTFROM><BANKID>0001<BRANCHID>1234<ACCTID>98765-4<ACCTTYPE>CHECKING</BANKACCTFROM>
<BANKTRANLIST><DTSTART>20260901<DTEND>20260930
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260903120000<TRNAMT>-120.35<FITID>A1<NAME>ENERGIA ELETRICA</STMTTRN>
<STMTTRN><TRNTYPE>CREDIT<DTPOSTED>20260905120000<TRNAMT>5200.00<FITID>A2<NAME>SALARIO</STMTTRN>
<STMTTRN><TRNTYPE>DEBIT<DTPOSTED>20260910120000<TRNAMT>-39.90<FITID>A3<NAME>TARIFA</STMTTRN>
</BANKTRANLIST><LEDGERBAL><BALAMT>5039.75<DTASOF>20260930</LEDGERBAL><AVAILBAL><BALAMT>5000.00<DTASOF>20260930</AVAILBAL></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;

export const JSON_SAMPLE = JSON.stringify({
  empresa: "ResolveLabs",
  ativo: true,
  usuarios: [
    { id: 1, nome: "Ana", email: "ana@exemplo.com" },
    { id: 2, nome: "Bruno", email: null },
  ],
  config: { tema: "escuro", limites: { diario: 100 } },
});

export const XML_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<catalogo versao="2">
  <produto id="1"><nome>Caneta</nome><preco>2.50</preco></produto>
  <produto id="2"><nome>Lápis</nome><preco>1.20</preco></produto>
</catalogo>`;
