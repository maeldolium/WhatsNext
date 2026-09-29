import type { RawgGameRaw, RawgResponse } from "../types/rawg.type";
import { fetchJson, type Page, requireApiKey } from "./http";

const RAWG_BASE_URL = "https://api.rawg.io/api";
// Clé lue depuis .env (seules les variables préfixées VITE_ sont exposées au front)
const RAWG_KEY = import.meta.env.VITE_RAWG_API_KEY;

/**
 * Appelle l'endpoint /games de RAWG avec les paramètres donnés et renvoie une page
 * de jeux (20 max, 1re page par défaut).
 */
async function fetchGamesPage(params: Record<string, string>): Promise<Page<RawgGameRaw>> {
	// searchParams encode automatiquement les valeurs (espaces, accents, &...)
	const url = new URL(`${RAWG_BASE_URL}/games`);
	url.searchParams.set("key", requireApiKey(RAWG_KEY, "VITE_RAWG_API_KEY"));
	for (const [name, value] of Object.entries(params)) {
		url.searchParams.set(name, value);
	}

	const data = await fetchJson<RawgResponse>(url.toString());
	// RAWG indique l'URL de la page suivante, null sur la dernière page
	return { results: data.results, hasMore: data.next !== null };
}

/** Recherche des jeux par nom (1re page uniquement) */
export async function searchGames(query: string): Promise<RawgGameRaw[]> {
	return (await fetchGamesPage({ search: query })).results;
}

/**
 * Jeux les mieux notés par la presse (Metacritic). La note des joueurs RAWG n'est
 * pas utilisée : elle fait remonter des jeux notés par seulement 5 ou 6 personnes.
 */
export function getTopRatedGames(page = 1): Promise<Page<RawgGameRaw>> {
	return fetchGamesPage({ ordering: "-metacritic", page: String(page) });
}
