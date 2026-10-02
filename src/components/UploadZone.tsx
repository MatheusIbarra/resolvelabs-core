"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ApiError, checkToolAccess, registerPdfUsage } from "@/lib/fakeApi";
import { baseName, downloadBlob } from "@/utils/download";
import { PdfNoTextError, convertPdfToOfx, ofxToBlob } from "@/utils/pdfToOfx";
import { FREE_PDF_LIMIT, SUPPORTED_BANKS, type DenyReason } from "@/lib/content";
import { Loading, LoadingLabel } from "./ui/Loading";
import Alert from "./ui/Alert";
import { useToast } from "./ui/Toast";
import { MSG, errorMessage } from "@/lib/messages";

const ACCEPTED_TYPE = "application/pdf";
const TOOL_SLUG = "pdf-para-ofx";

interface UploadZoneProps {
  onAccessDenied: (reason: DenyReason) => void;
}

export default function UploadZone({ onAccessDenied }: UploadZoneProps) {
  const toast = useToast();
  const { profile, isLoading, error: profileError, refresh, applyProfile } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isBusy = isLoading || isValidating || isProcessing;
  const isPro = profile?.plan === "PRO";
  const used = Math.min(profile?.usageCount ?? 0, FREE_PDF_LIMIT);
  const isLimitReached = profile?.plan === "FREE" && profile.usageCount >= FREE_PDF_LIMIT;

  /** Roda a validação de permissão na "API". Retorna true se pode prosseguir. */
  const validateAccess = async (): Promise<boolean> => {
    setIsValidating(true);
    try {
      const access = await checkToolAccess(TOOL_SLUG);
      if (!access.allowed) {
        onAccessDenied(access.reason);
        return false;
      }
      return true;
    } catch (err) {
      toast.error(errorMessage(err, MSG.pdf.validateFailed));
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file || isBusy) return;
    if (file.type !== ACCEPTED_TYPE) {
      toast.error(MSG.pdf.invalidFormat);
      return;
    }
    if (!(await validateAccess())) return;

    setIsProcessing(true);
    try {
      // 1) Conversão 100% local: o PDF nunca sai do navegador.
      const result = await convertPdfToOfx(file);
      if (result.transactions.length === 0) {
        toast.error(MSG.pdf.noTransactions);
        return; // não consome o uso gratuito
      }
      // 2) Só o contador de uso vai ao servidor (limite aplicado de forma atômica).
      const { usageCount } = await registerPdfUsage();
      applyProfile({ usageCount });
      // 3) Download do .ofx.
      downloadBlob(ofxToBlob(result.ofx), `${baseName(file.name)}.ofx`);
      toast.success(MSG.pdf.converted(file.name, result.transactions.length), { title: MSG.pdf.convertedTitle });
      result.warnings.forEach((w) => toast.warning(w));
    } catch (err) {
      if (err instanceof ApiError && err.code === "LIMIT_REACHED") {
        await refresh();
        onAccessDenied("LIMIT_REACHED");
      } else if (err instanceof PdfNoTextError) {
        toast.error(err.message);
      } else {
        toast.error(errorMessage(err, MSG.pdf.failed));
      }
    } finally {
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
  if (isLoading) status = <Loading>Carregando seu perfil…</Loading>;
  else if (isValidating) status = <Loading>Verificando seu acesso…</Loading>;
  else if (isProcessing) status = <Loading>Convertendo o arquivo…</Loading>;
  else if (profileError) status = <Alert variant="error">{profileError} Clique na área acima para tentar novamente.</Alert>;
  else if (isLimitReached) status = <Alert variant="warning">{MSG.pdf.limitReached}</Alert>;

  let buttonLabel: React.ReactNode = "Selecionar arquivo";
  if (isLoading) buttonLabel = <LoadingLabel>Carregando perfil…</LoadingLabel>;
  else if (isValidating) buttonLabel = <LoadingLabel>Verificando acesso…</LoadingLabel>;
  else if (isProcessing) buttonLabel = <LoadingLabel>Convertendo…</LoadingLabel>;

  return (
    <section className="card">
      <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-4">
        <h2 className="section-title">Enviar extrato</h2>
        {isLoading ? (
          <Loading>Carregando…</Loading>
        ) : profile ? (
          isPro ? (
            <span className="badge-brand">Plano PRO · uso ilimitado</span>
          ) : (
            <span className="badge-neutral" aria-label={`Uso gratuito: ${used} de ${FREE_PDF_LIMIT}`}>
              Uso gratuito: {used}/{FREE_PDF_LIMIT}
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
            {isDragging ? "Solte o arquivo para enviar" : "Arraste seu extrato em PDF aqui"}
          </p>
          <p className="mb-6 text-sm text-stone-600">ou clique para buscar no computador</p>
          <span className="btn-primary pointer-events-none" aria-hidden>
            {buttonLabel}
          </span>
        </div>

        <div className="mt-4 min-h-6" aria-live="polite">{status}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-stone-200 px-5 py-4">
        <span className="mr-1 text-sm text-stone-500">Formatos suportados:</span>
        {SUPPORTED_BANKS.map((bank) => (
          <span key={bank} className="badge-neutral">{bank}</span>
        ))}
      </div>
    </section>
  );
}
