import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Save, Trash2, RotateCcw, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";
import {
  useCitiesConfig,
  useCategoriesConfig,
  useSiteModeConfig,
  useUpdateAppConfig,
  DEFAULT_CITIES,
  type CategoriesConfig,
} from "@/hooks/useAppConfig";
import categoriesDefault from "@/lib/categories.json";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

type Tab = "site" | "cities" | "categories";

function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>("site");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-black text-white">Configurações do site</h1>
        <p className="text-neutral-400 mt-1 text-sm">
          Controle o modo do site, as cidades e as categorias usadas no diretório.
        </p>
      </header>

      <div className="flex gap-1 border-b border-white/10 overflow-x-auto">
        {(
          [
            { id: "site", label: "Modo do site" },
            { id: "cities", label: "Cidades" },
            { id: "categories", label: "Categorias" },
          ] as { id: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition ${
              tab === t.id
                ? "border-[#facc15] text-[#facc15]"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "site" && <SiteModeSection />}
      {tab === "cities" && <CitiesSection />}
      {tab === "categories" && <CategoriesSection />}
    </div>
  );
}

/* ----------------------------- Site mode -------------------------------- */

function SiteModeSection() {
  const { mode, isLoading } = useSiteModeConfig();
  const update = useUpdateAppConfig();

  const setMode = (next: "waitlist" | "live") => {
    update.mutate(
      { key: "site_mode", value: next },
      {
        onSuccess: () => toast.success(`Modo atualizado: ${next === "live" ? "Plataforma ao vivo" : "Lista de espera"}`),
        onError: (e) => toast.error(`Erro: ${String((e as Error).message ?? e)}`),
      },
    );
  };

  return (
    <section className="bg-neutral-900 border border-white/10 rounded-3xl p-6 max-w-2xl">
      <h2 className="text-lg font-extrabold text-white">Modo público</h2>
      <p className="text-sm text-neutral-400 mt-1">
        Define o que os visitantes veem na página inicial.
      </p>
      {isLoading ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="animate-spin text-neutral-500" size={20} />
        </div>
      ) : (
        <div className="mt-5 grid sm:grid-cols-2 gap-3">
          <ModeCard
            active={mode === "waitlist"}
            title="Lista de espera"
            desc="Mostrar apenas o formulário de inscrição (MVP)."
            onClick={() => setMode("waitlist")}
            disabled={update.isPending}
          />
          <ModeCard
            active={mode === "live"}
            title="Plataforma ao vivo"
            desc="Liberar o diretório completo para o público."
            onClick={() => setMode("live")}
            disabled={update.isPending}
          />
        </div>
      )}
      <p className="text-xs text-neutral-500 mt-4">
        Dica: visite qualquer página com <code className="text-[#facc15]">?preview=platform</code>{" "}
        para pré-visualizar a plataforma sem alterar o modo público.
      </p>
    </section>
  );
}

