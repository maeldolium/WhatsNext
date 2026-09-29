import type { TmdbListResponse, TmdbMovieRaw, TmdbTvShowRaw } from "../types/tmdb.type";
import { type ApiPage, fetchJson, requireApiKey } from "./http";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
// Seules les variables préfixées VITE_ du .env sont accessibles dans le code du navigateur
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

async function fetchTmdbPage<T>(path: string, params: Record<string, string>): Promise<ApiPage<T>> {
	// searchParams encode automatiquement les valeurs (espaces, accents, &...)
	const url = new URL(`${TMDB_BASE_URL}${path}`);
	url.searchParams.set("api_key", requireApiKey(TMDB_KEY, "VITE_TMDB_API_KEY"));
	url.searchParams.set("language", "fr-FR"); // titres et résumés en français
	for (const [name, value] of Object.entries(params)) {
		url.searchParams.set(name, value);
	}

	const data = await fetchJson<TmdbListResponse<T>>(url.toString());
	return { results: data.results, hasMore: data.page < data.total_pages };
}

// Les recherches ne renvoient que la 1re page (20 résultats max)

export async function searchMovies(query: string): Promise<TmdbMovieRaw[]> {
	return (await fetchTmdbPage<TmdbMovieRaw>("/search/movie", { query })).results;
}

export async function searchTvShows(query: string): Promise<TmdbTvShowRaw[]> {
	return (await fetchTmdbPage<TmdbTvShowRaw>("/search/tv", { query })).results;
}

// Pour les classements, on passe par /discover avec un nombre minimum de votes :
// sans ce seuil, des titres notés 9/10 par une poignée de personnes passent devant
// les classiques. Il y a moins de votes sur les séries, d'où un seuil plus bas.

export function getTopRatedMovies(page = 1): Promise<ApiPage<TmdbMovieRaw>> {
	return fetchTmdbPage<TmdbMovieRaw>("/discover/movie", {
		sort_by: "vote_average.desc",
		"vote_count.gte": "2000",
		page: String(page),
	});
}

export function getTopRatedTvShows(page = 1): Promise<ApiPage<TmdbTvShowRaw>> {
	return fetchTmdbPage<TmdbTvShowRaw>("/discover/tv", {
		sort_by: "vote_average.desc",
		"vote_count.gte": "1000",
		page: String(page),
	});
}
