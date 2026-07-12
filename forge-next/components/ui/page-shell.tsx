import type { ReactNode } from "react";
import { PageBackGutter, type PageBackConfig } from "@/components/ui/page-back-gutter";
import { ScrollPage } from "@/components/ui/scroll-page";
import { pageContentClass, pageShellClass } from "@/lib/theme";

function ShellScrollBody({
  header,
  preFooter,
  footer,
  children,
}: {
  header?: ReactNode;
  preFooter?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  if (header || preFooter || footer) {
    return (
      <ScrollPage
        header={header}
        preFooter={preFooter}
        footer={footer}
        scrollClassName="flex min-h-full flex-col gap-6"
      >
        {children}
      </ScrollPage>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
  );
}

export function PageShell({
  back,
  className,
  children,
  header,
  preFooter,
  footer,
  showMobileBack = true,
  scrollable = true,
}: {
  back?: PageBackConfig;
  className?: string;
  children: ReactNode;
  header?: ReactNode;
  preFooter?: ReactNode;
  footer?: ReactNode;
  showMobileBack?: boolean;
  scrollable?: boolean;
}) {
  if (!scrollable) {
    const mainClassName = back ? pageShellClass() : pageContentClass();
    const content = (
      <main className="flex min-h-full flex-col gap-6">{children}</main>
    );

    if (!back) {
      return (
        <main className={`${mainClassName}${className ? ` ${className}` : ""}`}>
          {children}
        </main>
      );
    }

    return (
      <div className={`${mainClassName}${className ? ` ${className}` : ""}`}>
        <PageBackGutter back={back} showMobileBack={showMobileBack}>
          {content}
        </PageBackGutter>
      </div>
    );
  }

  if (!back) {
    return (
      <main
        className={`mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden${className ? ` ${className}` : ""}`}
      >
        <ShellScrollBody header={header} preFooter={preFooter} footer={footer}>
          {children}
        </ShellScrollBody>
      </main>
    );
  }

  return (
    <div
      className={`${pageShellClass()} flex min-h-0 flex-1 flex-col overflow-hidden${className ? ` ${className}` : ""}`}
    >
      <PageBackGutter
        back={back}
        showMobileBack={showMobileBack}
        className="flex min-h-0 flex-1 flex-col"
      >
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <ShellScrollBody header={header} preFooter={preFooter} footer={footer}>
            {children}
          </ShellScrollBody>
        </main>
      </PageBackGutter>
    </div>
  );
}
