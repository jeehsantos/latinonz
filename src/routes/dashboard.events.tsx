import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, X, Power, Trash2, MapPin } from "lucide-react";
import { useCurrentPlan } from "@/lib/dev-plan";
import { can } from "@/lib/plans";
import { getMyEvents, createEvent, toggleEvent, deleteEvent } from "@/lib/events.functions";

export const Route = createFileRoute("/dashboard/events")({
  component: EventsPage,
});

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
};

function fmt(dt: string | null) {
  if (!dt) return "";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

function EventsPage() {
  const [plan] = useCurrentPlan();
  const unlocked = can(plan, "events");

  const queryClient = useQueryClient();
  const fetchEvents = useServerFn(getMyEvents);
  const createEventFn = useServerFn(createEvent);
  const toggleEventFn = useServerFn(toggleEvent);
  const deleteEventFn = useServerFn(deleteEvent);

  const { data } = useQuery({
    queryKey: ["my-events"],
    queryFn: () => fetchEvents(),
    enabled: unlocked,
  });

  const events: EventRow[] =
    data && (data as { ok?: boolean }).ok ? ((data as { events: EventRow[] }).events ?? []) : [];

  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    startsAt: "",
    endsAt: "",
    imageUrl: "",
  });

  function resetForm() {
    setForm({ title: "", description: "", location: "", startsAt: "", endsAt: "", imageUrl: "" });
    setFormError(null);
  }

  const createMutation = useMutation({
    mutationFn: () =>
      createEventFn({
        data: {
          title: form.title.trim(),
          description: form.description.trim() || null,
          location: form.location.trim() || null,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
          imageUrl: form.imageUrl.trim() || null,
        },
      }),
    onSuccess: (res) => {
      if (!(res as { ok?: boolean }).ok) {
        setFormError((res as { error?: string }).error ?? "Erro ao criar evento");
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["my-events"] });
      setFormOpen(false);
      resetForm();
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : "Erro ao criar evento"),
  });

  const toggleMutation = useMutation({
    mutationFn: (eventId: string) => toggleEventFn({ data: { eventId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-events"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => deleteEventFn({ data: { eventId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-events"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Eventos</h1>
          <p className="text-gray-500 mt-1">Crie e gerencie eventos do seu negócio.</p>
        </div>
        {unlocked && (
          <button
            onClick={() => {
              resetForm();
              setFormOpen(true);
            }}
            className="bg-white hover:bg-gray-100 text-[#000000] font-bold rounded-xl px-4 py-2.5 text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Novo evento
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-6">
        <h2 className="text-lg font-extrabold text-gray-900 mb-4">Seus eventos</h2>

        {unlocked ? (
          events.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Nenhum evento criado ainda.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {events.map((e) => (
                <div
                  key={e.id}
                  className={`rounded-3xl p-6 border ${
                    e.is_active
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-gray-50 border-gray-200 opacity-70"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <Calendar
                      className={e.is_active ? "text-emerald-700" : "text-gray-400"}
                      size={20}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleMutation.mutate(e.id)}
                        disabled={toggleMutation.isPending}
                        className="text-gray-400 hover:text-gray-700 p-1"
                        aria-label="Toggle"
                        title={e.is_active ? "Desativar" : "Ativar"}
                      >
                        <Power size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remover evento "${e.title}"?`)) deleteMutation.mutate(e.id);
                        }}
                        disabled={deleteMutation.isPending}
                        className="text-gray-400 hover:text-red-600 p-1"
                        aria-label="Delete"
                        title="Remover"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="font-extrabold text-lg mt-3 text-gray-900">{e.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{fmt(e.starts_at)}</p>
                  {e.ends_at && <p className="text-xs text-gray-500">até {fmt(e.ends_at)}</p>}
                  {e.location && (
                    <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                      <MapPin size={12} /> {e.location}
                    </p>
                  )}
                  {e.description && <p className="text-sm text-gray-700 mt-2">{e.description}</p>}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/60 px-6 py-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <Calendar size={22} />
            </div>
            <p className="mt-5 font-extrabold text-gray-900 text-base">
              Eventos são exclusivos do plano Ultra
            </p>
            <p className="mt-2 text-sm text-gray-600 max-w-sm">
              Faça upgrade para Ultra para publicar eventos no seu perfil.
            </p>
            <Link
              to="/dashboard/upgrade"
              className="mt-4 inline-flex items-center bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-colors"
            >
              Fazer upgrade
            </Link>
          </div>
        )}
      </div>

      {formOpen && unlocked && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setFormOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-md w-full"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 text-lg">Novo evento</h3>
              <button
                onClick={() => setFormOpen(false)}
                className="text-gray-400 hover:text-gray-700"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={(ev) => {
                ev.preventDefault();
                setFormError(null);
                createMutation.mutate();
              }}
              className="mt-4 space-y-3"
            >
              <input
                required
                type="text"
                placeholder="Título"
                value={form.title}
                onChange={(ev) => setForm((f) => ({ ...f, title: ev.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                maxLength={200}
              />
              <textarea
                rows={3}
                placeholder="Descrição (opcional)"
                value={form.description}
                onChange={(ev) => setForm((f) => ({ ...f, description: ev.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none"
                maxLength={2000}
              />
              <input
                type="text"
                placeholder="Local (opcional)"
                value={form.location}
                onChange={(ev) => setForm((f) => ({ ...f, location: ev.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                maxLength={300}
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Início</label>
                  <input
                    required
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(ev) => setForm((f) => ({ ...f, startsAt: ev.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Fim (opcional)</label>
                  <input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(ev) => setForm((f) => ({ ...f, endsAt: ev.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <input
                type="url"
                placeholder="URL da imagem (opcional)"
                value={form.imageUrl}
                onChange={(ev) => setForm((f) => ({ ...f, imageUrl: ev.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 text-sm rounded-xl border border-gray-200 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm rounded-xl bg-white hover:bg-gray-100 text-[#000000] font-bold disabled:opacity-60"
                >
                  {createMutation.isPending ? "Criando…" : "Criar evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
