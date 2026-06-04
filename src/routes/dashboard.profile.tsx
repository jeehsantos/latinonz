import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  QrCode,
  Download,
  Plus,
  Trash2,
  Upload,
  Check,
  Lock,
  Sparkles,
  ShoppingBag,
  UtensilsCrossed,
  Bike,
  CalendarClock,
  Truck,
  Wrench,
  Heart,
  Gift,
  Star as StarIcon,
  Coffee,
  Package,
  Info,
  Globe,
  MapPin,
  Clock,
  Store,
  Phone,
  RefreshCw,
  Star,
  UploadCloud,
} from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { useI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import {
  getMyBusiness,
  updateMyBusiness,
  updateBusinessHours,
  updateBusinessBranches,
  updateServiceOptions,
  updateServiceOptionItems,
} from "@/lib/business.functions";
import { uploadLogo } from "@/lib/storage.functions";
import { connectGooglePlace, syncGoogleReviews } from "@/lib/reviews.functions";
import QRCode from "qrcode";
import { useCurrentPlan } from "@/lib/dev-plan";
import { can } from "@/lib/plans";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfileEditor,
});

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type TabId = "general" | "locations" | "features";

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

type Branch = {
  id: string; // local UI id
  name: string; // location label (city or custom)
  addressStreet: string;
  addressSuburb: string;
  phone: string;
  schedule: BranchSchedule;
};

const newBranch = (overrides: Partial<Branch> = {}): Branch => ({
  id: crypto.randomUUID(),
  name: overrides.name ?? "Auckland",
  addressStreet: overrides.addressStreet ?? "",
  addressSuburb: overrides.addressSuburb ?? "",
  phone: overrides.phone ?? "",
  schedule: overrides.schedule ?? cloneSchedule(DEFAULT_SCHEDULE),
});

