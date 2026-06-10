// Shared branded email layout for all Latino Connect Hub transactional emails.
// Keep all email HTML inline and table-based for maximum client compatibility.

import { getEmailText, type EmailLocale } from "./email-i18n";

const LOGO_URL =
  "https://cpttcriscektmbnjckjo.supabase.co/storage/v1/object/public/business-logos/brand%2Flatino-connect-logo.png";

const BRAND = {
  yellow: "#facc15",
  yellowDark: "#df991b",
  ink: "#111111",
  body: "#374151",
  muted: "#6b7280",
  border: "#e5e7eb",
  surface: "#f9fafb",
  pageBg: "#f4f4f5",
};

export type EmailRow = { label: string; value: string };

export type EmailSection =
  | { kind: "paragraph"; text: string }
  | { kind: "rows"; rows: EmailRow[] }
  | { kind: "quote"; text: string }
  | { kind: "cta"; label: string; url: string }
  | { kind: "fineprint"; text: string };

export type BrandedEmailOptions = {
  preheader?: string;
  heading: string;
  sections: EmailSection[];
  footerNote?: string;
  locale?: EmailLocale;
};

export function renderBrandedEmail(opts: BrandedEmailOptions): string {
  const locale = opts.locale ?? "en";
  const preheader = opts.preheader ?? "";
  const heading = escapeHtml(opts.heading);
  const sectionsHtml = opts.sections.map((s) => renderSection(s, locale)).join("\n");
  const footerText = getEmailText("layout", "footer", locale);
  const footerNote = opts.footerNote
    ? `<p style="margin:8px 0 0;font-size:11px;color:${BRAND.muted};text-align:center;line-height:1.6;">${escapeHtml(opts.footerNote)}</p>`
    : "";

  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${heading}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.pageBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${BRAND.ink};">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.pageBg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ${BRAND.border};">
            <tr>
              <td align="center" style="background:${BRAND.yellow};padding:28px 24px;">
                <img src="${LOGO_URL}" alt="Latino Connect Hub" width="150" style="display:block;max-width:150px;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px;">
                <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:${BRAND.ink};line-height:1.3;">${heading}</h1>
                ${sectionsHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid #f1f1f3;">
                <p style="margin:0;font-size:12px;color:${BRAND.muted};text-align:center;">
                  © ${new Date().getFullYear()} ${escapeHtml(footerText)}
                </p>
                ${footerNote}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderSection(s: EmailSection, locale: EmailLocale): string {
  switch (s.kind) {
    case "paragraph":
      return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${BRAND.body};">${escapeHtml(s.text)}</p>`;
    case "rows": {
      const rowsHtml = s.rows
        .map(
          (r) => `
            <tr>
              <td style="padding:10px 12px;color:${BRAND.muted};font-size:13px;width:38%;border-bottom:1px solid ${BRAND.border};vertical-align:top;">${escapeHtml(r.label)}</td>
              <td style="padding:10px 12px;color:${BRAND.ink};font-size:14px;font-weight:600;border-bottom:1px solid ${BRAND.border};word-break:break-word;">${escapeHtml(r.value)}</td>
            </tr>`,
        )
        .join("");
      return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:10px;margin:6px 0 18px;overflow:hidden;">${rowsHtml}</table>`;
    }
    case "quote":
      return `<div style="margin:0 0 18px;padding:14px 16px;background:${BRAND.surface};border-left:3px solid ${BRAND.yellowDark};border-radius:8px;font-size:14px;color:${BRAND.body};white-space:pre-wrap;line-height:1.6;">${escapeHtml(s.text)}</div>`;
    case "cta": {
      const ctaFallback = getEmailText("layout", "cta_fallback", locale);
      return `<div style="text-align:center;margin:24px 0 18px;">
        <a href="${escapeAttr(s.url)}" style="display:inline-block;background:${BRAND.yellowDark};color:#ffffff;text-decoration:none;font-weight:800;font-size:15px;padding:14px 30px;border-radius:12px;">${escapeHtml(s.label)}</a>
      </div>
      <p style="margin:0 0 8px;font-size:12px;color:${BRAND.muted};line-height:1.6;">${escapeHtml(ctaFallback)}</p>
      <p style="margin:0 0 18px;font-size:12px;color:${BRAND.ink};word-break:break-all;background:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:8px;padding:10px;">${escapeHtml(s.url)}</p>`;
    }
    case "fineprint":
      return `<p style="margin:8px 0 4px;font-size:12px;color:${BRAND.muted};line-height:1.6;">${escapeHtml(s.text)}</p>`;
  }
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeAttr(s: string) {
  return escapeHtml(s);
}

const RESEND_GATEWAY = "https://connector-gateway.lovable.dev/resend/emails";

export async function sendBrandedEmail(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!lovableKey || !resendKey) {
    console.warn("[email] Resend not configured");
    return { ok: false, reason: "resend_not_configured" };
  }
  const res = await fetch(RESEND_GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from: "Latino Connect Hub <no-reply@latinoconnecthub.co.nz>",
      to: [args.to],
      subject: args.subject,
      html: args.html,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[email] Resend ${res.status}: ${body}`);
    return { ok: false, reason: `resend_${res.status}` };
  }
  return { ok: true };
}
