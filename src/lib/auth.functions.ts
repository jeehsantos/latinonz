import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Accept NZ numbers in flexible formats: +64..., 0064..., or local 0xx...
// Allows spaces, dashes, and parentheses between digits.
const nzPhoneRegex = /^(?:\+?64|0)[\s\-()]*\d(?:[\s\-()]*\d){7,11}$/;

const signUpSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(8).max(128),
  businessName: z.string().trim().min(1).max(200),
  ownerName: z.string().trim().min(1).max(200),
  whatsapp: z
    .string()
    .trim()
    .max(32)
    .regex(nzPhoneRegex, "Número NZ inválido (ex: +64 21 000 0000 ou 021 000 0000)"),
});

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(1).max(128),
});

export const signUp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => signUpSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        business_name: data.businessName,
        owner_name: data.ownerName,
        whatsapp: data.whatsapp,
      },
    });

    if (createError || !created.user) {
      console.error("signUp createUser error", createError);
      const message = createError?.message ?? "Não foi possível criar a conta.";
      return { ok: false as const, error: message };
    }

    const { data: session, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError || !session.session) {
      console.error("signUp signIn error", signInError);
      return {
        ok: false as const,
        error: signInError?.message ?? "Conta criada, mas login falhou.",
      };
    }

    return {
      ok: true as const,
      session: session.session,
      user: session.user,
    };
  });

export const signIn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => signInSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: result, error } = await supabaseAdmin.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error || !result.session) {
      console.error("signIn error", error);
      return {
        ok: false as const,
        error: error?.message ?? "E-mail ou senha incorretos.",
      };
    }

    return {
      ok: true as const,
      session: result.session,
      user: result.user,
    };
  });

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (token) {
    const { error } = await supabaseAdmin.auth.admin.signOut(token);
    if (error) {
      console.error("signOut error", error);
      return { ok: false as const, error: error.message };
    }
  }
  return { ok: true as const };
});

export const getSession = createServerFn({ method: "GET" }).handler(async () => {
  const authHeader = getRequestHeader("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return { ok: true as const, user: null };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return { ok: true as const, user: null };
  }

  return { ok: true as const, user: data.user };
});
