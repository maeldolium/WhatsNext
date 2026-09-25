import type { TmdbMovieRaw, TmdbSearchResponse, TmdbTvShowRaw } from "../types/tmdb.type";
import { fetchJson, requireApiKey } from "./http";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
// Clé v3 lue depuis .env (seules les variables préfixées VITE_ sont exposées au front)
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

/**
 * Appelle un endpoint TMDB qui renvoie une liste paginée (recherche, discover…)
 * et renvoie la liste des résultats d'une page (20 résultats max, 1re page par défaut).
 */
async function fetchTmdbList<T>(path: string, params: Record<string, string>): Promise<T[]> {
	// searchParams encode automatiquement les valeurs (espaces, accents, &...)
	const url = new URL(`${TMDB_BASE_URL}${path}`);
	url.searchParams.set("api_key", requireApiKey(TMDB_KEY, "VITE_TMDB_API_KEY"));
	url.searchParams.set("language", "fr-FR"); // titres et résumés en français
	for (const [name, value] of Object.entries(params)) {
		url.searchParams.set(name, value);
	}

	const data = await fetchJson<TmdbSearchResponse<T>>(url.toString());
	// On ne garde que la liste, sans les infos de pagination
	return data.results;
}

/** Recherche des films par titre */
export function searchMovies(query: string): Promise<TmdbMovieRaw[]> {
	return fetchTmdbList<TmdbMovieRaw>("/search/movie", { query });
}

/** Recherche des séries par titre */
export function searchTvShows(query: string): Promise<TmdbTvShowRaw[]> {
	return fetchTmdbList<TmdbTvShowRaw>("/search/tv", { query });
}

// Pour les classements, on passe par /discover avec un nombre minimum de votes :
// sans ce seuil, des titres notés 9/10 par une poignée de personnes passent devant
// les classiques. Il y a moins de votes sur les séries, d'où un seuil plus bas.

/** Films les mieux notés par les spectateurs TMDB (page 1 = les 20 premiers, etc.) */
export function getTopRatedMovies(page = 1): Promise<TmdbMovieRaw[]> {
	return fetchTmdbList<TmdbMovieRaw>("/discover/movie", {
		sort_by: "vote_average.desc",
		"vote_count.gte": "2000",
		page: String(page),
	});
}

/** Séries les mieux notées par les spectateurs TMDB (page 1 = les 20 premières, etc.) */
export function getTopRatedTvShows(page = 1): Promise<TmdbTvShowRaw[]> {
	return fetchTmdbList<TmdbTvShowRaw>("/discover/tv", {
		sort_by: "vote_average.desc",
		"vote_count.gte": "1000",
		page: String(page),
	});
}
