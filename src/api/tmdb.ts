import type { TmdbMovieRaw, TmdbSearchResponse, TmdbTvShowRaw } from "../types/tmdb.type";
import { fetchJson } from "./http";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
// Clé v3 lue depuis .env (seules les variables préfixées VITE_ sont exposées au front)
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

/**
 * Appelle un endpoint de recherche TMDB ("movie" ou "tv") et renvoie la liste des résultats.
 * Ne renvoie que la première page (20 résultats max).
 */
async function searchTmdb<T>(endpoint: "movie" | "tv", query: string): Promise<T[]> {
	// searchParams encode automatiquement les valeurs (espaces, accents, &...)
	const url = new URL(`${TMDB_BASE_URL}/search/${endpoint}`);
	url.searchParams.set("api_key", TMDB_KEY);
	url.searchParams.set("query", query);
	url.searchParams.set("language", "fr-FR"); // titres et résumés en français

	const data = await fetchJson<TmdbSearchResponse<T>>(url.toString());
	// On ne garde que la liste, sans les infos de pagination
	return data.results;
}

/** Recherche des films par titre */
export function searchMovies(query: string): Promise<TmdbMovieRaw[]> {
	return searchTmdb<TmdbMovieRaw>("movie", query);
}

/** Recherche des séries par titre */
export function searchTvShows(query: string): Promise<TmdbTvShowRaw[]> {
	return searchTmdb<TmdbTvShowRaw>("tv", query);
}
