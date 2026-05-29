import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
}) {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    console.warn("[leads] Email skipped: Resend not configured.");
    return { sent: false, reason: "resend_not_configured" as const };
  }

  const { to, businessName, lead } = params;
  const html = `
    <div style="font-family:system-ui,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#facc15">
      <h2 style="margin:0 0 12px;color:#facc15">Novo lead para ${escapeHtml(businessName)}</h2>
      <p style="margin:0 0 16px;color:#374151">Você recebeu um novo contato pelo Latino Connect.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#6b7280">Nome</td><td style="padding:6px 0;font-weight:600">${escapeHtml(lead.name)}</td></tr>
        ${lead.email ? `<tr><td style="padding:6px 0;color:#6b7280">Email</td><td style="padding:6px 0">${escapeHtml(lead.email)}</td></tr>` : ""}
        ${lead.phone ? `<tr><td style="padding:6px 0;color:#6b7280">WhatsApp</td><td style="padding:6px 0">${escapeHtml(lead.phone)}</td></tr>` : ""}
        ${lead.message ? `<tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">Mensagem</td><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(lead.message)}</td></tr>` : ""}
      </table>
    </div>`;

  const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": RESEND_API_KEY,
    },
    body: JSON.stringify({
      from: "Latino Connect <onboarding@resend.dev>",
      to: [to],
      subject: `Novo lead — ${businessName}`,
      html,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[leads] Resend erro ${res.status}: ${body}`);
    return { sent: false, reason: `resend_${res.status}` as const };
  }
  return { sent: true as const };
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
      .select("id, name, owner_id, phone")
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
