import type { WatchlistStatus } from "../types/watchlist.ts";

/**
 * Règle commune à toute l'app (store, cartes, formulaire d'ajout) : on ne peut
 * donner un avis (note, favori) que sur un titre commencé. Un titre « À découvrir »
 * n'a donc ni note ni favori.
 */
export function canHaveOpinion(status: WatchlistStatus): boolean {
	return status !== "planned";
}
