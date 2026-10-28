const IMAGE_MEDIA_TYPES: Record<string, string> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
};

export function imageMediaType(filename: string): string | null {
  const extension = filename.slice(filename.lastIndexOf(".")).toLowerCase();
  return IMAGE_MEDIA_TYPES[extension] ?? null;
}

/** Verify the file signature rather than trusting the browser's MIME type. */
export function matchesImageType(bytes: Uint8Array, mediaType: string): boolean {
  const startsWith = (signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  switch (mediaType) {
    case "image/png": return startsWith([137, 80, 78, 71, 13, 10, 26, 10]);
    case "image/jpeg": return startsWith([255, 216, 255]);
    case "image/gif": return startsWith([71, 73, 70, 56]) && (bytes[4] === 55 || bytes[4] === 57) && bytes[5] === 97;
    case "image/webp": return startsWith([82, 73, 70, 70]) && [87, 69, 66, 80].every((byte, index) => bytes[index + 8] === byte);
    default: return false;
  }
}
