import type { StoreEvent, Unsubscribe, WatchlistStore } from "../types/store.ts";
import type { WatchlistItem } from "../types/watchlist.ts";
import { playAnimation } from "../utils/animation.ts";
import { getElement } from "../utils/dom.ts";
import { createCard, updateCard } from "./card.ts";
import { compareItems, DEFAULT_VIEW, matchesView, type ViewState } from "./view.ts";

export interface WatchlistOptions {
	onEdit: (id: string) => void;
	onViewApplied: (items: WatchlistItem[], visibleCount: number) => void;
}

export interface WatchlistController {
	setView(view: ViewState): void;
	unmount: Unsubscribe;
}

export function mountWatchlist(
	store: WatchlistStore,
	options: WatchlistOptions,
): WatchlistController {
	const list = getElement(".watchlist__list", HTMLUListElement);
	const emptyMessage = getElement(".watchlist__message--empty", HTMLParagraphElement);
	const noResultMessage = getElement(".watchlist__message--no-result", HTMLParagraphElement);

	const cards = new Map<string, HTMLLIElement>();

	let openMenuCard: HTMLElement | null = null;

	let view: ViewState = DEFAULT_VIEW;

	function addCard(item: WatchlistItem): HTMLLIElement {
		const card = createCard(item);
		cards.set(item.id, card);
		return card;
	}

	// La carte quitte la Map tout de suite, mais reste dans le DOM le temps de son animation de sortie
	function removeCard(id: string): void {
		const card = cards.get(id);
		if (!card) return;
		if (card === openMenuCard) openMenuCard = null;
		cards.delete(id);
		void playAnimation(card, "card--leaving").then(() => card.remove());
	}

	function setMenuOpen(card: HTMLElement, open: boolean): void {
		getElement(".card__menu", HTMLDivElement, card).hidden = !open;
		openMenuCard = open ? card : null;
	}

	function closeOpenMenu(): void {
		if (openMenuCard) setMenuOpen(openMenuCard, false);
	}

	function toggleMenu(card: HTMLElement): void {
		const wasOpen = card === openMenuCard;
		closeOpenMenu();
		if (!wasOpen) setMenuOpen(card, true);
	}

	function confirmAndDelete(card: HTMLLIElement, id: string): void {
		const title = getElement(".card__title", HTMLHeadingElement, card).textContent;
		if (window.confirm(`Supprimer « ${title} » de ta collection ?`)) store.deleteItem(id);
	}

	function handleListClick(event: MouseEvent): void {
		if (!(event.target instanceof Element)) return;
		const button = event.target.closest<HTMLButtonElement>("button[data-action]");
		const card = button?.closest<HTMLLIElement>(".card");
		const id = card?.dataset.id;
		// cards.has(id) : on ignore une carte déjà supprimée, encore visible pendant son animation
		if (!button || !card || !id || !cards.has(id)) return;

		switch (button.dataset.action) {
			case "favorite":
				store.toggleFavorite(id);
				break;
			case "rate": {
				// Recliquer sur la note actuelle la retire (retour à 0)
				const value = Number(button.dataset.value);
				const currentRating = store.getAll().find((item) => item.id === id)?.rating;
				store.setRating(id, value === currentRating ? 0 : value);
				break;
			}
			case "menu":
				toggleMenu(card);
				break;
			case "edit":
				closeOpenMenu();
				options.onEdit(id);
				break;
			case "delete":
				closeOpenMenu();
				confirmAndDelete(card, id);
				break;
		}
	}

	function handleOutsideClick(event: MouseEvent): void {
		if (openMenuCard && event.target instanceof Node && !openMenuCard.contains(event.target)) {
			closeOpenMenu();
		}
	}

	function handleDocumentKeydown(event: KeyboardEvent): void {
		if (event.key === "Escape") closeOpenMenu();
	}

	function applyView(): void {
		const items = store.getAll();
		const visibleItems = items
			.filter((item) => matchesView(item, view))
			.sort((a, b) => compareItems(a, b, view.sort));
		const visibleIds = new Set(visibleItems.map((item) => item.id));

		for (const [id, card] of cards) {
			card.hidden = !visibleIds.has(id);
		}
		if (openMenuCard?.hidden) closeOpenMenu();

		// On ne déplace que les cartes qui ne sont pas à leur place.
		// "order" suit l'ordre actuel du DOM, sans les cartes en train de sortir (animation).
		const order = [...list.children].filter((child) => !child.classList.contains("card--leaving"));
		visibleItems.forEach((item, index) => {
			const card = cards.get(item.id);
			if (!card || order[index] === card) return;
			list.insertBefore(card, order[index] ?? null);
			order.splice(order.indexOf(card), 1);
			order.splice(index, 0, card);
		});

		emptyMessage.hidden = items.length > 0;
		noResultMessage.hidden = items.length === 0 || visibleItems.length > 0;

		options.onViewApplied(items, visibleItems.length);
	}

	function handleStoreEvent(event: StoreEvent): void {
		switch (event.type) {
			case "init":
				cards.clear();
				list.replaceChildren(...event.items.map(addCard));
				break;
			case "add": {
				const card = addCard(event.item);
				list.prepend(card);
				void playAnimation(card, "card--entering");
				break;
			}
			case "update": {
				const card = cards.get(event.item.id);
				if (!card) break;
				updateCard(card, event.item);
				void playAnimation(card, "card--updated");
				break;
			}
			case "delete":
				removeCard(event.item.id);
				break;
		}
		applyView();
	}

	list.addEventListener("click", handleListClick);
	document.addEventListener("click", handleOutsideClick);
	document.addEventListener("keydown", handleDocumentKeydown);

	// À appeler en dernier : subscribe() envoie immédiatement l'événement "init"
	const unsubscribe = store.subscribe(handleStoreEvent);

	return {
		setView(nextView) {
			view = nextView;
			applyView();
		},
		unmount() {
			unsubscribe();
			list.removeEventListener("click", handleListClick);
			document.removeEventListener("click", handleOutsideClick);
			document.removeEventListener("keydown", handleDocumentKeydown);
		},
	};
}
