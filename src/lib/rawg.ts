const RAWG_API_KEY = import.meta.env.RAWG_API_KEY;
const RAWG_BASE_URL = "https://api.rawg.io/api/games";

export interface RawgGameData {
  name: string;
  backgroundImage: string | null;
  released: string | null;
  genres: string[];
  platforms: string[];
}

const cache = new Map<string, RawgGameData | null>();

/**
 * Fetches game metadata (cover image, genres, platforms) from RAWG by slug.
 * Slug is the part of a rawg.io URL after /games/, e.g.
 * https://rawg.io/games/elden-ring -> "elden-ring"
 *
 * Returns null if the API key is missing, the request fails, or the
 * game isn't found — callers should render a sensible fallback in that case.
 */
export async function getRawgGame(slug: string): Promise<RawgGameData | null> {
  if (cache.has(slug)) {
    return cache.get(slug) ?? null;
  }

  if (!RAWG_API_KEY) {
    console.warn(
      `[rawg] RAWG_API_KEY is not set — skipping fetch for "${slug}". Set RAWG_API_KEY in your .env or repo secrets.`,
    );
    cache.set(slug, null);
    return null;
  }

  try {
    const res = await fetch(`${RAWG_BASE_URL}/${slug}?key=${RAWG_API_KEY}`);
    if (!res.ok) {
      console.warn(
        `[rawg] Failed to fetch "${slug}": ${res.status} ${res.statusText}`,
      );
      cache.set(slug, null);
      return null;
    }
    const data = await res.json();

    const result: RawgGameData = {
      name: data.name,
      backgroundImage: data.background_image ?? null,
      released: data.released ?? null,
      genres: (data.genres ?? []).map((g: { name: string }) => g.name),
      platforms: (data.platforms ?? []).map(
        (p: { platform: { name: string } }) => p.platform.name,
      ),
    };

    cache.set(slug, result);
    return result;
  } catch (err) {
    console.warn(`[rawg] Error fetching "${slug}":`, err);
    cache.set(slug, null);
    return null;
  }
}
