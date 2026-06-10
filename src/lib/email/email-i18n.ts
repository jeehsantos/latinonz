// Server-side email translation dictionary.
// Used by email templates that run outside the React i18n context.

export type EmailLocale = "pt" | "es" | "en";

const dict = {
  // ─── Shared layout ───
  layout: {
    cta_fallback: {
      pt: "Ou copie e cole este link no navegador:",
      es: "O copie y pegue este enlace en su navegador:",
      en: "Or copy and paste this link in your browser:",
    },
    footer: {
      pt: "Latino Connect Hub — Aotearoa, Nova Zelândia",
      es: "Latino Connect Hub — Aotearoa, Nueva Zelanda",
      en: "Latino Connect Hub — Aotearoa, New Zealand",
    },
  },

  // ─── Activation email ───
  activation: {
    subject: {
      pt: "Ative sua conta — Latino Connect Hub",
      es: "Activa tu cuenta — Latino Connect Hub",
      en: "Activate your account — Latino Connect Hub",
    },
    preheader: {
      pt: "Confirme seu e-mail para ativar sua conta no Latino Connect Hub.",
      es: "Confirma tu correo para activar tu cuenta en Latino Connect Hub.",
      en: "Confirm your email to activate your Latino Connect Hub account.",
    },
    greeting: {
      pt: "Bem-vindo(a), {name}!",
      es: "¡Bienvenido/a, {name}!",
      en: "Welcome, {name}!",
    },
    greeting_no_name: {
      pt: "Bem-vindo(a)!",
      es: "¡Bienvenido/a!",
      en: "Welcome!",
    },
    body: {
      pt: "Estamos quase lá. Para ativar sua conta e começar a divulgar seu negócio na maior rede latina da Nova Zelândia, confirme seu e-mail clicando no botão abaixo.",
      es: "Ya casi está. Para activar tu cuenta y comenzar a promocionar tu negocio en la red latina más grande de Nueva Zelanda, confirma tu correo haciendo clic en el botón de abajo.",
      en: "We're almost there. To activate your account and start promoting your business on New Zealand's largest Latino network, confirm your email by clicking the button below.",
    },
    cta: {
      pt: "Ativar minha conta",
      es: "Activar mi cuenta",
      en: "Activate my account",
    },
    fineprint: {
      pt: "Se você não criou esta conta, pode ignorar esta mensagem com segurança.",
      es: "Si no creaste esta cuenta, puedes ignorar este mensaje con seguridad.",
      en: "If you didn't create this account, you can safely ignore this message.",
    },
  },

  // ─── Password reset email ───
  password_reset: {
    subject: {
      pt: "Redefinir sua senha — Latino Connect Hub",
      es: "Restablecer tu contraseña — Latino Connect Hub",
      en: "Reset your password — Latino Connect Hub",
    },
    preheader: {
      pt: "Redefina sua senha do Latino Connect Hub.",
      es: "Restablece tu contraseña de Latino Connect Hub.",
      en: "Reset your Latino Connect Hub password.",
    },
    greeting: {
      pt: "Olá, {name}",
      es: "Hola, {name}",
      en: "Hi, {name}",
    },
    greeting_no_name: {
      pt: "Redefinição de senha",
      es: "Restablecimiento de contraseña",
      en: "Password reset",
    },
    body: {
      pt: "Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha. Este link expira em 1 hora.",
      es: "Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón de abajo para crear una nueva contraseña. Este enlace expira en 1 hora.",
      en: "We received a request to reset your account password. Click the button below to create a new password. This link expires in 1 hour.",
    },
    cta: {
      pt: "Redefinir minha senha",
      es: "Restablecer mi contraseña",
      en: "Reset my password",
    },
    fineprint: {
      pt: "Se você não solicitou esta redefinição, ignore este e-mail — sua senha atual continua segura.",
      es: "Si no solicitaste este restablecimiento, ignora este correo — tu contraseña actual sigue siendo segura.",
      en: "If you didn't request this reset, ignore this email — your current password remains secure.",
    },
  },

  // ─── Lead notification email ───
  lead: {
    subject: {
      pt: "Novo lead — {business}",
      es: "Nuevo contacto — {business}",
      en: "New lead — {business}",
    },
    preheader: {
      pt: "Novo lead para {business} via Latino Connect Hub.",
      es: "Nuevo contacto para {business} vía Latino Connect Hub.",
      en: "New lead for {business} via Latino Connect Hub.",
    },
    heading: {
      pt: "Novo lead — {business}",
      es: "Nuevo contacto — {business}",
      en: "New lead — {business}",
    },
    body: {
      pt: "Você recebeu um novo contato pelo Latino Connect Hub. Os detalhes estão abaixo — responda o quanto antes para aumentar suas chances de conversão.",
      es: "Recibiste un nuevo contacto a través de Latino Connect Hub. Los detalles están a continuación — responde lo antes posible para aumentar tus posibilidades de conversión.",
      en: "You received a new contact through Latino Connect Hub. Details are below — respond as soon as possible to increase your chances of conversion.",
    },
    label_name: {
      pt: "Nome",
      es: "Nombre",
      en: "Name",
    },
    label_email: {
      pt: "E-mail",
      es: "Correo",
      en: "Email",
    },
    label_whatsapp: {
      pt: "WhatsApp",
      es: "WhatsApp",
      en: "WhatsApp",
    },
    fineprint: {
      pt: "Dica: leads contatados em até 5 minutos têm muito mais chance de fechar negócio.",
      es: "Consejo: los contactos respondidos en menos de 5 minutos tienen muchas más posibilidades de cerrar un trato.",
      en: "Tip: leads contacted within 5 minutes are much more likely to close a deal.",
    },
  },
} as const;

// Retrieve a translated email string, replacing {placeholder} tokens.
export function getEmailText(
  section: keyof typeof dict,
  key: string,
  locale: EmailLocale = "en",
  vars?: Record<string, string>,
): string {
  const sectionDict = dict[section] as Record<string, Record<EmailLocale, string>> | undefined;
  if (!sectionDict) return key;
  const entry = sectionDict[key];
  if (!entry) return key;
  let text = entry[locale] ?? entry.en ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}
