import { authHeroClass, authHeroTitleClass } from "@/lib/theme";

export function AuthBrandHero({ className }: { className?: string }) {
  return (
    <section
      className={`${authHeroClass()}${className ? ` ${className}` : ""}`}
    >
      <h1 className={authHeroTitleClass()}>Forge</h1>
    </section>
  );
}
