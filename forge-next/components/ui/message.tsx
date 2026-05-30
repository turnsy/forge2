import type { ReactNode } from "react";
import { messageToneClass, type MessageTone } from "@/lib/theme";

export function Message({
  tone,
  children,
}: {
  tone: MessageTone;
  children: ReactNode;
}) {
  return (
    <p
      className={messageToneClass(tone)}
      role={tone === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}
