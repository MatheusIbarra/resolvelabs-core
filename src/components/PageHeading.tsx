export default function PageHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      <h1 className="mb-3 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">{title}</h1>
      <p className="text-base leading-relaxed text-stone-600">{description}</p>
    </div>
  );
}
