import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Latino Connect" },
      {
        name: "description",
        content:
          "Termos de Uso da Latino Connect Hub: regras, responsabilidades e direitos ao usar a plataforma.",
      },
      { property: "og:title", content: "Termos de Uso — Latino Connect" },
      {
        property: "og:description",
        content: "Termos e condições que regem o uso da plataforma Latino Connect Hub.",
      },
      { property: "og:url", content: "https://latinoconnecthub.co.nz/terms" },
    ],
    links: [{ rel: "canonical", href: "https://latinoconnecthub.co.nz/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  const lastUpdated = "29 de maio de 2026";
  return (
    <SiteShell>
      <article className="max-w-3xl mx-auto px-6 py-16 text-neutral-100">
        <p className="text-xs font-bold uppercase tracking-wider text-[#df991b]">Legal</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-black text-white">Termos de Uso</h1>
        <p className="mt-3 text-sm text-neutral-400">Última atualização: {lastUpdated}</p>

        <section className="mt-10 space-y-4">
          <p>
            Estes Termos regem o uso da plataforma Latino Connect Hub. Ao acessar ou usar o site,
            você concorda com estes Termos e com nossa{" "}
            <Link to="/privacy" className="text-[#df991b] underline">
              Política de Privacidade
            </Link>
            . Se não concordar, não utilize a plataforma.
          </p>
        </section>

        <Section title="1. Sobre a plataforma">
          <p>
            Latino Connect Hub é um diretório online que conecta negócios da comunidade latina na
            Nova Zelândia com consumidores. Não somos parte de qualquer transação entre você e os
            negócios listados.
          </p>
        </Section>

        <Section title="2. Elegibilidade">
          <p>
            Você deve ter pelo menos 16 anos para criar uma conta. Negócios listados devem operar
            legalmente na Nova Zelândia.
          </p>
        </Section>

        <Section title="3. Sua conta">
          <ul className="list-disc pl-6 space-y-1">
            <li>Forneça informações verdadeiras, completas e atualizadas.</li>
            <li>Mantenha sua senha em sigilo — você é responsável por toda atividade na conta.</li>
            <li>Notifique-nos imediatamente sobre uso não autorizado.</li>
          </ul>
        </Section>

        <Section title="4. Uso aceitável">
          <p>É proibido:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Publicar conteúdo falso, enganoso, ofensivo, discriminatório ou ilegal.</li>
            <li>Coletar dados de outros usuários (scraping, harvesting).</li>
            <li>Tentar burlar segurança, RLS ou rate-limiting.</li>
            <li>Enviar spam, malware ou publicidade não autorizada.</li>
            <li>Usar a plataforma para fraude ou concorrência desleal.</li>
          </ul>
          <p>Podemos suspender ou excluir contas que violem estas regras, sem aviso prévio.</p>
        </Section>

        <Section title="5. Conteúdo do usuário">
          <p>
            Você mantém a propriedade do conteúdo que envia (descrições, fotos, eventos). Ao
            publicar, concede à Latino Connect Hub uma licença não exclusiva, mundial e gratuita
            para hospedar, exibir e promover esse conteúdo dentro da plataforma. Você garante ter
            os direitos sobre todo conteúdo enviado.
          </p>
        </Section>

        <Section title="6. Negócios listados e leads">
          <p>
            Negócios são responsáveis pela exatidão da sua listagem e pelos serviços prestados.
            Leads enviados via plataforma devem ser tratados em conformidade com o Privacy Act 2020
            — use os dados apenas para responder ao consumidor.
          </p>
        </Section>

        <Section title="7. Pagamentos e planos">
          <p>
            Alguns recursos requerem assinatura paga. Os pagamentos são processados por terceiros
            (ex: Stripe). Reembolsos seguem a política do plano e a legislação do consumidor da
            Nova Zelândia (Consumer Guarantees Act 1993).
          </p>
        </Section>

        <Section title="8. Propriedade intelectual">
          <p>
            Logotipos, marca, código e design da Latino Connect Hub são protegidos. É proibido
            copiar, redistribuir ou criar trabalhos derivados sem autorização.
          </p>
        </Section>

        <Section title="9. Isenções e limitações">
          <p>
            A plataforma é fornecida "como está". Não garantimos disponibilidade ininterrupta nem a
            exatidão de listagens de terceiros. Na máxima extensão permitida em lei, não somos
            responsáveis por danos indiretos decorrentes do uso da plataforma. Nada nestes Termos
            limita seus direitos sob o Consumer Guarantees Act 1993 ou Fair Trading Act 1986.
          </p>
        </Section>

        <Section title="10. Encerramento">
          <p>
            Você pode encerrar sua conta a qualquer momento pelo painel ou solicitando em{" "}
            <a className="text-[#df991b] underline" href="mailto:hello@latinoconnecthub.co.nz">
              hello@latinoconnecthub.co.nz
            </a>
            . Podemos encerrar contas que violem estes Termos.
          </p>
        </Section>

        <Section title="11. Mudanças nos Termos">
          <p>
            Podemos atualizar estes Termos. Mudanças significativas serão notificadas por e-mail
            ou aviso na plataforma. O uso contínuo após a atualização constitui aceite.
          </p>
        </Section>

        <Section title="12. Lei aplicável">
          <p>
            Estes Termos são regidos pelas leis da Nova Zelândia. Disputas serão submetidas aos
            tribunais competentes de Auckland, NZ.
          </p>
        </Section>

        <Section title="13. Contato">
          <p>
            Dúvidas?{" "}
            <a className="text-[#df991b] underline" href="mailto:hello@latinoconnecthub.co.nz">
              hello@latinoconnecthub.co.nz
            </a>
          </p>
        </Section>
      </article>
    </SiteShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 space-y-3">
      <h2 className="text-xl font-extrabold text-white">{title}</h2>
      <div className="space-y-3 text-[15px] leading-relaxed">{children}</div>
    </section>
  );
}
