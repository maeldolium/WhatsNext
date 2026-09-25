import type { WatchlistItem } from "../types/watchlist.ts";

// Ce qui identifie un titre : les API ne nous donnent pas d'identifiant commun
// entre films, séries et jeux, on compare donc le type, le titre et l'année.
type TitleIdentity = Pick<WatchlistItem, "type" | "title" | "releaseYear">;

/** Clé texte unique d'un titre, utile comme clé de Map */
export function titleKey(item: TitleIdentity): string {
	return `${item.type}|${item.title}|${item.releaseYear}`;
}

/**
 * Règle commune à toute l'app (store, recherche, « Découvrir ») : un titre est déjà
 * dans la collection si un élément a le même type, le même titre et la même année.
 */
export function isInCollection(item: TitleIdentity, collection: TitleIdentity[]): boolean {
	const key = titleKey(item);
	return collection.some((owned) => titleKey(owned) === key);
}
