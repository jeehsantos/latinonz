import { renderBrandedEmail, sendBrandedEmail } from "./layout.server";
import { getEmailText, type EmailLocale } from "./email-i18n";

type SendArgs = {
  to: string;
  ownerName?: string | null;
  resetUrl: string;
  locale?: EmailLocale;
};

export async function sendPasswordResetEmail({ to, ownerName, resetUrl, locale = "en" }: SendArgs) {
  const heading = ownerName
    ? getEmailText("password_reset", "greeting", locale, { name: ownerName })
    : getEmailText("password_reset", "greeting_no_name", locale);

  const html = renderBrandedEmail({
    locale,
    preheader: getEmailText("password_reset", "preheader", locale),
    heading,
    sections: [
      {
        kind: "paragraph",
        text: getEmailText("password_reset", "body", locale),
      },
      { kind: "cta", label: getEmailText("password_reset", "cta", locale), url: resetUrl },
      {
        kind: "fineprint",
        text: getEmailText("password_reset", "fineprint", locale),
      },
    ],
  });

  const result = await sendBrandedEmail({
    to,
    subject: getEmailText("password_reset", "subject", locale),
    html,
  });
  if (!result.ok) {
    throw new Error(`Failed to send password reset email: ${result.reason}`);
  }
  return result;
}
