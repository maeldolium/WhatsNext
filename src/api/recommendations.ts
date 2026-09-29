import type { NewWatchlistItem } from "../types/store.ts";
import type { WatchlistItemType } from "../types/watchlist.ts";
import { normalizeRawgGame, normalizeTmdbMovie, normalizeTmdbTvShow } from "../utils/normalize.ts";
import type { ApiPage } from "./http.ts";
import { getTopRatedGames } from "./rawg.ts";
import { getTopRatedMovies, getTopRatedTvShows } from "./tmdb.ts";

export interface Recommendation {
	item: NewWatchlistItem;
	// Note sur 10 (spectateurs TMDB, ou Metacritic ramenée de 100 à 10 pour les jeux).
	// Elle sert seulement à l'affichage : elle n'est pas enregistrée dans la watchlist.
	score: number;
}

// Transforme les résultats d'une page en gardant l'info « il reste des pages »
function mapPage<T, U>(page: ApiPage<T>, transform: (raw: T) => U): ApiPage<U> {
	return { results: page.results.map(transform), hasMore: page.hasMore };
}

export async function getRecommendations(
	type: WatchlistItemType,
	page = 1,
): Promise<ApiPage<Recommendation>> {
	switch (type) {
		case "movie":
			return mapPage(await getTopRatedMovies(page), (raw) => ({
				item: normalizeTmdbMovie(raw),
				score: raw.vote_average,
			}));
		case "tv_show":
			return mapPage(await getTopRatedTvShows(page), (raw) => ({
				item: normalizeTmdbTvShow(raw),
				score: raw.vote_average,
			}));
		case "game": {
			const games = await getTopRatedGames(page);
			// Le classement RAWG contient quelques doublons incomplets (sans image ni note) :
			// on les écarte pour ne garder que des fiches exploitables
			const complete = games.results.filter(
				(raw) => raw.background_image !== null && raw.metacritic !== null,
			);
			return mapPage({ ...games, results: complete }, (raw) => ({
				item: normalizeRawgGame(raw),
				score: (raw.metacritic ?? 0) / 10,
			}));
		}
	}
}
