import { expect, test, type Page } from "@playwright/test";
import { registerAndLogin } from "./support/auth";
import { SAMPLE_STATEMENT, buildStatementPdf } from "./support/pdf";
import { JSON_SAMPLE, OFX_SAMPLE, XML_SAMPLE, bigCsv, file, xlsxFile } from "./support/inspector-fixtures";

test.describe.configure({ mode: "serial" });

const input = (page: Page) => page.getByTestId("inspector-input");
const badge = (page: Page) => page.getByTestId("file-kind");

test.describe("Inspetor Universal de Arquivos", () => {
  let nonGetRequests: string[] = [];

  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
    await page.goto("/ferramentas/inspetor-arquivos");
    await expect(page.getByRole("heading", { name: "Inspetor Universal de Arquivos" })).toBeVisible();
    // Privacidade: depois de abrir a página, nenhuma requisição não-GET pode sair (nada de upload).
    nonGetRequests = [];
    // Exceção: o contador anônimo de uso (/api/track) leva só { tool, event, kind }, nunca nome ou conteúdo do arquivo.
    page.on("request", (r) => {
      if (r.method() === "GET") return;
      if (new URL(r.url()).pathname === "/api/track") {
        const body = r.postData(); // sendBeacon pode não expor o corpo ao Playwright; quando expõe, só { tool, event, kind } é aceito
        if (body) expect(body, "o contador não pode levar dados do arquivo").toMatch(/^\{"tool":"[a-z-]+","event":"(view|use)"(,"kind":"[a-z]+")?\}$/);
        return;
      }
      nonGetRequests.push(`${r.method()} ${r.url()}`);
    });
  });

  test.afterEach(() => {
    expect(nonGetRequests, "o inspetor não deve enviar dados a nenhum servidor").toEqual([]);
  });

  test("planilha XLSX: abas, contagem de linhas/colunas e seleção de célula", async ({ page }) => {
    await input(page).setInputFiles(xlsxFile());

    await expect(badge(page)).toHaveText("Planilha");
    await expect(page.getByRole("tab", { name: "Vendas" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Clientes" })).toBeVisible();
    await expect(page.getByTestId("sheet-stats")).toContainText("4 linhas");
    await expect(page.getByTestId("sheet-stats")).toContainText("3 colunas");

    const row2 = page.locator('[data-row="2"]');
    await expect(row2).toContainText("Caneta azul");
    await row2.getByText("Caneta azul").click();
    await expect(page.getByTestId("formula-bar")).toContainText("A2");
    await expect(page.getByTestId("formula-bar")).toContainText("Caneta azul");

    await page.getByRole("tab", { name: "Clientes" }).click();
    await expect(page.getByTestId("sheet-stats")).toContainText("3 linhas");
    await expect(page.locator('[data-row="3"]')).toContainText("Bruno");
  });

  test("planilha grande (100 mil linhas): worker, tabela virtualizada e rolagem até o fim", async ({ page }) => {
    const rows = 100_000;
    await input(page).setInputFiles(bigCsv(rows));

    await expect(badge(page)).toHaveText("Planilha", { timeout: 30_000 });
    await expect(page.getByTestId("sheet-stats")).toContainText("100.001 linhas"); // + cabeçalho
    await expect(page.getByTestId("sheet-stats")).toContainText("worker");
    await expect(page.locator('[data-row="2"]')).toContainText("Cliente 1");

    // Virtualização: só uma fração mínima das linhas existe no DOM.
    const domRows = await page.locator("[data-row]").count();
    expect(domRows, "linhas renderizadas no DOM").toBeLessThan(120);

    // Vai ao fim da planilha: os dados do final chegam do worker sob demanda.
    await page.getByTestId("sheet-scroll").evaluate((el) => (el.scrollTop = el.scrollHeight));
    await expect(page.locator(`[data-row="${rows + 1}"]`)).toContainText(`Cliente ${rows}`, { timeout: 15_000 });
    expect(await page.locator("[data-row]").count()).toBeLessThan(120);
  });

  test("OFX: cabeçalho bancário, saldos e tabela de transações ordenável", async ({ page }) => {
    await input(page).setInputFiles(file("extrato.ofx", "application/x-ofx", OFX_SAMPLE));

    await expect(badge(page)).toHaveText("OFX");
    const resumo = page.getByRole("tabpanel").or(page.locator("dl").first());
    await expect(page.getByText("Banco Exemplo")).toBeVisible();
    await expect(page.getByText("98765-4")).toBeVisible();
    await expect(page.getByText(/R\$\s*5\.039,75 em 30\/09\/2026/)).toBeVisible(); // saldo contábil
    await expect(page.getByText(/R\$\s*5\.200,00/).first()).toBeVisible(); // total de créditos
    void resumo;

    await page.getByRole("tab", { name: /Transações \(3\)/ }).click();
    const table = page.getByTestId("ofx-table");
    await expect(table.getByRole("columnheader")).toHaveText(["Data ↑", "Descrição", "Valor", "Tipo"]);
    await expect(table.getByRole("row")).toHaveCount(4); // cabeçalho + 3
    await expect(table.getByRole("row").nth(1)).toContainText("03/09/2026");

    await table.getByRole("button", { name: /Valor/ }).click(); // ordena por valor crescente
    await expect(table.getByRole("row").nth(1)).toContainText("ENERGIA ELETRICA");
    await table.getByRole("button", { name: /Valor/ }).click(); // decrescente
    await expect(table.getByRole("row").nth(1)).toContainText("SALARIO");
  });

  test("JSON: árvore recolhível, cópia de nó e texto formatado", async ({ page }) => {
    await input(page).setInputFiles(file("dados.json", "application/json", JSON_SAMPLE));

    await expect(badge(page)).toHaveText("JSON");
    const tree = page.getByTestId("tree");
    await expect(tree).toContainText("empresa");
    await expect(tree).toContainText('"ResolveLabs"');
    await expect(tree.getByText("usuarios")).toBeVisible();

    // Recolher tudo esconde os filhos; Nível 2 mostra de volta.
    await page.getByRole("button", { name: "Recolher tudo" }).click();
    await expect(tree).not.toContainText("empresa");
    await page.getByRole("button", { name: "Nível 2" }).click();
    await expect(tree).toContainText("empresa");

    // Expandir/recolher um nó isolado.
    const usuarios = tree.getByRole("treeitem").filter({ hasText: "usuarios" }).first();
    await usuarios.getByRole("button", { name: /Expandir|Recolher/ }).first().click();

    // Copiar: o toast confirma (independe de permissão de clipboard do navegador de teste).
    await page.getByRole("button", { name: "Copiar tudo" }).click();
    await expect(page.getByText(/Conteúdo copiado|Não foi possível copiar/)).toBeVisible();

    await page.getByRole("tab", { name: "Texto formatado" }).click();
    const text = await page.getByTestId("formatted-text").innerText();
    expect(text).toContain('{\n  "empresa": "ResolveLabs"');
    expect(text).toContain('    "limites": {');
  });

  test("XML: árvore com atributos, texto indentado e erro claro para XML inválido", async ({ page }) => {
    await input(page).setInputFiles(file("catalogo.xml", "application/xml", XML_SAMPLE));

    await expect(badge(page)).toHaveText("XML");
    const tree = page.getByTestId("tree");
    await expect(tree).toContainText("catalogo");
    await expect(tree).toContainText("@versao");
    await expect(tree).toContainText("produto");

    await page.getByRole("tab", { name: "Texto formatado" }).click();
    const text = await page.getByTestId("formatted-text").innerText();
    expect(text).toContain('<catalogo versao="2">');
    expect(text).toContain("  <produto id=\"1\">");
    expect(text).toContain("<nome>Caneta</nome>");

    await input(page).setInputFiles(file("quebrado.xml", "application/xml", "<a><b></a>"));
    await expect(page.getByTestId("inspector-error")).toContainText("XML mal formado");
  });

  test("PDF: metadados técnicos e prévia da primeira página", async ({ page }) => {
    await input(page).setInputFiles({ name: "extrato.pdf", mimeType: "application/pdf", buffer: buildStatementPdf(SAMPLE_STATEMENT) });

    await expect(badge(page)).toHaveText("PDF");
    await expect(page.getByText("Páginas")).toBeVisible();
    await expect(page.getByText("A4")).toBeVisible();
    await expect(page.getByText(/595 × 842 pt/)).toBeVisible();
    const preview = page.getByTestId("pdf-preview");
    await expect(preview).toBeVisible();
    await expect.poll(async () => (await preview.boundingBox())?.width ?? 0).toBeGreaterThan(100);
  });

  test("Imagem: resolução, megapixels, proporção e prévia", async ({ page }) => {
    const png = await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 640;
      c.height = 360;
      const x = c.getContext("2d")!;
      x.fillStyle = "#0f766e";
      x.fillRect(0, 0, 640, 360);
      return c.toDataURL("image/png").split(",")[1];
    });
    await input(page).setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") });

    await expect(badge(page)).toHaveText("Imagem");
    await expect(page.getByText("640 × 360 px")).toBeVisible();
    await expect(page.getByText("0.23 MP")).toBeVisible();
    await expect(page.getByText("16:9")).toBeVisible();
    await expect(page.getByTestId("image-preview")).toBeVisible();
  });

  test("detecção pelo conteúdo e erros: .csv que é PDF vira PDF; binário desconhecido é recusado", async ({ page }) => {
    await input(page).setInputFiles({ name: "falso.csv", mimeType: "text/csv", buffer: buildStatementPdf(SAMPLE_STATEMENT) });
    await expect(badge(page)).toHaveText("PDF"); // a assinatura vence a extensão

    await input(page).setInputFiles({ name: "lixo.bin", mimeType: "application/octet-stream", buffer: Buffer.from([1, 2, 3, 4, 5]) });
    await expect(page.getByTestId("inspector-error")).toContainText("Tipo de arquivo não suportado");
  });
});
