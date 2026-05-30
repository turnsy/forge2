import { z } from "zod";

export const userRoleSchema = z.enum(["coach", "athlete"]);

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  role: userRoleSchema,
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  role: userRoleSchema,
});
