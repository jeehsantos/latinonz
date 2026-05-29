import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Latino Connect" },
      {
        name: "description",
        content:
          "Como a Latino Connect Hub coleta, usa, armazena e protege seus dados pessoais em conformidade com o Privacy Act 2020 da Nova Zelândia.",
      },
      { property: "og:title", content: "Política de Privacidade — Latino Connect" },
      {
        property: "og:description",
        content:
          "Nosso compromisso com a privacidade dos dados, baseado no Privacy Act 2020 da Nova Zelândia.",
      },
      { property: "og:url", content: "https://latinoconnecthub.co.nz/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://latinoconnecthub.co.nz/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const lastUpdated = "29 de maio de 2026";
  return (
    <SiteShell>
      <article className="max-w-3xl mx-auto px-6 py-16 text-gray-800">
        <p className="text-xs font-bold uppercase tracking-wider text-[#df991b]">Legal</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-black text-gray-900">
          Política de Privacidade
        </h1>
        <p className="mt-3 text-sm text-gray-500">Última atualização: {lastUpdated}</p>

        <section className="mt-10 space-y-4">
          <p>
            A Latino Connect Hub ("nós", "nosso") respeita sua privacidade e está comprometida em
            proteger seus dados pessoais. Esta política descreve como coletamos, usamos,
            armazenamos e divulgamos suas informações em conformidade com o{" "}
            <a
              className="text-[#df991b] underline"
              href="https://www.privacy.org.nz/privacy-act-2020/"
              target="_blank"
              rel="noreferrer"
            >
              Privacy Act 2020
            </a>{" "}
            da Nova Zelândia e seus 13 Princípios de Privacidade (IPPs).
          </p>
        </section>

        <Section title="1. Quem somos">
          <p>
            Latino Connect Hub é um diretório digital de negócios da comunidade latina na Nova
            Zelândia. Operamos em Auckland, NZ. Você pode nos contatar a qualquer momento em{" "}
            <a className="text-[#df991b] underline" href="mailto:hello@latinoconnecthub.co.nz">
              hello@latinoconnecthub.co.nz
            </a>
            .
          </p>
        </Section>

        <Section title="2. Quais dados coletamos (IPP 1, 4)">
          <p>Coletamos apenas o necessário para a finalidade declarada:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Cadastro / waitlist:</strong> nome, nome do negócio, e-mail, número de
              WhatsApp e categoria de serviço.
            </li>
            <li>
              <strong>Conta:</strong> e-mail, senha (hash) e dados do perfil que você fornecer.
            </li>
            <li>
              <strong>Negócios:</strong> dados do estabelecimento, fotos, endereço, horário e
              avaliações públicas.
            </li>
            <li>
              <strong>Leads:</strong> mensagens enviadas por consumidores aos negócios.
            </li>
            <li>
              <strong>Técnicos:</strong> endereço IP (em formato anonimizado/hashed), tipo de
              navegador e páginas visitadas, exclusivamente para segurança e métricas agregadas.
            </li>
          </ul>
          <p>Nunca coletamos dados sensíveis (saúde, religião, etnia) ou dados de menores de 16 anos.</p>
        </Section>

        <Section title="3. Como coletamos (IPP 2, 3, 4)">
          <p>
            Coletamos dados diretamente de você quando preenche um formulário, cria conta, lista
            seu negócio ou entra em contato. Antes de enviar, você verá claramente para que os
            dados serão usados, com quem podem ser compartilhados e seus direitos. Não usamos meios
            ocultos ou enganosos.
          </p>
        </Section>

        <Section title="4. Para que usamos seus dados (IPP 10)">
          <ul className="list-disc pl-6 space-y-1">
            <li>Operar a plataforma, sua conta e listagem.</li>
            <li>Enviar e-mails transacionais (ativação, recuperação de senha, notificações).</li>
            <li>Permitir contato entre consumidores e negócios listados.</li>
            <li>Prevenir fraude, abuso e violações dos termos.</li>
            <li>Comunicações de marketing — apenas com seu consentimento explícito, com opção de cancelar.</li>
          </ul>
        </Section>

        <Section title="5. Com quem compartilhamos (IPP 11, 12)">
          <p>Compartilhamos dados apenas com prestadores estritamente necessários:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Supabase</strong> (banco de dados e autenticação) — armazenamento seguro.
            </li>
            <li>
              <strong>Resend</strong> (envio de e-mails transacionais).
            </li>
            <li>
              <strong>Cloudflare</strong> (hospedagem edge e proteção contra ataques).
            </li>
            <li>
              <strong>Google</strong> (login opcional via OAuth, se você escolher).
            </li>
          </ul>
          <p>
            Esses provedores podem armazenar dados fora da Nova Zelândia. Selecionamos parceiros
            com padrões de proteção comparáveis ao Privacy Act 2020. Não vendemos seus dados.
          </p>
        </Section>

        <Section title="6. Segurança (IPP 5)">
          <p>
            Aplicamos medidas técnicas e organizacionais: HTTPS/TLS em todo o tráfego, Row Level
            Security (RLS) no banco de dados, hash de senhas, controle de acesso por papel,
            rate-limiting contra abuso e revisão de logs. Apesar dos esforços, nenhum sistema é
            100% seguro — se ocorrer um incidente sério, notificaremos você e a{" "}
            <a
              className="text-[#df991b] underline"
              href="https://www.privacy.org.nz/"
              target="_blank"
              rel="noreferrer"
            >
              Office of the Privacy Commissioner
            </a>{" "}
            conforme exigido por lei.
          </p>
        </Section>

        <Section title="7. Retenção (IPP 9)">
          <p>
            Mantemos seus dados apenas enquanto forem necessários para a finalidade coletada ou
            exigência legal. Dados de waitlist são removidos após o lançamento e migração. Você
            pode solicitar exclusão a qualquer momento.
          </p>
        </Section>

        <Section title="8. Seus direitos (IPP 6, 7)">
          <p>Você tem direito a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Acessar uma cópia dos dados que mantemos sobre você.</li>
            <li>Corrigir dados imprecisos ou desatualizados.</li>
            <li>Solicitar exclusão da sua conta e dados pessoais.</li>
            <li>Retirar consentimento de marketing a qualquer momento.</li>
            <li>Reclamar à Office of the Privacy Commissioner NZ.</li>
          </ul>
          <p>
            Envie pedidos para{" "}
            <a className="text-[#df991b] underline" href="mailto:hello@latinoconnecthub.co.nz">
              hello@latinoconnecthub.co.nz
            </a>{" "}
            — respondemos em até 20 dias úteis.
          </p>
        </Section>

        <Section title="9. Cookies">
          <p>
            Usamos cookies essenciais (sessão, autenticação, preferências de idioma) que não
            requerem consentimento, e cookies opcionais de análise apenas após seu aceite. Você
            pode revisar a escolha pelo banner exibido na sua primeira visita ou limpando os dados
            do navegador.
          </p>
        </Section>

        <Section title="10. Mudanças nesta política">
          <p>
            Podemos atualizar esta política. Avisaremos por e-mail ou aviso na plataforma quando
            houver mudanças relevantes.
          </p>
        </Section>

        <div className="mt-12 text-sm text-gray-500">
          Veja também os{" "}
          <Link to="/terms" className="text-[#df991b] underline">
            Termos de Uso
          </Link>
          .
        </div>
      </article>
    </SiteShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 space-y-3">
      <h2 className="text-xl font-extrabold text-gray-900">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}
