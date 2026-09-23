import type { WatchlistItem, WatchlistStatus } from "../types/watchlist.ts";

// Catégories de la navigation latérale ("series" en attente de l'ajout au modèle par A)
export type Category = "all" | "movie" | "series" | "game" | "favorites";
export type StatusFilter = "all" | WatchlistStatus;
// Les valeurs reprennent les noms des champs du modèle (et les value du <select> de tri)
export type SortKey = "dateAdded" | "title" | "rating" | "releaseYear";

// Ce que l'utilisateur a choisi d'afficher.
// C'est un état d'INTERFACE : il n'est pas dans le store et n'est pas sauvegardé.
export interface ViewState {
	category: Category;
	status: StatusFilter;
	genre: string; // "" = tous les genres
	search: string;
	sort: SortKey;
}

export const DEFAULT_VIEW: ViewState = {
	category: "all",
	status: "all",
	genre: "",
	search: "",
	sort: "dateAdded",
};

export const CATEGORY_TITLES: Record<Category, string> = {
	all: "Ma collection",
	movie: "Films",
	series: "Séries",
	game: "Jeux",
	favorites: "Favoris",
};

export function matchesCategory(item: WatchlistItem, category: Category): boolean {
	switch (category) {
		case "all":
			return true;
		case "favorites":
			return item.favorite;
		default:
			return item.type === category;
	}
}

// Minuscules et sans accents : « pokemon » trouve « Pokémon »
function normalize(text: string): string {
	return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

// Un élément est visible s'il passe TOUS les filtres
export function matchesView(item: WatchlistItem, view: ViewState): boolean {
	return (
		matchesCategory(item, view.category) &&
		(view.status === "all" || item.status === view.status) &&
		(view.genre === "" || item.genres.includes(view.genre)) &&
		normalize(item.title).includes(normalize(view.search))
	);
}

// Fonction de comparaison pour Array.sort : négatif = a avant b, positif = b avant a
export function compareItems(a: WatchlistItem, b: WatchlistItem, sort: SortKey): number {
	switch (sort) {
		case "dateAdded":
			return b.dateAdded.localeCompare(a.dateAdded); // plus récent d'abord
		case "title":
			return a.title.localeCompare(b.title, "fr"); // A → Z
		case "rating":
			return b.rating - a.rating; // meilleure note d'abord
		case "releaseYear":
			return b.releaseYear - a.releaseYear; // plus récent d'abord
	}
}
