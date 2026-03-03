import { z } from 'zod';

export const signupSchema = z.object({
    tenantName: z.string().min(2).max(255),
    tenantSlug: z
        .string()
        .min(3)
        .max(63)
        .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, 'Slug must be lowercase alphanumeric with optional hyphens'),
    ownerName: z.string().min(2).max(255),
    email: z.string().email().max(255),
    password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const refreshSchema = z.object({
    refreshToken: z.string().min(1),
});

export const logoutSchema = z.object({
    refreshToken: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8).max(128),
});

export const inviteUserSchema = z.object({
    email: z.string().email().max(255),
    name: z.string().min(2).max(255),
    role: z.enum(['TENANT_ADMIN', 'TENANT_STAFF', 'TENANT_ACCOUNTANT']),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
