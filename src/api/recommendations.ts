import type { NewWatchlistItem } from "../types/store.ts";
import type { WatchlistItemType } from "../types/watchlist.ts";
import { normalizeRawgGame, normalizeTmdbMovie, normalizeTmdbTvShow } from "../utils/normalize.ts";
import type { Page } from "./http.ts";
import { getTopRatedGames } from "./rawg.ts";
import { getTopRatedMovies, getTopRatedTvShows } from "./tmdb.ts";

export interface Recommendation {
	item: NewWatchlistItem;
	// Note sur 10 (spectateurs TMDB, ou Metacritic ramenée de 100 à 10 pour les jeux).
	// Elle sert seulement à l'affichage : elle n'est pas enregistrée dans la watchlist.
	score: number;
}

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
