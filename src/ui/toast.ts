import { createElement } from "../utils/dom.ts";

const TOAST_DURATION_MS = 3000;

// Créée une seule fois, au premier message, puis réutilisée
let toast: HTMLParagraphElement | null = null;
let hideTimer: number | undefined;

// Placée hors de la modale : le message reste visible après sa fermeture
export function showToast(message: string): void {
	if (!toast) {
		toast = createElement("p", "toast");
		// role="status" : le message est lu par les lecteurs d'écran
		toast.setAttribute("role", "status");
		document.body.append(toast);
	}
	toast.textContent = message;
	toast.hidden = false;

	// Un nouveau message relance le compte à rebours au lieu de disparaître trop tôt
	clearTimeout(hideTimer);
	hideTimer = window.setTimeout(() => {
		if (toast) toast.hidden = true;
	}, TOAST_DURATION_MS);
}
