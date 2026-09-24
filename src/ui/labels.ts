import type { WatchlistItemType, WatchlistStatus } from "../types/watchlist.ts";

export const STATUS_LABELS: Record<WatchlistStatus, string> = {
	planned: "À découvrir",
	in_progress: "En cours",
	completed: "Terminé",
};

export const TYPE_LABELS: Record<WatchlistItemType, string> = {
	movie: "Film",
	game: "Jeu",
};

export const TYPE_ICONS: Record<WatchlistItemType, string> = {
	movie: "icon-movie",
	game: "icon-game",
};
