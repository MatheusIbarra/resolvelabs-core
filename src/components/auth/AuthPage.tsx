import Header from "../Header";

export default function AuthPage({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="page-container flex flex-1 items-start justify-center py-12 sm:py-20">{children}</main>
    </>
  );
}
