"use client";

export function addBrowserOrigin(formData: FormData): FormData {
  if (typeof window !== "undefined") {
    formData.set("origin", window.location.origin);
  }

  return formData;
}
