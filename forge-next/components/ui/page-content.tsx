import type { ReactNode } from "react";
import { ScrollPage } from "@/components/ui/scroll-page";
import { LIST_PAGE_SCROLL_CLASS } from "@/lib/layout/page-layout";
import { pageContentClass } from "@/lib/theme";

export function PageContent({
  className,
  children,
  header,
  subHeader,
  preFooter,
  footer,
  scrollable = true,
  listLayout = false,
}: {
  className?: string;
  children: ReactNode;
  header?: ReactNode;
  subHeader?: ReactNode;
  preFooter?: ReactNode;
  footer?: ReactNode;
  scrollable?: boolean;
  listLayout?: boolean;
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
        subHeader={subHeader}
        preFooter={preFooter}
        footer={footer}
        scrollClassName={listLayout ? LIST_PAGE_SCROLL_CLASS : "flex flex-col gap-6"}
      >
        {children}
      </ScrollPage>
    </main>
  );
}
