import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
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
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { CATEGORIES, NZ_CITIES } from "@/lib/mock/categories";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfileEditor,
});

type BusinessType = "Serviço" | "Produto";
type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: "mon", label: "Segunda-feira", short: "SEG" },
  { key: "tue", label: "Terça-feira", short: "TER" },
  { key: "wed", label: "Quarta-feira", short: "QUA" },
  { key: "thu", label: "Quinta-feira", short: "QUI" },
  { key: "fri", label: "Sexta-feira", short: "SEX" },
  { key: "sat", label: "Sábado", short: "SÁB" },
  { key: "sun", label: "Domingo", short: "DOM" },
];

type DaySchedule = {
  closed: boolean;
  slots: { open: string; close: string }[];
};
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

const cloneSchedule = (s: BranchSchedule): BranchSchedule =>
  JSON.parse(JSON.stringify(s));

function ProfileEditor() {
  const [businessType, setBusinessType] = useState<BusinessType>("Serviço");
  const [cities, setCities] = useState<string[]>(["Auckland"]);
  const [citiesOpen, setCitiesOpen] = useState(false);
  const [schedules, setSchedules] = useState<Record<string, BranchSchedule>>({
    Auckland: DEFAULT_SCHEDULE,
  });
  const [activeBranch, setActiveBranch] = useState<string>("Auckland");
  const [qrGenerated, setQrGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const plan: "Básico" | "Premium" = "Premium";
  const activeCategories = CATEGORIES.map((c) => c.name);

  const branchSchedule =
    schedules[activeBranch] ?? DEFAULT_SCHEDULE;

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
      if (exists && activeBranch === city) {
        setActiveBranch(next[0] ?? "");
      }
      if (!exists && next.length === 1) {
        setActiveBranch(city);
      }
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
      [day]: {
        closed: false,
        slots: [...s[day].slots, { open: "14:00", close: "18:00" }],
      },
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

  const handleGenerateQr = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setQrGenerated(true);
    }, 700);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogo(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const multiBranch = cities.length > 1;
  const citiesLabel = useMemo(() => {
    if (!cities.length) return "Selecione as cidades";
    if (cities.length <= 2) return cities.join(", ");
    return `${cities.slice(0, 2).join(", ")} +${cities.length - 2}`;
  }, [cities]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">
          Informações Básicas
        </h3>

        {/* Descrição em destaque, no topo */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="block text-sm font-bold text-gray-700">
              Descrição Completa do Negócio
            </label>
            <span className="text-xs text-gray-400">240/500</span>
          </div>
          <textarea
            rows={4}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#1A5336] resize-none"
            defaultValue="Autêntica comida mexicana com ingredientes frescos locais. Servindo a comunidade com os melhores tacos e burritos."
          />
          <p className="text-xs text-gray-500 mt-1">
            Esta descrição aparece em destaque na página do seu negócio.
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            O que você oferece?
          </label>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setBusinessType("Serviço")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${businessType === "Serviço" ? "bg-white text-[#1A5336] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Serviços
            </button>
            <button
              onClick={() => setBusinessType("Produto")}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${businessType === "Produto" ? "bg-white text-[#1A5336] shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              Produtos
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Negócio</label>
          <input
            type="text"
            defaultValue="Tacos do Chef"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#1A5336] focus:ring-1 focus:ring-[#1A5336]"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Categoria Principal</label>
          <div className="relative">
            <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#1A5336] appearance-none">
              {activeCategories.map((c, i) => (
                <option key={i}>{c}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">Telefone / WhatsApp</label>
          <input
            type="text"
            placeholder="Ex: 021 000 0000"
            defaultValue="021 999 8888"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#1A5336]"
          />
        </div>

        {/* Multi-select Cidades */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Cidades de Atendimento
            <span className="font-normal text-gray-400"> (múltipla seleção)</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setCitiesOpen((o) => !o)}
              className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-left text-gray-900 outline-none focus:border-[#1A5336]"
            >
              <span className="truncate">{citiesLabel}</span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${citiesOpen ? "rotate-180" : ""}`} />
            </button>

            {citiesOpen && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg p-2 max-h-72 overflow-y-auto">
                {NZ_CITIES.map((c) => {
                  const checked = cities.includes(c);
                  return (
                    <button
                      type="button"
                      key={c}
                      onClick={() => toggleCity(c)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 text-left"
                    >
                      <span
                        className={`h-4 w-4 rounded border flex items-center justify-center ${checked ? "bg-[#1A5336] border-[#1A5336]" : "border-gray-300"}`}
                      >
                        {checked && <Check size={12} className="text-white" />}
                      </span>
                      <span className="text-sm text-gray-700">{c}</span>
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
                  className="inline-flex items-center gap-1 bg-emerald-50 text-[#1A5336] text-xs font-semibold px-2.5 py-1 rounded-full"
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
          <label className="block text-sm font-bold text-gray-700 mb-1">
            Palavras-chave (Hashtags)
          </label>
          <input
            type="text"
            placeholder="Ex: #tacos #comidamexicana #auckland"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#1A5336]"
          />
          <p className="text-xs text-gray-500 mt-1">
            Ajuda os clientes a encontrarem seu negócio mais rápido nas buscas.
          </p>
        </div>

        {/* Horário de Funcionamento — redesenhado */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[#1A5336]" />
              <label className="block text-sm font-bold text-gray-700">
                Horário de Funcionamento
              </label>
            </div>
            {plan === "Básico" && (
              <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold">
                Upgrade para horários avançados
              </span>
            )}
          </div>

          {/* Branch tabs (only when multiple cities) */}
          {multiBranch && (
            <div className="mb-4">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <p className="text-xs text-gray-500">
                  Configure horários distintos para cada filial:
                </p>
                <button
                  type="button"
                  onClick={copyScheduleToAll}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A5336] hover:underline"
                >
                  <Copy size={12} /> Aplicar a todas as filiais
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100 rounded-xl">
                {cities.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setActiveBranch(c)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      activeBranch === c
                        ? "bg-white text-[#1A5336] shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {DAYS.map(({ key, label, short }) => {
              const day = branchSchedule[key];
              return (
                <div
                  key={key}
                  className={`flex flex-col md:flex-row md:items-center gap-3 md:gap-4 px-4 py-3 transition-colors ${
                    day.closed ? "bg-gray-50" : "bg-white hover:bg-gray-50/60"
                  }`}
                >
                  <div className="flex items-center gap-3 md:w-44">
                    <span
                      className={`flex items-center justify-center h-9 w-9 rounded-lg text-[11px] font-bold ${
                        day.closed
                          ? "bg-gray-200 text-gray-500"
                          : "bg-emerald-50 text-[#1A5336]"
                      }`}
                    >
                      {short}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                  </div>

                  <div className="flex-1 flex flex-wrap items-center gap-2">
                    {day.closed ? (
                      <span className="inline-flex items-center text-xs font-bold text-red-700 bg-red-50 border border-red-100 rounded-md px-2.5 py-1.5">
                        FECHADO
                      </span>
                    ) : (
                      <>
                        {day.slots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1"
                          >
                            <input
                              type="time"
                              value={slot.open}
                              onChange={(e) => updateSlot(key, idx, "open", e.target.value)}
                              className="bg-transparent text-sm text-gray-900 outline-none w-[88px]"
                            />
                            <span className="text-gray-400 text-xs">às</span>
                            <input
                              type="time"
                              value={slot.close}
                              onChange={(e) => updateSlot(key, idx, "close", e.target.value)}
                              className="bg-transparent text-sm text-gray-900 outline-none w-[88px]"
                            />
                            {day.slots.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSlot(key, idx)}
                                className="text-gray-400 hover:text-red-600 ml-1"
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
                          className="inline-flex items-center gap-1 text-[#1A5336] hover:bg-emerald-50 text-xs font-bold px-2 py-1.5 rounded-md transition-colors"
                        >
                          <Plus size={12} /> Adicionar
                        </button>
                      </>
                    )}
                  </div>

                  {/* Switch */}
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs font-semibold text-gray-500">
                      {day.closed ? "Fechado" : "Aberto"}
                    </span>
                    <span className="relative">
                      <input
                        type="checkbox"
                        checked={!day.closed}
                        onChange={() => toggleClosed(key)}
                        className="sr-only peer"
                      />
                      <span className="block h-5 w-9 bg-gray-300 peer-checked:bg-[#1A5336] rounded-full transition-colors" />
                      <span className="absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                    </span>
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <ServiceOptionsSection plan={plan} />

        <button className="bg-[#1A5336] hover:bg-[#123F27] text-white font-bold rounded-xl px-6 py-2.5 text-sm">
          Salvar alterações
        </button>
      </div>

      <div className="w-full lg:w-80 space-y-6">
        {/* Logo upload */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-1">Logo do Negócio</h3>
          <p className="text-xs text-gray-500 mb-4">
            Será exibido nos resultados do diretório.
          </p>

          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center mb-3">
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
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1A5336] hover:bg-[#123F27] text-white font-bold py-2 rounded-xl text-sm transition-colors"
              >
                <Upload size={14} /> {logo ? "Trocar" : "Carregar"}
              </button>
              {logo && (
                <button
                  onClick={() => setLogo(null)}
                  className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 rounded-xl text-sm transition-colors"
                  aria-label="Remover logo"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-2 text-center">
              PNG ou JPG, quadrado (mín. 400x400).
            </p>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col items-center text-center">
          <h3 className="font-bold text-gray-900 mb-4 w-full text-left">Seu QR Code</h3>

          <div className="w-32 h-32 bg-gray-50 border border-gray-200 rounded-xl p-2 mb-4 flex items-center justify-center">
            {qrGenerated ? (
              <QrCode size={100} className="text-gray-800" strokeWidth={1} />
            ) : (
              <span className="text-xs text-gray-400 px-2">
                {generating ? "Gerando..." : "QR Code ainda não gerado"}
              </span>
            )}
          </div>

          {!qrGenerated ? (
            <button
              onClick={handleGenerateQr}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 bg-[#1A5336] hover:bg-[#123F27] disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {generating ? "Gerando..." : "Gerar QR Code"}
            </button>
          ) : (
            <button className="w-full flex items-center justify-center gap-2 bg-[#0B2C1A] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-[#1A5336] transition-colors">
              <Download size={16} /> Baixar
            </button>
          )}
        </div>
      </div>
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

function ServiceOptionsSection({ plan }: { plan: "Básico" | "Premium" }) {
  const [enabled, setEnabled] = useState<Record<ServiceOptionKey, boolean>>({
    takeaway: true,
    dinein: true,
    delivery: false,
    booking: false,
  });
  const [extra, setExtra] = useState("");
  const isPaid = plan !== "Básico";

  const toggle = (k: ServiceOptionKey) =>
    setEnabled((p) => ({ ...p, [k]: !p[k] }));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-[#1A5336]" />
          <div>
            <h3 className="text-base font-bold text-gray-900">Opções de Atendimento</h3>
            <p className="text-xs text-gray-500">
              Aparecem em destaque na sua página pública para os clientes.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-800 uppercase tracking-wide">
          <Sparkles size={11} /> Premium
        </span>
      </div>

      {!isPaid ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 p-6 text-center">
          <div className="w-11 h-11 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Lock size={18} />
          </div>
          <p className="mt-3 text-sm font-bold text-gray-900">
            Disponível no plano Premium
          </p>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Mostre para seus clientes se você atende com take away, dine in,
            delivery ou aceita reservas antecipadas.
          </p>
          <Link
            to="/dashboard/upgrade"
            className="inline-flex mt-4 bg-[#1A5336] hover:bg-[#123F27] text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            Fazer upgrade
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SERVICE_OPTIONS.map(({ key, label, hint, icon: Icon }) => {
              const on = enabled[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                    on
                      ? "border-[#1A5336] bg-emerald-50/60"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center h-10 w-10 rounded-lg ${
                      on ? "bg-[#1A5336] text-white" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <Icon size={18} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-bold text-gray-900">
                      {label}
                    </span>
                    <span className="block text-xs text-gray-500">{hint}</span>
                  </span>
                  <span className="relative">
                    <span
                      className={`block h-5 w-9 rounded-full transition-colors ${
                        on ? "bg-[#1A5336]" : "bg-gray-300"
                      }`}
                    />
                    <span
                      className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full shadow transition-transform ${
                        on ? "translate-x-4" : ""
                      }`}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Outra opção de atendimento
              <span className="font-normal text-gray-400"> (opcional)</span>
            </label>
            <input
              type="text"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="Ex: Catering, Drive-thru, Atendimento a domicílio…"
              maxLength={60}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#1A5336]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use este campo caso seu modelo de atendimento não esteja nas opções acima.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
