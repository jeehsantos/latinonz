import { renderBrandedEmail, sendBrandedEmail } from "./layout.server";

type SendArgs = {
  to: string;
  ownerName: string;
  activationUrl: string;
};

export async function sendActivationEmail({ to, ownerName, activationUrl }: SendArgs) {
  const greeting = ownerName ? `Bem-vindo(a), ${ownerName}!` : "Bem-vindo(a)!";
  const html = renderBrandedEmail({
    preheader: "Confirme seu e-mail para ativar sua conta no Latino Connect Hub.",
    heading: greeting,
    sections: [
      {
        kind: "paragraph",
        text: "Estamos quase lá. Para ativar sua conta e começar a divulgar seu negócio na maior rede latina da Nova Zelândia, confirme seu e-mail clicando no botão abaixo.",
      },
      { kind: "cta", label: "Ativar minha conta", url: activationUrl },
      {
        kind: "fineprint",
        text: "Se você não criou esta conta, pode ignorar esta mensagem com segurança.",
      },
    ],
  });

  const result = await sendBrandedEmail({
    to,
    subject: "Ative sua conta — Latino Connect Hub",
    html,
  });
  if (!result.ok) {
    throw new Error(`Falha ao enviar e-mail de ativação: ${result.reason}`);
  }
  return result;
}
