import type { StoreEvent, Unsubscribe, WatchlistStore } from "../types/store.ts";
import type { WatchlistItem } from "../types/watchlist.ts";
import { playAnimation } from "../utils/animation.ts";
import { getElement } from "../utils/dom.ts";
import { createCard, updateCard } from "./card.ts";
import { compareItems, DEFAULT_VIEW, matchesView, type ViewState } from "./view.ts";

export interface WatchlistOptions {
	// Appelée quand l'utilisateur veut modifier un élément (formulaire de C)
	onEdit: (id: string) => void;
	// Appelée après chaque mise à jour de l'affichage (compteurs, sous-titre…)
	onViewApplied: (items: WatchlistItem[], visibleCount: number) => void;
}

export interface WatchlistController {
	// Applique de nouveaux filtres / un nouveau tri à la liste
	setView(view: ViewState): void;
	// Démonte tout : désabonnement du store + retrait des écouteurs
	unmount: Unsubscribe;
}

// Affiche la watchlist, la garde synchronisée avec le store, gère les clics sur les cartes
// et applique les filtres et le tri choisis par l'utilisateur.
export function mountWatchlist(
	store: WatchlistStore,
	options: WatchlistOptions,
): WatchlistController {
	const list = getElement(".watchlist__list", HTMLUListElement);
	const emptyMessage = getElement(".watchlist__message--empty", HTMLParagraphElement);
	const noResultMessage = getElement(".watchlist__message--no-result", HTMLParagraphElement);

	// Associe l'id de chaque élément à sa carte dans le DOM :
	// retrouver une carte est immédiat, sans parcourir la page.
	const cards = new Map<string, HTMLLIElement>();

	// Carte dont le menu « ⋯ » est ouvert (un seul à la fois)
	let openMenuCard: HTMLElement | null = null;

	// Filtres et tri choisis par l'utilisateur
	let view: ViewState = DEFAULT_VIEW;

	function addCard(item: WatchlistItem): HTMLLIElement {
		const card = createCard(item);
		cards.set(item.id, card);
		return card;
	}

	// Seul endroit qui retire une carte. Elle quitte tout de suite la Map (elle n'existe plus
	// pour le reste du code), mais reste dans le DOM le temps de son animation de sortie.
	function removeCard(id: string): void {
		const card = cards.get(id);
		if (!card) return;
		if (card === openMenuCard) openMenuCard = null;
		cards.delete(id);
		// inert : la carte qui disparaît n'est plus cliquable ni atteignable au clavier
		card.inert = true;
		void playAnimation(card, "card--leaving").then(() => card.remove());
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
				options.onEdit(id);
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

	// --- Filtres et tri ---

	// Applique la vue aux cartes EXISTANTES : on masque et on réordonne, on ne recrée rien
	function applyView(): void {
		const items = store.getAll();
		const visibleItems = items
			.filter((item) => matchesView(item, view))
			.sort((a, b) => compareItems(a, b, view.sort));
		const visibleIds = new Set(visibleItems.map((item) => item.id));

		// 1. Masquer / afficher
		for (const [id, card] of cards) {
			card.hidden = !visibleIds.has(id);
		}
		if (openMenuCard?.hidden) closeOpenMenu();

		// 2. Réordonner : on ne déplace que les cartes qui ne sont pas à leur place.
		// "order" suit l'ordre actuel du DOM, sans les cartes en train de sortir (animation).
		const order = [...list.children].filter(
			(child) => !child.classList.contains("card--leaving"),
		);
		visibleItems.forEach((item, index) => {
			const card = cards.get(item.id);
			if (!card || order[index] === card) return;
			list.insertBefore(card, order[index] ?? null);
			order.splice(order.indexOf(card), 1);
			order.splice(index, 0, card);
		});

		// 3. Messages : « vide » s'il n'y a aucun élément, « aucun résultat » si tout est filtré
		emptyMessage.hidden = items.length > 0;
		noResultMessage.hidden = items.length === 0 || visibleItems.length > 0;

		options.onViewApplied(items, visibleItems.length);
	}

	// --- Synchronisation avec le store ---

	function handleStoreEvent(event: StoreEvent): void {
		switch (event.type) {
			case "init":
				// Seul cas où l'on construit toute la liste (l'ordre est ensuite fixé par applyView)
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
		// Après chaque changement : filtres, tri, messages et compteurs à jour
		applyView();
	}

	list.addEventListener("click", handleListClick);
	document.addEventListener("click", handleDocumentClick);
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
			document.removeEventListener("click", handleDocumentClick);
			document.removeEventListener("keydown", handleDocumentKeydown);
		},
	};
}
