import type { WatchlistStatus } from "../types/watchlist.ts";

// Règle commune au store, aux cartes et aux formulaires : on ne peut donner un avis
// (note, favori) que sur un titre commencé, pas sur un titre « À découvrir ».
export function canHaveOpinion(status: WatchlistStatus): boolean {
	return status !== "planned";
}
