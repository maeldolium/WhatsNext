import type { RawgGameRaw, RawgResponse } from "../types/rawg.type";
import { fetchJson } from "./http";

const RAWG_BASE_URL = "https://api.rawg.io/api";
// Clé lue depuis .env (seules les variables préfixées VITE_ sont exposées au front)
const RAWG_KEY = import.meta.env.VITE_RAWG_API_KEY;

/**
 * Appelle l'endpoint /games de RAWG avec les paramètres donnés et renvoie la liste
 * des jeux. Ne renvoie que la première page (20 jeux max).
 */
async function fetchGames(params: Record<string, string>): Promise<RawgGameRaw[]> {
	// searchParams encode automatiquement les valeurs (espaces, accents, &...)
	const url = new URL(`${RAWG_BASE_URL}/games`);
	url.searchParams.set("key", RAWG_KEY);
	for (const [name, value] of Object.entries(params)) {
		url.searchParams.set(name, value);
	}

	const data = await fetchJson<RawgResponse>(url.toString());
	// On ne garde que la liste des jeux, sans les infos de pagination
	return data.results;
}

/** Recherche des jeux par nom */
export function searchGames(query: string): Promise<RawgGameRaw[]> {
	return fetchGames({ search: query });
}

/**
 * Jeux les mieux notés par la presse (Metacritic). La note des joueurs RAWG n'est
 * pas utilisée : elle fait remonter des jeux notés par seulement 5 ou 6 personnes.
 */
export function getTopRatedGames(): Promise<RawgGameRaw[]> {
	return fetchGames({ ordering: "-metacritic" });
}
