import { getElement } from "../utils/dom.ts";

export function mountPageHeader(onAdd: () => void): void {
	getElement(".page-header__add", HTMLButtonElement).addEventListener("click", onAdd);
}

export function setPageTitle(title: string): void {
	getElement(".page-header__title", HTMLHeadingElement).textContent = title;
}

export function setPageSubtitle(text: string): void {
	getElement(".page-header__subtitle", HTMLParagraphElement).textContent = text;
}

export function setPageSummary(visibleCount: number, total: number): void {
	const entries = `${visibleCount} ${visibleCount > 1 ? "entrées" : "entrée"}`;
	setPageSubtitle(`${entries} · ${total} au total`);
}
