import { NextResponse } from "next/server";
import { requestTranslator } from "@/i18n/server";
import type { ApiMessages } from "@/i18n/messages/api";

export type ApiErrorKey = keyof ApiMessages;

/** Resposta de erro JSON no idioma da requisição (`x-locale`, cookie ou Accept-Language). */
export function apiError(
  request: Request,
  key: ApiErrorKey,
  status: number,
  vars?: Record<string, string | number>,
  extra?: Record<string, unknown>,
  init?: { headers?: HeadersInit },
) {
  return NextResponse.json({ error: requestTranslator(request).t(`api.${key}`, vars), ...extra }, { status, headers: init?.headers });
}
