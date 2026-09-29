import type { RawgGameRaw, RawgResponse } from "../types/rawg.type";
import { type ApiPage, fetchJson, requireApiKey } from "./http";

const RAWG_BASE_URL = "https://api.rawg.io/api";
// Seules les variables préfixées VITE_ du .env sont accessibles dans le code du navigateur
const RAWG_KEY = import.meta.env.VITE_RAWG_API_KEY;

async function fetchGamesPage(params: Record<string, string>): Promise<ApiPage<RawgGameRaw>> {
	// searchParams encode automatiquement les valeurs (espaces, accents, &...)
	const url = new URL(`${RAWG_BASE_URL}/games`);
	url.searchParams.set("key", requireApiKey(RAWG_KEY, "VITE_RAWG_API_KEY"));
	for (const [name, value] of Object.entries(params)) {
		url.searchParams.set(name, value);
	}

	const data = await fetchJson<RawgResponse>(url.toString());
	return { results: data.results, hasMore: data.next !== null };
}

// Ne renvoie que la 1re page (20 résultats max)
export async function searchGames(query: string): Promise<RawgGameRaw[]> {
	return (await fetchGamesPage({ search: query })).results;
}

// Classement par note de la presse (Metacritic). La note des joueurs RAWG n'est
// pas utilisée : elle fait remonter des jeux notés par seulement 5 ou 6 personnes.
export function getTopRatedGames(page = 1): Promise<ApiPage<RawgGameRaw>> {
	return fetchGamesPage({ ordering: "-metacritic", page: String(page) });
}
