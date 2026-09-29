import { getElement } from "../utils/dom.ts";

// Deux pages dans le même document : « Découvrir » (recommandations) et la collection
// (barre de filtres + liste). On affiche l'une et on masque l'autre avec l'attribut hidden.
export type Page = "discover" | "collection";

const COLLECTION_SELECTORS = [".toolbar", ".app__separator", ".watchlist"];

let currentPage: Page = "discover";

export function getCurrentPage(): Page {
	return currentPage;
}

export function showPage(page: Page): void {
	currentPage = page;
	getElement(".discover", HTMLElement).hidden = page !== "discover";
	for (const selector of COLLECTION_SELECTORS) {
		getElement(selector, HTMLElement).hidden = page !== "collection";
	}
}

// Seul endroit qui gère le bouton actif de la navigation (« Découvrir » et catégories)
export function setActiveNavButton(active: HTMLButtonElement): void {
	for (const button of document.querySelectorAll<HTMLButtonElement>(".nav__button")) {
		button.classList.toggle("nav__button--active", button === active);
	}
}
