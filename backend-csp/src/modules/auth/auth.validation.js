import { z } from 'zod';
export const registerSchoolSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  password: z.string().min(6),
});
export const loginSchoolSchema = z.object({
  phone: z.string(),
  password: z.string(),
});
export const loginSuperAdminSchema = z.object({
  phone: z.string(),
  password: z.string(),
});