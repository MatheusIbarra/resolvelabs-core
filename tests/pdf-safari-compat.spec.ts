import { expect, test } from "@playwright/test";
import { USER_PASSWORD, USER_PHONE } from "./support/e2e-env";
import { SAMPLE_STATEMENT, buildStatementPdf } from "./support/pdf";

/**
 * Regressão: Safari/WebKit antigos não suportam `for await` sobre ReadableStream, e o pdf.js usava isso em
 * getTextContent() ("undefined is not a function (near '...value of readableStream...')").
 * O teste remove esse suporte do navegador e garante que a conversão continua funcionando.
 */
test("PDF -> OFX funciona em navegador sem iteração assíncrona de ReadableStream", async ({ page }) => {
  const email = `compat-${Date.now()}@resolvelabs.test`;
  const credentials = { email, password: USER_PASSWORD };
  expect((await page.request.post("/api/auth/register", { data: { ...credentials, phone: USER_PHONE, termsAccepted: true } })).status()).toBe(201);
  expect((await page.request.post("/api/auth/login", { data: credentials })).status()).toBe(200);

  await page.goto("/ferramentas/pdf-para-ofx");
  await expect(page.getByLabel("Uso gratuito: 0 de 3")).toBeVisible(); // página carregada e hidratada

  // Simula o navegador antigo só agora, para não quebrar a hidratação do próprio app.
  await page.evaluate(() => {
    const proto = ReadableStream.prototype as unknown as Record<PropertyKey, unknown>;
    delete proto[Symbol.asyncIterator];
    delete proto.values;
  });
  expect(await page.evaluate(() => typeof (ReadableStream.prototype as unknown as Record<PropertyKey, unknown>)[Symbol.asyncIterator])).toBe("undefined");

  const download = page.waitForEvent("download");
  await page.locator('input[type="file"]').setInputFiles({
    name: "extrato.pdf",
    mimeType: "application/pdf",
    buffer: buildStatementPdf(SAMPLE_STATEMENT),
  });

  expect((await download).suggestedFilename()).toBe("extrato.ofx");
  await expect(page.getByText(/OFX gerado/).first()).toBeVisible();
  await expect(page.getByText(/iterator|undefined is not a function/i)).toHaveCount(0);
});
