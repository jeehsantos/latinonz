import { Link } from "@tanstack/react-router";
import logo from "@/assets/Latino_Connecthub_White.png";
import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="bg-[#000000] text-white/80 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Latino Connect Hub" className="h-10 md:h-12 w-auto" />
          </Link>
          <p className="text-sm mt-2 text-white/60">{t("footer_tagline")}</p>
        </div>
        <div>
          <p className="text-white font-bold mb-3">{t("footer_platform")}</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/directory" className="hover:text-white">
                {t("nav.directory")}
              </Link>
            </li>
            <li>
              <Link to="/planos" className="hover:text-white">
                {t("nav.plans")}
              </Link>
            </li>
            <li>
              <Link to="/cadastro" className="hover:text-white">
                {t("nav.register")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-white font-bold mb-3">{t("footer_content")}</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/blog" className="hover:text-white">
                {t("nav.blog")}
              </Link>
            </li>
            <li>
              <Link to="/sobre" className="hover:text-white">
                {t("nav.about")}
              </Link>
            </li>
            <li>
              <Link to="/contato" className="hover:text-white">
                {t("nav.contact")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-white font-bold mb-3">{t("footer_contact_col")}</p>
          <p className="text-sm">hello@latinoconnecthub.co.nz</p>
          <p className="text-sm">Auckland, Nova Zelândia</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 text-xs text-white/40 flex flex-col md:flex-row justify-between gap-2">
          <p>
            © {new Date().getFullYear()} Latino Connect Hub. {t("footer_rights")}
          </p>
          <p>{t("footer_made_with")}</p>
        </div>
      </div>
    </footer>
  );
}
