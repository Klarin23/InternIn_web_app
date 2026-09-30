import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email().max(255);
const tokenSchema = z.string().min(32).max(128);
const codeSchema = z.string().trim().min(10).max(40);

export const inviterEtudiantSchema = z.object({
  email: emailSchema,
});

export const tokenSchemaBody = z.object({
  token: tokenSchema,
});

export const codeRattachementSchema = z.object({
  code: codeSchema,
});

export const idRattachementSchema = z.object({
  idRattachement: z.string().uuid(),
});
