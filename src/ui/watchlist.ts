import type { StoreEvent, Unsubscribe, WatchlistStore } from "../types/store.ts";
import type { WatchlistItem } from "../types/watchlist.ts";
import { getElement } from "../utils/dom.ts";
import { createCard, updateCard } from "./card.ts";

// Affiche la watchlist, la garde synchronisée avec le store et gère les clics sur les cartes.
// onEdit : fonction appelée quand l'utilisateur veut modifier un élément (fournie par le formulaire de C).
// Renvoie une fonction qui démonte tout (désabonnement + retrait des écouteurs).
export function mountWatchlist(store: WatchlistStore, onEdit: (id: string) => void): Unsubscribe {
	const list = getElement(".watchlist__list", HTMLUListElement);
	const emptyMessage = getElement(".watchlist__message--empty", HTMLParagraphElement);

	// Associe l'id de chaque élément à sa carte dans le DOM :
	// retrouver une carte est immédiat, sans parcourir la page.
	const cards = new Map<string, HTMLLIElement>();

	// Carte dont le menu « ⋯ » est ouvert (un seul à la fois)
	let openMenuCard: HTMLElement | null = null;

	function addCard(item: WatchlistItem): HTMLLIElement {
		const card = createCard(item);
		cards.set(item.id, card);
		return card;
	}

	// Seul endroit qui retire une carte : c'est ici que viendra se brancher l'animation de sortie
	function removeCard(id: string): void {
		const card = cards.get(id);
		if (card === openMenuCard) openMenuCard = null;
		card?.remove();
		cards.delete(id);
	}

	// --- Menu « ⋯ » ---

	function setMenuOpen(card: HTMLElement, open: boolean): void {
		getElement(".card__menu", HTMLDivElement, card).hidden = !open;
		getElement(".card__menu-toggle", HTMLButtonElement, card).setAttribute(
			"aria-expanded",
			String(open),
		);
		openMenuCard = open ? card : null;
		// À l'ouverture, le focus va sur « Modifier » : utilisable directement au clavier
		if (open) getElement(".card__menu-item", HTMLButtonElement, card).focus();
	}

	function closeOpenMenu(): void {
		if (openMenuCard) setMenuOpen(openMenuCard, false);
	}

	function toggleMenu(card: HTMLElement): void {
		const wasOpen = card === openMenuCard;
		closeOpenMenu();
		if (!wasOpen) setMenuOpen(card, true);
	}

	// --- Actions ---

	function confirmAndDelete(card: HTMLElement, id: string): void {
		const title = getElement(".card__title", HTMLHeadingElement, card).textContent;
		if (window.confirm(`Supprimer « ${title} » de ta collection ?`)) {
			store.deleteItem(id);
		}
	}

	// Délégation : UN seul écouteur pour tous les boutons de toutes les cartes.
	// On ne touche jamais au DOM ici : on appelle le store, qui notifie handleStoreEvent.
	function handleListClick(event: MouseEvent): void {
		if (!(event.target instanceof Element)) return;
		const button = event.target.closest<HTMLButtonElement>("button[data-action]");
		const card = button?.closest<HTMLLIElement>(".card");
		const id = card?.dataset.id;
		if (!button || !card || !id) return;

		switch (button.dataset.action) {
			case "favorite":
				store.toggleFavorite(id);
				break;
			case "rate": {
				// Recliquer sur la note actuelle la retire (retour à 0)
				const value = Number(button.dataset.value);
				const isCurrent = button.getAttribute("aria-pressed") === "true";
				store.setRating(id, isCurrent ? 0 : value);
				break;
			}
			case "menu":
				toggleMenu(card);
				break;
			case "edit":
				closeOpenMenu();
				onEdit(id);
				break;
			case "delete":
				closeOpenMenu();
				confirmAndDelete(card, id);
				break;
		}
	}

	// Un clic n'importe où en dehors du menu ouvert le referme
	function handleDocumentClick(event: MouseEvent): void {
		if (openMenuCard && event.target instanceof Node && !openMenuCard.contains(event.target)) {
			closeOpenMenu();
		}
	}

	// Échap referme le menu et rend le focus au bouton « ⋯ »
	function handleDocumentKeydown(event: KeyboardEvent): void {
		if (event.key !== "Escape" || !openMenuCard) return;
		const toggle = getElement(".card__menu-toggle", HTMLButtonElement, openMenuCard);
		closeOpenMenu();
		toggle.focus();
	}

	// --- Synchronisation avec le store ---

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

	list.addEventListener("click", handleListClick);
	document.addEventListener("click", handleDocumentClick);
	document.addEventListener("keydown", handleDocumentKeydown);

	// À appeler en dernier : subscribe() envoie immédiatement l'événement "init"
	const unsubscribe = store.subscribe(handleStoreEvent);

	return () => {
		unsubscribe();
		list.removeEventListener("click", handleListClick);
		document.removeEventListener("click", handleDocumentClick);
		document.removeEventListener("keydown", handleDocumentKeydown);
	};
}
