import { messageToneClass, type MessageTone } from "@/lib/theme";

export function AuthMessage({
  tone,
  children,
}: {
  tone: MessageTone;
  children: React.ReactNode;
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
