import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getEmailText, type EmailLocale } from "@/lib/email/email-i18n";

const submitSchema = z
  .object({
    businessId: z.string().uuid(),
    name: z.string().trim().min(1).max(100),
    phone: z.string().trim().max(40).optional().nullable(),
    email: z.string().trim().email().max(255).optional().nullable(),
    message: z.string().trim().max(1000).optional().nullable(),
    source: z.enum(["direct", "whatsapp", "email", "directory"]).default("direct"),
  })
  .refine((d) => !!(d.phone || d.email), {
    message: "Informe email ou WhatsApp.",
    path: ["email"],
  });

const updateSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(["Pendente", "Contatado", "Convertido"]),
});

type PlanTier = "starter" | "premium" | "ultra";

function normalizePlan(value: string | null | undefined): PlanTier {
  const v = (value ?? "").toLowerCase();
  if (v === "premium") return "premium";
  if (v === "ultra") return "ultra";
  return "starter";
}

async function getOwnerEmail(ownerId: string): Promise<string | null> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(ownerId);
    if (error) return null;
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

async function sendOwnerEmail(params: {
  to: string;
  businessName: string;
  lead: { name: string; email?: string | null; phone?: string | null; message?: string | null };
  locale?: EmailLocale;
}) {
  const { to, businessName, lead, locale = "en" } = params;
  const { renderBrandedEmail, sendBrandedEmail } = await import("@/lib/email/layout.server");

  const rows = [{ label: getEmailText("lead", "label_name", locale), value: lead.name }];
  if (lead.email) rows.push({ label: getEmailText("lead", "label_email", locale), value: lead.email });
  if (lead.phone) rows.push({ label: getEmailText("lead", "label_whatsapp", locale), value: lead.phone });

  const html = renderBrandedEmail({
    locale,
    preheader: getEmailText("lead", "preheader", locale, { business: businessName }),
    heading: getEmailText("lead", "heading", locale, { business: businessName }),
    sections: [
      {
        kind: "paragraph",
        text: getEmailText("lead", "body", locale),
      },
      { kind: "rows", rows },
      ...(lead.message
        ? ([{ kind: "quote" as const, text: lead.message }] as const)
        : []),
      {
        kind: "fineprint",
        text: getEmailText("lead", "fineprint", locale),
      },
    ],
  });

  const result = await sendBrandedEmail({
    to,
    subject: getEmailText("lead", "subject", locale, { business: businessName }),
    html,
  });
  return { sent: result.ok, reason: result.ok ? undefined : result.reason };
}


async function sendOwnerWhatsApp(params: {
  toPhone: string;
  businessName: string;
  lead: { name: string; email?: string | null; phone?: string | null; message?: string | null };
}) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
  const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"
  if (!LOVABLE_API_KEY || !TWILIO_API_KEY || !TWILIO_WHATSAPP_FROM) {
    console.warn("[leads] WhatsApp skipped: Twilio not configured.");
    return { sent: false, reason: "twilio_not_configured" as const };
  }

  const to = normalizeWhatsAppNumber(params.toPhone);
  if (!to) {
    return { sent: false, reason: "invalid_phone" as const };
  }

  const lines = [
    `🟢 *Novo lead — ${params.businessName}*`,
    `Nome: ${params.lead.name}`,
    params.lead.email ? `Email: ${params.lead.email}` : null,
    params.lead.phone ? `WhatsApp: ${params.lead.phone}` : null,
    params.lead.message ? `\nMensagem:\n${params.lead.message}` : null,
  ].filter(Boolean);

  const body = new URLSearchParams({
    To: to,
    From: TWILIO_WHATSAPP_FROM,
    Body: lines.join("\n"),
  });

  const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": TWILIO_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[leads] Twilio erro ${res.status}: ${text}`);
    return { sent: false, reason: `twilio_${res.status}` as const };
  }
  return { sent: true as const };
}

function normalizeWhatsAppNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  // Default to NZ country code if user typed a local number
  const e164 =
    digits.startsWith("64") || raw.trim().startsWith("+")
      ? `+${digits}`
      : `+64${digits.replace(/^0+/, "")}`;
  return `whatsapp:${e164}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((input) => submitSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Insert the lead with the service role so anonymous visitors work
    // regardless of session state; the INSERT policy allows anon anyway.
    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("leads")
      .insert({
        business_id: data.businessId,
        name: data.name,
        phone: data.phone ?? null,
        email: data.email ?? null,
        message: data.message ?? null,
        source: data.source,
      })
      .select("id")
      .single();
    if (insErr) {
      return { ok: false as const, error: insErr.message };
    }

    // Fetch business + owner plan to decide notifications
    const { data: biz, error: bizErr } = await supabaseAdmin
      .from("businesses")
      .select("id, name, owner_id, phone, language_preference")
      .eq("id", data.businessId)
      .maybeSingle();
    if (bizErr || !biz) {
      return {
        ok: true as const,
        leadId: inserted.id,
        notified: { email: false, whatsapp: false },
      };
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan_tier")
      .eq("id", biz.owner_id)
      .maybeSingle();

    const plan = normalizePlan(profile?.plan_tier ?? null);
    const ownerEmail = await getOwnerEmail(biz.owner_id);
    const ownerPhone = biz.phone;
    const bizLocale = (biz.language_preference as EmailLocale) || "en";

    const leadPayload = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      message: data.message,
    };

    let emailResult: { sent: boolean } = { sent: false };
    let whatsappResult: { sent: boolean } = { sent: false };

    try {
      if (plan === "starter" && ownerEmail) {
        emailResult = await sendOwnerEmail({
          to: ownerEmail,
          businessName: biz.name,
          lead: leadPayload,
          locale: bizLocale,
        });
      } else if (plan === "premium" && ownerPhone) {
        whatsappResult = await sendOwnerWhatsApp({
          toPhone: ownerPhone,
          businessName: biz.name,
          lead: leadPayload,
        });
      } else if (plan === "ultra") {
        if (ownerPhone) {
          whatsappResult = await sendOwnerWhatsApp({
            toPhone: ownerPhone,
            businessName: biz.name,
            lead: leadPayload,
          });
        }
        if (ownerEmail) {
          emailResult = await sendOwnerEmail({
            to: ownerEmail,
            businessName: biz.name,
            lead: leadPayload,
            locale: bizLocale,
          });
        }
      }
    } catch (err) {
      console.error("[leads] notification error", err);
    }

    return {
      ok: true as const,
      leadId: inserted.id,
      plan,
      notified: { email: emailResult.sent, whatsapp: whatsappResult.sent },
    };
  });

export const getMyLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: biz, error: bizErr } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (bizErr) return { ok: false as const, error: bizErr.message };
    if (!biz) return { ok: true as const, leads: [] };

    const { data: rows, error } = await supabase
      .from("leads")
      .select("id, name, phone, email, message, source, status, created_at")
      .eq("business_id", biz.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return { ok: false as const, error: error.message };

    return { ok: true as const, leads: rows ?? [] };
  });

export const updateLeadStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("leads")
      .update({ status: data.status })
      .eq("id", data.leadId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
