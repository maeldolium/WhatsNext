import { getElement } from "../utils/dom.ts";

export function openModal(title: string): void {
	getElement(".modal__title", HTMLHeadingElement).textContent = title;
	getElement(".modal", HTMLDialogElement).showModal();
}

// Ferme la fenêtre (utile à C après un enregistrement réussi)
export function closeModal(): void {
	getElement(".modal", HTMLDialogElement).close();
}
