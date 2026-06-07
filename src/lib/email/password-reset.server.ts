import { renderBrandedEmail, sendBrandedEmail } from "./layout.server";

type SendArgs = {
  to: string;
  ownerName?: string | null;
  resetUrl: string;
};

export async function sendPasswordResetEmail({ to, ownerName, resetUrl }: SendArgs) {
  const heading = ownerName ? `Olá, ${ownerName}` : "Redefinição de senha";
  const html = renderBrandedEmail({
    preheader: "Redefina sua senha do Latino Connect Hub.",
    heading,
    sections: [
      {
        kind: "paragraph",
        text: "Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha. Este link expira em 1 hora.",
      },
      { kind: "cta", label: "Redefinir minha senha", url: resetUrl },
      {
        kind: "fineprint",
        text: "Se você não solicitou esta redefinição, ignore este e-mail — sua senha atual continua segura.",
      },
    ],
  });

  const result = await sendBrandedEmail({
    to,
    subject: "Redefinir sua senha — Latino Connect Hub",
    html,
  });
  if (!result.ok) {
    throw new Error(`Falha ao enviar e-mail de redefinição: ${result.reason}`);
  }
  return result;
}
