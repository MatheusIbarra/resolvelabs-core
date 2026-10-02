export type Variant = "success" | "error" | "warning" | "info";

const PATHS: Record<Variant, string> = {
  success: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  error: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
  warning: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  info: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
};

export const VARIANT_STYLES: Record<Variant, { box: string; icon: string }> = {
  success: { box: "border-teal-200 bg-teal-50 text-teal-900", icon: "text-teal-700" },
  error: { box: "border-red-200 bg-red-50 text-red-900", icon: "text-red-600" },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-900", icon: "text-amber-600" },
  info: { box: "border-stone-200 bg-stone-100 text-stone-800", icon: "text-stone-500" },
};

export function VariantIcon({ variant, className = "h-5 w-5" }: { variant: Variant; className?: string }) {
  return (
    <svg className={`${className} shrink-0 ${VARIANT_STYLES[variant].icon}`} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={PATHS[variant]} />
    </svg>
  );
}
