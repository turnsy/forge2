import type { ReactNode } from "react";
import { ScrollPage } from "@/components/ui/scroll-page";
import { pageContentClass } from "@/lib/theme";

export function PageContent({
  className,
  children,
  header,
  preFooter,
  footer,
  scrollable = true,
}: {
  className?: string;
  children: ReactNode;
  header?: ReactNode;
  preFooter?: ReactNode;
  footer?: ReactNode;
  scrollable?: boolean;
}) {
  if (!scrollable) {
    return (
      <main className={`${pageContentClass()}${className ? ` ${className}` : ""}`}>
        {children}
      </main>
    );
  }

  return (
    <main
      className={`mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden${className ? ` ${className}` : ""}`}
    >
      <ScrollPage
        header={header}
        preFooter={preFooter}
        footer={footer}
        scrollClassName="flex flex-col gap-6"
      >
        {children}
      </ScrollPage>
    </main>
  );
}
