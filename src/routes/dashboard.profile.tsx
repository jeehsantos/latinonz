import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  QrCode,
  Download,
  Plus,
  Trash2,
  Upload,
  X,
  Check,
  Copy,
  MapPin,
  Clock,
  ShoppingBag,
  UtensilsCrossed,
  Bike,
  CalendarClock,
  Sparkles,
  Lock,
  Truck,
  Wrench,
  Heart,
  Gift,
  Star as StarIcon,
  Coffee,
  Package,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { NZ_CITIES } from "@/lib/mock/categories";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/lib/i18n";
import {
  getMyBusiness,
  updateMyBusiness,
  updateBusinessHours,
  updateServiceOptions,
  updateServiceOptionItems,
} from "@/lib/business.functions";
import { uploadLogo } from "@/lib/storage.functions";
import { connectGooglePlace, syncGoogleReviews } from "@/lib/reviews.functions";
import { Star, RefreshCw } from "lucide-react";
import QRCode from "qrcode";
import { useCurrentPlan } from "@/lib/dev-plan";
import { can } from "@/lib/plans";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfileEditor,
});

type BusinessType = "Serviço" | "Produto";
type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

type DaySchedule = { closed: boolean; slots: { open: string; close: string }[] };
type BranchSchedule = Record<DayKey, DaySchedule>;

const DEFAULT_SCHEDULE: BranchSchedule = {
  mon: { closed: false, slots: [{ open: "09:00", close: "18:00" }] },
  tue: { closed: false, slots: [{ open: "09:00", close: "18:00" }] },
  wed: { closed: false, slots: [{ open: "09:00", close: "18:00" }] },
  thu: { closed: false, slots: [{ open: "09:00", close: "18:00" }] },
  fri: { closed: false, slots: [{ open: "09:00", close: "18:00" }] },
  sat: { closed: false, slots: [{ open: "10:00", close: "14:00" }] },
  sun: { closed: true, slots: [] },
};

const cloneSchedule = (s: BranchSchedule): BranchSchedule => JSON.parse(JSON.stringify(s));

