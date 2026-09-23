import type { WatchlistItemType, WatchlistStatus } from "../types/watchlist.ts";

// Textes affichés pour chaque valeur technique du store.
export const STATUS_LABELS: Record<WatchlistStatus, string> = {
	planned: "À découvrir",
	in_progress: "En cours",
	completed: "Terminé",
};

export const TYPE_LABELS: Record<WatchlistItemType, string> = {
	movie: "Film",
	game: "Jeu",
};

// Nom du symbole du sprite à utiliser pour chaque type
export const TYPE_ICONS: Record<WatchlistItemType, string> = {
	movie: "icon-movie",
	game: "icon-game",
};
