import type { RawgGameRaw, RawgResponse } from "../types/rawg.type";
import { fetchJson } from "./http";

const RAWG_BASE_URL = "https://api.rawg.io/api";
// Clé lue depuis .env (seules les variables préfixées VITE_ sont exposées au front)
const RAWG_KEY = import.meta.env.VITE_RAWG_API_KEY;

/**
 * Recherche des jeux par nom.
 * Ne renvoie que la première page de résultats (20 jeux max).
 */
export async function searchGames(query: string): Promise<RawgGameRaw[]> {
	// searchParams encode automatiquement les valeurs (espaces, accents, &...)
	const url = new URL(`${RAWG_BASE_URL}/games`);
	url.searchParams.set("key", RAWG_KEY);
	url.searchParams.set("search", query);

	const data = await fetchJson<RawgResponse>(url.toString());
	// On ne garde que la liste des jeux, sans les infos de pagination
	return data.results;
}