function ProfileEditor() {
  const { t } = useI18n();
  const DAY_LABELS: Record<DayKey, string> = {
    mon: t("profile.day_mon"),
    tue: t("profile.day_tue"),
    wed: t("profile.day_wed"),
    thu: t("profile.day_thu"),
    fri: t("profile.day_fri"),
    sat: t("profile.day_sat"),
    sun: t("profile.day_sun"),
  };
  const fetchMyBusiness = useServerFn(getMyBusiness);
  const saveMyBusiness = useServerFn(updateMyBusiness);
  const saveHoursFn = useServerFn(updateBusinessHours);
  const saveBranchesFn = useServerFn(updateBusinessBranches);
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

  const [activeTab, setActiveTab] = useState<TabId>("general");

  // ---- General tab state ----
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryGroup, setCategoryGroup] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [keywords, setKeywords] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  // ---- Branches tab state ----
  const [branches, setBranches] = useState<Branch[]>([newBranch()]);
  const [expandedBranchId, setExpandedBranchId] = useState<string | null>(null);

  // ---- Features tab state ----
  type ServiceFlagKey = "takeaway" | "dinein" | "delivery" | "booking";
  const [serviceFlags, setServiceFlags] = useState<Record<ServiceFlagKey, boolean>>({
    takeaway: false,
    dinein: false,
    delivery: false,
    booking: false,
  });
  type CustomServiceItem = { title: string; description: string; icon_key: string };
  const [customServiceItems, setCustomServiceItems] = useState<CustomServiceItem[]>([]);

  // ---- Save state ----
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ---- QR ----
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [plan] = useCurrentPlan();
  const canUseQr = can(plan, "qrCode");
  const slug = loaded?.business?.slug ?? "";
  const qrUrl = slug ? `https://latinoconnecthub.co.nz/business/${slug}` : "";

  // ---- Seed form once loaded ----
  useEffect(() => {
    if (!loaded?.ok) return;

    if (loaded.business) {
      const b = loaded.business;
      setName(b.name ?? "");
      setDescription(b.description ?? "");
      if (b.macro_category) setCategory(b.macro_category);
      const loadedGroup = (b as { category_group?: string | null }).category_group;
      if (loadedGroup) setCategoryGroup(loadedGroup);
      setPhone(b.phone ?? "");
      setWebsite(b.website ?? "");
      setKeywords((b.keywords ?? []).join(", "));
      if (b.logo_url) setLogo(b.logo_url);

      // Build branches from locations + business_hours + business_branches
      const locs: string[] =
        b.locations && b.locations.length > 0 ? (b.locations as string[]) : ["Auckland"];

      const loadedHours = (loaded.hours ?? []) as unknown as {
        day_key: DayKey;
        is_closed: boolean;
        slots: { open: string; close: string }[];
        location: string;
      }[];
      const loadedBranches = (loaded.branches ?? []) as unknown as {
        location: string;
        address_street: string | null;
        address_suburb: string | null;
        phone: string | null;
      }[];

      const fallbackStreet =
        (b as { address_street?: string | null }).address_street ?? "";
      const fallbackSuburb =
        (b as { address_suburb?: string | null }).address_suburb ?? "";

      const built: Branch[] = locs.map((loc, idx) => {
        const sched = cloneSchedule(DEFAULT_SCHEDULE);
        const rowsForLoc = loadedHours.filter((h) => h.location === loc);
        if (rowsForLoc.length > 0) {
          for (const k of DAY_KEYS) sched[k] = { closed: true, slots: [] };
          for (const r of rowsForLoc) {
            sched[r.day_key] = {
              closed: !!r.is_closed,
              slots: Array.isArray(r.slots) ? r.slots : [],
            };
          }
        }
        const br = loadedBranches.find((x) => x.location === loc);
        return {
          id: crypto.randomUUID(),
          name: loc,
          addressStreet: br?.address_street ?? (idx === 0 ? fallbackStreet : ""),
          addressSuburb: br?.address_suburb ?? (idx === 0 ? fallbackSuburb : ""),
          phone: br?.phone ?? "",
          schedule: sched,
        };
      });
      setBranches(built);
      setExpandedBranchId(built[0]?.id ?? null);

      // Service options
      const so = loaded.serviceOptions as
        | { takeaway: boolean; dinein: boolean; delivery: boolean; booking: boolean }
        | null;
      if (so) {
        setServiceFlags({
          takeaway: !!so.takeaway,
          dinein: !!so.dinein,
          delivery: !!so.delivery,
          booking: !!so.booking,
        });
      }

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
      supabase.auth.getUser().then(({ data }) => {
        const meta = data.user?.user_metadata;
        if (meta) {
          setName((prev) => prev || meta.business_name || "");
          setPhone((prev) => prev || meta.whatsapp || "");
        }
      });
    }
  }, [loaded]);

  const { groups, categories: allCategories, getCategoryByKey } = useCategories();

  // Initialize group + category to sensible defaults.
  useEffect(() => {
    if (groups.length === 0) return;
    // If category set but group missing, derive group from category.
    if (category && !categoryGroup) {
      const found = getCategoryByKey(category);
      if (found) setCategoryGroup(found.group);
      return;
    }
    // If nothing set yet, default to first group + first category in it.
    if (!categoryGroup) {
      const firstGroup = groups[0].id;
      setCategoryGroup(firstGroup);
      const firstCat = allCategories.find((c) => c.group === firstGroup);
      if (firstCat && !category) setCategory(firstCat.key);
    }
  }, [groups, allCategories, category, categoryGroup, getCategoryByKey]);

  // When the user changes group, snap category to the first one in that group
  // if the current category does not belong to it.
  useEffect(() => {
    if (!categoryGroup) return;
    const current = getCategoryByKey(category);
    if (current && current.group === categoryGroup) return;
    const firstInGroup = allCategories.find((c) => c.group === categoryGroup);
    if (firstInGroup) setCategory(firstInGroup.key);
  }, [categoryGroup, allCategories, category, getCategoryByKey]);


  // ---- Branch mutators ----
  const updateBranch = (id: string, patch: Partial<Branch>) =>
    setBranches((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const updateBranchSchedule = (id: string, mutator: (s: BranchSchedule) => BranchSchedule) =>
    setBranches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, schedule: mutator(b.schedule) } : b)),
    );

  const addBranch = () => {
    const b = newBranch({ name: "" });
    setBranches((prev) => [...prev, b]);
    setExpandedBranchId(b.id);
  };

  const removeBranch = (id: string) => {
    setBranches((prev) => {
      const next = prev.filter((b) => b.id !== id);
      return next.length ? next : [newBranch()];
    });
    setExpandedBranchId((cur) => (cur === id ? null : cur));
  };

  const copyHoursFrom = (targetId: string, sourceId: string) => {
    const source = branches.find((b) => b.id === sourceId);
    if (!source) return;
    updateBranch(targetId, { schedule: cloneSchedule(source.schedule) });
  };

  const toggleDayClosed = (branchId: string, day: DayKey) =>
    updateBranchSchedule(branchId, (s) => {
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

  const updateSlot = (
    branchId: string,
    day: DayKey,
    field: "open" | "close",
    v: string,
  ) =>
    updateBranchSchedule(branchId, (s) => ({
      ...s,
      [day]: {
        ...s[day],
        slots: s[day].slots.length
          ? s[day].slots.map((sl, i) => (i === 0 ? { ...sl, [field]: v } : sl))
          : [{ open: field === "open" ? v : "09:00", close: field === "close" ? v : "18:00" }],
      },
    }));

  // ---- QR ----
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

  // ---- Save ----
  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);
    try {
      const cleanBranches = branches.filter((b) => b.name.trim().length > 0);
      const locations = cleanBranches.map((b) => b.name.trim());
      const primary = cleanBranches[0];

      const res = await saveMyBusiness({
        data: {
          name: name.trim() || undefined,
          description: description.trim(),
          macro_category: category,
          category_group: categoryGroup || null,
          phone: phone.trim() || null,
          website: website.trim() || null,
          locations,
          address_street: primary?.addressStreet.trim() || null,
          address_suburb: primary?.addressSuburb.trim() || null,
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
        } else {
          setSaveError(res.error || t("profile.save_error_generic"));
        }
        return;
      }

      // Persist branches (address + phone per location)
      await saveBranchesFn({
        data: {
          branches: cleanBranches.map((b) => ({
            location: b.name.trim(),
            address_street: b.addressStreet.trim() || null,
            address_suburb: b.addressSuburb.trim() || null,
            phone: b.phone.trim() || null,
          })),
        },
      });

      if (plan !== "starter") {
        const hoursPayload: {
          location: string;
          day_key: DayKey;
          is_closed: boolean;
          slots: { open: string; close: string }[];
        }[] = [];
        for (const br of cleanBranches) {
          for (const k of DAY_KEYS) {
            hoursPayload.push({
              location: br.name.trim(),
              day_key: k,
              is_closed: br.schedule[k].closed,
              slots: br.schedule[k].closed ? [] : br.schedule[k].slots,
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
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "general", label: t("profile.tab_general") },
    { id: "locations", label: t("profile.tab_locations") },
    { id: "features", label: t("profile.tab_features") },
  ];

  return (
    <div className="-m-6 lg:-m-10 min-h-screen bg-black text-zinc-300">
      {/* Sticky Header with Save */}
      <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 lg:px-10 py-5">
        <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white tracking-tight truncate">
              {t("profile.edit_title")}
            </h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              {t("profile.edit_subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {saveSuccess && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-400">
                <Check className="w-3.5 h-3.5" /> {t("profile.saved_label")}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-black px-5 sm:px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> {saving ? t("profile.saving_label") : t("profile.save_changes")}
            </button>
          </div>
        </div>
        {saveError && (
          <p className="text-sm text-red-400 mt-2 max-w-6xl mx-auto">{saveError}</p>
        )}
      </header>

      <div className="px-6 lg:px-10 py-8 max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-white/10 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-all relative whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-yellow-500"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-yellow-500 shadow-[0_-2px_10px_rgba(234,179,8,0.5)]" />
              )}
            </button>
          ))}
        </div>

        <div className="animate-in fade-in duration-300">
          {activeTab === "general" && (
            <GeneralTab
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
              category={category}
              setCategory={setCategory}
              phone={phone}
              setPhone={setPhone}
              website={website}
              setWebsite={setWebsite}
              keywords={keywords}
              setKeywords={setKeywords}
              logo={logo}
              logoRef={logoRef}
              logoUploading={logoUploading}
              logoError={logoError}
              onUploadLogo={handleLogoUpload}
              onRemoveLogo={() => setLogo(null)}
            />
          )}

          {activeTab === "locations" && (
            <LocationsTab
              branches={branches}
              expandedId={expandedBranchId}
              onExpand={(id) =>
                setExpandedBranchId((cur) => (cur === id ? null : id))
              }
              onAdd={addBranch}
              onRemove={removeBranch}
              onUpdate={updateBranch}
              onToggleDay={toggleDayClosed}
              onUpdateSlot={updateSlot}
              onCopyHours={copyHoursFrom}
              plan={plan}
              dayLabels={DAY_LABELS}
            />
          )}

          {activeTab === "features" && (
            <FeaturesTab
              plan={plan}
              flags={serviceFlags}
              onToggleFlag={(k) =>
                setServiceFlags((p) => ({ ...p, [k]: !p[k] }))
              }
              items={customServiceItems}
              onChangeItems={setCustomServiceItems}
              businessId={loaded?.ok ? (loaded.business?.id ?? null) : null}
              initialPlaceId={loaded?.ok ? (loaded.business?.google_place_id ?? "") : ""}
              onPlaceConnected={() => refetch()}
              qrDataUrl={qrDataUrl}
              qrError={qrError}
              generating={generating}
              canUseQr={canUseQr}
              qrUrl={qrUrl}
              onGenerateQr={handleGenerateQr}
              onDownloadQr={handleDownloadQr}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* General Tab                                                         */
/* ------------------------------------------------------------------ */

type GeneralTabProps = {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  website: string;
  setWebsite: (v: string) => void;
  keywords: string;
  setKeywords: (v: string) => void;
  logo: string | null;
  logoRef: React.RefObject<HTMLInputElement | null>;
  logoUploading: boolean;
  logoError: string | null;
  onUploadLogo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
};

function GeneralTab(p: GeneralTabProps) {
  const { t } = useI18n();
  const { groups, categories } = useCategories();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader icon={<Info className="w-5 h-5 text-yellow-500" />} title={t("profile.title")} />
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label={t("profile.business_name_asterisk")}>
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => p.setName(e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label={t("profile.category_asterisk")}>
                <div className="relative">
                  <select
                    value={p.category}
                    onChange={(e) => p.setCategory(e.target.value)}
                    className={`${inputCls} appearance-none pr-10`}
                  >
                    {groups.map((group) => {
                      const groupCats = categories.filter((c) => c.group === group.id);
                      if (groupCats.length === 0) return null;
                      return (
                        <optgroup key={group.id} label={group.label}>
                          {groupCats.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.label}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                  />
                </div>
              </Field>
            </div>

            <Field
              label={t("profile.description_asterisk")}
              right={<span className="text-xs text-zinc-600">{p.description.length}/500</span>}
            >
              <textarea
                rows={5}
                maxLength={500}
                value={p.description}
                onChange={(e) => p.setDescription(e.target.value)}
                className={`${inputCls} resize-none`}
              />
            </Field>

            <Field label={t("profile.keywords_label")} hint={t("profile.keywords_hint")}>
              <input
                type="text"
                value={p.keywords}
                onChange={(e) => p.setKeywords(e.target.value)}
                placeholder={t("profile.keywords_placeholder")}
                className={inputCls}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader icon={<Globe className="w-5 h-5 text-yellow-500" />} title={t("profile.contact_links_title")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label={t("profile.default_phone_label")}>
              <input
                type="text"
                placeholder="+64 21 000 0000"
                value={p.phone}
                onChange={(e) => p.setPhone(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label={t("profile.website_label")}>
              <input
                type="url"
                placeholder="https://yoursite.co.nz"
                value={p.website}
                onChange={(e) => p.setWebsite(e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <h3 className="text-sm font-medium text-white mb-4">{t("profile.logo_card_title")}</h3>
          <div
            onClick={() => p.logoRef.current?.click()}
            className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all cursor-pointer"
          >
            <div className="w-24 h-24 rounded-full bg-zinc-800 border-4 border-[#111] overflow-hidden mb-4 shadow-lg relative group">
              {p.logo ? (
                <img src={p.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                  <Upload size={24} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <UploadCloud className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-white font-medium mb-1">
              {p.logoUploading ? t("profile.logo_uploading") : t("profile.logo_click_drag")}
            </p>
            <p className="text-xs text-zinc-500">{t("profile.logo_hint_size")}</p>
            <input
              ref={p.logoRef}
              type="file"
              accept="image/*"
              onChange={p.onUploadLogo}
              className="hidden"
            />
          </div>
          {p.logoError && <p className="text-xs text-red-400 mt-2 text-center">{p.logoError}</p>}
          {p.logo && (
            <button
              onClick={p.onRemoveLogo}
              className="mt-3 w-full text-xs text-zinc-400 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5"
            >
              <Trash2 size={12} /> {t("profile.logo_remove_btn")}
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Locations Tab                                                       */
/* ------------------------------------------------------------------ */

type LocationsTabProps = {
  branches: Branch[];
  expandedId: string | null;
  onExpand: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Branch>) => void;
  onToggleDay: (id: string, day: DayKey) => void;
  onUpdateSlot: (id: string, day: DayKey, field: "open" | "close", v: string) => void;
  onCopyHours: (targetId: string, sourceId: string) => void;
  plan: string;
  dayLabels: Record<DayKey, string>;
};

function LocationsTab(p: LocationsTabProps) {
  const { t } = useI18n();
  const hoursLocked = p.plan === "starter";
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between mb-2 gap-4">
        <div>
          <h2 className="text-lg font-medium text-white">{t("profile.manage_branches_title")}</h2>
          <p className="text-sm text-zinc-400">
            {t("profile.manage_branches_subtitle")}
          </p>
        </div>
        <button
          onClick={p.onAdd}
          className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-white/5 shrink-0"
        >
          <Plus className="w-4 h-4" /> {t("profile.add_branch_btn")}
        </button>
      </div>

      {hoursLocked && (
        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4 flex items-start gap-3">
          <Lock className="w-4 h-4 text-yellow-500 mt-0.5" />
          <div className="text-sm">
            <p className="text-white font-medium">{t("profile.hours_premium_title")}</p>
            <p className="text-zinc-400 text-xs mt-1">
              {t("profile.hours_premium_body")}{" "}
              <Link to="/dashboard/upgrade" className="text-yellow-500 hover:underline font-medium">
                {t("profile.hours_premium_link")}
              </Link>
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {p.branches.map((branch, index) => {
          const expanded = p.expandedId === branch.id;
          return (
            <div
              key={branch.id}
              className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl"
            >
              <button
                type="button"
                onClick={() => p.onExpand(branch.id)}
                className="w-full p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors text-left"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                      expanded ? "bg-yellow-500 text-black" : "bg-white/5 text-zinc-400"
                    }`}
                  >
                    <Store className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-medium text-lg truncate">
                      {branch.name || t("profile.untitled_branch")}
                    </h3>
                    <p className="text-sm text-zinc-500 truncate max-w-md">
                      {[branch.addressStreet, branch.addressSuburb].filter(Boolean).join(", ") ||
                        t("profile.no_address_set")}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-zinc-500 transition-transform duration-300 shrink-0 ml-3 ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expanded && (
                <div className="border-t border-white/10 p-6 bg-[#0c0c0c]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-5">
                      <SectionLabel
                        icon={<MapPin className="w-4 h-4" />}
                        text={t("profile.location_details_label")}
                      />

                      <Field label={t("profile.branch_name_label")}>
                        <input
                          type="text"
                          value={branch.name}
                          onChange={(e) => p.onUpdate(branch.id, { name: e.target.value })}
                          placeholder="e.g. Auckland CBD"
                          className={inputCls}
                        />
                      </Field>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label={t("profile.street_label")}>
                          <input
                            type="text"
                            value={branch.addressStreet}
                            onChange={(e) =>
                              p.onUpdate(branch.id, { addressStreet: e.target.value })
                            }
                            placeholder="123 Queen St"
                            className={inputCls}
                          />
                        </Field>
                        <Field label={t("profile.suburb_label")}>
                          <input
                            type="text"
                            value={branch.addressSuburb}
                            onChange={(e) =>
                              p.onUpdate(branch.id, { addressSuburb: e.target.value })
                            }
                            placeholder="Auckland Central"
                            className={inputCls}
                          />
                        </Field>
                      </div>

                      <Field label={t("profile.branch_phone_label")}>
                        <div className="relative">
                          <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input
                            type="text"
                            value={branch.phone}
                            onChange={(e) => p.onUpdate(branch.id, { phone: e.target.value })}
                            placeholder="+64 22 000 0000"
                            className={`${inputCls} pl-11`}
                          />
                        </div>
                      </Field>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <SectionLabel
                          icon={<Clock className="w-4 h-4" />}
                          text={t("profile.operating_hours_label")}
                        />
                        {index > 0 && p.branches[0] && (
                          <button
                            type="button"
                            onClick={() => p.onCopyHours(branch.id, p.branches[0].id)}
                            className="text-[11px] text-zinc-400 hover:text-yellow-500 underline decoration-zinc-700 underline-offset-2 transition-colors"
                          >
                            {t("profile.copy_from_branch")} {p.branches[0].name || t("profile.untitled_branch")}
                          </button>
                        )}
                      </div>

                      {hoursLocked ? (
                        <div className="rounded-xl border border-white/10 bg-black/40 p-5 text-center">
                          <Lock className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
                          <p className="text-sm text-zinc-300 font-medium">
                            {t("profile.hours_locked_title")}
                          </p>
                          <Link
                            to="/dashboard/upgrade"
                            className="inline-block mt-3 text-xs text-yellow-500 hover:underline font-medium"
                          >
                            {t("profile.hours_locked_link")}
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {DAY_KEYS.map((key) => {
                            const day = branch.schedule[key];
                            const slot = day.slots[0] ?? { open: "09:00", close: "18:00" };
                            return (
                              <div
                                key={key}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                              >
                                <div className="w-28 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => p.onToggleDay(branch.id, key)}
                                    className={`w-8 h-4 rounded-full relative transition-colors shrink-0 ${
                                      !day.closed ? "bg-yellow-500" : "bg-zinc-700"
                                    }`}
                                  >
                                    <div
                                      className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-transform ${
                                        !day.closed ? "translate-x-4" : "translate-x-0.5"
                                      }`}
                                    />
                                  </button>
                                  <span
                                    className={`text-sm ${
                                      !day.closed ? "text-zinc-200" : "text-zinc-500"
                                    }`}
                                  >
                                    {p.dayLabels[key]}
                                  </span>
                                </div>

                                {!day.closed ? (
                                  <div className="flex flex-1 items-center gap-2">
                                    <input
                                      type="time"
                                      value={slot.open}
                                      onChange={(e) =>
                                        p.onUpdateSlot(branch.id, key, "open", e.target.value)
                                      }
                                      className="bg-[#111] border border-white/10 rounded text-sm text-white px-2 py-1 focus:border-yellow-500 focus:outline-none w-24"
                                    />
                                    <span className="text-zinc-600">{t("profile.time_separator")}</span>
                                    <input
                                      type="time"
                                      value={slot.close}
                                      onChange={(e) =>
                                        p.onUpdateSlot(branch.id, key, "close", e.target.value)
                                      }
                                      className="bg-[#111] border border-white/10 rounded text-sm text-white px-2 py-1 focus:border-yellow-500 focus:outline-none w-24"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex-1">
                                    <span className="text-xs font-medium px-2 py-1 rounded bg-red-500/10 text-red-400">
                                      {t("profile.day_closed_label")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => p.onRemove(branch.id)}
                      className="text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> {t("profile.remove_branch_btn")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Features Tab                                                        */
/* ------------------------------------------------------------------ */

type ServiceFlagKey = "takeaway" | "dinein" | "delivery" | "booking";

type FeaturesTabProps = {
  plan: string;
  flags: Record<ServiceFlagKey, boolean>;
  onToggleFlag: (k: ServiceFlagKey) => void;
  items: { title: string; description: string; icon_key: string }[];
  onChangeItems: (items: { title: string; description: string; icon_key: string }[]) => void;
  businessId: string | null;
  initialPlaceId: string;
  onPlaceConnected: () => void;
  qrDataUrl: string | null;
  qrError: string | null;
  generating: boolean;
  canUseQr: boolean;
  qrUrl: string;
  onGenerateQr: () => void;
  onDownloadQr: () => void;
};

function FeaturesTab(p: FeaturesTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <ServiceOptionsCard
          plan={p.plan}
          flags={p.flags}
          onToggleFlag={p.onToggleFlag}
          items={p.items}
          onChangeItems={p.onChangeItems}
        />
        {p.plan !== "starter" && (
          <GoogleReviewsCard
            businessId={p.businessId}
            initialPlaceId={p.initialPlaceId}
            onConnected={p.onPlaceConnected}
          />
        )}
      </div>

      <div className="space-y-6">
        <QrCard
          qrDataUrl={p.qrDataUrl}
          qrError={p.qrError}
          generating={p.generating}
          canUseQr={p.canUseQr}
          qrUrl={p.qrUrl}
          onGenerate={p.onGenerateQr}
          onDownload={p.onDownloadQr}
        />
      </div>
    </div>
  );
}

/* ------- Service options ------- */

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

const SERVICE_OPTIONS: {
  key: ServiceFlagKey;
  labelKey: TranslationKey;
  hintKey: TranslationKey;
}[] = [
  { key: "takeaway", labelKey: "service_options.takeaway_label", hintKey: "service_options.takeaway_hint" },
  { key: "dinein", labelKey: "service_options.dinein_label", hintKey: "service_options.dinein_hint" },
  { key: "delivery", labelKey: "service_options.delivery_label", hintKey: "service_options.delivery_hint" },
  { key: "booking", labelKey: "service_options.booking_label", hintKey: "service_options.booking_hint" },
];

function ServiceOptionsCard({
  plan,
  flags,
  onToggleFlag,
  items,
  onChangeItems,
}: {
  plan: string;
  flags: Record<ServiceFlagKey, boolean>;
  onToggleFlag: (k: ServiceFlagKey) => void;
  items: { title: string; description: string; icon_key: string }[];
  onChangeItems: (items: { title: string; description: string; icon_key: string }[]) => void;
}) {
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
    <Card>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" /> {t("profile.service_options_card_title")}
        </h3>
        <span className="text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r from-yellow-600 to-yellow-400 text-black px-2 py-0.5 rounded">
          Premium
        </span>
      </div>

      {!isPaid ? (
        <div className="rounded-xl border-2 border-dashed border-white/10 bg-black/40 p-6 text-center">
          <div className="w-11 h-11 mx-auto rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
            <Lock size={18} />
          </div>
          <p className="mt-3 text-sm font-medium text-white">{t("profile.service_options_premium_notice")}</p>
          <Link
            to="/dashboard/upgrade"
            className="inline-block mt-3 text-xs text-yellow-500 hover:underline font-medium"
          >
            {t("profile.service_options_upgrade_link")}
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {SERVICE_OPTIONS.map((opt) => {
              const active = flags[opt.key];
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onToggleFlag(opt.key)}
                  className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                    active
                      ? "bg-yellow-500/10 border-yellow-500/50"
                      : "bg-[#111] border-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`font-medium ${
                        active ? "text-yellow-500" : "text-zinc-300"
                      }`}
                    >
                      {t(opt.labelKey)}
                    </span>
                    {active && <Check className="w-4 h-4 text-yellow-500" />}
                  </div>
                  <span className="text-xs text-zinc-500">{t(opt.hintKey)}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-zinc-300">{t("profile.custom_options_label")}</label>
              <button
                type="button"
                onClick={addItem}
                disabled={items.length > 0 && !items[items.length - 1].title.trim()}
                className="text-sm text-yellow-500 hover:text-yellow-400 font-medium flex items-center gap-1 transition-colors disabled:opacity-40"
              >
                <Plus className="w-4 h-4" /> {t("profile.add_custom_option_btn")}
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => {
                const Icon = getServiceIcon(it.icon_key);
                return (
                  <div key={idx} className="rounded-xl border border-white/10 p-3 bg-black/40 space-y-2">
                    <div className="flex items-start gap-3">
                      <span className="flex items-center justify-center h-10 w-10 rounded-lg bg-yellow-500/10 text-yellow-500 shrink-0">
                        <Icon size={18} />
                      </span>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={it.title}
                          onChange={(e) => updateItem(idx, { title: e.target.value })}
                          placeholder={t("profile.custom_title_placeholder")}
                          maxLength={80}
                          className={`${inputCls} py-2 text-sm`}
                        />
                        <input
                          type="text"
                          value={it.description}
                          onChange={(e) => updateItem(idx, { description: e.target.value })}
                          placeholder={t("profile.custom_description_placeholder")}
                          maxLength={200}
                          className={`${inputCls} py-2 text-sm`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-zinc-500 hover:text-red-500 mt-2"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {CUSTOM_ICONS.map(({ key, icon: I }) => {
                        const a = it.icon_key === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => updateItem(idx, { icon_key: key })}
                            className={`flex items-center justify-center h-8 w-8 rounded-lg border transition-colors ${
                              a
                                ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                                : "border-white/10 text-zinc-500 hover:border-white/30"
                            }`}
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
    </Card>
  );
}

/* ------- Google reviews ------- */

function GoogleReviewsCard({
  businessId,
  initialPlaceId,
  onConnected,
}: {
  businessId: string | null;
  initialPlaceId: string;
  onConnected: () => void;
}) {
  const { t } = useI18n();
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
        setMsg({ kind: "ok", text: t("profile.google_connected_msg").replace("{n}", String(res.synced)) });
        onConnected();
      } else {
        setMsg({ kind: "err", text: res.error });
      }
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : t("profile.google_failed_msg") });
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
      setMsg({ kind: "ok", text: t("profile.google_synced_msg").replace("{n}", String(res.synced)) });
      onConnected();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : t("profile.google_sync_failed_msg") });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <h3 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
        <Globe className="w-5 h-5 text-yellow-500" /> {t("profile.google_reviews_title")}
      </h3>
      <p className="text-sm text-zinc-400 mb-4">
        {t("profile.google_reviews_subtitle")}
      </p>

      <div className="flex gap-3">
        <input
          type="text"
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          placeholder="ChIJN1t..."
          maxLength={200}
          className={`${inputCls} flex-1`}
        />
        <button
          onClick={handleConnect}
          disabled={busy || !isValid}
          className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border border-white/5"
        >
          {busy ? "…" : initialPlaceId ? t("profile.google_reviews_update_btn") : t("profile.google_reviews_verify_btn")}
        </button>
        {initialPlaceId && businessId && (
          <button
            onClick={handleSync}
            disabled={busy}
            className="bg-white/5 hover:bg-white/10 text-zinc-200 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border border-white/5"
            title="Sync now"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>
      {msg && (
        <p className={`text-xs mt-3 ${msg.kind === "ok" ? "text-emerald-400" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}
      <p className="text-xs text-zinc-500 mt-3">
        {t("profile.google_reviews_place_id_hint")}{" "}
        <a
          href="https://developers.google.com/maps/documentation/places/web-service/place-id"
          target="_blank"
          rel="noreferrer"
          className="text-yellow-500 hover:underline"
        >
          developers.google.com
        </a>
        .
      </p>
    </Card>
  );
}

/* ------- QR card ------- */

function QrCard({
  qrDataUrl,
  qrError,
  generating,
  canUseQr,
  qrUrl,
  onGenerate,
  onDownload,
}: {
  qrDataUrl: string | null;
  qrError: string | null;
  generating: boolean;
  canUseQr: boolean;
  qrUrl: string;
  onGenerate: () => void;
  onDownload: () => void;
}) {
  const { t } = useI18n();
  return (
    <Card className="flex flex-col items-center text-center">
      <h3 className="text-lg font-medium text-white w-full text-left mb-6 flex items-center gap-2">
        <QrCode className="w-5 h-5 text-yellow-500" /> {t("profile.qr_card_title")}
      </h3>

      <div className="w-48 h-48 bg-white rounded-2xl p-2 mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)] flex items-center justify-center">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="QR Code" className="w-full h-full rounded-xl" />
        ) : !canUseQr ? (
          <span className="text-xs text-zinc-500 inline-flex items-center gap-1">
            <Lock size={12} /> {t("profile.qr_premium_label")}
          </span>
        ) : (
          <span className="text-xs text-zinc-500">
            {generating ? t("profile.qr_generating_label") : t("profile.qr_click_generate")}
          </span>
        )}
      </div>

      {!canUseQr ? (
        <Link
          to="/dashboard/upgrade"
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(234,179,8,0.15)] mb-3 inline-flex items-center gap-2"
        >
          <Sparkles size={14} /> {t("profile.qr_upgrade_btn")}
        </Link>
      ) : !qrDataUrl ? (
        <button
          onClick={onGenerate}
          disabled={generating || !qrUrl}
          className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(234,179,8,0.15)] mb-3"
        >
          {generating ? t("profile.qr_generating_label") : t("profile.qr_generate_btn")}
        </button>
      ) : (
        <button
          onClick={onDownload}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-[0_0_20px_rgba(234,179,8,0.15)] mb-3 inline-flex items-center gap-2"
        >
          <Download size={14} /> {t("profile.qr_download_btn")}
        </button>
      )}
      {qrError && <p className="text-xs text-red-400 mb-2">{qrError}</p>}
      {qrUrl && (
        <p className="text-xs text-zinc-500 break-all max-w-[250px]">{qrUrl}</p>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Shared UI primitives                                                */
/* ------------------------------------------------------------------ */

const inputCls =
  "w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 transition-all placeholder:text-zinc-600";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 shadow-xl ${className}`}
    >
      {children}
    </div>
  );
}

function CardHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
      {icon} {title}
    </h3>
  );
}

function Field({
  label,
  hint,
  right,
  children,
}: {
  label: string;
  hint?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <label className="text-sm font-medium text-zinc-400">{label}</label>
        {right}
      </div>
      {children}
      {hint && <p className="text-xs text-zinc-500 mt-2">{hint}</p>}
    </div>
  );
}

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <h4 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-2 flex items-center gap-2">
      {icon} {text}
    </h4>
  );
}
