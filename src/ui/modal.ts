import { getElement } from "../utils/dom.ts";

// Ouvre la fenêtre d'ajout / modification avec le titre voulu.
// showModal() gère le fond, le blocage de la page, Échap et le focus.
export function openModal(title: string): void {
	getElement(".modal__title", HTMLHeadingElement).textContent = title;
	getElement(".modal", HTMLDialogElement).showModal();
}

// Ferme la fenêtre (utile à C après un enregistrement réussi)
export function closeModal(): void {
	getElement(".modal", HTMLDialogElement).close();
}
