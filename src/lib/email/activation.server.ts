const RESEND_GATEWAY = "https://connector-gateway.lovable.dev/resend/emails";

const LOGO_URL =
  "https://cpttcriscektmbnjckjo.supabase.co/storage/v1/object/public/business-logos/brand%2Flatino-connect-logo.png";

type SendArgs = {
  to: string;
  ownerName: string;
  activationUrl: string;
};

export async function sendActivationEmail({ to, ownerName, activationUrl }: SendArgs) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!lovableKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!resendKey) throw new Error("RESEND_API_KEY is not configured");

  const subject = "Ative sua conta — Latino Connect Hub";
  const html = renderActivationHtml({ ownerName, activationUrl });

  const res = await fetch(RESEND_GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from: "Latino Connect Hub <no-reply@latinoconnecthub.co.nz>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend send failed [${res.status}]: ${body}`);
  }
  return res.json();
}

function renderActivationHtml({
  ownerName,
  activationUrl,
}: {
  ownerName: string;
  activationUrl: string;
}) {
  const safeName = escapeHtml(ownerName || "");
  const safeUrl = escapeHtml(activationUrl);
  return `<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Ative sua conta</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#111;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td align="center" style="background:#facc15;padding:32px 24px;">
                <img src="${LOGO_URL}" alt="Latino Connect Hub" width="160" style="display:block;max-width:160px;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 8px;">
                <h1 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#111;">
                  Bem-vindo${safeName ? `, ${safeName}` : ""}!
                </h1>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">
                  Estamos quase lá. Para ativar sua conta no Latino Connect Hub e começar a divulgar seu negócio na maior rede latina da Nova Zelândia, confirme seu e-mail clicando no botão abaixo.
                </p>
                <div style="text-align:center;margin:28px 0 24px;">
                  <a href="${safeUrl}" style="display:inline-block;background:#df991b;color:#facc15;text-decoration:none;font-weight:800;font-size:15px;padding:14px 28px;border-radius:12px;">
                    Ativar minha conta
                  </a>
                </div>
                <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
                  Ou copie e cole este link no navegador:
                </p>
                <p style="margin:0 0 24px;font-size:12px;color:#374151;word-break:break-all;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px;">
                  ${safeUrl}
                </p>
                <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">
                  Se você não criou esta conta, ignore esta mensagem.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 28px;border-top:1px solid #f1f1f3;">
                <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                  © Latino Connect Hub — Nova Zelândia
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
