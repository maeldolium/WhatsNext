import type { WatchlistItem, WatchlistItemType, WatchlistStatus } from "./watchlist.ts";

// Données à fournir pour créer un item. Pas d'id ni de dates : le store les génère.
// Les champs avec "?" sont optionnels, le store leur donne une valeur par défaut.
export interface NewWatchlistItem {
	type: WatchlistItemType;
	title: string;
	cover: string;
	releaseYear: number;
	genres: string[];
	status?: WatchlistStatus;
	rating?: number;
	favorite?: boolean;
	notes?: string;
}

// Partial<T> rend tous les champs de T optionnels : on ne modifie que ce qu'on veut.
export type WatchlistItemChanges = Partial<NewWatchlistItem>;

// Événement envoyé aux abonnés. Le champ "type" dit ce qui s'est passé,
// et "item" désigne l'élément concerné.
export type StoreEvent =
	| { type: "init"; items: WatchlistItem[] }
	| { type: "add"; item: WatchlistItem }
	| { type: "update"; item: WatchlistItem }
	| { type: "delete"; item: WatchlistItem };

export type StoreListener = (event: StoreEvent) => void;

export type Unsubscribe = () => void;

// Contrat du store, figé par le groupe : le vrai store et le mock l'implémentent tous les deux.
// subscribe() envoie immédiatement un événement "init" avec la liste courante.
export interface WatchlistStore {
	getAll(): WatchlistItem[];
	addItem(data: NewWatchlistItem): WatchlistItem;
	updateItem(id: string, changes: WatchlistItemChanges): WatchlistItem;
	deleteItem(id: string): void;
	toggleFavorite(id: string): WatchlistItem;
	setStatus(id: string, status: WatchlistStatus): WatchlistItem;
	setRating(id: string, rating: number): WatchlistItem;
	subscribe(listener: StoreListener): Unsubscribe;
}
