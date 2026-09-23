import { getElement } from "../utils/dom.ts";

// Bouton « Ajouter » de l'en-tête : onAdd décide de ce qu'il ouvre
export function mountPageHeader(onAdd: () => void): void {
	getElement(".page-header__add", HTMLButtonElement).addEventListener("click", onAdd);
}

// Titre de la vue (« Ma collection », « Films »…) : la balise <h1> reste, seul son texte change
export function setPageTitle(title: string): void {
	getElement(".page-header__title", HTMLHeadingElement).textContent = title;
}

// Sous-titre : « 6 entrées · 24 au total »
export function setPageSummary(visibleCount: number, total: number): void {
	const entries = `${visibleCount} ${visibleCount > 1 ? "entrées" : "entrée"}`;
	getElement(".page-header__subtitle", HTMLParagraphElement).textContent =
		`${entries} · ${total} au total`;
}
