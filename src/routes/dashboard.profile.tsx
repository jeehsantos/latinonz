import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, QrCode, Download, Plus, Trash2 } from "lucide-react";
import { CATEGORIES, NZ_CITIES } from "@/lib/mock/categories";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfileEditor,
});

type BusinessType = "Serviço" | "Produto";
type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const DAYS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

type DaySchedule = {
  closed: boolean;
  slots: { open: string; close: string }[];
};

const DEFAULT_SCHEDULE: Record<DayKey, DaySchedule> = {
  mon: { closed: false, slots: [{ open: "09:00", close: "18:00" }] },
  tue: { closed: false, slots: [{ open: "09:00", close: "18:00" }] },
  wed: { closed: false, slots: [{ open: "09:00", close: "18:00" }] },
  thu: { closed: false, slots: [{ open: "09:00", close: "18:00" }] },
  fri: { closed: false, slots: [{ open: "09:00", close: "18:00" }] },
  sat: { closed: false, slots: [{ open: "10:00", close: "14:00" }] },
  sun: { closed: true, slots: [] },
};

function ProfileEditor() {
  const [businessType, setBusinessType] = useState<BusinessType>("Serviço");
  const [schedule, setSchedule] = useState<Record<DayKey, DaySchedule>>(DEFAULT_SCHEDULE);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const plan: "Básico" | "Premium" = "Básico";
  const activeCategories = CATEGORIES.map((c) => c.name);

  const updateSlot = (day: DayKey, idx: number, field: "open" | "close", value: string) => {
    setSchedule((s) => {
      const slots = s[day].slots.map((sl, i) => (i === idx ? { ...sl, [field]: value } : sl));
      return { ...s, [day]: { ...s[day], slots } };
    });
  };

  const addSlot = (day: DayKey) => {
    setSchedule((s) => ({
      ...s,
      [day]: { closed: false, slots: [...s[day].slots, { open: "14:00", close: "18:00" }] },
    }));
  };

  const removeSlot = (day: DayKey, idx: number) => {
    setSchedule((s) => ({
      ...s,
      [day]: { ...s[day], slots: s[day].slots.filter((_, i) => i !== idx) },
    }));
  };

  const toggleClosed = (day: DayKey) => {
    setSchedule((s) => {
      const isClosed = !s[day].closed;
      return {
        ...s,
        [day]: {
          closed: isClosed,
          slots: isClosed ? [] : s[day].slots.length ? s[day].slots : [{ open: "09:00", close: "18:00" }],
        },
      };
    });
  };

  const handleGenerateQr = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setQrGenerated(true);
    }, 700);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Informações Básicas</h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">O que você oferece?</label>
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

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Cidades de Atendimento</label>
            <div className="relative">
              <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#1A5336] appearance-none">
                {NZ_CITIES.map((c, i) => (
                  <option key={i}>{c}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-4 top-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Palavras-chave (Hashtags)</label>
            <input
              type="text"
              placeholder="Ex: #tacos #comidamexicana #auckland"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#1A5336]"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ajuda os clientes a encontrarem seu negócio mais rápido nas buscas.
            </p>
          </div>

          {/* Horário de Funcionamento */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-bold text-gray-700">Horário de Funcionamento</label>
              {plan === "Básico" && (
                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold">
                  Upgrade para horários avançados
                </span>
              )}
            </div>

            <div className="space-y-4">
              {DAYS.map(({ key, label }) => {
                const day = schedule[key];
                return (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 pb-4 border-b border-gray-50 last:border-0">
                    <div className="w-full sm:w-28 flex items-center justify-between sm:justify-start gap-3 pt-2">
                      <span className="text-sm font-semibold text-gray-700">{label}</span>
                    </div>

                    <div className="flex-1 space-y-2">
                      {day.closed ? (
                        <span className="inline-flex items-center text-xs font-bold text-red-700 bg-red-50 border border-red-100 rounded-md px-2.5 py-1.5">
                          FECHADO
                        </span>
                      ) : (
                        day.slots.map((slot, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="time"
                              value={slot.open}
                              onChange={(e) => updateSlot(key, idx, "open", e.target.value)}
                              className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-[#1A5336]"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              type="time"
                              value={slot.close}
                              onChange={(e) => updateSlot(key, idx, "close", e.target.value)}
                              className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-[#1A5336]"
                            />
                            {day.slots.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeSlot(key, idx)}
                                className="text-gray-400 hover:text-red-600 p-1"
                                aria-label="Remover horário"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        ))
                      )}

                      {!day.closed && (
                        <button
                          type="button"
                          onClick={() => addSlot(key)}
                          className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 hover:bg-gray-200 text-xs px-3 py-1.5 rounded-md font-bold transition-colors"
                        >
                          <Plus size={12} /> Adicionar horário
                        </button>
                      )}
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={day.closed}
                        onChange={() => toggleClosed(key)}
                        className="h-4 w-4 rounded border-gray-300 text-[#1A5336] focus:ring-[#1A5336]"
                      />
                      <span className="text-xs font-semibold text-gray-600">Fechado</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="block text-sm font-bold text-gray-700">Descrição Completa</label>
              <span className="text-xs text-gray-400">240/500</span>
            </div>
            <textarea
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#1A5336] resize-none"
              defaultValue="Autêntica comida mexicana com ingredientes frescos locais. Servindo a comunidade com os melhores tacos e burritos."
            />
          </div>

          <button className="bg-[#1A5336] hover:bg-[#123F27] text-white font-bold rounded-xl px-6 py-2.5 text-sm">
            Salvar alterações
          </button>
        </div>
      </div>

      <div className="w-full lg:w-80 space-y-6">
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
