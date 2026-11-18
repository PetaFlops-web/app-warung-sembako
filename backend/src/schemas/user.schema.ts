import { z } from 'zod';

export const registerUserSchema = z.object({
  body: z.object({
    name: z.string("Nama wajib dikirim"),
    email: z.email("Email tidak valid"),
    password: z.string().min(6, "Kata sandi minimal 6 karakter"),
    role: z.enum(['OWNER', 'KEEPER'], "Role harus OWNER atau KEEPER"),
  })
});

export const loginUserSchema = z.object({
  body: z.object({
    email: z.email("Email tidak valid"),
    password: z.string().min(6, "Kata sandi minimal 6 karakter"),
  })
});

export const refreshTokenSchema = z.object({
  body: z.object({
    token_penyegaran: z.string("Token penyegaran wajib dikirim").min(1, "Token penyegaran wajib dikirim"),
  })
});

export type registerUserInput = z.infer<typeof registerUserSchema>['body'];
export type loginUserInput = z.infer<typeof loginUserSchema>['body'];
export type refreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
