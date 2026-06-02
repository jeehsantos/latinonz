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
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const remaining = Number.isFinite(limit) ? Math.max(0, limit - photos.length) : Infinity;
  const limitReached = Number.isFinite(limit) && photos.length >= limit;

  const handlePick = () => {
    if (limitReached || uploading) return;
    fileRef.current?.click();
  };

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    setError(null);

    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) {
      setError("No image files selected.");
      return;
    }

    let toUpload = images;
    if (Number.isFinite(remaining) && images.length > remaining) {
      toUpload = images.slice(0, remaining);
      setError(
        `Only ${remaining} photo(s) uploaded — plan limit reached.`,
      );
    }

    setUploading(true);
    setProgress({ done: 0, total: toUpload.length });
    try {
      for (let i = 0; i < toUpload.length; i++) {
        const file = toUpload[i];
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = "";
        for (let j = 0; j < bytes.length; j++) bin += String.fromCharCode(bytes[j]);
        const contentBase64 = btoa(bin);
        const dot = file.name.lastIndexOf(".");
        const ext = (dot >= 0 ? file.name.slice(dot + 1) : "jpg").toLowerCase();
        await callUpload({
          data: { contentBase64, contentType: file.type || "image/jpeg", ext },
        });
        setProgress({ done: i + 1, total: toUpload.length });
      }
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    await uploadFiles(files);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (limitReached || uploading) return;
    const files = Array.from(e.dataTransfer.files ?? []);
    await uploadFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (limitReached || uploading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
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
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        {uploading && progress && (
          <p className="text-sm text-[#facc15] mt-2">
            Uploading {progress.done} / {progress.total}…
          </p>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFile}
        className="hidden"
      />

      {!limitReached && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handlePick}
          role="button"
          tabIndex={0}
          className={`rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition ${
            isDragging
              ? "border-[#facc15] bg-[#facc15]/5"
              : "border-white/15 hover:border-[#facc15]/60 hover:bg-white/[0.02]"
          } ${uploading ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <Plus className="mx-auto text-[#facc15]" size={24} />
          <p className="mt-2 text-sm font-bold text-white">
            {isDragging
              ? "Drop images to upload"
              : "Drag & drop images here, or click to select"}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {Number.isFinite(remaining)
              ? `${remaining} slot(s) remaining`
              : t("gallery.subtitle_unlimited")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map((p: { id: string; url: string }) => (
          <div
            key={p.id}
            className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group"
          >
            <img src={p.url} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => handleDelete(p.id)}
              className="absolute top-2 right-2 bg-neutral-900/90 hover:bg-neutral-900 text-red-500 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remover"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {!isLoading &&
          Array.from({ length: placeholders }).map((_, i) => (
            <div
              key={`ph-${i}`}
              className="aspect-square rounded-2xl bg-gradient-to-br from-emerald-100/10 via-amber-100/10 to-emerald-50/5 border border-white/10"
            />
          ))}
      </div>
    </div>
  );
}
