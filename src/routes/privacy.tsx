import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { useI18n, usePageMetadata } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Latino Connect" },
      {
        name: "description",
        content: "Privacy Policy of Latino Connect Hub.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: PrivacyPage,
});

type SectionItem = {
  title: string;
  content: string;
};

function PrivacyPage() {
  const { t, raw } = useI18n();
  usePageMetadata(undefined, undefined, `${t("privacy.title")} — Latino Connect`);
  const sections = raw<SectionItem[]>("privacy.sections") ?? [];

  return (
    <SiteShell>
      <article className="max-w-3xl mx-auto px-6 py-16 text-neutral-100">
        <p className="text-xs font-bold uppercase tracking-wider text-[#df991b]">Legal</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-black text-white">
          {t("privacy.title")}
        </h1>
        <p className="mt-3 text-sm text-neutral-400">{t("privacy.last_updated")}</p>

        <section className="mt-10 space-y-4">
          <p className="whitespace-pre-line text-[15px] leading-relaxed">
            {t("privacy.intro")}
          </p>
        </section>

        {sections.map((section, index) => (
          <Section key={index} title={section.title}>
            <p className="whitespace-pre-line text-[15px] leading-relaxed">{section.content}</p>
          </Section>
        ))}

        <div className="mt-12 text-sm text-neutral-400">
          {t("privacy.footer_see_also").split("{link}")[0]}
          <Link to="/terms" className="text-[#df991b] underline">
            {t("footer_legal.terms")}
          </Link>
          {t("privacy.footer_see_also").split("{link}")[1]}
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
