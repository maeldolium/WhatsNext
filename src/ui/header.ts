import { getElement } from "../utils/dom.ts";

// En-tête de la vue : pour l'instant, seulement le bouton « Ajouter ».
export function mountPageHeader(onAdd: () => void): void {
	getElement(".page-header__add", HTMLButtonElement).addEventListener("click", onAdd);
}
