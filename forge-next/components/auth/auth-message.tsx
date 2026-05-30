export function AuthMessage({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    error:
      "border-red-500/20 bg-red-500/10 text-red-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
    success:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-md dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    info: "border-white/10 bg-white/[0.06] text-zinc-300 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300",
  }[tone];

  return (
    <p
      className={`rounded-3xl border px-4 py-3 text-sm ${styles}`}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
