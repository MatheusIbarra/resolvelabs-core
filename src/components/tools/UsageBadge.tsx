export default function UsageBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-4 right-4 z-40 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 shadow-sm">
      {children}
    </div>
  );
}
