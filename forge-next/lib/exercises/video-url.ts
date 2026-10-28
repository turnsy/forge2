import { z } from "zod";

export const exerciseVideoInput = z.object({
  videoUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return (
          ["http:", "https:"].includes(url.protocol) &&
          !url.username &&
          !url.password
        );
      } catch {
        return false;
      }
    }, "Enter a valid http or https video URL."),
});

export const exerciseVideoIds = z.object({
  ids: z.array(z.uuid()).max(200),
});
