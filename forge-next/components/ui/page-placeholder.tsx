export function PagePlaceholder({ title }: { title: string }) {
  return (
    <main className="flex flex-1 items-center justify-center p-4 md:p-8">
      <h1 className="text-2xl font-semibold text-surface-foreground">{title}</h1>
    </main>
  );
}
