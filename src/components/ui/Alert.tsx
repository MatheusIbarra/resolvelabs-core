import { VARIANT_STYLES, VariantIcon, type Variant } from "./icons";

interface AlertProps {
  variant: Variant;
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/** Mensagem inline persistente (estados que bloqueiam ou orientam o usuário na tela). */
export default function Alert({ variant, title, children, action, className = "" }: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${VARIANT_STYLES[variant].box} ${className}`}
    >
      <VariantIcon variant={variant} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div>}
      </div>
      {action}
    </div>
  );
}
