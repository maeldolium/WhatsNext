import type { StoreEvent, Unsubscribe, WatchlistStore } from "../types/store.ts";
import type { WatchlistItem } from "../types/watchlist.ts";
import { getElement } from "../utils/dom.ts";
import { createCard, updateCard } from "./card.ts";

// Affiche la watchlist et la garde synchronisée avec le store.
// Renvoie la fonction de désabonnement fournie par le store.
export function mountWatchlist(store: WatchlistStore): Unsubscribe {
	const list = getElement(".watchlist__list", HTMLUListElement);
	const emptyMessage = getElement(".watchlist__message--empty", HTMLParagraphElement);

	// Associe l'id de chaque élément à sa carte dans le DOM :
	// retrouver une carte est immédiat, sans parcourir la page.
	const cards = new Map<string, HTMLLIElement>();

	function addCard(item: WatchlistItem): HTMLLIElement {
		const card = createCard(item);
		cards.set(item.id, card);
		return card;
	}

	// Seul endroit qui retire une carte : c'est ici que viendra se brancher l'animation de sortie
	function removeCard(id: string): void {
		cards.get(id)?.remove();
		cards.delete(id);
	}

	function handleStoreEvent(event: StoreEvent): void {
		switch (event.type) {
			case "init":
				// Seul cas où l'on construit toute la liste. Plus récents en premier.
				cards.clear();
				list.replaceChildren(...event.items.toReversed().map(addCard));
				break;
			case "add":
				list.prepend(addCard(event.item));
				break;
			case "update": {
				const card = cards.get(event.item.id);
				if (card) updateCard(card, event.item);
				break;
			}
			case "delete":
				removeCard(event.item.id);
				break;
		}
		emptyMessage.hidden = cards.size > 0;
	}

	// À appeler en dernier : subscribe() envoie immédiatement l'événement "init"
	return store.subscribe(handleStoreEvent);
}
