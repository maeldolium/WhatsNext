import type {
	StoreEvent,
	StoreListener,
	WatchlistItemChanges,
	WatchlistStore,
} from "../types/store.ts";
import type { WatchlistItem } from "../types/watchlist.ts";

export interface StoreOptions {
	// Nom de la case dans localStorage
	storageKey?: string;
	// Données utilisées au premier lancement, quand localStorage est encore vide
	initialItems?: WatchlistItem[];
}

// Vérifie qu'une donnée lue dans localStorage ressemble bien à un WatchlistItem
// (le stockage peut avoir été modifié ou corrompu à la main).
function isWatchlistItem(value: unknown): value is WatchlistItem {
	if (typeof value !== "object" || value === null) return false;
	const item = value as Record<string, unknown>;
	return (
		typeof item.id === "string" && typeof item.title === "string" && Array.isArray(item.genres)
	);
}

function loadItems(storageKey: string, initialItems: WatchlistItem[]): WatchlistItem[] {
	try {
		const raw = localStorage.getItem(storageKey);
		// Copie profonde pour ne jamais modifier le tableau de départ (ex. les fichiers de mock)
		if (raw === null) return structuredClone(initialItems);
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter(isWatchlistItem) : [];
	} catch (error) {
		console.error("Lecture de la watchlist impossible, démarrage à vide.", error);
		return [];
	}
}

function saveItems(storageKey: string, items: WatchlistItem[]): void {
	try {
		localStorage.setItem(storageKey, JSON.stringify(items));
	} catch (error) {
		console.error("Enregistrement de la watchlist impossible.", error);
	}
}

// Le Proxy enveloppe le tableau d'items : chaque modification (push, splice, items[i] = ...)
// passe par les "traps" set / deleteProperty, qui sauvegardent automatiquement dans localStorage.
// Les méthodes du store n'ont donc jamais besoin d'appeler saveItems() elles-mêmes.
function createPersistedItems(storageKey: string, initial: WatchlistItem[]): WatchlistItem[] {
	return new Proxy(initial, {
		set(target, property, value) {
			// Reflect.set fait l'affectation normale, comme target[property] = value
			const ok = Reflect.set(target, property, value);
			saveItems(storageKey, target);
			return ok;
		},
		deleteProperty(target, property) {
			const ok = Reflect.deleteProperty(target, property);
			saveItems(storageKey, target);
			return ok;
		},
	});
}

function assertValidRating(rating: number): void {
	if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
		throw new RangeError(`La note doit être comprise entre 0 et 5 (reçu : ${rating}).`);
	}
}

// Les variables déclarées dans cette fonction sont privées :
// seules les méthodes retournées y ont accès.
export function createWatchlistStore(options: StoreOptions = {}): WatchlistStore {
	const storageKey = options.storageKey ?? "whatsnext:watchlist";
	const items = createPersistedItems(storageKey, loadItems(storageKey, options.initialItems ?? []));
	const listeners = new Set<StoreListener>();

	const notify = (event: StoreEvent) => {
		for (const listener of listeners) listener(event);
	};

	const indexOf = (id: string): number => {
		const index = items.findIndex((item) => item.id === id);
		if (index === -1) throw new Error(`Aucun élément avec l'id "${id}".`);
		return index;
	};

	const updateItem = (id: string, changes: WatchlistItemChanges): WatchlistItem => {
		if (changes.rating !== undefined) assertValidRating(changes.rating);
		const index = indexOf(id);
		const updated: WatchlistItem = {
			...items[index],
			...changes,
			dateUpdated: new Date().toISOString(),
		};
		// On remplace l'objet entier plutôt que de modifier ses champs un par un :
		// c'est cette affectation que le Proxy détecte pour sauvegarder.
		items[index] = updated;
		notify({ type: "update", item: updated });
		return updated;
	};

	return {
		// Copie du tableau : la liste ne doit être modifiée que via les méthodes du store.
		getAll: () => [...items],

		addItem(data) {
			if (data.rating !== undefined) assertValidRating(data.rating);
			const now = new Date().toISOString();
			const item: WatchlistItem = {
				// Valeurs par défaut, écrasées par celles de data si elles sont fournies
				status: "planned",
				rating: 0,
				favorite: false,
				notes: "",
				...data,
				id: crypto.randomUUID(),
				dateAdded: now,
				dateUpdated: now,
			};
			items.push(item);
			notify({ type: "add", item });
			return item;
		},

		updateItem,

		deleteItem(id) {
			const [removed] = items.splice(indexOf(id), 1);
			notify({ type: "delete", item: removed });
		},

		toggleFavorite: (id) => updateItem(id, { favorite: !items[indexOf(id)].favorite }),
		setStatus: (id, status) => updateItem(id, { status }),
		setRating: (id, rating) => updateItem(id, { rating }),

		subscribe(listener) {
			listeners.add(listener);
			listener({ type: "init", items: [...items] });
			// La fonction retournée permet de se désabonner
			return () => listeners.delete(listener);
		},
	};
}

export const watchlistStore = createWatchlistStore();
