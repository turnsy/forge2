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

function browserOrigin(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.hostname !== "localhost") {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export async function getRequestOrigin(
  fallbackOrigin?: string | null,
): Promise<string> {
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

  const browserFallback = browserOrigin(fallbackOrigin);
  if (browserFallback) {
    return browserFallback;
  }

  return "http://localhost:3000";
}
