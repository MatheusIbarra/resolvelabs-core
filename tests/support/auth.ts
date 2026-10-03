import { expect, type Page } from "@playwright/test";
import { USER_PASSWORD } from "./e2e-env";

export const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@resolvelabs.test`;

/** Cria a conta pela API e deixa o navegador logado (os cookies da API valem para a página). */
export async function registerAndLogin(page: Page, email = uniqueEmail("user")) {
  const credentials = { email, password: USER_PASSWORD };
  const signup = { ...credentials, termsAccepted: true };
  expect((await page.request.post("/api/auth/register", { data: signup })).status(), "cadastro via API").toBe(201);
  expect((await page.request.post("/api/auth/login", { data: credentials })).status(), "login via API").toBe(200);
  return email;
}
