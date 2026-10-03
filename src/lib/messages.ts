// Utilitário de erro. Os textos de toasts e alertas ficam em i18n/messages/msg.ts.

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
