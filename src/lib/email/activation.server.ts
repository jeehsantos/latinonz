import { renderBrandedEmail, sendBrandedEmail } from "./layout.server";
import { getEmailText, type EmailLocale } from "./email-i18n";

type SendArgs = {
  to: string;
  ownerName: string;
  activationUrl: string;
  locale?: EmailLocale;
};

export async function sendActivationEmail({ to, ownerName, activationUrl, locale = "en" }: SendArgs) {
  const greeting = ownerName
    ? getEmailText("activation", "greeting", locale, { name: ownerName })
    : getEmailText("activation", "greeting_no_name", locale);

  const html = renderBrandedEmail({
    locale,
    preheader: getEmailText("activation", "preheader", locale),
    heading: greeting,
    sections: [
      {
        kind: "paragraph",
        text: getEmailText("activation", "body", locale),
      },
      { kind: "cta", label: getEmailText("activation", "cta", locale), url: activationUrl },
      {
        kind: "fineprint",
        text: getEmailText("activation", "fineprint", locale),
      },
    ],
  });

  const result = await sendBrandedEmail({
    to,
    subject: getEmailText("activation", "subject", locale),
    html,
  });
  if (!result.ok) {
    throw new Error(`Failed to send activation email: ${result.reason}`);
  }
  return result;
}
