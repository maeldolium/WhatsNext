import { gamesMock } from "../mocks/games.mock.ts";
import { moviesMock } from "../mocks/movies.mock.ts";
import { createWatchlistStore } from "./store.ts";

// Même fonctionnement que le vrai store (Proxy + localStorage), mais pré-rempli
// avec les données de démo au premier lancement. Clé de stockage séparée pour ne pas
// mélanger les données de test avec celles de l'application.
export const mockWatchlistStore = createWatchlistStore({
	storageKey: "whatsnext:watchlist:mock",
	initialItems: [...moviesMock, ...gamesMock],
});
