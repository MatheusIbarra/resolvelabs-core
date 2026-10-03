"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_LENGTH, MIN_LENGTH, NoSecureRandomError, estimateStrength, generatePassword, type PasswordOptions } from "@/utils/password";
import { trackEvent } from "@/lib/track";
import { useI18n } from "@/i18n/I18nProvider";
import Alert from "../ui/Alert";
import { useToast } from "../ui/Toast";

const TOOL = "gerador-senhas";

const CLASSES = [
  { key: "lower", sample: "a-z" },
  { key: "upper", sample: "A-Z" },
  { key: "digits", sample: "0-9" },
  { key: "symbols", sample: "!@#$" },
] as const;

const STRENGTH_KEY = ["weak", "fair", "strong", "veryStrong"] as const;

const BAR = ["bg-red-600", "bg-amber-500", "bg-teal-600", "bg-teal-700"];

export default function PasswordGenerator() {
  const { t } = useI18n();
  const toast = useToast();
  const [options, setOptions] = useState<PasswordOptions>({ length: 16, upper: true, lower: true, digits: true, symbols: true, avoidAmbiguous: false });
  // A senha só existe depois da montagem: nunca vai no HTML gerado no servidor.
  const [password, setPassword] = useState("");
  const [unsupported, setUnsupported] = useState(false);
  const tracked = useRef(false);

  const regenerate = useCallback(
    (opts: PasswordOptions) => {
      try {
        setPassword(generatePassword(opts));
      } catch (err) {
        if (err instanceof NoSecureRandomError) setUnsupported(true);
        else throw err;
      }
    },
    [],
  );

  useEffect(() => {
    regenerate(options);
  }, [options, regenerate]);

  const selected = CLASSES.filter((c) => options[c.key]);
  const strength = estimateStrength(options);

  const copy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      toast.success(t("msg.password.copied"));
      if (!tracked.current) {
        tracked.current = true;
        trackEvent(TOOL, "use"); // só o evento, nunca a senha
      }
    } catch {
      toast.error(t("msg.password.copyFailed"));
    }
  };

  return (
    <div className="card p-6">
      {unsupported && <Alert variant="error" className="mb-5">{t("msg.password.noRandom")}</Alert>}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <output
          aria-live="polite"
          data-testid="password-output"
          className="flex min-h-[3.25rem] flex-1 items-center break-all rounded-md border border-stone-300 bg-stone-50 px-4 py-3 font-mono text-base text-stone-900"
        >
          {password || "…"}
        </output>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => regenerate(options)} disabled={unsupported} data-testid="password-regenerate">{t("tools.password.generateAnother")}</button>
          <button className="btn-primary" onClick={copy} disabled={!password} data-testid="password-copy">{t("tools.password.copy")}</button>
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-stone-600">{t("tools.password.strength")} <strong className="text-stone-900">{t(`tools.password.${STRENGTH_KEY[strength.level - 1]}`)}</strong></span>
          <span className="text-xs text-stone-500">{t("tools.password.bits", { bits: strength.bits })}</span>
        </div>
        <div className="flex gap-1" aria-hidden>
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= strength.level ? BAR[strength.level - 1] : "bg-stone-200"}`} />
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="pw-length" className="label !mb-0">{t("tools.password.lengthLabel")}</label>
          <span className="rounded-md bg-stone-100 px-2 py-0.5 font-mono text-sm text-stone-900" data-testid="password-length-value">{options.length}</span>
        </div>
        <input
          id="pw-length"
          type="range"
          min={MIN_LENGTH}
          max={MAX_LENGTH}
          value={options.length}
          onChange={(e) => setOptions((o) => ({ ...o, length: Number(e.target.value) }))}
          className="w-full accent-teal-700"
        />
        <div className="mt-1 flex justify-between text-xs text-stone-500"><span>{MIN_LENGTH}</span><span>{MAX_LENGTH}</span></div>
      </div>

      <fieldset>
        <legend className="label">{t("tools.password.types")}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {CLASSES.map((c) => {
            const isLast = selected.length === 1 && options[c.key];
            return (
              <label key={c.key} className={`flex items-center justify-between rounded-md border border-stone-200 px-4 py-3 text-sm ${isLast ? "opacity-70" : "cursor-pointer hover:border-teal-600"}`}>
                <span className="flex items-center gap-3 text-stone-800">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-teal-700"
                    checked={options[c.key]}
                    disabled={isLast}
                    onChange={(e) => setOptions((o) => ({ ...o, [c.key]: e.target.checked }))}
                    data-testid={`pw-${c.key}`}
                  />
                  {t(`tools.password.${c.key}`)}
                </span>
                <span className="font-mono text-xs text-stone-500">{c.sample}</span>
              </label>
            );
          })}
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm text-stone-700">
          <input type="checkbox" className="h-4 w-4 accent-teal-700" checked={options.avoidAmbiguous} onChange={(e) => setOptions((o) => ({ ...o, avoidAmbiguous: e.target.checked }))} />
          {t("tools.password.avoid")}
        </label>
        <p className="mt-2 text-xs text-stone-500">{t("tools.password.minOne")}</p>
      </fieldset>
    </div>
  );
}
