import type { InputHTMLAttributes } from "react";

const inputClassName =
  "w-full rounded-3xl border border-white/10 bg-white/[0.06] px-5 py-3.5 font-normal text-zinc-50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] outline-none backdrop-blur-md placeholder:font-semibold placeholder:text-zinc-400 transition focus:border-white/20 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/10 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-50 dark:placeholder:text-zinc-400 dark:focus:border-white/20 dark:focus:bg-white/[0.08] dark:focus:ring-white/10";

export function AuthField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  if (label) {
    return (
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        <span>{label}</span>
        <input className={inputClassName} {...props} />
      </label>
    );
  }

  return <input className={inputClassName} {...props} />;
}
