import type { NewWatchlistItem } from "../types/store.ts";
import type { WatchlistItemType } from "../types/watchlist.ts";
import { normalizeRawgGame, normalizeTmdbMovie, normalizeTmdbTvShow } from "../utils/normalize.ts";
import type { Page } from "./http.ts";
import { getTopRatedGames } from "./rawg.ts";
import { getTopRatedMovies, getTopRatedTvShows } from "./tmdb.ts";

// Titre recommandé : l'item au format de l'app (prêt à être ajouté au store)
// et sa note, qui n'est pas stockée dans la watchlist.
export interface Recommendation {
	item: NewWatchlistItem;
	/** Note sur 10 : spectateurs TMDB, ou presse Metacritic (sur 100) ramenée sur 10 pour les jeux */
	score: number;
}

/**
 * Une page du classement des titres les mieux notés d'un type donné, dans l'ordre
 * de l'API. `page` permet d'aller chercher la suite (page 2 = titres 21 à 40…).
 * `hasMore` dit s'il reste des pages, même si celle-ci est vide après filtrage.
 */
export async function getRecommendations(
	type: WatchlistItemType,
	page = 1,
): Promise<Page<Recommendation>> {
	switch (type) {
		case "movie": {
			const { results, hasMore } = await getTopRatedMovies(page);
			return {
				results: results.map((raw) => ({ item: normalizeTmdbMovie(raw), score: raw.vote_average })),
				hasMore,
			};
		}
		case "tv_show": {
			const { results, hasMore } = await getTopRatedTvShows(page);
			return {
				results: results.map((raw) => ({
					item: normalizeTmdbTvShow(raw),
					score: raw.vote_average,
				})),
				hasMore,
			};
		}
		case "game": {
			const { results, hasMore } = await getTopRatedGames(page);
			return {
				results: results
					// Le classement RAWG contient quelques doublons incomplets (sans image ni note) :
					// on les écarte pour ne garder que des fiches exploitables
					.filter((raw) => raw.background_image !== null && raw.metacritic !== null)
					.map((raw) => ({ item: normalizeRawgGame(raw), score: (raw.metacritic ?? 0) / 10 })),
				hasMore,
			};
		}
	}
}
