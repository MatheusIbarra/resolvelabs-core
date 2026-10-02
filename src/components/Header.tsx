import Link from "next/link";
import Logo from "./Logo";
import HeaderAuthLink from "./auth/HeaderAuthLink";

const NAV_LINK = "text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors";

export default function Header() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="page-container flex h-16 items-center justify-between">
        <Link href="/" aria-label="ResolveLabs – início">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/ferramentas" className={NAV_LINK}>Ferramentas</Link>
          <Link href="/blog" className={NAV_LINK}>Blog</Link>
          <Link href="/checkout" className={NAV_LINK}>Preços</Link>
        </nav>
        <div className="flex items-center gap-3">
          <HeaderAuthLink />
          <Link href="/checkout" className="btn-primary">Assinar PRO</Link>
        </div>
      </div>
    </header>
  );
}
