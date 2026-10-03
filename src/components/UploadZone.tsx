"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, refundPdfUsage, registerPdfUsage } from "@/lib/fakeApi";
import { useAccessControl } from "@/hooks/useAccessControl";
import { usePaywall } from "@/hooks/usePaywall";
import { baseName, downloadBlob } from "@/utils/download";
import { PdfNoTextError, convertPdfToOfx, ofxToBlob } from "@/utils/pdfToOfx";
import { FREE_PDF_LIMIT, SUPPORTED_BANKS } from "@/lib/content";
import { Loading, LoadingLabel } from "./ui/Loading";
import Alert from "./ui/Alert";
import { useToast } from "./ui/Toast";
import { errorMessage } from "@/lib/messages";
import { useI18n } from "@/i18n/I18nProvider";

const ACCEPTED_TYPE = "application/pdf";
const TOOL_SLUG = "pdf-para-ofx";

export default function UploadZone() {
  const { t, tn } = useI18n();
  const toast = useToast();
  const paywall = usePaywall();
  const { checkAccess, isChecking: isValidating } = useAccessControl();
  const { profile, isLoading, error: profileError, refresh, applyProfile } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isBusy = isLoading || isValidating || isProcessing;
  const isPro = profile?.plan === "PRO";
  const used = Math.min(profile?.usageCount ?? 0, FREE_PDF_LIMIT);
  const isLimitReached = profile?.plan === "FREE" && profile.usageCount >= FREE_PDF_LIMIT;

  /** Confere plano/limite antes de agir; se não puder, o paywall global abre com o motivo certo. */
  const validateAccess = () => checkAccess({ slug: TOOL_SLUG });

  const handleFile = async (file: File | undefined) => {
    if (!file || isBusy) return;
    if (file.type !== ACCEPTED_TYPE) {
      toast.error(t("msg.pdf.invalidFormat"));
      return;
    }
    if (!(await validateAccess())) return;

    setIsProcessing(true);
    let reserved = false;
    let delivered = false;
    try {
      // 1) O servidor reserva o uso (limite aplicado de forma atômica) antes de qualquer processamento.
      const { usageCount } = await registerPdfUsage();
      reserved = true;
      applyProfile({ usageCount });
      // 2) Conversão 100% local: o PDF nunca sai do navegador.
      const result = await convertPdfToOfx(file);
      if (result.transactions.length === 0) {
        toast.error(t("msg.pdf.noTransactions"));
        return; // sem resultado: o uso reservado é devolvido no finally
      }
      delivered = true;
      // 3) Download do .ofx.
      downloadBlob(ofxToBlob(result.ofx), `${baseName(file.name)}.ofx`);
      toast.success(tn("msg.pdf.converted", result.transactions.length, { name: file.name }), { title: t("msg.pdf.convertedTitle") });
      result.warnings.forEach((w) => toast.warning(w));
    } catch (err) {
      if (err instanceof ApiError && err.code === "LIMIT_REACHED") {
        await refresh();
        paywall.open("LIMIT_REACHED");
      } else if (err instanceof ApiError && err.code === "UNAUTHENTICATED") {
        paywall.open("AUTH_REQUIRED"); // sessão expirou no meio do caminho
      } else if (err instanceof PdfNoTextError) {
        toast.error(err.message);
      } else {
        toast.error(errorMessage(err, t("msg.pdf.failed")));
      }
    } finally {
      if (reserved && !delivered) {
        try {
          applyProfile(await refundPdfUsage());
        } catch {
          await refresh(); // o servidor segue como fonte da verdade do contador
        }
      }
      setIsProcessing(false);
    }
  };

  const handleClick = async () => {
    if (isBusy) return;
    if (profileError) {
      await refresh();
      return;
    }
    // Limite já conhecido: a validação roda, barra a ação e abre o paywall.
    if (isLimitReached) {
      await validateAccess();
      return;
    }
    inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite selecionar o mesmo arquivo novamente
    handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Ignora dragleave disparado ao passar sobre elementos filhos.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isBusy) return;
    const file = e.dataTransfer.files?.[0];
    if (isLimitReached) {
      await validateAccess();
      return;
    }
    handleFile(file);
  };

  // Estado de carregamento (texto de terminal) e avisos persistentes abaixo da zona de drop
  let status: React.ReactNode = null;
  if (isLoading) status = <Loading>{t("tools.pdf.loadingProfile")}</Loading>;
  else if (isValidating) status = <Loading>{t("tools.pdf.verifying")}</Loading>;
  else if (isProcessing) status = <Loading>{t("tools.pdf.converting")}</Loading>;
  else if (profileError) status = <Alert variant="error">{profileError} {t("tools.pdf.profileErrorHint")}</Alert>;
  else if (isLimitReached) status = <Alert variant="warning">{t("msg.pdf.limitReached")}</Alert>;

  let buttonLabel: React.ReactNode = t("tools.pdf.selectFile");
  if (isLoading) buttonLabel = <LoadingLabel>{t("tools.pdf.loadingProfileShort")}</LoadingLabel>;
  else if (isValidating) buttonLabel = <LoadingLabel>{t("tools.pdf.verifyingShort")}</LoadingLabel>;
  else if (isProcessing) buttonLabel = <LoadingLabel>{t("tools.pdf.convertingShort")}</LoadingLabel>;

  return (
    <section className="card">
      <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-4">
        <h2 className="section-title">{t("tools.pdf.title")}</h2>
        {isLoading ? (
          <Loading>{t("common.ui.loading")}</Loading>
        ) : profile ? (
          isPro ? (
            <span className="badge-brand">{t("tools.pdf.proPlan")}</span>
          ) : (
            <span className="badge-neutral" aria-label={t("tools.pdf.freeUseAria", { used, limit: FREE_PDF_LIMIT })}>
              {t("tools.pdf.freeUse", { used, limit: FREE_PDF_LIMIT })}
            </span>
          )
        ) : null}
      </div>

      <div className="p-5">
        <div
          role="button"
          tabIndex={0}
          aria-busy={isBusy}
          aria-disabled={isBusy}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`group flex flex-col items-center rounded-lg border-2 border-dashed px-6 py-14 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700/40 ${
            isBusy ? "cursor-wait" : "cursor-pointer"
          } ${
            isDragging
              ? "border-teal-600 bg-teal-50"
              : "border-stone-300 bg-stone-50 hover:border-teal-600 hover:bg-teal-50/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPE}
            className="hidden"
            onChange={handleInputChange}
            onClick={(e) => e.stopPropagation()}
          />
          <svg className="mb-4 h-10 w-10 text-stone-400 group-hover:text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="mb-1 text-lg font-semibold text-stone-900">
            {isDragging ? t("tools.pdf.drop") : t("tools.pdf.drag")}
          </p>
          <p className="mb-6 text-sm text-stone-600">{t("tools.pdf.click")}</p>
          <span className="btn-primary pointer-events-none" aria-hidden>
            {buttonLabel}
          </span>
        </div>

        <div className="mt-4 min-h-6" aria-live="polite">{status}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-stone-200 px-5 py-4">
        <span className="mr-1 text-sm text-stone-500">{t("tools.pdf.formats")}</span>
        {SUPPORTED_BANKS.map((bank) => (
          <span key={bank} className="badge-neutral">{bank}</span>
        ))}
      </div>
    </section>
  );
}
