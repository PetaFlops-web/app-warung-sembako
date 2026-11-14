import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string("Nama wajib dikirim"),
    email: z.email("Email tidak valid"),
    password: z.string().min(6, "Kata sandi minimal 6 karakter"),
    role: z.enum(['OWNER', 'KEEPER'], "Role harus OWNER atau KEEPER"),
  })
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];