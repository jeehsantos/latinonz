import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useCurrentPlan } from "@/lib/dev-plan";
import { getLimit } from "@/lib/plans";
import { useI18n } from "@/lib/i18n";
import { listMyPhotos, uploadPhoto, deletePhoto } from "@/lib/storage.functions";

export const Route = createFileRoute("/dashboard/gallery")({
  component: GalleryPage,
});

function GalleryPage() {
  const { t } = useI18n();
  const [plan] = useCurrentPlan();
  const limit = getLimit(plan, "photoLimit");
  const max = Number.isFinite(limit) ? limit : 12;

  const fetchPhotos = useServerFn(listMyPhotos);
  const callUpload = useServerFn(uploadPhoto);
  const callDelete = useServerFn(deletePhoto);

  const { data, refetch, isLoading } = useQuery({
    queryKey: ["my-photos"],
    queryFn: () => fetchPhotos({}),
  });
  const photos = data?.photos ?? [];

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limitReached = Number.isFinite(limit) && photos.length >= limit;

  const handlePick = () => {
    if (limitReached || uploading) return;
    fileRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const contentBase64 = btoa(bin);
      const dot = file.name.lastIndexOf(".");
      const ext = (dot >= 0 ? file.name.slice(dot + 1) : "jpg").toLowerCase();
      await callUpload({
        data: { contentBase64, contentType: file.type || "image/jpeg", ext },
      });
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await callDelete({ data: { photoId: id } });
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao remover.");
    }
  };

  const placeholders = Math.max(0, max - photos.length - (limitReached ? 0 : 1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">{t("gallery.title")}</h1>
        <p className="text-neutral-400 mt-1">
          {t("gallery.subtitle_plan")} <span className="font-bold capitalize">{plan}</span>{" "}
          {t("gallery.subtitle_allows")}{" "}
          {Number.isFinite(limit)
            ? `${t("gallery.subtitle_photos").replace("{n}", String(limit))}`
            : t("gallery.subtitle_unlimited")}
          .
        </p>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map((p: { id: string; url: string }) => (
          <div
            key={p.id}
            className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group"
          >
            <img src={p.url} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => handleDelete(p.id)}
              className="absolute top-2 right-2 bg-neutral-900/90 hover:bg-neutral-900 text-red-600 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remover"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {!limitReached && (
          <button
            onClick={handlePick}
            disabled={uploading}
            className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 text-neutral-400 hover:border-[#facc15] hover:text-[#facc15] disabled:opacity-60 flex flex-col items-center justify-center gap-2"
          >
            <Plus size={20} />
            <span className="text-xs font-bold">{uploading ? "..." : t("gallery.add_button")}</span>
          </button>
        )}
        {!isLoading &&
          Array.from({ length: placeholders }).map((_, i) => (
            <div
              key={`ph-${i}`}
              className="aspect-square rounded-2xl bg-gradient-to-br from-emerald-100 via-amber-100 to-emerald-50 border border-white/10"
            />
          ))}
      </div>
    </div>
  );
}
