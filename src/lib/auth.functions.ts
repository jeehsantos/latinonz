import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
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
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendActivationEmail } = await import("@/lib/email/activation.server");
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Look up the user by email via an indexed RPC instead of paginating
    // through every auth user (listUsers breaks at scale).
    const { data: rows, error: lookupError } = await supabaseAdmin.rpc(
      "get_auth_user_by_email",
      { _email: data.email },
    );
    if (lookupError) {
      console.error("resendActivation lookup error", lookupError);
      return { ok: false as const, error: "Não foi possível reenviar o e-mail." };
    }
    const user = rows?.[0];
    if (!user) {
      // Don't reveal whether the email exists.
      return { ok: true as const };
    }
    if (user.email_confirmed_at) {
      return { ok: false as const, error: "Esta conta já está ativada. Faça login." };
    }

    const meta = (user.raw_user_meta_data ?? {}) as Record<string, unknown>;
    const ownerName =
      (typeof meta.owner_name === "string" && meta.owner_name) ||
      (typeof meta.business_name === "string" && meta.business_name) ||
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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

// Per-email rate limit for password reset: max 3 requests per 30 minutes.
const PASSWORD_RESET_MAX = 3;
const PASSWORD_RESET_WINDOW_MS = 30 * 60 * 1000;
const passwordResetBucket = new Map<string, { count: number; reset: number }>();

function passwordResetRateLimit(email: string): { ok: true } | { ok: false; retryAfterMs: number } {
  const now = Date.now();
  const key = email.toLowerCase();
  const entry = passwordResetBucket.get(key);
  if (!entry || entry.reset < now) {
    passwordResetBucket.set(key, { count: 1, reset: now + PASSWORD_RESET_WINDOW_MS });
    return { ok: true };
  }
  if (entry.count >= PASSWORD_RESET_MAX) {
    return { ok: false, retryAfterMs: entry.reset - now };
  }
  entry.count += 1;
  return { ok: true };
}

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => passwordResetSchema.parse(input))
  .handler(async ({ data }) => {
    const rl = passwordResetRateLimit(data.email);
    if (!rl.ok) {
      const minutes = Math.max(1, Math.ceil(rl.retryAfterMs / 60000));
      return {
        ok: false as const,
        error: `Você atingiu o limite de ${PASSWORD_RESET_MAX} pedidos de redefinição. Tente novamente em ${minutes} minuto(s).`,
        retryAfterMs: rl.retryAfterMs,
      };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Look up the user by email via an indexed RPC (scales to millions of users).
    const { data: rows, error: lookupError } = await supabaseAdmin.rpc(
      "get_auth_user_by_email",
      { _email: data.email },
    );
    if (lookupError) {
      console.error("requestPasswordReset lookup error", lookupError);
      // Don't reveal — respond ok regardless.
      return { ok: true as const };
    }
    const user = rows?.[0];
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

    const meta = (user.raw_user_meta_data ?? {}) as Record<string, unknown>;
    const ownerName =
      (typeof meta.owner_name === "string" && meta.owner_name) ||
      (typeof meta.business_name === "string" && meta.business_name) ||
      null;

    // Look up the user's business for language preference.
    const { data: biz } = await supabaseAdmin
      .from("businesses")
      .select("language_preference")
      .eq("owner_id", user.id)
      .maybeSingle();
    const locale = (biz?.language_preference as EmailLocale) || "en";

    try {
      const { sendPasswordResetEmail } = await import("@/lib/email/password-reset.server");
      await sendPasswordResetEmail({ to: data.email, ownerName, resetUrl, locale });
    } catch (err) {
      console.error("requestPasswordReset send error", err);
      return { ok: false as const, error: "Falha ao enviar o e-mail de redefinição." };
    }
    return { ok: true as const };
  });