function ProfileEditor() {
  const { t } = useI18n();
  const fetchMyBusiness = useServerFn(getMyBusiness);
  const saveMyBusiness = useServerFn(updateMyBusiness);
  const saveHoursFn = useServerFn(updateBusinessHours);
  const saveServiceOptionsFn = useServerFn(updateServiceOptions);
  const saveServiceItemsFn = useServerFn(updateServiceOptionItems);
  const callUploadLogo = useServerFn(uploadLogo);
  const { data: loaded, refetch } = useQuery({
    queryKey: ["my-business"],
    queryFn: async () => {
      try {
        return await fetchMyBusiness({});
      } catch {
        return null;
      }
    },
    retry: false,
    throwOnError: false,
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [businessType, setBusinessType] = useState<BusinessType>("Serviço");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [keywords, setKeywords] = useState("");
  const [addressStreet, setAddressStreet] = useState("");
  const [addressSuburb, setAddressSuburb] = useState("");
  const [cities, setCities] = useState<string[]>(["Auckland"]);
  const [citiesOpen, setCitiesOpen] = useState(false);
  const [schedules, setSchedules] = useState<Record<string, BranchSchedule>>({
    Auckland: DEFAULT_SCHEDULE,
  });
  const [activeBranch, setActiveBranch] = useState<string>("Auckland");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [plan] = useCurrentPlan();
  const canUseQr = can(plan, "qrCode");
  const slug = loaded?.business?.slug ?? "";
  const qrUrl = slug ? `https://latinoconnecthub.co.nz/business/${slug}` : "";
  const [logo, setLogo] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Service options (controlled by parent)
  type ServiceFlagKey = "takeaway" | "dinein" | "delivery" | "booking";
  const [serviceFlags, setServiceFlags] = useState<Record<ServiceFlagKey, boolean>>({
    takeaway: false,
    dinein: false,
    delivery: false,
    booking: false,
  });
  
  type CustomServiceItem = { title: string; description: string; icon_key: string };
  const [customServiceItems, setCustomServiceItems] = useState<CustomServiceItem[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  // Seed form once business loads
  useEffect(() => {
    if (!loaded?.ok) return;
    
    if (loaded.business) {
      const b = loaded.business;
      if (b.type === "Serviço" || b.type === "Produto") setBusinessType(b.type as BusinessType);
      setName(b.name ?? "");
      setDescription(b.description ?? "");
      if (b.macro_category) setCategory(b.macro_category);
      setPhone(b.phone ?? "");
      setKeywords((b.keywords ?? []).join(", "));
      setAddressStreet((b as { address_street?: string | null }).address_street ?? "");
      setAddressSuburb((b as { address_suburb?: string | null }).address_suburb ?? "");
      const locs: string[] =
        b.locations && b.locations.length > 0 ? (b.locations as string[]) : ["Auckland"];
      setCities(locs);
      setActiveBranch(locs[0]);

      // Seed schedules from saved business_hours (per location), fallback to default
      const loadedHours = (loaded.hours ?? []) as unknown as {
        day_key: DayKey;
        is_closed: boolean;
        slots: { open: string; close: string }[];
        location: string;
      }[];
      setSchedules(() => {
        const next: Record<string, BranchSchedule> = {};
        for (const loc of locs) {
          const base = cloneSchedule(DEFAULT_SCHEDULE);
          const rowsForLoc = loadedHours.filter((h) => h.location === loc);
          if (rowsForLoc.length > 0) {
            for (const k of DAY_KEYS) base[k] = { closed: true, slots: [] };
            for (const r of rowsForLoc) {
              base[r.day_key] = {
                closed: !!r.is_closed,
                slots: Array.isArray(r.slots) ? r.slots : [],
              };
            }
          }
          next[loc] = base;
        }
        return next;
      });

      if (b.logo_url) setLogo(b.logo_url);

      // Seed service options
      const so = loaded.serviceOptions as
        | { takeaway: boolean; dinein: boolean; delivery: boolean; booking: boolean; other: string | null }
        | null;
      if (so) {
        setServiceFlags({
          takeaway: !!so.takeaway,
          dinein: !!so.dinein,
          delivery: !!so.delivery,
          booking: !!so.booking,
        });
        
      }

      // Seed custom service items
      const items = (loaded.serviceOptionItems ?? []) as {
        title: string;
        description: string | null;
        icon_key: string;
      }[];
      setCustomServiceItems(
        items.map((it) => ({
          title: it.title,
          description: it.description ?? "",
          icon_key: it.icon_key || "sparkles",
        })),
      );
    } else {
      // Fallback: If no business row exists yet, use user_metadata from signup
      supabase.auth.getUser().then(({ data }) => {
        const meta = data.user?.user_metadata;
        if (meta) {
          setName((prev) => prev || meta.business_name || "");
          setPhone((prev) => prev || meta.whatsapp || "");
        }
      });
    }
  }, [loaded]);

  const { categories: dbCategories } = useCategories();
  const wantedKind: "service" | "product" = businessType === "Produto" ? "product" : "service";
  const activeCategories = useMemo(
    () => dbCategories.filter((c) => c.kind === wantedKind).map((c) => c.canonicalName),
    [dbCategories, wantedKind],
  );
  // Reset category if it no longer belongs to the current tab
  useEffect(() => {
    if (!category && activeCategories.length > 0) {
      setCategory(activeCategories[0]);
      return;
    }
    if (category && activeCategories.length > 0 && !activeCategories.includes(category)) {
      setCategory(activeCategories[0]);
    }
  }, [activeCategories, category]);
  const branchSchedule = schedules[activeBranch] ?? DEFAULT_SCHEDULE;

  const days: { key: DayKey; label: string; short: string }[] = [
    { key: "mon", label: "Segunda-feira", short: "SEG" },
    { key: "tue", label: "Terça-feira", short: "TER" },
    { key: "wed", label: "Quarta-feira", short: "QUA" },
    { key: "thu", label: "Quinta-feira", short: "QUI" },
    { key: "fri", label: "Sexta-feira", short: "SEX" },
    { key: "sat", label: "Sábado", short: "SÁB" },
    { key: "sun", label: "Domingo", short: "DOM" },
  ];

  const setBranchSchedule = (mutator: (s: BranchSchedule) => BranchSchedule) => {
    setSchedules((prev) => ({
      ...prev,
      [activeBranch]: mutator(prev[activeBranch] ?? cloneSchedule(DEFAULT_SCHEDULE)),
    }));
  };

  const toggleCity = (city: string) => {
    setCities((prev) => {
      const exists = prev.includes(city);
      const next = exists ? prev.filter((c) => c !== city) : [...prev, city];
      setSchedules((sch) => {
        const copy = { ...sch };
        if (exists) {
          delete copy[city];
        } else if (!copy[city]) {
          copy[city] = cloneSchedule(DEFAULT_SCHEDULE);
        }
        return copy;
      });
      if (exists && activeBranch === city) setActiveBranch(next[0] ?? "");
      if (!exists && next.length === 1) setActiveBranch(city);
      return next;
    });
  };

  const copyScheduleToAll = () => {
    const source = cloneSchedule(branchSchedule);
    const next: Record<string, BranchSchedule> = {};
    for (const c of cities) next[c] = cloneSchedule(source);
    setSchedules(next);
  };

  const updateSlot = (day: DayKey, idx: number, field: "open" | "close", v: string) =>
    setBranchSchedule((s) => ({
      ...s,
      [day]: {
        ...s[day],
        slots: s[day].slots.map((sl, i) => (i === idx ? { ...sl, [field]: v } : sl)),
      },
    }));

  const addSlot = (day: DayKey) =>
    setBranchSchedule((s) => ({
      ...s,
      [day]: { closed: false, slots: [...s[day].slots, { open: "14:00", close: "18:00" }] },
    }));

  const removeSlot = (day: DayKey, idx: number) =>
    setBranchSchedule((s) => ({
      ...s,
      [day]: { ...s[day], slots: s[day].slots.filter((_, i) => i !== idx) },
    }));

  const toggleClosed = (day: DayKey) =>
    setBranchSchedule((s) => {
      const isClosed = !s[day].closed;
      return {
        ...s,
        [day]: {
          closed: isClosed,
          slots: isClosed
            ? []
            : s[day].slots.length
              ? s[day].slots
              : [{ open: "09:00", close: "18:00" }],
        },
      };
    });

  const handleGenerateQr = async () => {
    if (!canUseQr || !qrUrl) return;
    setQrError(null);
    setGenerating(true);
    try {
      const url = await QRCode.toDataURL(qrUrl, {
        width: 512,
        margin: 1,
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(url);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : "Erro ao gerar QR");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `${slug || "qr-code"}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    setLogoUploading(true);
    try {
      const buf = await file.arrayBuffer();
      let bin = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const contentBase64 = btoa(bin);
      const dot = file.name.lastIndexOf(".");
      const ext = (dot >= 0 ? file.name.slice(dot + 1) : "jpg").toLowerCase();
      const res = await callUploadLogo({
        data: { contentBase64, contentType: file.type || "image/jpeg", ext },
      });
      setLogo(res.url);
      await refetch();
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setLogoUploading(false);
      if (logoRef.current) logoRef.current.value = "";
    }
  };

  const multiBranch = cities.length > 1;
  const citiesLabel = useMemo(() => {
    if (!cities.length) return t("profile.cities_placeholder");
    if (cities.length <= 2) return cities.join(", ");
    return `${cities.slice(0, 2).join(", ")} +${cities.length - 2}`;
  }, [cities, t]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 bg-neutral-900 rounded-2xl border border-white/10 shadow-sm p-6 space-y-6">
        <h3 className="text-xl font-bold text-white border-b border-white/10 pb-4">
          {t("profile.title")}
        </h3>

        <div>
          <div className="flex justify-between mb-1">
            <label className="block text-sm font-bold text-neutral-200">
              {t("profile.description_label")}
            </label>
            <span className="text-xs text-neutral-500">240/500</span>
          </div>
          <textarea
            rows={4}
            maxLength={500}
            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#facc15] resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="text-xs text-neutral-400 mt-1">{t("profile.description_hint")}</p>
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-200 mb-2">
            {t("profile.type_label")}
          </label>
          <div className="flex bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setBusinessType("Serviço")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${businessType === "Serviço" ? "bg-black text-[#facc15] shadow-sm" : "text-neutral-400 hover:text-neutral-200"}`}
            >
              {t("profile.type_service")}
            </button>
            <button
              onClick={() => setBusinessType("Produto")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${businessType === "Produto" ? "bg-black text-[#facc15] shadow-sm" : "text-neutral-400 hover:text-neutral-200"}`}
            >
              {t("profile.type_product")}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-200 mb-1">
            {t("profile.business_name_label")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#facc15] focus:ring-1 focus:ring-[#facc15]"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-200 mb-1">
            {t("profile.category_label")}
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#facc15] appearance-none"
            >
              {activeCategories.length === 0 && (
                <option value="">Nenhuma categoria disponível</option>
              )}
              {activeCategories.map((c: string, i: number) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-4 top-4 text-neutral-500 pointer-events-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-200 mb-1">
            {t("profile.phone_label")}
          </label>
          <input
            type="text"
            placeholder="Ex: 021 000 0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#facc15]"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-200 mb-1">
            {t("profile.cities_label")}{" "}
            <span className="font-normal text-neutral-500">{t("profile.cities_multiple")}</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setCitiesOpen((o) => !o)}
              className="w-full flex items-center justify-between bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-left text-white outline-none focus:border-[#facc15]"
            >
              <span className="truncate">{citiesLabel}</span>
              <ChevronDown
                size={16}
                className={`text-neutral-500 transition-transform ${citiesOpen ? "rotate-180" : ""}`}
              />
            </button>
            {citiesOpen && (
              <div className="absolute z-20 mt-2 w-full bg-neutral-900 border border-white/10 rounded-xl shadow-lg p-2 max-h-72 overflow-y-auto">
                {NZ_CITIES.map((c) => {
                  const checked = cities.includes(c);
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={() => toggleCity(c)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-neutral-950 text-left"
                    >
                      <span
                        className={`h-4 w-4 rounded border flex items-center justify-center ${checked ? "bg-[#facc15] border-[#facc15]" : "border-gray-300"}`}
                      >
                        {checked && <Check size={12} className="text-white" />}
                      </span>
                      <span className="text-sm text-neutral-200">{c}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {cities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {cities.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 bg-emerald-50 text-[#facc15] text-xs font-semibold px-2.5 py-1 rounded-full"
                >
                  <MapPin size={11} /> {c}
                  <button
                    type="button"
                    onClick={() => toggleCity(c)}
                    className="hover:text-red-600"
                    aria-label={`Remover ${c}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-neutral-200 mb-1">
            {t("profile.keywords_label")}
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder={t("profile.keywords_placeholder")}
            className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#facc15]"
          />
          <p className="text-xs text-neutral-400 mt-1">{t("profile.keywords_hint")}</p>
        </div>

        {/* Hours — Premium+ only */}
        {plan === "starter" ? (
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} className="text-neutral-500" />
              <label className="block text-sm font-bold text-neutral-200">
                {t("profile.hours_title")}
              </label>
              <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold">
                PREMIUM+
              </span>
            </div>
            <p className="text-xs text-neutral-400">{t("profile.hours_upgrade_hint")}</p>
          </div>
        ) : (
          <div className="pt-4 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[#facc15]" />
                <label className="block text-sm font-bold text-neutral-200">
                  {t("profile.hours_title")}
                </label>
              </div>
            </div>

            {multiBranch && (
              <div className="mb-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <p className="text-xs text-neutral-400">{t("profile.hours_configure_branches")}</p>
                  <button
                    type="button"
                    onClick={copyScheduleToAll}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#facc15] hover:underline"
                  >
                    <Copy size={12} /> {t("profile.hours_apply_all")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 p-1 bg-white/5 rounded-xl">
                  {cities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setActiveBranch(c)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${activeBranch === c ? "bg-black text-[#facc15] shadow-sm" : "text-neutral-400 hover:text-neutral-200"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-white/10 overflow-hidden divide-y divide-gray-100">
              {days.map(({ key, label, short }) => {
                const day = branchSchedule[key];
                return (
                  <div
                    key={key}
                    className={`flex flex-col md:flex-row md:items-center gap-3 md:gap-4 px-4 py-3 transition-colors ${day.closed ? "bg-neutral-950" : "bg-neutral-900 hover:bg-neutral-950/60"}`}
                  >
                    <div className="flex items-center gap-3 md:w-44">
                      <span
                        className={`flex items-center justify-center h-9 w-9 rounded-lg text-[11px] font-bold ${day.closed ? "bg-white/10 text-neutral-400" : "bg-emerald-50 text-[#facc15]"}`}
                      >
                        {short}
                      </span>
                      <span className="text-sm font-semibold text-neutral-200">{label}</span>
                    </div>
                    <div className="flex-1 flex flex-wrap items-center gap-2">
                      {day.closed ? (
                        <span className="inline-flex items-center text-xs font-bold text-red-700 bg-red-50 border border-red-100 rounded-md px-2.5 py-1.5">
                          {t("profile.hours_closed")}
                        </span>
                      ) : (
                        <>
                          {day.slots.map((slot, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-1.5 bg-neutral-900 border border-white/10 rounded-lg px-2 py-1"
                            >
                              <input
                                type="time"
                                value={slot.open}
                                onChange={(e) => updateSlot(key, idx, "open", e.target.value)}
                                className="bg-transparent text-sm text-white outline-none w-[88px]"
                              />
                              <span className="text-neutral-500 text-xs">{t("profile.hours_at")}</span>
                              <input
                                type="time"
                                value={slot.close}
                                onChange={(e) => updateSlot(key, idx, "close", e.target.value)}
                                className="bg-transparent text-sm text-white outline-none w-[88px]"
                              />
                              {day.slots.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSlot(key, idx)}
                                  className="text-neutral-500 hover:text-red-600 ml-1"
                                  aria-label="Remover horário"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addSlot(key)}
                            className="inline-flex items-center gap-1 text-[#facc15] hover:bg-emerald-50 text-xs font-bold px-2 py-1.5 rounded-md transition-colors"
                          >
                            <Plus size={12} /> {t("profile.hours_add_slot")}
                          </button>
                        </>
                      )}
                    </div>
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <span className="text-xs font-semibold text-neutral-400">
                        {day.closed ? t("profile.hours_closed_label") : t("profile.hours_open")}
                      </span>
                      <span className="relative">
                        <input
                          type="checkbox"
                          checked={!day.closed}
                          onChange={() => toggleClosed(key)}
                          className="sr-only peer"
                        />
                        <span className="block h-5 w-9 bg-gray-300 peer-checked:bg-[#facc15] rounded-full transition-colors" />
                        <span className="absolute top-0.5 left-0.5 h-4 w-4 bg-neutral-900 rounded-full shadow transition-transform peer-checked:translate-x-4" />
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {plan !== "starter" && (
          <GoogleReviewsSection
            businessId={loaded?.ok ? (loaded.business?.id ?? null) : null}
            initialPlaceId={loaded?.ok ? (loaded.business?.google_place_id ?? "") : ""}
            onConnected={() => refetch()}
          />
        )}

        <ServiceOptionsSection
          plan={plan}
          flags={serviceFlags}
          onToggleFlag={(k) => setServiceFlags((p) => ({ ...p, [k]: !p[k] }))}
          items={customServiceItems}
          onChangeItems={setCustomServiceItems}
        />

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
        {saveSuccess && <p className="text-sm text-emerald-700">{t("profile.save_button")} ✓</p>}
        <button
          onClick={async () => {
            setSaveError(null);
            setSaveSuccess(false);
            setSaving(true);
            try {
              const res = await saveMyBusiness({
                data: {
                  name: name.trim() || undefined,
                  description: description.trim(),
                  type: businessType,
                  macro_category: category,
                  phone: phone.trim() || null,
                  locations: cities,
                  keywords: keywords
                    .split(",")
                    .map((k) => k.trim())
                    .filter(Boolean),
                },
              });
              if (!res.ok) {
                const errorKey = (res as { errorKey?: string }).errorKey;
                if (errorKey === "save_name_required") {
                  setSaveError(t("profile.save_error_name_required"));
                } else if (errorKey === "save_not_found") {
                  setSaveError(t("profile.save_error_not_found"));
                } else if (errorKey === "save_generic") {
                  setSaveError(t("profile.save_error_generic"));
                } else {
                  setSaveError(res.error);
                }
                return;
              }

              // Save hours, service options, and custom service items for Premium+
              if (plan !== "starter") {
                const hoursPayload: {
                  location: string;
                  day_key: DayKey;
                  is_closed: boolean;
                  slots: { open: string; close: string }[];
                }[] = [];
                for (const city of cities) {
                  const sched = schedules[city] ?? DEFAULT_SCHEDULE;
                  for (const k of DAY_KEYS) {
                    hoursPayload.push({
                      location: city,
                      day_key: k,
                      is_closed: sched[k].closed,
                      slots: sched[k].closed ? [] : sched[k].slots,
                    });
                  }
                }
                await saveHoursFn({ data: { hours: hoursPayload } });
                await saveServiceOptionsFn({
                  data: {
                    takeaway: serviceFlags.takeaway,
                    dinein: serviceFlags.dinein,
                    delivery: serviceFlags.delivery,
                    booking: serviceFlags.booking,
                    other: null,
                  },
                });
                await saveServiceItemsFn({
                  data: {
                    items: customServiceItems
                      .filter((it) => it.title.trim().length > 0)
                      .map((it) => ({
                        title: it.title.trim(),
                        description: it.description.trim() || null,
                        icon_key: it.icon_key,
                      })),
                  },
                });
              }

              setSaveSuccess(true);
              await refetch();
            } catch (err) {
              setSaveError(err instanceof Error ? err.message : t("profile.save_error_unexpected"));
            } finally {
              setSaving(false);
            }
          }}
          disabled={saving}
          className="bg-neutral-900 hover:bg-white/5 disabled:opacity-60 text-[#facc15] font-bold rounded-xl px-6 py-2.5 text-sm"
        >
          {saving ? "..." : t("profile.save_button")}
        </button>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-neutral-900 rounded-2xl border border-white/10 shadow-sm p-6">
          <h3 className="font-bold text-white mb-1">{t("profile.logo_title")}</h3>
          <p className="text-xs text-neutral-400 mb-4">{t("profile.logo_subtitle")}</p>
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-white/10 bg-neutral-950 overflow-hidden flex items-center justify-center mb-3">
              {logo ? (
                <img src={logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Upload size={28} className="text-gray-300" />
              )}
            </div>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <div className="flex gap-2 w-full">
              <button
                onClick={() => logoRef.current?.click()}
                disabled={logoUploading}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-white/5 disabled:opacity-60 text-[#facc15] font-bold py-2 rounded-xl text-sm transition-colors"
              >
                <Upload size={14} />{" "}
                {logoUploading ? "..." : logo ? t("profile.logo_change") : t("profile.logo_upload")}
              </button>
              {logo && (
                <button
                  onClick={() => setLogo(null)}
                  disabled={logoUploading}
                  className="inline-flex items-center justify-center bg-white/5 hover:bg-white/10 disabled:opacity-60 text-neutral-200 font-bold px-3 rounded-xl text-sm transition-colors"
                  aria-label={t("profile.logo_remove")}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            {logoError && <p className="text-[11px] text-red-600 mt-2 text-center">{logoError}</p>}
            <p className="text-[11px] text-neutral-500 mt-2 text-center">{t("profile.logo_hint")}</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-white/10 shadow-sm p-6 flex flex-col items-center text-center">
          <h3 className="font-bold text-white mb-4 w-full text-left">{t("profile.qr_title")}</h3>
          <div className="w-32 h-32 bg-neutral-950 border border-white/10 rounded-xl p-2 mb-4 flex items-center justify-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR code" className="w-full h-full object-contain" />
            ) : !canUseQr ? (
              <span className="text-xs text-neutral-500 px-2 inline-flex items-center gap-1">
                <Lock size={12} /> Premium / Ultra
              </span>
            ) : (
              <span className="text-xs text-neutral-500 px-2">
                {generating ? t("profile.qr_generating") : t("profile.qr_not_generated")}
              </span>
            )}
          </div>
          {!canUseQr ? (
            <Link
              to="/dashboard/upgrade"
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              <Sparkles size={16} /> Fazer upgrade
            </Link>
          ) : !qrDataUrl ? (
            <button
              onClick={handleGenerateQr}
              disabled={generating || !qrUrl}
              className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-white/5 disabled:opacity-60 text-[#facc15] font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {generating ? t("profile.qr_generating") : t("profile.qr_generate")}
            </button>
          ) : (
            <button
              onClick={handleDownloadQr}
              className="w-full flex items-center justify-center gap-2 bg-[#0B2C1A] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-neutral-900 hover:text-[#facc15] transition-colors"
            >
              <Download size={16} /> {t("profile.qr_download")}
            </button>
          )}
          {qrError && <p className="text-[11px] text-red-600 mt-2">{qrError}</p>}
          {qrUrl && canUseQr && <p className="text-[10px] text-neutral-500 mt-2 break-all">{qrUrl}</p>}
        </div>
      </div>
    </div>
  );
}

const CUSTOM_ICONS: { key: string; icon: typeof ShoppingBag }[] = [
  { key: "sparkles", icon: Sparkles },
  { key: "shopping-bag", icon: ShoppingBag },
  { key: "utensils", icon: UtensilsCrossed },
  { key: "bike", icon: Bike },
  { key: "calendar", icon: CalendarClock },
  { key: "truck", icon: Truck },
  { key: "wrench", icon: Wrench },
  { key: "heart", icon: Heart },
  { key: "gift", icon: Gift },
  { key: "star", icon: StarIcon },
  { key: "coffee", icon: Coffee },
  { key: "package", icon: Package },
];

export function getServiceIcon(key: string): typeof ShoppingBag {
  return CUSTOM_ICONS.find((i) => i.key === key)?.icon ?? Sparkles;
}

type ServiceOptionsSectionProps = {
  plan: string;
  flags: Record<ServiceOptionKey, boolean>;
  onToggleFlag: (k: ServiceOptionKey) => void;
  items: { title: string; description: string; icon_key: string }[];
  onChangeItems: (
    items: { title: string; description: string; icon_key: string }[],
  ) => void;
};

function ServiceOptionsSection({
  plan,
  flags,
  onToggleFlag,
  items,
  onChangeItems,
}: ServiceOptionsSectionProps) {
  const { t } = useI18n();
  const isPaid = plan === "premium" || plan === "ultra";

  const addItem = () =>
    onChangeItems([...items, { title: "", description: "", icon_key: "sparkles" }]);
  const updateItem = (
    idx: number,
    patch: Partial<{ title: string; description: string; icon_key: string }>,
  ) => onChangeItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeItem = (idx: number) => onChangeItems(items.filter((_, i) => i !== idx));

  return (
    <div className="bg-neutral-900 rounded-2xl border border-white/10 shadow-sm p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[#facc15]" />
          <div>
            <h3 className="text-base font-bold text-white">
              {t("profile.service_options_title")}
            </h3>
            <p className="text-xs text-neutral-400">{t("profile.service_options_subtitle")}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-800 uppercase tracking-wide">
          <Sparkles size={11} /> Premium
        </span>
      </div>

      {!isPaid ? (
        <div className="rounded-xl border-2 border-dashed border-white/10 bg-neutral-950/60 p-6 text-center">
          <div className="w-11 h-11 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Lock size={18} />
          </div>
          <p className="mt-3 text-sm font-bold text-white">
            {t("profile.service_options_locked_title")}
          </p>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            {t("profile.service_options_locked_body")}
          </p>
          <Link
            to="/dashboard/upgrade"
            className="inline-flex mt-4 bg-neutral-900 hover:bg-white/5 text-[#facc15] text-xs font-bold px-4 py-2 rounded-xl"
          >
            {t("profile.service_options_upgrade")}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SERVICE_OPTIONS.map(({ key, label, hint, icon: Icon }) => {
              const on = flags[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onToggleFlag(key)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${on ? "border-[#facc15] bg-emerald-50/60" : "border-white/10 bg-neutral-900 hover:border-gray-300"}`}
                >
                  <span
                    className={`flex items-center justify-center h-10 w-10 rounded-lg ${on ? "bg-[#facc15] text-white" : "bg-white/5 text-neutral-400"}`}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-bold text-white">{label}</span>
                    <span className="block text-xs text-neutral-400">{hint}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-neutral-200">
                Opções personalizadas
              </label>
              <button
                type="button"
                onClick={addItem}
                disabled={items.length > 0 && !items[items.length - 1].title.trim()}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#facc15] hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline"
              >
                <Plus size={14} /> Adicionar opção
              </button>
            </div>
            <p className="text-xs text-neutral-500 mb-3">
              Preencha o título e escolha um ícone. Salvo ao clicar em{" "}
              <span className="text-[#facc15] font-semibold">Salvar perfil</span>.
            </p>

            {items.length === 0 && (
              <p className="text-xs text-neutral-400">
                Adicione opções extras como “Atendimento domiciliar”, “Consultoria online”, “Catering”, etc.
              </p>
            )}

            <div className="space-y-3">
              {items.map((it, idx) => {
                const Icon = getServiceIcon(it.icon_key);
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-white/10 p-3 bg-neutral-950/40 space-y-2"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex items-center justify-center h-10 w-10 rounded-lg bg-black text-[#facc15] shrink-0">
                        <Icon size={18} />
                      </span>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={it.title}
                          onChange={(e) => updateItem(idx, { title: e.target.value })}
                          placeholder="Título (ex: Atendimento domiciliar)"
                          maxLength={80}
                          className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#facc15]"
                        />
                        <input
                          type="text"
                          value={it.description}
                          onChange={(e) => updateItem(idx, { description: e.target.value })}
                          placeholder="Descrição (opcional)"
                          maxLength={200}
                          className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#facc15]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-neutral-500 hover:text-red-500 mt-2"
                        aria-label="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {CUSTOM_ICONS.map(({ key, icon: I }) => {
                        const active = it.icon_key === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => updateItem(idx, { icon_key: key })}
                            className={`flex items-center justify-center h-8 w-8 rounded-lg border transition-colors ${active ? "border-[#facc15] bg-[#facc15]/10 text-[#facc15]" : "border-white/10 text-neutral-400 hover:border-white/30"}`}
                            aria-label={key}
                          >
                            <I size={14} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

type ServiceOptionKey = "takeaway" | "dinein" | "delivery" | "booking";

const SERVICE_OPTIONS: {
  key: ServiceOptionKey;
  label: string;
  hint: string;
  icon: typeof ShoppingBag;
}[] = [
  { key: "takeaway", label: "Take Away", hint: "Cliente retira no local", icon: ShoppingBag },
  { key: "dinein", label: "Dine In", hint: "Consumo no local", icon: UtensilsCrossed },
  { key: "delivery", label: "Delivery", hint: "Entrega ao cliente", icon: Bike },
  { key: "booking", label: "Reserva antecipada", hint: "Book in advance", icon: CalendarClock },
];

function GoogleReviewsSection({
  businessId,
  initialPlaceId,
  onConnected,
}: {
  businessId: string | null;
  initialPlaceId: string;
  onConnected: () => void;
}) {
  const connect = useServerFn(connectGooglePlace);
  const sync = useServerFn(syncGoogleReviews);
  const [placeId, setPlaceId] = useState(initialPlaceId);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    setPlaceId(initialPlaceId);
  }, [initialPlaceId]);

  const isValid = /^[A-Za-z0-9_-]{10,200}$/.test(placeId.trim());

  const handleConnect = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const res = await connect({ data: { placeId: placeId.trim() } });
      if (res.ok) {
        setMsg({ kind: "ok", text: `Conectado. ${res.synced} avaliações sincronizadas.` });
        onConnected();
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Falha ao conectar." });
    } finally {
      setBusy(false);
    }
  };

  const handleSync = async () => {
    if (!businessId) return;
    setMsg(null);
    setBusy(true);
    try {
      const res = await sync({ data: { businessId } });
      setMsg({ kind: "ok", text: `${res.synced} avaliações sincronizadas.` });
      onConnected();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "Falha ao sincronizar." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-neutral-900 rounded-2xl border border-white/10 shadow-sm p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-[#facc15]" />
          <div>
            <h3 className="text-base font-bold text-white">Google Reviews</h3>
            <p className="text-xs text-neutral-400">
              Conecte seu Google Place ID para exibir avaliações reais no seu perfil.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-neutral-200 mb-1">Google Place ID</label>
        <input
          type="text"
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          placeholder="Ex: ChIJN1t_tDeuEmsRUsoyG83frY4"
          maxLength={200}
          className="w-full bg-neutral-950 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#facc15]"
        />
        <p className="text-xs text-neutral-400 mt-1">
          Encontre seu Place ID em{" "}
          <a
            href="https://developers.google.com/maps/documentation/places/web-service/place-id"
            target="_blank"
            rel="noreferrer"
            className="text-[#facc15] font-semibold hover:underline"
          >
            developers.google.com
          </a>
          .
        </p>
      </div>

      {msg && (
        <p className={`text-sm ${msg.kind === "ok" ? "text-emerald-700" : "text-red-600"}`}>
          {msg.text}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleConnect}
          disabled={busy || !isValid}
          className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-white/5 disabled:opacity-60 text-[#facc15] font-bold rounded-xl px-4 py-2 text-sm"
        >
          {busy ? "..." : initialPlaceId ? "Atualizar e sincronizar" : "Conectar"}
        </button>
        {initialPlaceId && businessId && (
          <button
            type="button"
            onClick={handleSync}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 disabled:opacity-60 text-neutral-100 font-bold rounded-xl px-4 py-2 text-sm"
          >
            <RefreshCw size={14} /> Sincronizar agora
          </button>
        )}
      </div>
    </div>
  );
}
