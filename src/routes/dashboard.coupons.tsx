import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Ticket, X, Power, Trash2, Pencil, Upload, ImagePlus, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useCurrentPlan } from "@/lib/dev-plan";
import { can } from "@/lib/plans";
import { useI18n } from "@/lib/i18n";
import { LockedFeatureCard } from "@/components/dashboard/LockedFeatureCard";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  getMyCoupons,
  createCoupon,
  updateCoupon,
  toggleCoupon,
  deleteCoupon,
  uploadCouponPromoImage,
  removeCouponPromoImage,
} from "@/lib/coupons.functions";

export const Route = createFileRoute("/dashboard/coupons")({
  component: CouponsPage,
});

type CouponRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discount_type: "percent" | "fixed" | null;
  discount_value: number | null;
  expires_at: string | null;
  is_active: boolean;
  promo_image_url: string | null;
  promo_image_path: string | null;
  created_at: string;
};

type FormState = {
  code: string;
  title: string;
  description: string;
  discountType: "percent" | "fixed";
  discountValue: string;
  expiresAt: string;
};

const emptyForm: FormState = {
  code: "",
  title: "",
  description: "",
  discountType: "percent",
  discountValue: "",
  expiresAt: "",
};

function fileToBase64(file: File): Promise<{ base64: string; ext: string; type: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",", 2)[1] : result;
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      resolve({ base64, ext, type: file.type });
    };
    reader.onerror = () => reject(reader.error ?? new Error("read error"));
    reader.readAsDataURL(file);
  });
}

function discountBadge(c: CouponRow) {
  if (!c.discount_value) return null;
  return c.discount_type === "percent"
    ? `${c.discount_value}% OFF`
    : `$${c.discount_value} OFF`;
}

