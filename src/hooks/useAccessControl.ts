"use client";

import { useCallback, useState } from "react";
import { decideAccess, getProfile } from "@/lib/fakeApi";
import { getTool } from "@/lib/tools";
import { errorMessage } from "@/lib/messages";
import { useI18n } from "@/i18n/I18nProvider";
import { useToast } from "@/components/ui/Toast";
import { usePaywall } from "./usePaywall";

export interface AccessRequest {
  /** Slug da ferramenta (de lib/tools): plano exigido e limite gratuito vêm de lá. */
  slug?: string;
  /** Alternativa sem slug: exige PRO. Ignorado quando `slug` é informado. */
  isProTool?: boolean;
}

/**
 * Verifica, ANTES de uma ação, se o usuário pode executá-la; se não puder, abre o paywall com o motivo certo.
 *
 *   const { checkAccess } = useAccessControl();
 *   if (!(await checkAccess({ slug: "pdf-para-ofx" }))) return;
 *
 * Lê o perfil vivo do servidor a cada chamada (plano e uso podem ter mudado). A checagem é só UX:
 * a API reaplica plano e limite de forma atômica, então burlar o front não libera nada.
 * Não há limite em localStorage: seria trivial de apagar.
 */
export function useAccessControl() {
  const toast = useToast();
  const { t } = useI18n();
  const paywall = usePaywall();
  const [isChecking, setIsChecking] = useState(false);

  const checkAccess = useCallback(
    async ({ slug, isProTool }: AccessRequest): Promise<boolean> => {
      setIsChecking(true);
      try {
        const tool = slug ? getTool(slug) : undefined;
        if (slug && !tool) throw new Error(t("msg.api.unknownTool"));
        const decision = decideAccess(await getProfile(), { requiresPro: tool?.requiresPro ?? isProTool, freeLimit: tool?.freeLimit });
        if (decision.allowed) return true;
        paywall.open(decision.reason);
        return false;
      } catch (err) {
        // Falha de rede/servidor não é motivo para mostrar paywall: avisa e barra a ação.
        toast.error(errorMessage(err, t("msg.tools.validateFailed")));
        return false;
      } finally {
        setIsChecking(false);
      }
    },
    [paywall, toast, t],
  );

  return { checkAccess, isChecking };
}
