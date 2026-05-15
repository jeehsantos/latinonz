import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LEADS } from "@/lib/mock/leads";
import type { Lead } from "@/lib/mock/types";

export const Route = createFileRoute("/dashboard/leads")({
  component: LeadsPage,
});

const STATUS_STYLES: Record<Lead["status"], string> = {
  Pendente: "bg-amber-100 text-amber-700",
  Contatado: "bg-blue-100 text-blue-700",
  Convertido: "bg-emerald-100 text-emerald-700",
};

function LeadsPage() {
  const [selected, setSelected] = useState<Lead | null>(null);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Leads</h1>
        <p className="text-gray-500 mt-1">Mensagens e contatos enviados pelos clientes.</p>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-bold">Cliente</th>
                <th className="p-4 font-bold">Origem</th>
                <th className="p-4 font-bold">Data</th>
                <th className="p-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {LEADS.map((l) => (
                <tr key={l.id} onClick={() => setSelected(l)} className={`hover:bg-gray-50 cursor-pointer ${selected?.id === l.id ? "bg-emerald-50" : ""}`}>
                  <td className="p-4 font-bold text-gray-900">{l.name}<div className="text-xs font-normal text-gray-500">{l.phone}</div></td>
                  <td className="p-4 text-gray-600">{l.source}</td>
                  <td className="p-4 text-gray-500">{l.date} {l.time}</td>
                  <td className="p-4"><span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_STYLES[l.status]}`}>{l.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white border border-gray-200 rounded-3xl p-6">
          {selected ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{selected.source}</p>
              <h3 className="font-extrabold text-gray-900 mt-1">{selected.name}</h3>
              <p className="text-sm text-gray-500">{selected.phone}</p>
              <p className="mt-4 text-sm text-gray-700">{selected.msg}</p>
              <div className="mt-6 flex gap-2">
                <button className="flex-1 bg-[#1A5336] hover:bg-[#123F27] text-white font-bold rounded-xl py-2 text-sm">Responder</button>
                <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl py-2 text-sm">Marcar resolvido</button>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">Selecione um lead para ver os detalhes.</p>
          )}
        </div>
      </div>
    </div>
  );
}
