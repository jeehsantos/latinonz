import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const placeIdSchema = z.object({
  placeId: z.string().trim().min(10).max(200).regex(/^[A-Za-z0-9_-]+$/),
});

const businessIdSchema = z.object({
  businessId: z.string().uuid(),
});

type GoogleReview = {
  author_name: string;
  profile_photo_url?: string;
  rating: number;
  text?: string;
  time?: number; // unix seconds
  // Newer Places API may return author_attribution + publishTime
};

type PlaceDetailsResponse = {
  status: string;
  error_message?: string;
  result?: {
    rating?: number;
    user_ratings_total?: number;
    reviews?: GoogleReview[];
  };
};

async function fetchAndCache(businessId: string, placeId: string) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    throw new Error("GOOGLE_PLACES_API_KEY não configurada.");
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "reviews,rating,user_ratings_total");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Google Places API erro HTTP ${res.status}`);
  }
  const payload = (await res.json()) as PlaceDetailsResponse;
  if (payload.status !== "OK" && payload.status !== "ZERO_RESULTS") {
    throw new Error(`Google Places API status ${payload.status}: ${payload.error_message ?? ""}`.trim());
  }

  const reviews = payload.result?.reviews ?? [];
  const rating = payload.result?.rating ?? 0;
  const reviewCount = payload.result?.user_ratings_total ?? 0;

  const rows = reviews
    .filter((r) => r && typeof r.rating === "number" && r.author_name)
    .map((r) => {
      const ratingInt = Math.max(1, Math.min(5, Math.round(r.rating)));
      const reviewId =
        // The legacy API doesn't return a stable id; derive a deterministic one
        // from author + time so re-syncs are idempotent.
        `${r.author_name}_${r.time ?? 0}`;
      const publishedAt = r.time ? new Date(r.time * 1000).toISOString() : null;
      return {
        business_id: businessId,
        google_review_id: reviewId,
        author_name: r.author_name.slice(0, 200),
        author_photo_url: r.profile_photo_url ?? null,
        rating: ratingInt,
        text: r.text ? r.text.slice(0, 5000) : null,
        published_at: publishedAt,
        synced_at: new Date().toISOString(),
      };
    });

  if (rows.length > 0) {
    const { error: upErr } = await supabaseAdmin
      .from("google_reviews")
      .upsert(rows, { onConflict: "business_id,google_review_id" });
    if (upErr) throw new Error(upErr.message);
  }

  const { error: bErr } = await supabaseAdmin
    .from("businesses")
    .update({
      rating: Number(rating.toFixed(2)),
      review_count: reviewCount,
    })
    .eq("id", businessId);
  if (bErr) throw new Error(bErr.message);

  return { rating, reviewCount, synced: rows.length };
}

export const connectGooglePlace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => placeIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: biz, error } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!biz) throw new Error("Nenhum negócio encontrado para este usuário.");

    const { error: updErr } = await supabase
      .from("businesses")
      .update({ google_place_id: data.placeId })
      .eq("id", biz.id);
    if (updErr) throw new Error(updErr.message);

    try {
      const result = await fetchAndCache(biz.id, data.placeId);
      return { ok: true as const, ...result };
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : "Falha na sincronização inicial.",
      };
    }
  });

export const syncGoogleReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => businessIdSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: biz, error } = await supabase
      .from("businesses")
      .select("id, owner_id, google_place_id")
      .eq("id", data.businessId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!biz || biz.owner_id !== userId) {
      throw new Error("Negócio não encontrado.");
    }
    if (!biz.google_place_id) {
      throw new Error("Google Place ID não configurado para este negócio.");
    }

    const result = await fetchAndCache(biz.id, biz.google_place_id);
    return { ok: true as const, ...result };
  });

export const getReviews = createServerFn({ method: "GET" })
  .inputValidator((input) => businessIdSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: rows, error } = await supabaseAdmin
      .from("google_reviews")
      .select("id, author_name, author_photo_url, rating, text, published_at")
      .eq("business_id", data.businessId)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return { ok: true as const, reviews: rows ?? [] };
  });
