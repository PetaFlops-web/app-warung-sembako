import { z } from 'zod';

export const registerUserSchema = z.object({
  body: z.object({
    username: z.string("Username wajib dikirim"),
    email: z.email("Email tidak valid"),
    password: z.string().min(6, "Kata sandi minimal 6 karakter").max(128, "Kata sandi maksimal 128 karakter"),
    role: z.enum(['OWNER', 'KEEPER'], "Role harus OWNER atau KEEPER"),
  })
});

export const loginUserSchema = z.object({
  body: z.object({
    email: z.email("Email tidak valid"),
    password: z.string().min(6, "Kata sandi minimal 6 karakter"),
  })
});

export type registerUserInput = z.infer<typeof registerUserSchema>['body'];
export type loginUserInput = z.infer<typeof loginUserSchema>['body'];