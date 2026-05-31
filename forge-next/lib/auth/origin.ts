import { headers } from "next/headers";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

function configuredSiteUrl(): string | null {
  const value =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim();

  return value ? trimTrailingSlash(value) : null;
}

function vercelDeploymentOrigin(): string | null {
  const host = process.env.VERCEL_URL?.trim();
  if (!host) {
    return null;
  }

  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${trimTrailingSlash(host)}`;
}

export async function getRequestOrigin(): Promise<string> {
  const configured = configuredSiteUrl();
  if (configured) {
    return configured;
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin");
  if (origin) {
    return trimTrailingSlash(origin);
  }

  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (host) {
    const protocol = headerStore.get("x-forwarded-proto") ?? "https";
    const hostname = host.split(",")[0]?.trim();
    if (hostname) {
      return `${protocol}://${hostname}`;
    }
  }

  const vercelOrigin = vercelDeploymentOrigin();
  if (vercelOrigin) {
    return vercelOrigin;
  }

  return "http://localhost:3000";
}
