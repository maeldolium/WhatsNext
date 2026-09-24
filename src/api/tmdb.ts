import type { TmdbMovieRaw, TmdbSearchResponse } from "../types/tmdb.type";
import { fetchJson } from "./http";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
// Clé v3 lue depuis .env (seules les variables préfixées VITE_ sont exposées au front)
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

/**
 * Recherche des films par titre.
 * Ne renvoie que la première page de résultats (20 films max).
 */
export async function searchMovies(query: string): Promise<TmdbMovieRaw[]> {
	// searchParams encode automatiquement les valeurs (espaces, accents, &...)
	const url = new URL(`${TMDB_BASE_URL}/search/movie`);
	url.searchParams.set("api_key", TMDB_KEY);
	url.searchParams.set("query", query);
	url.searchParams.set("language", "fr-FR"); // optionnel : titres et résumés en français

	const data = await fetchJson<TmdbSearchResponse>(url.toString());
	// On ne garde que la liste des films, sans les infos de pagination
	return data.results;
}
