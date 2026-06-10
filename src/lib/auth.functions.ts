import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendActivationEmail } from "@/lib/email/activation.server";
import { sendPasswordResetEmail } from "@/lib/email/password-reset.server";
import type { EmailLocale } from "@/lib/email/email-i18n";

// Accept NZ numbers in flexible formats: +64..., 0064..., or local 0xx...
const nzPhoneRegex = /^(?:\+?64|0)[\s\-()]*\d(?:[\s\-()]*\d){7,11}$/;

const siteOriginSchema = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((u) => /^https?:\/\//i.test(u), "Origem inválida");

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
  siteOrigin: siteOriginSchema,
});

const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(1).max(128),
});

const resendActivationSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  siteOrigin: siteOriginSchema,
});

const passwordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  siteOrigin: siteOriginSchema,
});

async function buildAndSendActivation(args: {
  email: string;
  password?: string;
  ownerName: string;
  siteOrigin: string;
  locale?: EmailLocale;
}) {
  const redirectTo = `${args.siteOrigin}/auth/confirm`;
  const linkResult = args.password
    ? await supabaseAdmin.auth.admin.generateLink({
        type: "signup",
        email: args.email,
        password: args.password,
        options: { redirectTo },
      })
    : await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: args.email,
        options: { redirectTo },
      });

  const { data: link, error: linkError } = linkResult;
  if (linkError || !link?.properties?.hashed_token) {
    throw new Error(linkError?.message ?? "Não foi possível gerar o link de ativação.");
  }

  const linkType = args.password ? "signup" : "magiclink";
  const tokenHash = link.properties.hashed_token;
  const activationUrl = `${args.siteOrigin}/auth/confirm?token_hash=${encodeURIComponent(
    tokenHash,
  )}&type=${linkType}`;

  await sendActivationEmail({
    to: args.email,
    ownerName: args.ownerName,
    activationUrl,
    locale: args.locale ?? "en",
  });
}

export const signUp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => signUpSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: false,
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

    try {
      // New user — no business yet, so fall back to default locale.
      await buildAndSendActivation({
        email: data.email,
        password: data.password,
        ownerName: data.ownerName,
        siteOrigin: data.siteOrigin,
        locale: "en",
      });
    } catch (err) {
      console.error("signUp activation email error", err);
      return {
        ok: false as const,
        error:
          "Conta criada, mas falhou ao enviar o e-mail de ativação. Tente reenviar em alguns minutos.",
      };
    }

    return {
      ok: true as const,
      requiresActivation: true as const,
      email: data.email,
    };
  });

export const resendActivation = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => resendActivationSchema.parse(input))
  .handler(async ({ data }) => {
    // Look up user by email so we have the owner name for the email template.
    const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error("resendActivation list error", listError);
      return { ok: false as const, error: "Não foi possível reenviar o e-mail." };
    }
    const user = list.users.find((u) => u.email?.toLowerCase() === data.email);
    if (!user) {
      // Don't reveal whether the email exists.
      return { ok: true as const };
    }
    if (user.email_confirmed_at) {
      return { ok: false as const, error: "Esta conta já está ativada. Faça login." };
    }

    const ownerName =
      (user.user_metadata?.owner_name as string | undefined) ??
      (user.user_metadata?.business_name as string | undefined) ??
      "";

    try {
      // Look up the user's business for language preference.
      const { data: biz } = await supabaseAdmin
        .from("businesses")
        .select("language_preference")
        .eq("owner_id", user.id)
        .maybeSingle();
      const locale = (biz?.language_preference as EmailLocale) || "en";

      await buildAndSendActivation({
        email: data.email,
        ownerName,
        siteOrigin: data.siteOrigin,
        locale,
      });
    } catch (err) {
      console.error("resendActivation send error", err);
      return { ok: false as const, error: "Falha ao enviar o e-mail de ativação." };
    }

    return { ok: true as const };
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
      const isUnconfirmed = /confirm/i.test(error?.message ?? "");
      return {
        ok: false as const,
        error: isUnconfirmed
          ? "Sua conta ainda não foi ativada. Verifique o e-mail de ativação."
          : (error?.message ?? "E-mail ou senha incorretos."),
        needsActivation: isUnconfirmed,
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

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => passwordResetSchema.parse(input))
  .handler(async ({ data }) => {
    // Look up the user to personalize the email (and to avoid sending to non-users).
    const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error("requestPasswordReset list error", listError);
      // Don't reveal — respond ok regardless.
      return { ok: true as const };
    }
    const user = list.users.find((u) => u.email?.toLowerCase() === data.email);
    if (!user) {
      // Don't reveal whether the email exists.
      return { ok: true as const };
    }

    const redirectTo = `${data.siteOrigin}/auth/confirm`;
    const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: data.email,
      options: { redirectTo },
    });
    if (linkError || !link?.properties?.hashed_token) {
      console.error("requestPasswordReset generateLink error", linkError);
      return { ok: false as const, error: "Não foi possível gerar o link de redefinição." };
    }
    const resetUrl = `${data.siteOrigin}/auth/confirm?token_hash=${encodeURIComponent(
      link.properties.hashed_token,
    )}&type=recovery`;

    const ownerName =
      (user.user_metadata?.owner_name as string | undefined) ??
      (user.user_metadata?.business_name as string | undefined) ??
      null;

    // Look up the user's business for language preference.
    const { data: biz } = await supabaseAdmin
      .from("businesses")
      .select("language_preference")
      .eq("owner_id", user.id)
      .maybeSingle();
    const locale = (biz?.language_preference as EmailLocale) || "en";

    try {
      await sendPasswordResetEmail({ to: data.email, ownerName, resetUrl, locale });
    } catch (err) {
      console.error("requestPasswordReset send error", err);
      return { ok: false as const, error: "Falha ao enviar o e-mail de redefinição." };
    }
    return { ok: true as const };
  });
