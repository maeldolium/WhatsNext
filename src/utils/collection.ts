import type { WatchlistItem } from "../types/watchlist.ts";

// Ce qui identifie un titre : les API ne nous donnent pas d'identifiant commun
// entre films, séries et jeux, on compare donc le type, le titre et l'année.
type TitleIdentity = Pick<WatchlistItem, "type" | "title" | "releaseYear">;

export function titleKey(item: TitleIdentity): string {
	return `${item.type}|${item.title}|${item.releaseYear}`;
}

// Règle commune au store, à la recherche et à « Découvrir » pour éviter les doublons
export function isInCollection(item: TitleIdentity, collection: TitleIdentity[]): boolean {
	const key = titleKey(item);
	return collection.some((owned) => titleKey(owned) === key);
}
