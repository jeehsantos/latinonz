import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useI18n, usePageMetadata } from "@/lib/i18n";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Latino Connect" },
      {
        name: "description",
        content: "Termos de Uso do Latino Connect Hub.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: TermsPage,
});

type SectionItem = {
  title: string;
  content: string;
};

function TermsPage() {
  const { t, raw } = useI18n();
  usePageMetadata(undefined, undefined, `${t("terms.title")} — Latino Connect`);
  const sections = raw<SectionItem[]>("terms.sections") ?? [];

  return (
    <SiteShell>
      <article className="max-w-3xl mx-auto px-6 py-16 text-neutral-100">
        <p className="text-xs font-bold uppercase tracking-wider text-[#df991b]">Legal</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-black text-white">
          {t("terms.title")}
        </h1>
        <p className="mt-3 text-sm text-neutral-400">{t("terms.last_updated")}</p>

        <section className="mt-10 space-y-4">
          <p className="whitespace-pre-line text-[15px] leading-relaxed">
            {t("terms.intro")}
          </p>
        </section>

        {sections.map((section, index) => (
          <Section key={index} title={section.title}>
            <p className="whitespace-pre-line text-[15px] leading-relaxed">{section.content}</p>
          </Section>
        ))}

        <div className="mt-12 text-sm text-neutral-400">
          {t("terms.footer_see_also").split("{link}")[0]}
          <Link to="/privacy" className="text-[#df991b] underline">
            {t("footer_legal.privacy")}
          </Link>
          {t("terms.footer_see_also").split("{link}")[1]}
        </div>
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
