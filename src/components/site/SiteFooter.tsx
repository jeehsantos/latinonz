import { Link } from "@tanstack/react-router";
import logo from "@/assets/Latino_Connecthub_White.png";
import { useI18n } from "@/lib/i18n";

import { Facebook, Instagram, MessageCircle } from "lucide-react";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="bg-black text-white/80 mt-24 border-t border-white/10 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-6 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Latino Connect Hub" className="h-26 md:h-16 w-auto" />
          </Link>
          <p className="text-sm mt-2 text-white/60">{t("footer_tagline")}</p>
        </div>
        <div>
          <p className="text-[#df991b] font-bold mb-3">{t("footer_platform")}</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/directory" className="hover:text-[#df991b]">
                {t("nav.directory")}
              </Link>
            </li>
            <li>
              <Link to="/planos" className="hover:text-[#df991b]">
                {t("nav.plans")}
              </Link>
            </li>
            <li>
              <Link to="/cadastro" className="hover:text-[#df991b]">
                {t("nav.register")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[#df991b] font-bold mb-3">{t("footer_content")}</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/blog" className="hover:text-[#df991b]">
                {t("nav.blog")}
              </Link>
            </li>
            <li>
              <Link to="/sobre" className="hover:text-[#df991b]">
                {t("nav.about")}
              </Link>
            </li>
            <li>
              <Link to="/contato" className="hover:text-[#df991b]">
                {t("nav.contact")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[#df991b] font-bold mb-3">{t("footer_contact_col")}</p>
          <p className="text-sm">hello@latinoconnecthub.co.nz</p>
          <p className="text-sm">Auckland, Nova Zelândia</p>
          <div className="flex items-center gap-4 mt-6">
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#df991b] transition-colors" aria-label="Facebook">
              <Facebook className="w-5 h-5" />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#df991b] transition-colors" aria-label="Instagram">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[#df991b] transition-colors" aria-label="WhatsApp">
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 text-xs text-white/40 flex flex-col md:flex-row justify-between gap-2">
          <p>
            © {new Date().getFullYear()} Latino Connect Hub. {t("footer_rights")}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy" className="hover:text-[#df991b]">
              {t("footer_legal.privacy")}
            </Link>
            <Link to="/terms" className="hover:text-[#df991b]">
              {t("footer_legal.terms")}
            </Link>
            <span>{t("footer_made_with")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
