import { getElement } from "../utils/dom.ts";

// Deux pages dans le même document : « Découvrir » (recommandations) et la collection
// (barre de filtres + liste). On affiche l'une et on masque l'autre avec l'attribut hidden.
export type Page = "discover" | "collection";

// Éléments qui n'appartiennent qu'à la page collection
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

	// Sur « Découvrir », aucune catégorie de la collection n'est active. Côté collection,
	// c'est filters.ts qui active le bouton de la catégorie choisie.
	getElement('.nav__button[data-page="discover"]', HTMLButtonElement).classList.toggle(
		"nav__button--active",
		page === "discover",
	);
	if (page === "discover") {
		for (const button of document.querySelectorAll(".nav__button[data-filter]")) {
			button.classList.remove("nav__button--active");
		}
	}
}
