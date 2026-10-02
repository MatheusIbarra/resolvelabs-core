"use client";

import { Component, useRef, useState, type ReactNode } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { downloadBlob } from "@/utils/download";
import { trackEvent } from "@/lib/track";
import { MSG } from "@/lib/messages";
import Alert from "../ui/Alert";
import { useToast } from "../ui/Toast";

const TOOL = "gerador-qrcode";

type Level = "L" | "M" | "Q" | "H";
/** Capacidade máxima em bytes (versão 40, modo byte) por nível de correção de erro. */
const CAPACITY: Record<Level, number> = { L: 2953, M: 2331, Q: 1663, H: 1273 };
const LEVELS: { value: Level; label: string }[] = [
  { value: "L", label: "Baixa (L): mais dados" },
  { value: "M", label: "Média (M): recomendado" },
  { value: "Q", label: "Alta (Q)" },
  { value: "H", label: "Máxima (H): mais robusto" },
];
const SIZES = [512, 1024, 2048];
const MAX_CHARS = 1000;

/** Rede de segurança: a biblioteca lança durante a renderização se o conteúdo não couber. */
class QrBoundary extends Component<{ resetKey: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? <Alert variant="error">{MSG.qr.tooLong}</Alert> : this.props.children;
  }
}

export default function QrGenerator() {
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [value, setValue] = useState("");
  const [level, setLevel] = useState<Level>("M");
  const [size, setSize] = useState(1024);

  const bytes = new TextEncoder().encode(value).length;
  const fits = bytes <= CAPACITY[level];
  const active = value.trim() !== "" && fits;

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error(MSG.qr.exportFailed);
        return;
      }
      downloadBlob(blob, "qrcode-resolvelabs.png");
      toast.success(MSG.qr.downloaded);
      trackEvent(TOOL, "use");
    }, "image/png");
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="card p-6" aria-labelledby="qr-in">
        <h2 id="qr-in" className="section-title mb-4">Conteúdo do QR Code</h2>
        <label htmlFor="qr-text" className="label">Link ou texto</label>
        <textarea
          id="qr-text"
          className="input min-h-[8rem] resize-y"
          placeholder="https://www.seusite.com.br"
          maxLength={MAX_CHARS}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          data-testid="qr-input"
        />
        <p className="mt-1 text-right text-xs text-stone-500">{value.length}/{MAX_CHARS}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="qr-level" className="label">Correção de erros</label>
            <select id="qr-level" className="input" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="qr-size" className="label">Tamanho do PNG</label>
            <select id="qr-size" className="input" value={size} onChange={(e) => setSize(Number(e.target.value))}>
              {SIZES.map((s) => (
                <option key={s} value={s}>{s} × {s} px</option>
              ))}
            </select>
          </div>
        </div>
        {!fits && <Alert variant="warning" className="mt-4">{MSG.qr.tooLong}</Alert>}
      </section>

      <section className="card flex flex-col items-center justify-center p-6" aria-labelledby="qr-out">
        <h2 id="qr-out" className="section-title mb-4 self-start">Seu QR Code</h2>
        {active ? (
          <QrBoundary resetKey={`${value}|${level}`}>
            <div className="rounded-lg border border-stone-200 bg-white p-3">
              <QRCodeCanvas
                ref={canvasRef}
                value={value}
                size={size}
                level={level}
                marginSize={4}
                bgColor="#ffffff"
                fgColor="#000000"
                style={{ width: "100%", maxWidth: 288, height: "auto" }}
                data-testid="qr-canvas"
              />
            </div>
            <button className="btn-primary mt-5 w-full max-w-[288px]" onClick={download} data-testid="qr-download">Baixar PNG</button>
          </QrBoundary>
        ) : (
          <div className="flex h-72 w-full max-w-[288px] items-center justify-center rounded-lg border-2 border-dashed border-stone-300 px-6 text-center text-sm text-stone-500">
            Digite um link ou texto para gerar o QR Code na hora.
          </div>
        )}
      </section>
    </div>
  );
}
