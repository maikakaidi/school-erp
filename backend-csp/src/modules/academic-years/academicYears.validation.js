import { z } from 'zod';

export const createYearSchema = z.object({
  name: z.string().regex(/^\d{4}-\d{4}$/, 'Format attendu : YYYY-YYYY'),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
});

export const setYearCurrentSchema = z.object({
  yearId: z.string().uuid(),
});

export const closeYearSchema = z.object({
  yearId: z.string().uuid(),
});

export const copyYearSchema = z.object({
  sourceYearId: z.string().uuid(),
  targetYearName: z.string().regex(/^\d{4}-\d{4}$/, 'Format attendu : YYYY-YYYY'),
});
