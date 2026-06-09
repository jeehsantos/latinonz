import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCitiesConfig } from "@/hooks/useAppConfig";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/lib/i18n";

export type MobileSearchValue = { q: string; category: string; city: string };

export function MobileSearchBar({
  value,
  onChange,
  onSubmit,
  variant = "compact",
}: {
  value: MobileSearchValue;
  onChange: (v: MobileSearchValue) => void;
  onSubmit?: () => void;
  variant?: "compact" | "sticky";
}) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { groups, categories } = useCategories();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const activeFilterCount = (value.category ? 1 : 0) + (value.city ? 1 : 0);

  const apply = () => {
    onChange(draft);
    setOpen(false);
    if (onSubmit) onSubmit();
    else navigate({ to: "/directory", search: { q: draft.q || undefined, category: draft.category || undefined, city: draft.city || undefined } });
  };

  const clearOne = (key: "category" | "city") => onChange({ ...value, [key]: "" });

  const wrapperClass =
    variant === "sticky"
      ? "sticky top-[57px] z-20 bg-neutral-950/95 backdrop-blur-md border-b border-white/10 px-4 py-3"
      : "px-1";

  return (
    <div className={wrapperClass}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (onSubmit) onSubmit();
          else navigate({ to: "/directory", search: { q: value.q || undefined, category: value.category || undefined, city: value.city || undefined } });
        }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            value={value.q}
            onChange={(e) => onChange({ ...value, q: e.target.value })}
            placeholder={t("directory.search_placeholder")}
            className="w-full bg-neutral-900 border border-white/10 rounded-full pl-10 pr-4 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-[#facc15] outline-none"
          />
        </div>
        <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (o) setDraft(value); }}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="relative shrink-0 h-12 w-12 rounded-full bg-[#facc15] text-black flex items-center justify-center shadow-lg shadow-[#facc15]/20"
              aria-label="Filters"
            >
              <SlidersHorizontal size={18} />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-black text-[#facc15] text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border border-[#facc15]">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-neutral-950 border-white/10 text-white rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-white text-left">Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-5 space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 block">
                  {t("directory.all_areas")}
                </label>
                <select
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  className="w-full bg-neutral-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#facc15]"
                >
                  <option value="">{t("directory.all_areas")}</option>
                  {groups.map((group) => {
                    const groupCats = categories.filter((c) => c.group === group.id);
                    if (!groupCats.length) return null;
                    return (
                      <optgroup key={group.id} label={group.label}>
                        {groupCats.map((c) => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 block">
                  {t("directory.all_nz")}
                </label>
                <select
                  value={draft.city}
                  onChange={(e) => setDraft({ ...draft, city: e.target.value })}
                  className="w-full bg-neutral-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-[#facc15]"
                >
                  <option value="">{t("directory.all_nz")}</option>
                  {NZ_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2 sticky bottom-0 bg-neutral-950 pb-2">
                <button
                  type="button"
                  onClick={() => { setDraft({ q: draft.q, category: "", city: "" }); }}
                  className="flex-1 py-3 rounded-full border border-white/15 text-neutral-200 font-semibold text-sm"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={apply}
                  className="flex-1 py-3 rounded-full bg-[#facc15] text-black font-bold text-sm"
                >
                  {t("directory.search_button")}
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </form>
      {activeFilterCount > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.category && (
            <Chip label={getCategoryLabel(value.category, groups, categories)} onClear={() => clearOne("category")} />
          )}
          {value.city && <Chip label={value.city} onClear={() => clearOne("city")} />}
        </div>
      )}
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      onClick={onClear}
      className="inline-flex items-center gap-1.5 bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/30 rounded-full px-3 py-1 text-xs font-semibold"
    >
      {label}
      <X size={12} />
    </button>
  );
}

function getCategoryLabel(
  key: string,
  groups: { id: string; label: string }[],
  categories: { key: string; label: string; group: string }[],
) {
  const g = groups.find((x) => x.id === key);
  if (g) return g.label;
  const c = categories.find((x) => x.key === key);
  return c?.label ?? key;
}