function CouponsPage() {
  const { t } = useI18n();
  const [plan] = useCurrentPlan();
  const unlocked = can(plan, "coupons");

  const queryClient = useQueryClient();
  const fetchCoupons = useServerFn(getMyCoupons);
  const createCouponFn = useServerFn(createCoupon);
  const updateCouponFn = useServerFn(updateCoupon);
  const toggleCouponFn = useServerFn(toggleCoupon);
  const deleteCouponFn = useServerFn(deleteCoupon);
  const uploadPromoFn = useServerFn(uploadCouponPromoImage);
  const removePromoFn = useServerFn(removeCouponPromoImage);

  const { data } = useQuery({
    queryKey: ["my-coupons"],
    queryFn: () => fetchCoupons(),
    enabled: unlocked,
  });

  const coupons: CouponRow[] =
    data && (data as { ok?: boolean }).ok ? ((data as { coupons: CouponRow[] }).coupons ?? []) : [];

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editingCoupon = editingId ? coupons.find((c) => c.id === editingId) ?? null : null;

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFieldErrors({});
    setPendingImage(null);
    setImagePreview(null);
    setFormOpen(true);
  }

  function openEdit(c: CouponRow) {
    setEditingId(c.id);
    setForm({
      code: c.code,
      title: c.title,
      description: c.description ?? "",
      discountType: (c.discount_type as "percent" | "fixed") ?? "percent",
      discountValue: c.discount_value != null ? String(c.discount_value) : "",
      expiresAt: c.expires_at ?? "",
    });
    setFieldErrors({});
    setPendingImage(null);
    setImagePreview(c.promo_image_url ?? null);
    setFormOpen(true);
  }

  function closeModal() {
    setFormOpen(false);
    setEditingId(null);
    setPendingImage(null);
    setImagePreview(null);
    setFieldErrors({});
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    const code = form.code.trim();
    if (!/^[A-Za-z0-9_-]{3,30}$/.test(code)) errs.code = t("coupons.errors.code_required");
    if (!form.title.trim()) errs.title = t("coupons.errors.title_required");
    if (form.discountValue) {
      const v = Number(form.discountValue);
      if (!Number.isFinite(v) || v < 0) errs.discountValue = t("coupons.errors.value_invalid");
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function uploadImageFor(couponId: string) {
    if (!pendingImage) return;
    try {
      const { base64, ext, type } = await fileToBase64(pendingImage);
      const res = await uploadPromoFn({
        data: { couponId, contentBase64: base64, contentType: type, ext },
      });
      if (!(res as { ok?: boolean }).ok) {
        toast.error((res as { error?: string }).error ?? t("coupons.errors.generic"));
      } else {
        toast.success(t("coupons.errors.image_uploaded"));
      }
    } catch {
      toast.error(t("coupons.errors.generic"));
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code.trim(),
        title: form.title.trim(),
        description: form.description.trim() || null,
        discountType: form.discountValue ? form.discountType : null,
        discountValue: form.discountValue ? Number(form.discountValue) : null,
        expiresAt: form.expiresAt || null,
      };
      if (editingId) {
        const res = await updateCouponFn({ data: { couponId: editingId, ...payload } });
        if (!(res as { ok?: boolean }).ok) {
          throw new Error((res as { error?: string }).error ?? t("coupons.errors.generic"));
        }
        await uploadImageFor(editingId);
        return { id: editingId, created: false };
      } else {
        const res = await createCouponFn({ data: payload });
        const r = res as { ok?: boolean; couponId?: string; error?: string };
        if (!r.ok || !r.couponId) throw new Error(r.error ?? t("coupons.errors.generic"));
        await uploadImageFor(r.couponId);
        return { id: r.couponId, created: true };
      }
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["my-coupons"] });
      toast.success(res.created ? t("coupons.errors.created") : t("coupons.errors.saved"));
      closeModal();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : t("coupons.errors.generic")),
  });

  const toggleMutation = useMutation({
    mutationFn: (couponId: string) => toggleCouponFn({ data: { couponId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-coupons"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (couponId: string) => deleteCouponFn({ data: { couponId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-coupons"] }),
  });

  const removeImageMutation = useMutation({
    mutationFn: (couponId: string) => removePromoFn({ data: { couponId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-coupons"] });
      toast.success(t("coupons.errors.image_removed"));
    },
  });

  function onPickFile(file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5MB");
      return;
    }
    setPendingImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const selectedDate = form.expiresAt ? new Date(`${form.expiresAt}T00:00:00`) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">{t("coupons.title")}</h1>
          <p className="text-neutral-400 mt-1">{t("coupons.subtitle")}</p>
        </div>
        {unlocked && (
          <button
            onClick={openCreate}
            className="bg-[#facc15] hover:bg-[#fde047] text-neutral-900 font-bold rounded-xl px-4 py-2.5 text-sm flex items-center gap-2"
          >
            <Plus size={16} /> {t("coupons.new_button")}
          </button>
        )}
      </div>

      <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6">
        <h2 className="text-lg font-extrabold text-white mb-4">{t("coupons.active_title")}</h2>

        {unlocked ? (
          coupons.length === 0 ? (
            <p className="text-sm text-neutral-500 py-8 text-center">{t("coupons.none_yet")}</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {coupons.map((c) => (
                <CouponCard
                  key={c.id}
                  coupon={c}
                  onEdit={() => openEdit(c)}
                  onToggle={() => toggleMutation.mutate(c.id)}
                  onDelete={() => {
                    if (confirm(t("coupons.confirm_delete").replace("{code}", c.code))) {
                      deleteMutation.mutate(c.id);
                    }
                  }}
                  onRemoveImage={() => removeImageMutation.mutate(c.id)}
                />
              ))}
            </div>
          )
        ) : (
          <LockedFeatureCard
            title={t("coupons.locked_title")}
            description={t("coupons.locked_description")}
            requiredPlan="premium"
          />
        )}
      </div>

      {formOpen && unlocked && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={closeModal}
        >
          <div
            className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-lg my-8 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="font-extrabold text-white text-lg">
                {editingId ? t("coupons.edit_modal_title") : t("coupons.new_button")}
              </h3>
              <button
                onClick={closeModal}
                className="text-neutral-400 hover:text-white p-1"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (validate()) saveMutation.mutate();
              }}
              className="flex-1 overflow-y-auto p-5 space-y-5"
            >
              <Field label={t("coupons.code_label")} error={fieldErrors.code} hint={t("coupons.code_hint")}>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                  }
                  placeholder={t("coupons.code_placeholder")}
                  maxLength={30}
                  className={inputCls(!!fieldErrors.code)}
                />
              </Field>

              <Field label={t("coupons.title_label")} error={fieldErrors.title}>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder={t("coupons.title_placeholder")}
                  maxLength={100}
                  className={inputCls(!!fieldErrors.title)}
                />
              </Field>

              <Field label={t("coupons.description_label")}>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder={t("coupons.description_placeholder")}
                  maxLength={500}
                  className={cn(inputCls(false), "resize-none")}
                />
              </Field>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  {t("coupons.discount_section")}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("coupons.type_label")}>
                    <select
                      value={form.discountType}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          discountType: e.target.value as "percent" | "fixed",
                        }))
                      }
                      className={inputCls(false)}
                    >
                      <option value="percent">{t("coupons.type_percent")}</option>
                      <option value="fixed">{t("coupons.type_fixed")}</option>
                    </select>
                  </Field>
                  <Field label={t("coupons.value_label")} error={fieldErrors.discountValue}>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder={t("coupons.value_placeholder")}
                      value={form.discountValue}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, discountValue: e.target.value }))
                      }
                      className={inputCls(!!fieldErrors.discountValue)}
                    />
                  </Field>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  {t("coupons.validity_section")}
                </p>
                <Field label={t("coupons.expires_label")}>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          inputCls(false),
                          "text-left flex items-center gap-2 justify-between",
                        )}
                      >
                        <span className={form.expiresAt ? "text-white" : "text-neutral-500"}>
                          {form.expiresAt
                            ? format(selectedDate!, "PPP")
                            : t("coupons.expires_placeholder")}
                        </span>
                        <CalendarIcon size={16} className="text-neutral-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-neutral-900 border-white/10" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) =>
                          setForm((f) => ({
                            ...f,
                            expiresAt: d ? format(d, "yyyy-MM-dd") : "",
                          }))
                        }
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                      {form.expiresAt && (
                        <div className="p-2 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, expiresAt: "" }))}
                            className="w-full text-xs text-neutral-400 hover:text-white py-1.5 rounded-lg hover:bg-white/5"
                          >
                            {t("coupons.no_expiry")}
                          </button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </Field>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  {t("coupons.promo_section")}
                </p>
                <p className="text-xs text-neutral-400 mb-3">{t("coupons.promo_hint")}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                />
                {imagePreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-neutral-950">
                    <img src={imagePreview} alt="" className="w-full h-40 object-cover" />
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-neutral-900/90 hover:bg-neutral-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                      >
                        {t("coupons.promo_change_btn")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingImage(null);
                          setImagePreview(null);
                          if (editingCoupon?.promo_image_url) {
                            removeImageMutation.mutate(editingCoupon.id);
                          }
                        }}
                        className="bg-red-500/90 hover:bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                      >
                        {t("coupons.promo_remove_btn")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-white/10 rounded-2xl py-8 flex flex-col items-center gap-2 text-neutral-400 hover:text-white hover:border-[#facc15]/40 transition"
                  >
                    <ImagePlus size={24} />
                    <span className="text-sm font-semibold">{t("coupons.promo_upload_btn")}</span>
                  </button>
                )}
              </div>
            </form>

            <div className="p-5 border-t border-white/10 flex gap-3 justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-neutral-300 hover:bg-white/5"
              >
                {t("coupons.cancel_btn")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validate()) saveMutation.mutate();
                }}
                disabled={saveMutation.isPending}
                className="bg-[#facc15] hover:bg-[#fde047] disabled:opacity-50 text-neutral-900 font-bold rounded-xl px-5 py-2.5 text-sm flex items-center gap-2"
              >
                <Upload size={14} />
                {saveMutation.isPending
                  ? editingId
                    ? t("coupons.saving_label")
                    : t("coupons.creating_label")
                  : editingId
                    ? t("coupons.save_btn")
                    : t("coupons.create_btn")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function inputCls(invalid: boolean) {
  return cn(
    "w-full bg-neutral-950 border rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#facc15]/40 transition",
    invalid ? "border-red-500/60" : "border-white/10 focus:border-[#facc15]/40",
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-neutral-300 mb-1.5">{label}</span>
      {children}
      {error ? (
        <span className="block text-xs text-red-400 mt-1">{error}</span>
      ) : hint ? (
        <span className="block text-xs text-neutral-500 mt-1">{hint}</span>
      ) : null}
    </label>
  );
}

function CouponCard({
  coupon: c,
  onEdit,
  onToggle,
  onDelete,
  onRemoveImage,
}: {
  coupon: CouponRow;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onRemoveImage: () => void;
}) {
  const { t } = useI18n();
  const badge = discountBadge(c);
  return (
    <div
      className={cn(
        "relative rounded-2xl overflow-hidden border bg-gradient-to-br from-neutral-900 to-neutral-800 flex",
        c.is_active ? "border-white/10" : "border-white/5 opacity-60",
      )}
    >
      <div className="w-2 bg-[#facc15]" />
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Ticket className="text-[#facc15]" size={18} />
            {badge && (
              <span className="text-[11px] font-bold tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full px-2 py-0.5">
                {badge}
              </span>
            )}
            {!c.is_active && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/5 text-neutral-400 rounded-full px-2 py-0.5">
                inactive
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <IconBtn title={t("coupons.edit_label")} onClick={onEdit}>
              <Pencil size={14} />
            </IconBtn>
            <IconBtn
              title={c.is_active ? t("coupons.deactivate_label") : t("coupons.activate_label")}
              onClick={onToggle}
            >
              <Power size={14} />
            </IconBtn>
            <IconBtn title={t("coupons.remove_label")} onClick={onDelete} danger>
              <Trash2 size={14} />
            </IconBtn>
          </div>
        </div>

        <p className="font-extrabold tracking-wider text-2xl mt-3 text-[#facc15]">{c.code}</p>
        <p className="text-sm font-semibold text-white mt-1">{c.title}</p>
        {c.description && (
          <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{c.description}</p>
        )}
        {c.expires_at && (
          <p className="text-xs text-neutral-500 mt-2">
            {t("coupons.valid_until")} {c.expires_at}
          </p>
        )}

        {c.promo_image_url && (
          <div className="mt-3 relative group rounded-xl overflow-hidden border border-white/10">
            <img src={c.promo_image_url} alt="" className="w-full h-28 object-cover" />
            <button
              onClick={onRemoveImage}
              className="absolute top-1.5 right-1.5 bg-black/70 hover:bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition"
              title={t("coupons.promo_remove_btn")}
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded-lg text-neutral-400 hover:bg-white/5 transition",
        danger ? "hover:text-red-400" : "hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
