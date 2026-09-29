import { getElement } from "../utils/dom.ts";

const TOAST_DURATION_MS = 3000;

let hideTimer: number | undefined;

export function showToast(message: string): void {
	const toast = getElement(".toast", HTMLParagraphElement);
	toast.textContent = message;
	toast.hidden = false;

	// Un nouveau message relance le compte à rebours au lieu de disparaître trop tôt
	clearTimeout(hideTimer);
	hideTimer = window.setTimeout(() => {
		toast.hidden = true;
	}, TOAST_DURATION_MS);
}
