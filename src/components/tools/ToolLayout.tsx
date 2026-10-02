import Header from "../Header";
import Breadcrumbs from "../Breadcrumbs";
import PageHeading from "../PageHeading";

interface ToolLayoutProps {
  breadcrumbs: string[];
  title: string;
  description: string;
  wide?: boolean;
  children: React.ReactNode;
}

export default function ToolLayout({ breadcrumbs, title, description, children }: ToolLayoutProps) {
  return (
    <>
      <Header />
      <Breadcrumbs items={breadcrumbs} />
      <main className="page-container flex-1 pb-20">
        <PageHeading title={title} description={description} />
        {children}
      </main>
    </>
  );
}