function ModeCard({
  active,
  title,
  desc,
  onClick,
  disabled,
}: {
  active: boolean;
  title: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-left p-5 rounded-2xl border-2 transition disabled:opacity-50 ${
        active
          ? "border-[#facc15] bg-[#facc15]/10"
          : "border-white/10 bg-neutral-950 hover:border-white/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-white font-bold">{title}</span>
        {active && <Check size={16} className="text-[#facc15]" />}
      </div>
      <p className="text-xs text-neutral-400 mt-1">{desc}</p>
    </button>
  );
}

/* ------------------------------ Cities ---------------------------------- */

function CitiesSection() {
  const cities = useCitiesConfig();
  const update = useUpdateAppConfig();
  const [draft, setDraft] = useState<string[]>(cities);
  const [newCity, setNewCity] = useState("");

  useEffect(() => {
    setDraft(cities);
  }, [cities]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(cities);

  const add = () => {
    const v = newCity.trim();
    if (!v) return;
    if (draft.some((c) => c.toLowerCase() === v.toLowerCase())) {
      toast.error("Cidade já existe");
      return;
    }
    setDraft([...draft, v]);
    setNewCity("");
  };

  const remove = (idx: number) => setDraft(draft.filter((_, i) => i !== idx));

  const rename = (idx: number, v: string) =>
    setDraft(draft.map((c, i) => (i === idx ? v : c)));

  const save = () => {
    const cleaned = draft.map((c) => c.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      toast.error("Adicione ao menos uma cidade");
      return;
    }
    update.mutate(
      { key: "cities", value: cleaned },
      {
        onSuccess: () => toast.success("Cidades atualizadas"),
        onError: (e) => toast.error(`Erro: ${String((e as Error).message ?? e)}`),
      },
    );
  };

  const resetDefaults = () => setDraft(DEFAULT_CITIES);

  return (
    <section className="bg-neutral-900 border border-white/10 rounded-3xl p-6 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white">Cidades & regiões</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Lista usada nos filtros do diretório e no cadastro de negócios.
          </p>
        </div>
        <button
          type="button"
          onClick={resetDefaults}
          className="text-xs font-bold text-neutral-400 hover:text-white inline-flex items-center gap-1"
        >
          <RotateCcw size={12} /> Padrão
        </button>
      </div>

      <ul className="mt-5 space-y-2">
        {draft.map((city, idx) => (
          <li key={idx} className="flex gap-2">
            <input
              value={city}
              onChange={(e) => rename(idx, e.target.value)}
              className="flex-1 bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#facc15]"
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="px-3 rounded-xl border border-white/10 text-red-400 hover:bg-red-500/10"
              aria-label="Remover cidade"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-2">
        <input
          value={newCity}
          onChange={(e) => setNewCity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Nova cidade (ex: Dunedin)"
          className="flex-1 bg-neutral-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-[#facc15]"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white inline-flex items-center gap-1 text-sm font-bold"
        >
          <Plus size={14} /> Adicionar
        </button>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        {dirty && <span className="text-xs text-amber-400">Alterações não salvas</span>}
        <button
          type="button"
          onClick={save}
          disabled={!dirty || update.isPending}
          className="px-5 py-2.5 rounded-xl bg-[#facc15] text-neutral-900 font-bold text-sm inline-flex items-center gap-2 disabled:opacity-50"
        >
          {update.isPending ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
          Salvar
        </button>
      </div>
    </section>
  );
}

/* ---------------------------- Categories -------------------------------- */

function CategoriesSection() {
  const config = useCategoriesConfig();
  const update = useUpdateAppConfig();
  const [draft, setDraft] = useState<string>(() => JSON.stringify(config, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(JSON.stringify(config, null, 2));
  }, [config]);

  const dirty = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(draft)) !== JSON.stringify(config);
    } catch {
      return true;
    }
  }, [draft, config]);

  const save = () => {
    let parsed: CategoriesConfig;
    try {
      parsed = JSON.parse(draft);
    } catch (e) {
      setError(`JSON inválido: ${(e as Error).message}`);
      return;
    }
    if (
      !parsed ||
      !Array.isArray(parsed.groups) ||
      !Array.isArray(parsed.categories)
    ) {
      setError("O JSON precisa ter as chaves `groups` e `categories`.");
      return;
    }
    setError(null);
    update.mutate(
      { key: "categories", value: parsed },
      {
        onSuccess: () => toast.success("Categorias atualizadas"),
        onError: (e) => {
          const msg = String((e as Error).message ?? e);
          setError(msg);
          toast.error(`Erro: ${msg}`);
        },
      },
    );
  };

  const resetDefaults = () => {
    setDraft(JSON.stringify(categoriesDefault, null, 2));
    setError(null);
  };

  return (
    <section className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-extrabold text-white">Categorias & subcategorias</h2>
          <p className="text-sm text-neutral-400 mt-1 max-w-xl">
            Edite os grupos (ex: Gastronomia) e as categorias (ex: Restaurante) com traduções
            PT/ES/EN. O formato é JSON — siga o exemplo padrão.
          </p>
        </div>
        <button
          type="button"
          onClick={resetDefaults}
          className="text-xs font-bold text-neutral-400 hover:text-white inline-flex items-center gap-1"
        >
          <RotateCcw size={12} /> Restaurar padrão
        </button>
      </div>

      <details className="mt-4 text-xs text-neutral-400">
        <summary className="cursor-pointer font-bold">Estrutura esperada</summary>
        <pre className="mt-2 p-3 bg-neutral-950 border border-white/10 rounded-xl overflow-auto text-[11px] leading-relaxed">
{`{
  "groups": [
    { "id": "food", "iconKey": "utensils-crossed", "colorKey": "red",
      "labels": { "pt": "Gastronomia", "es": "Gastronomía", "en": "Food" } }
  ],
  "categories": [
    { "key": "restaurant", "group": "food",
      "labels": { "pt": "Restaurante", "es": "Restaurante", "en": "Restaurant" } }
  ]
}`}
        </pre>
      </details>

      <textarea
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(null);
        }}
        spellCheck={false}
        className="mt-4 w-full h-[480px] font-mono text-xs bg-neutral-950 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-[#facc15] resize-y"
      />

      {error && (
        <div className="mt-3 flex items-start gap-2 text-sm text-red-400">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-end gap-3">
        {dirty && <span className="text-xs text-amber-400">Alterações não salvas</span>}
        <button
          type="button"
          onClick={save}
          disabled={!dirty || update.isPending}
          className="px-5 py-2.5 rounded-xl bg-[#facc15] text-neutral-900 font-bold text-sm inline-flex items-center gap-2 disabled:opacity-50"
        >
          {update.isPending ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
          Salvar
        </button>
      </div>
    </section>
  );
}
